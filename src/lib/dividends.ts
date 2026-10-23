import type { CurrencyCode, FxRate, Holding, Lot, Transaction } from '@/data/types';
import { convertCurrency } from '@/lib/snapshots';

export type DividendMonth = { month: string; amount: number };

export type YieldOnCost = {
  holdingId: string;
  trailingIncome: number;
  costBasis: number;
  yieldOnCost: number;
};

export type DividendInput = {
  transactions: Transaction[];
  today: string;
  fxRates: FxRate[];
  baseCurrency: CurrencyCode;
};

export type YieldInput = {
  transactions: Transaction[];
  lots: Lot[];
  holdings: Holding[];
  today: string;
  fxRates: FxRate[];
  baseCurrency: CurrencyCode;
};

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthIndex(isoMonth: string): number {
  const [year, month] = isoMonth.split('-').map(Number);
  return year * 12 + (month - 1);
}

function monthLabel(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function dividendsOnly(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => tx.type === 'dividend' && tx.amount > 0);
}

// A payment is recorded in the currency it arrived in, so every figure these functions
// add together or divide has to be brought to one currency first.
function inBase(amount: number, from: CurrencyCode, input: DividendInput | YieldInput): number {
  return convertCurrency(amount, from, input.baseCurrency, input.fxRates);
}

export function computeDividendCalendar(input: DividendInput): DividendMonth[] {
  const current = monthIndex(input.today.slice(0, 7));
  const byMonth = new Map<number, number>();
  for (const tx of dividendsOnly(input.transactions)) {
    const key = monthIndex(tx.date.slice(0, 7));
    byMonth.set(key, (byMonth.get(key) ?? 0) + inBase(tx.amount, tx.currency, input));
  }
  const months: DividendMonth[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const index = current - i;
    months.push({ month: monthLabel(index), amount: roundCents(byMonth.get(index) ?? 0) });
  }
  return months;
}

function groupByHolding(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (!tx.holdingId) continue;
    const bucket = map.get(tx.holdingId);
    if (bucket) bucket.push(tx);
    else map.set(tx.holdingId, [tx]);
  }
  return map;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Honest projection only: repeat each holding's own recorded cadence forward.
// A single recorded payment is assumed annual; two or more set the interval
// from the median gap between them. No external yield or market data is used.
export function computeDividendForecast(input: DividendInput): DividendMonth[] {
  const current = monthIndex(input.today.slice(0, 7));
  const windowStart = current + 1;
  const windowEnd = current + 12;
  const projected = new Map<number, number>();

  for (const [, payments] of groupByHolding(dividendsOnly(input.transactions))) {
    const ordered = [...payments].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const indices = ordered.map((tx) => monthIndex(tx.date.slice(0, 7)));
    const amount =
      ordered.reduce((sum, tx) => sum + inBase(tx.amount, tx.currency, input), 0) / ordered.length;

    let interval = 12;
    if (indices.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < indices.length; i += 1) gaps.push(indices[i] - indices[i - 1]);
      interval = Math.max(1, Math.round(median(gaps)));
    }

    const lastIndex = indices[indices.length - 1];
    for (let next = lastIndex + interval; next <= windowEnd; next += interval) {
      if (next >= windowStart) {
        projected.set(next, (projected.get(next) ?? 0) + amount);
      }
    }
  }

  const months: DividendMonth[] = [];
  for (let index = windowStart; index <= windowEnd; index += 1) {
    months.push({ month: monthLabel(index), amount: roundCents(projected.get(index) ?? 0) });
  }
  return months;
}

export function computeYieldOnCost(input: YieldInput): YieldOnCost[] {
  const current = monthIndex(input.today.slice(0, 7));
  const trailingStart = current - 11;

  const incomeByHolding = new Map<string, number>();
  for (const tx of dividendsOnly(input.transactions)) {
    if (!tx.holdingId) continue;
    const index = monthIndex(tx.date.slice(0, 7));
    if (index < trailingStart || index > current) continue;
    incomeByHolding.set(
      tx.holdingId,
      (incomeByHolding.get(tx.holdingId) ?? 0) + inBase(tx.amount, tx.currency, input),
    );
  }

  const currencyByHolding = new Map(
    input.holdings.map((holding) => [holding.id, holding.currency] as const),
  );
  const costByHolding = new Map<string, number>();
  for (const lot of input.lots) {
    const native = lot.remainingQuantity * lot.costPerUnit;
    const currency = currencyByHolding.get(lot.holdingId) ?? input.baseCurrency;
    costByHolding.set(
      lot.holdingId,
      (costByHolding.get(lot.holdingId) ?? 0) + inBase(native, currency, input),
    );
  }

  const result: YieldOnCost[] = [];
  for (const [holdingId, trailingIncome] of incomeByHolding) {
    const costBasis = costByHolding.get(holdingId) ?? 0;
    if (costBasis <= 0) continue;
    result.push({
      holdingId,
      trailingIncome: roundCents(trailingIncome),
      costBasis: roundCents(costBasis),
      yieldOnCost: (trailingIncome / costBasis) * 100,
    });
  }
  return result.sort((a, b) => b.yieldOnCost - a.yieldOnCost);
}
