import type { AssetClass, Snapshot, Transaction } from '@/data/types';
import { ASSET_CLASSES } from '@/data/types';
import { contributionsVsMarket, type CashFlow } from '@/lib/returns';

export type ClassChange = { assetClass: AssetClass; change: number };
export type AccountChange = { accountId: string; change: number };
export type HoldingFlow = { holdingId: string; flow: number };

export type Recap = {
  from: string;
  to: string;
  netWorthChange: number;
  contributions: number;
  market: number;
  perClass: ClassChange[];
  perAccount: AccountChange[];
  perHolding: HoldingFlow[];
};

export type RecapInput = {
  snapshots: Snapshot[];
  transactions: Transaction[];
  days: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function emptyRecap(date: string): Recap {
  return {
    from: date,
    to: date,
    netWorthChange: 0,
    contributions: 0,
    market: 0,
    perClass: ASSET_CLASSES.map((assetClass) => ({ assetClass, change: 0 })),
    perAccount: [],
    perHolding: [],
  };
}

export function computeRecap(input: RecapInput): Recap {
  const sorted = [...input.snapshots].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return emptyRecap('');
  const end = sorted[sorted.length - 1];
  if (sorted.length === 1) return emptyRecap(end.date);

  const cutoff = Date.parse(end.date) - input.days * DAY_MS;
  const start =
    [...sorted].reverse().find((snapshot) => Date.parse(snapshot.date) <= cutoff) ?? sorted[0];

  const perClass: ClassChange[] = ASSET_CLASSES.map((assetClass) => ({
    assetClass,
    change: roundCents((end.perClass[assetClass] ?? 0) - (start.perClass[assetClass] ?? 0)),
  }));

  const accountIds = new Set([...Object.keys(end.perAccount), ...Object.keys(start.perAccount)]);
  const perAccount: AccountChange[] = [...accountIds]
    .map((accountId) => ({
      accountId,
      change: roundCents((end.perAccount[accountId] ?? 0) - (start.perAccount[accountId] ?? 0)),
    }))
    .filter((group) => group.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const inPeriod = input.transactions.filter((tx) => {
    const t = Date.parse(tx.date);
    return t > Date.parse(start.date) && t <= Date.parse(end.date);
  });

  const externalFlows: CashFlow[] = inPeriod
    .filter((tx) => tx.type === 'deposit' || tx.type === 'withdrawal')
    .map((tx) => ({ date: tx.date, amount: tx.amount }));
  const split = contributionsVsMarket(start.totalNetWorth, end.totalNetWorth, externalFlows);

  const flowByHolding = new Map<string, number>();
  for (const tx of inPeriod) {
    if (!tx.holdingId) continue;
    flowByHolding.set(tx.holdingId, (flowByHolding.get(tx.holdingId) ?? 0) + tx.amount);
  }
  const perHolding: HoldingFlow[] = [...flowByHolding.entries()]
    .map(([holdingId, flow]) => ({ holdingId, flow: roundCents(flow) }))
    .filter((group) => group.flow !== 0)
    .sort((a, b) => Math.abs(b.flow) - Math.abs(a.flow));

  return {
    from: start.date,
    to: end.date,
    netWorthChange: roundCents(end.totalNetWorth - start.totalNetWorth),
    contributions: roundCents(split.contributions),
    market: roundCents(split.market),
    perClass,
    perAccount,
    perHolding,
  };
}
