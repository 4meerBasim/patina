import { describe, expect, it } from '@jest/globals';

import type { AssetClass, Snapshot, Transaction, TransactionType } from '@/data/types';
import { ASSET_CLASSES } from '@/data/types';
import { computeRecap } from '@/lib/recap';

function perClass(values: Partial<Record<AssetClass, number>> = {}): Record<AssetClass, number> {
  return ASSET_CLASSES.reduce(
    (acc, assetClass) => ({ ...acc, [assetClass]: values[assetClass] ?? 0 }),
    {} as Record<AssetClass, number>,
  );
}

function snapshot(date: string, overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    date,
    totalNetWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    perClass: perClass(),
    perAccount: {},
    ...overrides,
  };
}

function tx(
  date: string,
  type: TransactionType,
  amount: number,
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: `${type}-${date}-${amount}`,
    holdingId: null,
    accountId: 'a1',
    type,
    quantity: null,
    price: null,
    amount,
    currency: 'USD',
    date,
    note: null,
    ...overrides,
  };
}

describe('computeRecap', () => {
  it('returns an empty recap with no dates when there are no snapshots', () => {
    const recap = computeRecap({ snapshots: [], transactions: [], days: 30 });
    expect(recap.from).toBe('');
    expect(recap.to).toBe('');
    expect(recap.netWorthChange).toBe(0);
    expect(recap.perAccount).toEqual([]);
    expect(recap.perHolding).toEqual([]);
  });

  it('lists every asset class at zero in an empty recap', () => {
    const recap = computeRecap({ snapshots: [], transactions: [], days: 30 });
    expect(recap.perClass.map((entry) => entry.assetClass)).toEqual(ASSET_CLASSES);
    expect(recap.perClass.every((entry) => entry.change === 0)).toBe(true);
  });

  it('has nothing to compare against with a single snapshot', () => {
    const recap = computeRecap({
      snapshots: [snapshot('2026-10-01', { totalNetWorth: 500_000 })],
      transactions: [],
      days: 30,
    });
    expect(recap.from).toBe('2026-10-01');
    expect(recap.to).toBe('2026-10-01');
    expect(recap.netWorthChange).toBe(0);
  });

  it('sorts snapshots by date rather than trusting the input order', () => {
    const recap = computeRecap({
      snapshots: [
        snapshot('2026-10-31', { totalNetWorth: 110_000 }),
        snapshot('2026-10-01', { totalNetWorth: 100_000 }),
      ],
      transactions: [],
      days: 30,
    });
    expect(recap.from).toBe('2026-10-01');
    expect(recap.to).toBe('2026-10-31');
    expect(recap.netWorthChange).toBe(10_000);
  });

  describe('choosing the start of the window', () => {
    const snapshots = [
      snapshot('2026-09-01', { totalNetWorth: 90_000 }),
      snapshot('2026-10-01', { totalNetWorth: 100_000 }),
      snapshot('2026-10-21', { totalNetWorth: 105_000 }),
      snapshot('2026-10-31', { totalNetWorth: 110_000 }),
    ];

    it('picks the latest snapshot at or before the cutoff', () => {
      const recap = computeRecap({ snapshots, transactions: [], days: 30 });
      expect(recap.from).toBe('2026-10-01');
      expect(recap.to).toBe('2026-10-31');
      expect(recap.netWorthChange).toBe(10_000);
    });

    it('falls back to the earliest snapshot when none is old enough', () => {
      const recap = computeRecap({ snapshots, transactions: [], days: 3650 });
      expect(recap.from).toBe('2026-09-01');
      expect(recap.netWorthChange).toBe(20_000);
    });

    it('uses the previous snapshot for a window shorter than the gap', () => {
      const recap = computeRecap({ snapshots, transactions: [], days: 1 });
      expect(recap.from).toBe('2026-10-21');
      expect(recap.netWorthChange).toBe(5_000);
    });
  });

  describe('per class', () => {
    it('differences each class across the window', () => {
      const recap = computeRecap({
        snapshots: [
          snapshot('2026-10-01', { perClass: perClass({ stocks: 50_000, cash: 10_000 }) }),
          snapshot('2026-10-31', { perClass: perClass({ stocks: 62_500, cash: 7_500 }) }),
        ],
        transactions: [],
        days: 30,
      });
      const byClass = new Map(recap.perClass.map((entry) => [entry.assetClass, entry.change]));
      expect(byClass.get('stocks')).toBe(12_500);
      expect(byClass.get('cash')).toBe(-2_500);
      expect(byClass.get('crypto')).toBe(0);
    });

    it('treats a class missing from a snapshot as zero', () => {
      const start = snapshot('2026-10-01');
      const end = snapshot('2026-10-31');
      delete (start.perClass as Partial<Record<AssetClass, number>>).crypto;
      end.perClass.crypto = 4_000;
      const recap = computeRecap({ snapshots: [start, end], transactions: [], days: 30 });
      const crypto = recap.perClass.find((entry) => entry.assetClass === 'crypto');
      expect(crypto?.change).toBe(4_000);
    });

    it('rounds a class change to cents', () => {
      const recap = computeRecap({
        snapshots: [
          snapshot('2026-10-01', { perClass: perClass({ stocks: 0.1 }) }),
          snapshot('2026-10-31', { perClass: perClass({ stocks: 0.3 }) }),
        ],
        transactions: [],
        days: 30,
      });
      const stocks = recap.perClass.find((entry) => entry.assetClass === 'stocks');
      expect(stocks?.change).toBe(0.2);
    });
  });

  describe('per account', () => {
    it('ranks accounts by the size of the move, gains and losses together', () => {
      const recap = computeRecap({
        snapshots: [
          snapshot('2026-10-01', { perAccount: { a1: 10_000, a2: 50_000, a3: 1_000 } }),
          snapshot('2026-10-31', { perAccount: { a1: 12_000, a2: 20_000, a3: 1_500 } }),
        ],
        transactions: [],
        days: 30,
      });
      expect(recap.perAccount).toEqual([
        { accountId: 'a2', change: -30_000 },
        { accountId: 'a1', change: 2_000 },
        { accountId: 'a3', change: 500 },
      ]);
    });

    it('drops accounts that did not move', () => {
      const recap = computeRecap({
        snapshots: [
          snapshot('2026-10-01', { perAccount: { a1: 10_000, a2: 5_000 } }),
          snapshot('2026-10-31', { perAccount: { a1: 10_000, a2: 6_000 } }),
        ],
        transactions: [],
        days: 30,
      });
      expect(recap.perAccount).toEqual([{ accountId: 'a2', change: 1_000 }]);
    });

    it('counts an account that only exists at one end of the window', () => {
      const recap = computeRecap({
        snapshots: [
          snapshot('2026-10-01', { perAccount: { a1: 10_000 } }),
          snapshot('2026-10-31', { perAccount: { a1: 10_000, a2: 3_000 } }),
        ],
        transactions: [],
        days: 30,
      });
      expect(recap.perAccount).toEqual([{ accountId: 'a2', change: 3_000 }]);
    });
  });

  describe('contributions versus market', () => {
    const snapshots = [
      snapshot('2026-10-01', { totalNetWorth: 100_000 }),
      snapshot('2026-10-31', { totalNetWorth: 115_000 }),
    ];

    it('splits a gain into what was paid in and what the market did', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [tx('2026-10-10', 'deposit', 5_000)],
        days: 30,
      });
      expect(recap.netWorthChange).toBe(15_000);
      expect(recap.contributions).toBe(5_000);
      expect(recap.market).toBe(10_000);
    });

    it('nets a withdrawal against deposits', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [tx('2026-10-10', 'deposit', 8_000), tx('2026-10-20', 'withdrawal', -3_000)],
        days: 30,
      });
      expect(recap.contributions).toBe(5_000);
      expect(recap.market).toBe(10_000);
    });

    it('ignores buys, sells and dividends, which move money inside the portfolio', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [
          tx('2026-10-10', 'buy', 20_000),
          tx('2026-10-11', 'sell', -5_000),
          tx('2026-10-12', 'dividend', 400),
        ],
        days: 30,
      });
      expect(recap.contributions).toBe(0);
      expect(recap.market).toBe(15_000);
    });

    it('excludes a deposit dated on the start snapshot', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [tx('2026-10-01', 'deposit', 5_000)],
        days: 30,
      });
      expect(recap.contributions).toBe(0);
    });

    it('includes a deposit dated on the end snapshot', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [tx('2026-10-31', 'deposit', 5_000)],
        days: 30,
      });
      expect(recap.contributions).toBe(5_000);
    });

    it('ignores a deposit from before the window', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [tx('2026-09-15', 'deposit', 5_000)],
        days: 30,
      });
      expect(recap.contributions).toBe(0);
    });
  });

  describe('per holding', () => {
    const snapshots = [
      snapshot('2026-10-01', { totalNetWorth: 100_000 }),
      snapshot('2026-10-31', { totalNetWorth: 100_000 }),
    ];

    it('sums every transaction against one holding', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [
          tx('2026-10-05', 'buy', 4_000, { holdingId: 'h1' }),
          tx('2026-10-15', 'buy', 2_500, { holdingId: 'h1' }),
        ],
        days: 30,
      });
      expect(recap.perHolding).toEqual([{ holdingId: 'h1', flow: 6_500 }]);
    });

    it('ranks holdings by the size of the flow', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [
          tx('2026-10-05', 'buy', 1_000, { holdingId: 'h1' }),
          tx('2026-10-06', 'sell', -9_000, { holdingId: 'h2' }),
        ],
        days: 30,
      });
      expect(recap.perHolding.map((entry) => entry.holdingId)).toEqual(['h2', 'h1']);
    });

    it('drops a holding whose buys and sells cancel out', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [
          tx('2026-10-05', 'buy', 3_000, { holdingId: 'h1' }),
          tx('2026-10-06', 'sell', -3_000, { holdingId: 'h1' }),
        ],
        days: 30,
      });
      expect(recap.perHolding).toEqual([]);
    });

    it('ignores transactions with no holding attached', () => {
      const recap = computeRecap({
        snapshots,
        transactions: [tx('2026-10-05', 'deposit', 3_000)],
        days: 30,
      });
      expect(recap.perHolding).toEqual([]);
    });
  });
});
