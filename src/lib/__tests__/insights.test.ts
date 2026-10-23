import { describe, expect, it } from '@jest/globals';

import type { AllocationTargets } from '@/data/types';
import type { FeeAnalysis, HoldingFee } from '@/lib/fees';
import {
  computeInsights,
  defaultInsightThresholds,
  type InsightAllocation,
  type InsightGoal,
  type InsightHolding,
  type InsightInput,
} from '@/lib/insights';

const evenTargets: AllocationTargets = {
  stocks: 20,
  crypto: 20,
  property: 20,
  cash: 20,
  savings: 20,
};

const noFees: FeeAnalysis = {
  holdings: [],
  totalAnnualCost: 0,
  totalDrag10: 0,
  totalDrag20: 0,
  comparisonRatio: 0.0003,
};

function fee(overrides: Partial<HoldingFee> = {}): HoldingFee {
  return {
    holdingId: 'h1',
    name: 'Growth Fund',
    ratio: 0.0075,
    value: 100_000,
    annualCost: 750,
    drag10: 5_000,
    drag20: 15_000,
    excessVsComparison: 720,
    ...overrides,
  };
}

function input(overrides: Partial<InsightInput> = {}): InsightInput {
  return {
    allocation: [],
    targets: evenTargets,
    holdings: [],
    totalAssets: 0,
    fees: noFees,
    goals: [],
    baseCurrency: 'USD',
    thresholds: defaultInsightThresholds,
    ...overrides,
  };
}

function slice(assetClass: InsightAllocation['assetClass'], weight: number): InsightAllocation {
  return { assetClass, value: weight * 1000, weight };
}

function keysOf(result: ReturnType<typeof computeInsights>): string[] {
  return result.map((candidate) => candidate.key);
}

describe('computeInsights', () => {
  it('returns nothing for an empty portfolio', () => {
    expect(computeInsights(input())).toEqual([]);
  });

  describe('class concentration', () => {
    it('fires when a class sits exactly on the threshold', () => {
      const result = computeInsights(
        input({ allocation: [slice('stocks', defaultInsightThresholds.concentrationClassPercent)] }),
      );
      expect(keysOf(result)).toContain('concentration-class-stocks');
    });

    it('stays quiet just below the threshold', () => {
      const result = computeInsights(
        input({
          allocation: [slice('stocks', defaultInsightThresholds.concentrationClassPercent - 0.01)],
        }),
      );
      expect(keysOf(result)).not.toContain('concentration-class-stocks');
    });

    it('names the class and quotes its target', () => {
      const [candidate] = computeInsights(input({ allocation: [slice('property', 61.4)] }));
      expect(candidate.kind).toBe('concentration');
      expect(candidate.body).toBe('Real estate is 61% of your portfolio.');
      expect(candidate.detail).toBe('Target is 20%.');
    });
  });

  describe('holding concentration', () => {
    const holdings: InsightHolding[] = [
      { id: 'h1', label: 'Apple', value: 30_000 },
      { id: 'h2', label: 'Nestle', value: 5_000 },
    ];

    it('measures each holding against total assets', () => {
      const result = computeInsights(input({ holdings, totalAssets: 100_000 }));
      expect(keysOf(result)).toEqual(['concentration-holding-h1']);
      expect(result[0].body).toBe('Apple alone is 30% of your portfolio.');
      expect(result[0].detail).toBe('$30,000 in one position.');
    });

    it('fires exactly on the threshold', () => {
      const result = computeInsights(
        input({
          holdings: [{ id: 'h1', label: 'Apple', value: 12 }],
          totalAssets: 100,
        }),
      );
      expect(keysOf(result)).toContain('concentration-holding-h1');
    });

    it('skips the check when total assets are zero, rather than dividing by it', () => {
      const result = computeInsights(input({ holdings, totalAssets: 0 }));
      expect(keysOf(result)).toEqual([]);
    });
  });

  describe('drift', () => {
    it('reports a class above target', () => {
      const [candidate] = computeInsights(input({ allocation: [slice('cash', 32)] }));
      expect(candidate.kind).toBe('drift');
      expect(candidate.body).toBe('Cash is 12 points above target.');
      expect(candidate.detail).toBe('Actual 32% versus 20% target.');
    });

    it('reports a class below target', () => {
      const [candidate] = computeInsights(input({ allocation: [slice('savings', 8)] }));
      expect(candidate.body).toBe('Savings is 12 points below target.');
    });

    it('fires exactly on the drift threshold', () => {
      const result = computeInsights(
        input({ allocation: [slice('cash', 20 + defaultInsightThresholds.driftPoints)] }),
      );
      expect(keysOf(result)).toContain('drift-cash');
    });

    it('stays quiet just inside the drift threshold', () => {
      const result = computeInsights(
        input({ allocation: [slice('cash', 20 + defaultInsightThresholds.driftPoints - 0.01)] }),
      );
      expect(keysOf(result)).toEqual([]);
    });

    it('says point, not points, for a single point of drift', () => {
      const thresholds = { ...defaultInsightThresholds, driftPoints: 1 };
      const [candidate] = computeInsights(
        input({ allocation: [slice('cash', 21)], thresholds }),
      );
      expect(candidate.body).toBe('Cash is 1 point above target.');
    });
  });

  describe('fees', () => {
    const fees: FeeAnalysis = { ...noFees, holdings: [fee()] };

    it('reports a holding whose annual cost clears the threshold', () => {
      const [candidate] = computeInsights(input({ fees }));
      expect(candidate.kind).toBe('fees');
      expect(candidate.body).toBe('Growth Fund costs 0.75% a year.');
      expect(candidate.detail).toBe(
        'About $750 a year; a comparable index fund costs 0.03%.',
      );
    });

    it('fires exactly on the cost threshold', () => {
      const atThreshold: FeeAnalysis = {
        ...noFees,
        holdings: [fee({ annualCost: defaultInsightThresholds.feeAnnualCost })],
      };
      expect(keysOf(computeInsights(input({ fees: atThreshold })))).toEqual(['fees-h1']);
    });

    it('stays quiet just below the cost threshold', () => {
      const below: FeeAnalysis = {
        ...noFees,
        holdings: [fee({ annualCost: defaultInsightThresholds.feeAnnualCost - 0.01 })],
      };
      expect(computeInsights(input({ fees: below }))).toEqual([]);
    });
  });

  describe('goal milestones', () => {
    function goal(overrides: Partial<InsightGoal> = {}): InsightGoal {
      return { id: 'g1', name: 'House', percent: 80, pace: 'on-pace', ...overrides };
    }

    it('reports the highest milestone crossed, not every one', () => {
      const result = computeInsights(input({ goals: [goal({ percent: 80 })] }));
      expect(keysOf(result)).toEqual(['milestone-g1-75']);
      expect(result[0].body).toBe('Your House goal passed the 75% mark.');
      expect(result[0].detail).toBe('80% of the way there.');
    });

    it('switches wording when the goal is actually reached', () => {
      const [candidate] = computeInsights(input({ goals: [goal({ percent: 100 })] }));
      expect(candidate.key).toBe('milestone-g1-100');
      expect(candidate.body).toBe('You reached your House goal.');
    });

    it('stays quiet below the lowest milestone', () => {
      expect(computeInsights(input({ goals: [goal({ percent: 24 })] }))).toEqual([]);
    });

    it('fires exactly on a milestone', () => {
      const result = computeInsights(input({ goals: [goal({ percent: 25 })] }));
      expect(keysOf(result)).toEqual(['milestone-g1-25']);
    });
  });

  describe('goal pace', () => {
    it('reports a goal running behind', () => {
      const goals: InsightGoal[] = [{ id: 'g1', name: 'House', percent: 10, pace: 'behind' }];
      const [candidate] = computeInsights(input({ goals }));
      expect(candidate.kind).toBe('pace');
      expect(candidate.body).toBe('House is running behind schedule.');
      expect(candidate.detail).toBeNull();
    });

    it('reports a goal running ahead', () => {
      const goals: InsightGoal[] = [{ id: 'g1', name: 'House', percent: 10, pace: 'ahead' }];
      const [candidate] = computeInsights(input({ goals }));
      expect(candidate.kind).toBe('pace');
      expect(candidate.body).toBe('House is running ahead of schedule.');
    });

    it('says nothing about a goal that is on pace', () => {
      const goals: InsightGoal[] = [{ id: 'g1', name: 'House', percent: 10, pace: 'on-pace' }];
      expect(computeInsights(input({ goals }))).toEqual([]);
    });
  });

  it('orders candidates by priority, concentration ahead of drift ahead of pace', () => {
    const result = computeInsights(
      input({
        allocation: [slice('stocks', 70)],
        goals: [{ id: 'g1', name: 'House', percent: 10, pace: 'behind' }],
      }),
    );
    expect(result.map((candidate) => candidate.kind)).toEqual(['concentration', 'drift', 'pace']);
  });

  it('respects caller thresholds over the defaults', () => {
    const thresholds = { ...defaultInsightThresholds, concentrationClassPercent: 90 };
    const result = computeInsights(input({ allocation: [slice('stocks', 70)], thresholds }));
    expect(keysOf(result)).toEqual(['drift-stocks']);
  });
});
