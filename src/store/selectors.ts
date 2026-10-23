import type {
  Account,
  AllocationTargets,
  AssetClass,
  CurrencyCode,
  FxRate,
  Goal,
  Holding,
  HoldingWithInstrument,
  Instrument,
  Lot,
  Note,
  Ownership,
  PriceQuote,
  Snapshot,
  Transaction,
  Valuation,
} from '@/data/types';
import { ASSET_CLASSES } from '@/data/types';
import { computeDividendCalendar, computeDividendForecast, computeYieldOnCost } from '@/lib/dividends';
import { computeFeeAnalysis, type FeeAnalysis } from '@/lib/fees';
import { computePositions, type HoldingPosition } from '@/lib/positions';
import { computeRebalance, type RebalanceHint } from '@/lib/rebalance';
import { computeRecap, type Recap } from '@/lib/recap';
import { holdingValue } from '@/lib/snapshots';
import type { DividendMonth, YieldOnCost } from '@/lib/dividends';

function memoize<Args extends readonly unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  let lastArgs: Args | null = null;
  let lastResult: Result;
  return (...args: Args): Result => {
    if (lastArgs && lastArgs.length === args.length && lastArgs.every((arg, i) => arg === args[i])) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  };
}

function memoizeKeyed<Args extends readonly unknown[], Result>(
  fn: (...args: Args) => Result,
  keyOf: (...args: Args) => string,
): (...args: Args) => Result {
  const cache = new Map<string, { args: Args; result: Result }>();
  return (...args: Args): Result => {
    const key = keyOf(...args);
    const hit = cache.get(key);
    if (hit && hit.args.length === args.length && hit.args.every((arg, i) => arg === args[i])) {
      return hit.result;
    }
    const result = fn(...args);
    cache.set(key, { args, result });
    return result;
  };
}

export type NetWorth = { total: number; assets: number; liabilities: number };

export type Delta = { amount: number; percent: number };

export type AllocationSlice = { assetClass: AssetClass; value: number; weight: number };

export type AccountGroup = { account: Account; value: number };

export type OwnerGroup = { ownership: Ownership; value: number };

export type HoldingValue = HoldingWithInstrument & { value: number };

export type TopMover = {
  holding: Holding;
  instrument: Instrument | null;
  valueChange: number;
  percentChange: number;
};

export type GoalPace = 'ahead' | 'behind' | 'on-pace';

export type GoalProgress = {
  goal: Goal;
  percent: number;
  remaining: number;
  pace: GoalPace;
  projectedDate: string | null;
};

function latest(snapshots: Snapshot[]): Snapshot | null {
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

export const selectNetWorth = memoize((snapshots: Snapshot[]): NetWorth => {
  const current = latest(snapshots);
  if (!current) return { total: 0, assets: 0, liabilities: 0 };
  return {
    total: current.totalNetWorth,
    assets: current.totalAssets,
    liabilities: current.totalLiabilities,
  };
});

export const selectAllocation = memoize((snapshots: Snapshot[]): AllocationSlice[] => {
  const current = latest(snapshots);
  if (!current) return ASSET_CLASSES.map((assetClass) => ({ assetClass, value: 0, weight: 0 }));
  const total = current.totalAssets || 1;
  return ASSET_CLASSES.map((assetClass) => ({
    assetClass,
    value: current.perClass[assetClass] ?? 0,
    weight: ((current.perClass[assetClass] ?? 0) / total) * 100,
  }));
});

function deltaBetween(from: Snapshot | null, to: Snapshot | null): Delta {
  if (!from || !to || from.totalNetWorth === 0) return { amount: 0, percent: 0 };
  const amount = to.totalNetWorth - from.totalNetWorth;
  return { amount, percent: (amount / from.totalNetWorth) * 100 };
}

export const selectTodayDelta = memoize((snapshots: Snapshot[]): Delta => {
  if (snapshots.length < 2) return { amount: 0, percent: 0 };
  return deltaBetween(snapshots[snapshots.length - 2], snapshots[snapshots.length - 1]);
});

export const selectPeriodDelta = memoizeKeyed(
  (snapshots: Snapshot[], days: number): Delta => {
    const current = latest(snapshots);
    if (!current) return { amount: 0, percent: 0 };
    const cutoff = Date.parse(current.date) - days * 24 * 60 * 60 * 1000;
    const prior = [...snapshots].reverse().find((snapshot) => Date.parse(snapshot.date) <= cutoff);
    return deltaBetween(prior ?? snapshots[0], current);
  },
  (_snapshots, days) => String(days),
);

export const selectAccountGroups = memoize(
  (snapshots: Snapshot[], accounts: Account[]): AccountGroup[] => {
    const current = latest(snapshots);
    if (!current) return [];
    return accounts
      .map((account) => ({ account, value: current.perAccount[account.id] ?? 0 }))
      .filter((group) => group.value !== 0)
      .sort((a, b) => b.value - a.value);
  },
);

export const selectOwnerGroups = memoize(
  (snapshots: Snapshot[], accounts: Account[]): OwnerGroup[] => {
    const current = latest(snapshots);
    if (!current) return [];
    const totals = new Map<Ownership, number>();
    for (const account of accounts) {
      const value = current.perAccount[account.id] ?? 0;
      totals.set(account.ownership, (totals.get(account.ownership) ?? 0) + value);
    }
    return [...totals.entries()]
      .map(([ownership, value]) => ({ ownership, value }))
      .sort((a, b) => b.value - a.value);
  },
);

export const selectRecentActivity = memoizeKeyed(
  (transactions: Transaction[], limit: number): Transaction[] => transactions.slice(0, limit),
  (_transactions, limit) => String(limit),
);

export const selectUnreadNotes = memoize((notes: Note[]): Note[] =>
  notes.filter((note) => !note.read).slice(0, 3),
);

function latestValuationMap(valuations: Valuation[]): Map<string, Valuation> {
  const map = new Map<string, Valuation>();
  for (const valuation of valuations) {
    const current = map.get(valuation.holdingId);
    if (!current || Date.parse(valuation.date) > Date.parse(current.date)) {
      map.set(valuation.holdingId, valuation);
    }
  }
  return map;
}

export const selectHoldingValues = memoize(
  (
    holdings: Holding[],
    instruments: Instrument[],
    priceQuotes: PriceQuote[],
    valuations: Valuation[],
  ): HoldingValue[] => {
    const latestValuations = latestValuationMap(valuations);
    return holdings
      .map((holding) => ({
        ...holding,
        instrument: holding.instrumentId
          ? (instruments.find((item) => item.id === holding.instrumentId) ?? null)
          : null,
        value: holdingValue(holding, priceQuotes, latestValuations),
      }))
      .sort((a, b) => b.value - a.value);
  },
);

export const selectTopMovers = memoizeKeyed(
  (
    holdings: Holding[],
    instruments: Instrument[],
    priceQuotes: PriceQuote[],
    livePrices: Record<string, number>,
    limit: number,
  ): TopMover[] =>
    holdings
      .filter((holding) => holding.instrumentId)
      .map((holding) => {
        const base =
          priceQuotes.find((quote) => quote.instrumentId === holding.instrumentId)?.price ?? 0;
        const live = livePrices[holding.instrumentId as string] ?? base;
        return {
          holding,
          instrument: instruments.find((item) => item.id === holding.instrumentId) ?? null,
          valueChange: holding.quantity * (live - base),
          percentChange: base === 0 ? 0 : ((live - base) / base) * 100,
        };
      })
      .sort((a, b) => Math.abs(b.valueChange) - Math.abs(a.valueChange))
      .slice(0, limit),
  (_holdings, _instruments, _priceQuotes, _livePrices, limit) => String(limit),
);

function addMonths(iso: string, months: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function goalPace(goal: Goal, today: string): { pace: GoalPace; projectedDate: string | null } {
  const remaining = goal.target - goal.savedAmount;
  if (!goal.targetDate) return { pace: 'on-pace', projectedDate: null };
  if (remaining <= 0) return { pace: 'ahead', projectedDate: today };
  if (goal.monthlyContribution <= 0) return { pace: 'behind', projectedDate: null };
  const months = Math.ceil(remaining / goal.monthlyContribution);
  const projectedDate = addMonths(today, months);
  const projected = Date.parse(projectedDate);
  const target = Date.parse(goal.targetDate);
  if (projected < target) return { pace: 'ahead', projectedDate };
  if (projected > target) return { pace: 'behind', projectedDate };
  return { pace: 'on-pace', projectedDate };
}

export const selectGoalProgress = memoizeKeyed(
  (goals: Goal[], today: string): GoalProgress[] =>
    goals.map((goal) => {
      const { pace, projectedDate } = goalPace(goal, today);
      return {
        goal,
        percent: goal.target === 0 ? 0 : (goal.savedAmount / goal.target) * 100,
        remaining: Math.max(goal.target - goal.savedAmount, 0),
        pace,
        projectedDate,
      };
    }),
  (_goals, today) => today,
);

export type PortfolioMetrics = {
  value: number;
  costBasis: number;
  unrealisedGain: number;
  unrealisedPercent: number;
  realisedGain: number;
  marketGain: number;
  currencyGain: number;
};

function labelForHolding(holding: Holding, instruments: Instrument[]): string {
  if (holding.name) return holding.name;
  const instrument = holding.instrumentId
    ? instruments.find((item) => item.id === holding.instrumentId)
    : null;
  return instrument?.name ?? instrument?.symbol ?? holding.id;
}

export const selectHoldingPositions = memoize(
  (
    holdings: Holding[],
    lots: Lot[],
    transactions: Transaction[],
    priceQuotes: PriceQuote[],
    valuations: Valuation[],
    fxRates: FxRate[],
    baseCurrency: CurrencyCode,
  ): HoldingPosition[] =>
    computePositions({ holdings, lots, transactions, priceQuotes, valuations, fxRates, baseCurrency }),
);

export const selectPortfolioMetrics = memoize(
  (positions: HoldingPosition[]): PortfolioMetrics => {
    const totals = positions.reduce(
      (acc, position) => {
        acc.value += position.value;
        acc.costBasis += position.costBasis ?? 0;
        acc.unrealisedGain += position.unrealisedGain ?? 0;
        acc.realisedGain += position.realisedGain;
        acc.marketGain += position.marketGain ?? 0;
        acc.currencyGain += position.currencyGain ?? 0;
        return acc;
      },
      { value: 0, costBasis: 0, unrealisedGain: 0, realisedGain: 0, marketGain: 0, currencyGain: 0 },
    );
    const round = (value: number) => Math.round(value * 100) / 100;
    return {
      value: round(totals.value),
      costBasis: round(totals.costBasis),
      unrealisedGain: round(totals.unrealisedGain),
      unrealisedPercent: totals.costBasis !== 0 ? (totals.unrealisedGain / totals.costBasis) * 100 : 0,
      realisedGain: round(totals.realisedGain),
      marketGain: round(totals.marketGain),
      currencyGain: round(totals.currencyGain),
    };
  },
);

export const selectRecap = memoizeKeyed(
  (snapshots: Snapshot[], transactions: Transaction[], days: number): Recap =>
    computeRecap({ snapshots, transactions, days }),
  (_snapshots, _transactions, days) => String(days),
);

export const selectDividendCalendar = memoizeKeyed(
  (
    transactions: Transaction[],
    today: string,
    fxRates: FxRate[],
    baseCurrency: CurrencyCode,
  ): DividendMonth[] => computeDividendCalendar({ transactions, today, fxRates, baseCurrency }),
  (_transactions, today, _fxRates, baseCurrency) => `${today}:${baseCurrency}`,
);

export const selectDividendForecast = memoizeKeyed(
  (
    transactions: Transaction[],
    today: string,
    fxRates: FxRate[],
    baseCurrency: CurrencyCode,
  ): DividendMonth[] => computeDividendForecast({ transactions, today, fxRates, baseCurrency }),
  (_transactions, today, _fxRates, baseCurrency) => `${today}:${baseCurrency}`,
);

export const selectYieldOnCost = memoizeKeyed(
  (
    transactions: Transaction[],
    lots: Lot[],
    holdings: Holding[],
    today: string,
    fxRates: FxRate[],
    baseCurrency: CurrencyCode,
  ): YieldOnCost[] =>
    computeYieldOnCost({ transactions, lots, holdings, today, fxRates, baseCurrency }),
  (_transactions, _lots, _holdings, today, _fxRates, baseCurrency) => `${today}:${baseCurrency}`,
);

export const selectRebalanceHints = memoize(
  (
    allocation: AllocationSlice[],
    targets: AllocationTargets,
    netWorth: number,
  ): RebalanceHint[] =>
    computeRebalance({
      allocation: allocation.map((slice) => ({
        assetClass: slice.assetClass,
        value: slice.value,
        weight: slice.weight,
      })),
      targets,
      netWorth,
    }),
);

export const selectFeeAnalysis = memoize(
  (positions: HoldingPosition[], holdings: Holding[], instruments: Instrument[]): FeeAnalysis => {
    const byId = new Map(holdings.map((holding) => [holding.id, holding]));
    return computeFeeAnalysis({
      holdings: positions.map((position) => {
        const holding = byId.get(position.holdingId);
        return {
          id: position.holdingId,
          label: holding ? labelForHolding(holding, instruments) : position.holdingId,
          value: position.value,
          expenseRatio: holding?.expenseRatio ?? null,
        };
      }),
    });
  },
);
