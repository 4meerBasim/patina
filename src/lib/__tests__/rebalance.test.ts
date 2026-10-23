import { describe, expect, it } from '@jest/globals';

import type { AllocationTargets } from '@/data/types';
import { computeRebalance, defaultAllocationTargets } from '@/lib/rebalance';

function targets(overrides: Partial<AllocationTargets> = {}): AllocationTargets {
  return { stocks: 40, crypto: 5, property: 35, cash: 10, savings: 10, ...overrides };
}

describe('computeRebalance', () => {
  it('tells an overweight class to sell and an underweight class to buy', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 50000, weight: 50 },
        { assetClass: 'crypto', value: 2000, weight: 2 },
      ],
      targets: targets(),
      netWorth: 100000,
    });

    expect(result).toEqual([
      {
        assetClass: 'stocks',
        actualPercent: 50,
        targetPercent: 40,
        driftPoints: 10,
        actualValue: 50000,
        targetValue: 40000,
        deltaValue: -10000,
        action: 'sell',
      },
      {
        assetClass: 'crypto',
        actualPercent: 2,
        targetPercent: 5,
        driftPoints: -3,
        actualValue: 2000,
        targetValue: 5000,
        deltaValue: 3000,
        action: 'buy',
      },
    ]);
  });

  it('holds only while the drift is strictly inside the one point default tolerance', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 41000, weight: 41 },
        { assetClass: 'crypto', value: 6010, weight: 6.01 },
        { assetClass: 'property', value: 34010, weight: 34.01 },
      ],
      targets: targets(),
      netWorth: 100000,
    });

    expect(result[0].driftPoints).toBe(1);
    expect(result[0].action).toBe('sell');
    expect(result[1].driftPoints).toBeCloseTo(1.01, 10);
    expect(result[1].action).toBe('sell');
    expect(result[2].driftPoints).toBeCloseTo(-0.99, 10);
    expect(result[2].action).toBe('hold');
  });

  it('respects a wider tolerance supplied by the caller', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 43000, weight: 43 },
        { assetClass: 'crypto', value: 11000, weight: 11 },
      ],
      targets: targets(),
      netWorth: 100000,
      tolerancePoints: 5,
    });

    expect(result[0].action).toBe('hold');
    expect(result[0].driftPoints).toBe(3);
    expect(result[0].deltaValue).toBe(-3000);
    expect(result[1].action).toBe('sell');
    expect(result[1].driftPoints).toBe(6);
    expect(result[1].deltaValue).toBe(-6000);
  });

  it('holds everything with no delta when the allocation already matches the targets', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 40000, weight: 40 },
        { assetClass: 'crypto', value: 5000, weight: 5 },
        { assetClass: 'property', value: 35000, weight: 35 },
        { assetClass: 'cash', value: 10000, weight: 10 },
        { assetClass: 'savings', value: 10000, weight: 10 },
      ],
      targets: targets(),
      netWorth: 100000,
    });

    expect(result).toHaveLength(5);
    expect(result.every((hint) => hint.action === 'hold')).toBe(true);
    expect(result.every((hint) => hint.deltaValue === 0)).toBe(true);
    expect(result.every((hint) => hint.driftPoints === 0)).toBe(true);
  });

  it('leaves part of net worth unallocated when the targets sum to less than one hundred', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 40000, weight: 40 },
        { assetClass: 'crypto', value: 5000, weight: 5 },
        { assetClass: 'property', value: 35000, weight: 35 },
        { assetClass: 'cash', value: 10000, weight: 10 },
        { assetClass: 'savings', value: 10000, weight: 10 },
      ],
      targets: targets({ stocks: 30, property: 25 }),
      netWorth: 100000,
    });

    expect(result[0].targetPercent).toBe(30);
    expect(result[0].targetValue).toBe(30000);
    expect(result.reduce((sum, hint) => sum + hint.targetValue, 0)).toBe(80000);
    expect(result.reduce((sum, hint) => sum + hint.deltaValue, 0)).toBe(-20000);
    expect(result.map((hint) => hint.action)).toEqual(['sell', 'hold', 'sell', 'hold', 'hold']);
  });

  it('advises nothing when the targets sum to more than one hundred', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 40000, weight: 40 },
        { assetClass: 'crypto', value: 5000, weight: 5 },
        { assetClass: 'property', value: 35000, weight: 35 },
        { assetClass: 'cash', value: 10000, weight: 10 },
        { assetClass: 'savings', value: 10000, weight: 10 },
      ],
      targets: targets({ stocks: 50, crypto: 10, property: 40 }),
      netWorth: 100000,
    });

    // The targets themselves are reported as entered; only the advice is withheld.
    expect(result.reduce((sum, hint) => sum + hint.targetValue, 0)).toBe(120000);
    expect(result.map((hint) => hint.targetPercent)).toEqual([50, 10, 40, 10, 10]);
    expect(result.every((hint) => hint.action === 'hold')).toBe(true);
  });

  it('resumes advising once the targets come back to one hundred', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 40000, weight: 40 },
        { assetClass: 'crypto', value: 5000, weight: 5 },
        { assetClass: 'property', value: 35000, weight: 35 },
        { assetClass: 'cash', value: 10000, weight: 10 },
        { assetClass: 'savings', value: 10000, weight: 10 },
      ],
      targets: targets({ stocks: 50, property: 25 }),
      netWorth: 100000,
    });

    expect(result.map((hint) => hint.action)).toEqual(['buy', 'hold', 'sell', 'hold', 'hold']);
  });

  it('holds every class when net worth is zero, rather than advising a sell of nothing', () => {
    const result = computeRebalance({
      allocation: [
        { assetClass: 'stocks', value: 0, weight: 0 },
        { assetClass: 'cash', value: 0, weight: 0 },
      ],
      targets: targets(),
      netWorth: 0,
    });

    expect(
      result.every(
        (hint) =>
          Number.isFinite(hint.actualPercent) &&
          Number.isFinite(hint.targetPercent) &&
          Number.isFinite(hint.driftPoints) &&
          Number.isFinite(hint.actualValue) &&
          Number.isFinite(hint.targetValue) &&
          Number.isFinite(hint.deltaValue),
      ),
    ).toBe(true);
    expect(result.map((hint) => hint.targetValue)).toEqual([0, 0]);
    expect(result.map((hint) => hint.deltaValue)).toEqual([0, 0]);
    expect(result.map((hint) => hint.action)).toEqual(['hold', 'hold']);
  });

  it('treats a missing target as zero and emits nothing for a target with no allocation', () => {
    const partialTargets = { stocks: 40, crypto: 5, property: 35, cash: 10 } as AllocationTargets;
    const result = computeRebalance({
      allocation: [
        { assetClass: 'savings', value: 10000, weight: 10 },
        { assetClass: 'stocks', value: 40000, weight: 40 },
      ],
      targets: partialTargets,
      netWorth: 100000,
    });

    expect(result.map((hint) => hint.assetClass)).toEqual(['savings', 'stocks']);
    expect(result[0].targetPercent).toBe(0);
    expect(result[0].targetValue).toBe(0);
    expect(result[0].driftPoints).toBe(10);
    expect(result[0].deltaValue).toBe(-10000);
    expect(result[0].action).toBe('sell');
    expect(result[1].action).toBe('hold');
  });

  it('returns nothing for an empty allocation', () => {
    expect(computeRebalance({ allocation: [], targets: targets(), netWorth: 100000 })).toEqual([]);
  });

  it('leaves the exported default targets untouched and summing to one hundred', () => {
    expect(defaultAllocationTargets).toEqual({
      stocks: 40,
      crypto: 5,
      property: 35,
      cash: 10,
      savings: 10,
    });
    expect(Object.values(defaultAllocationTargets).reduce((sum, value) => sum + value, 0)).toBe(100);
  });
});
