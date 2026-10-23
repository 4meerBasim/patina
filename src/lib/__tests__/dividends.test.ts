import { describe, expect, it } from '@jest/globals';

import type { FxRate, Holding, Lot, Transaction } from '@/data/types';
import {
  computeDividendCalendar,
  computeDividendForecast,
  computeYieldOnCost,
} from '@/lib/dividends';

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    holdingId: 'h1',
    accountId: 'a1',
    type: 'dividend',
    quantity: null,
    price: null,
    amount: 0,
    currency: 'USD',
    date: '2026-01-15',
    note: null,
    ...overrides,
  };
}

function lot(overrides: Partial<Lot>): Lot {
  return {
    id: 'lot',
    holdingId: 'h1',
    quantity: 10,
    costPerUnit: 100,
    acquiredAt: '2024-01-01',
    remainingQuantity: 10,
    acquiredFxRate: null,
    ...overrides,
  };
}

const fxRates: FxRate[] = [
  { base: 'USD', quote: 'EUR', rate: 0.92, asOf: '2026-10-01' },
  { base: 'USD', quote: 'GBP', rate: 0.78, asOf: '2026-10-01' },
];

function holding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 'h1',
    accountId: 'a1',
    assetClass: 'stocks',
    instrumentId: 'inst-1',
    name: null,
    quantity: 10,
    currency: 'USD',
    ...overrides,
  };
}

describe('computeDividendCalendar', () => {
  it('returns the trailing twelve months in chronological order ending at the month of today', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15',
      transactions: [
        tx({ id: 't1', date: '2026-01-10', amount: 30 }),
        tx({ id: 't2', date: '2026-04-10', amount: 20 }),
        tx({ id: 't3', date: '2026-10-02', amount: 50 }),
      ],
    });

    expect(result).toEqual([
      { month: '2025-11', amount: 0 },
      { month: '2025-12', amount: 0 },
      { month: '2026-01', amount: 30 },
      { month: '2026-02', amount: 0 },
      { month: '2026-03', amount: 0 },
      { month: '2026-04', amount: 20 },
      { month: '2026-05', amount: 0 },
      { month: '2026-06', amount: 0 },
      { month: '2026-07', amount: 0 },
      { month: '2026-08', amount: 0 },
      { month: '2026-09', amount: 0 },
      { month: '2026-10', amount: 50 },
    ]);
  });

  it('sums several dividends falling in the same month', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15',
      transactions: [
        tx({ id: 't1', date: '2026-06-01', amount: 12.5 }),
        tx({ id: 't2', date: '2026-06-28', amount: 7.25 }),
      ],
    });

    expect(result.find((month) => month.month === '2026-06')).toEqual({
      month: '2026-06',
      amount: 19.75,
    });
  });

  it('reports a month with no dividends as zero rather than omitting it', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15',
      transactions: [
        tx({ id: 't1', date: '2026-08-10', amount: 40 }),
        tx({ id: 't2', date: '2026-10-10', amount: 40 }),
      ],
    });

    expect(result).toHaveLength(12);
    expect(result[10]).toEqual({ month: '2026-09', amount: 0 });
  });

  it('excludes a dividend in the month twelve back and includes one in the month eleven back', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15',
      transactions: [
        tx({ id: 'old', date: '2025-10-31', amount: 99 }),
        tx({ id: 'edge', date: '2025-11-01', amount: 11 }),
      ],
    });

    expect(result.map((month) => month.month)).not.toContain('2025-10');
    expect(result[0]).toEqual({ month: '2025-11', amount: 11 });
    expect(result.reduce((sum, month) => sum + month.amount, 0)).toBe(11);
  });

  it('ignores non-dividend transactions and dividends that are not positive', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15',
      transactions: [
        tx({ id: 'buy', type: 'buy', date: '2026-06-01', amount: 500 }),
        tx({ id: 'deposit', type: 'deposit', date: '2026-06-02', amount: 1000 }),
        tx({ id: 'negative', date: '2026-06-03', amount: -5 }),
        tx({ id: 'zero', date: '2026-06-04', amount: 0 }),
        tx({ id: 'real', date: '2026-06-05', amount: 25 }),
      ],
    });

    expect(result.find((month) => month.month === '2026-06')).toEqual({
      month: '2026-06',
      amount: 25,
    });
    expect(result.reduce((sum, month) => sum + month.amount, 0)).toBe(25);
  });

  it('zero-fills the months before a holding acquired mid-year started paying', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15',
      transactions: [
        tx({ id: 'buy', type: 'buy', date: '2026-07-01', amount: 5000 }),
        tx({ id: 'd1', date: '2026-07-15', amount: 12 }),
        tx({ id: 'd2', date: '2026-10-05', amount: 12 }),
      ],
    });

    expect(result.slice(0, 8).every((month) => month.amount === 0)).toBe(true);
    expect(result.slice(0, 8).map((month) => month.month)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
    expect(result[8]).toEqual({ month: '2026-07', amount: 12 });
    expect(result[11]).toEqual({ month: '2026-10', amount: 12 });
  });

  it('converts a dividend paid in another currency before adding it to the total', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15',
      transactions: [
        tx({ id: 'usd', date: '2026-05-10', amount: 100, currency: 'USD' }),
        tx({ id: 'eur', date: '2026-05-20', amount: 100, currency: 'EUR' }),
      ],
    });

    // 100 EUR at 0.92 EUR per USD is 108.70 USD.
    expect(result.find((month) => month.month === '2026-05')).toEqual({
      month: '2026-05',
      amount: 208.7,
    });
  });

  it('reports the same payments in whichever base currency is asked for', () => {
    const inEur = computeDividendCalendar({
      today: '2026-10-15',
      transactions: [tx({ id: 'usd', date: '2026-05-10', amount: 100, currency: 'USD' })],
      fxRates,
      baseCurrency: 'EUR',
    });

    expect(inEur.find((month) => month.month === '2026-05')).toEqual({
      month: '2026-05',
      amount: 92,
    });
  });

  it('returns twelve zero months when there are no transactions', () => {
    const result = computeDividendCalendar({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-15', transactions: [] });

    expect(result).toHaveLength(12);
    expect(result.every((month) => month.amount === 0)).toBe(true);
    expect(result[0].month).toBe('2025-11');
    expect(result[11].month).toBe('2026-10');
  });
});

describe('computeDividendForecast', () => {
  it('repeats a quarterly cadence at the average amount across the next twelve months', () => {
    const result = computeDividendForecast({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-20',
      transactions: [
        tx({ id: 'q1', date: '2025-10-15', amount: 10 }),
        tx({ id: 'q2', date: '2026-01-15', amount: 20 }),
        tx({ id: 'q3', date: '2026-04-15', amount: 30 }),
        tx({ id: 'q4', date: '2026-07-15', amount: 40 }),
      ],
    });

    expect(result).toEqual([
      { month: '2026-11', amount: 0 },
      { month: '2026-12', amount: 0 },
      { month: '2027-01', amount: 25 },
      { month: '2027-02', amount: 0 },
      { month: '2027-03', amount: 0 },
      { month: '2027-04', amount: 25 },
      { month: '2027-05', amount: 0 },
      { month: '2027-06', amount: 0 },
      { month: '2027-07', amount: 25 },
      { month: '2027-08', amount: 0 },
      { month: '2027-09', amount: 0 },
      { month: '2027-10', amount: 25 },
    ]);
  });

  it('treats a single recorded payment as annual and projects it once', () => {
    const result = computeDividendForecast({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-20',
      transactions: [tx({ id: 'only', date: '2026-03-10', amount: 50 })],
    });

    expect(result).toHaveLength(12);
    expect(result.filter((month) => month.amount > 0)).toEqual([
      { month: '2027-03', amount: 50 },
    ]);
  });

  it('uses the median gap rather than the mean when the intervals are irregular', () => {
    const result = computeDividendForecast({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-20',
      transactions: [
        tx({ id: 'p1', date: '2026-01-15', amount: 10 }),
        tx({ id: 'p2', date: '2026-02-15', amount: 10 }),
        tx({ id: 'p3', date: '2026-03-15', amount: 10 }),
        tx({ id: 'p4', date: '2026-10-15', amount: 10 }),
      ],
    });

    expect(result).toHaveLength(12);
    expect(result.every((month) => month.amount === 10)).toBe(true);
    expect(result[0]).toEqual({ month: '2026-11', amount: 10 });
    expect(result[1]).toEqual({ month: '2026-12', amount: 10 });
  });

  it('returns twelve zero months when there are no transactions', () => {
    const result = computeDividendForecast({
      fxRates,
      baseCurrency: 'USD',
      today: '2026-10-20', transactions: [] });

    expect(result).toHaveLength(12);
    expect(result.every((month) => month.amount === 0)).toBe(true);
    expect(result[0].month).toBe('2026-11');
    expect(result[11].month).toBe('2027-10');
  });
});

describe('computeYieldOnCost', () => {
  it('divides trailing income by remaining lot cost basis as a percent and sorts descending', () => {
    const result = computeYieldOnCost({
      fxRates,
      baseCurrency: 'USD',
      holdings: [holding()],
      today: '2026-10-15',
      transactions: [
        tx({ id: 'a1', holdingId: 'h1', date: '2026-03-10', amount: 40 }),
        tx({ id: 'a2', holdingId: 'h1', date: '2026-09-10', amount: 60 }),
        tx({ id: 'b1', holdingId: 'h2', date: '2026-05-10', amount: 30 }),
      ],
      lots: [
        lot({ id: 'l1', holdingId: 'h1', remainingQuantity: 10, costPerUnit: 100 }),
        lot({ id: 'l2', holdingId: 'h2', remainingQuantity: 5, costPerUnit: 200 }),
      ],
    });

    expect(result.map((entry) => entry.holdingId)).toEqual(['h1', 'h2']);
    expect(result[0].trailingIncome).toBe(100);
    expect(result[0].costBasis).toBe(1000);
    expect(result[0].yieldOnCost).toBeCloseTo(10, 10);
    expect(result[1].trailingIncome).toBe(30);
    expect(result[1].costBasis).toBe(1000);
    expect(result[1].yieldOnCost).toBeCloseTo(3, 10);
  });

  it('brings a foreign cost basis and a dividend paid in another currency to one currency', () => {
    const result = computeYieldOnCost({
      fxRates,
      baseCurrency: 'USD',
      holdings: [holding({ id: 'h-eur', currency: 'EUR' })],
      today: '2026-10-15',
      transactions: [tx({ id: 'd', holdingId: 'h-eur', date: '2026-09-10', amount: 50 })],
      lots: [lot({ id: 'l-eur', holdingId: 'h-eur', remainingQuantity: 10, costPerUnit: 100 })],
    });

    // 1000 EUR of cost is 1086.96 USD, so 50 USD of income is 4.6% rather than 5%.
    expect(result[0].costBasis).toBeCloseTo(1086.96, 2);
    expect(result[0].trailingIncome).toBe(50);
    expect(result[0].yieldOnCost).toBeCloseTo(4.6, 2);
  });

  it('excludes income older than the trailing twelve months', () => {
    const result = computeYieldOnCost({
      fxRates,
      baseCurrency: 'USD',
      holdings: [holding()],
      today: '2026-10-15',
      transactions: [
        tx({ id: 'old', holdingId: 'h1', date: '2025-10-20', amount: 500 }),
        tx({ id: 'new', holdingId: 'h1', date: '2025-11-20', amount: 50 }),
      ],
      lots: [lot({ id: 'l1', holdingId: 'h1', remainingQuantity: 10, costPerUnit: 100 })],
    });

    expect(result).toHaveLength(1);
    expect(result[0].trailingIncome).toBe(50);
    expect(result[0].yieldOnCost).toBeCloseTo(5, 10);
  });

  it('skips holdings whose remaining cost basis is zero, negative or missing', () => {
    const result = computeYieldOnCost({
      fxRates,
      baseCurrency: 'USD',
      holdings: [holding()],
      today: '2026-10-15',
      transactions: [
        tx({ id: 'z', holdingId: 'zero', date: '2026-06-01', amount: 50 }),
        tx({ id: 'n', holdingId: 'negative', date: '2026-06-01', amount: 50 }),
        tx({ id: 'm', holdingId: 'missing', date: '2026-06-01', amount: 50 }),
        tx({ id: 'g', holdingId: 'good', date: '2026-06-01', amount: 50 }),
      ],
      lots: [
        lot({ id: 'l1', holdingId: 'zero', remainingQuantity: 0, costPerUnit: 100 }),
        lot({ id: 'l2', holdingId: 'negative', remainingQuantity: -5, costPerUnit: 10 }),
        lot({ id: 'l3', holdingId: 'good', remainingQuantity: 1, costPerUnit: 100 }),
      ],
    });

    expect(result.map((entry) => entry.holdingId)).toEqual(['good']);
    expect(result[0].yieldOnCost).toBeCloseTo(50, 10);
    expect(result.every((entry) => Number.isFinite(entry.yieldOnCost))).toBe(true);
    expect(result.every((entry) => Number.isFinite(entry.costBasis))).toBe(true);
    expect(result.every((entry) => Number.isFinite(entry.trailingIncome))).toBe(true);
  });

  it('returns nothing when there are no transactions and no lots', () => {
    expect(computeYieldOnCost({
      fxRates,
      baseCurrency: 'USD',
      holdings: [holding()],
      today: '2026-10-15', transactions: [], lots: [] })).toEqual([]);
  });
});
