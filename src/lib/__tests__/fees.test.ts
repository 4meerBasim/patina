import { describe, expect, it } from '@jest/globals';

import { computeFeeAnalysis, defaultFeeAssumptions } from '@/lib/fees';

describe('computeFeeAnalysis', () => {
  it('reports annual cost, ten and twenty year drag and excess over the comparison ratio', () => {
    const result = computeFeeAnalysis({
      holdings: [{ id: 'h1', label: 'Fund A', value: 10000, expenseRatio: 0.0075 }],
    });

    expect(result.holdings).toHaveLength(1);
    expect(result.holdings[0].holdingId).toBe('h1');
    expect(result.holdings[0].name).toBe('Fund A');
    expect(result.holdings[0].ratio).toBe(0.0075);
    expect(result.holdings[0].value).toBe(10000);
    expect(result.holdings[0].annualCost).toBeCloseTo(75, 2);
    expect(result.holdings[0].drag10).toBeCloseTo(1336.16, 2);
    expect(result.holdings[0].drag20).toBeCloseTo(5078.31, 2);
    expect(result.holdings[0].excessVsComparison).toBeCloseTo(72, 2);
    expect(result.totalAnnualCost).toBeCloseTo(75, 2);
    expect(result.totalDrag10).toBeCloseTo(1336.16, 2);
    expect(result.totalDrag20).toBeCloseTo(5078.31, 2);
    expect(result.comparisonRatio).toBe(0.0003);
  });

  it('leaves out holdings with a null or zero expense ratio and counts nothing for them', () => {
    const result = computeFeeAnalysis({
      holdings: [
        { id: 'none', label: 'No Ratio', value: 10000, expenseRatio: null },
        { id: 'free', label: 'Zero Ratio', value: 20000, expenseRatio: 0 },
        { id: 'charged', label: 'Charged', value: 1000, expenseRatio: 0.005 },
      ],
    });

    expect(result.holdings.map((holding) => holding.holdingId)).toEqual(['charged']);
    expect(result.totalAnnualCost).toBeCloseTo(5, 2);
  });

  it('orders holdings by annual cost descending and totals the columns', () => {
    const result = computeFeeAnalysis({
      holdings: [
        { id: 'h1', label: 'Fund A', value: 10000, expenseRatio: 0.0075 },
        { id: 'h2', label: 'Fund B', value: 50000, expenseRatio: 0.002 },
        { id: 'h3', label: 'Fund C', value: 20000, expenseRatio: 0.009 },
      ],
    });

    expect(result.holdings.map((holding) => holding.holdingId)).toEqual(['h3', 'h2', 'h1']);
    expect(result.holdings.map((holding) => holding.annualCost)).toEqual([180, 100, 75]);
    expect(result.totalAnnualCost).toBeCloseTo(355, 2);
    expect(result.totalDrag10).toBeCloseTo(6345.97, 2);
    expect(result.totalDrag20).toBeCloseTo(24214.19, 2);
    expect(result.totalDrag10).toBeCloseTo(
      result.holdings.reduce((sum, holding) => sum + holding.drag10, 0),
      2,
    );
    expect(result.totalDrag20).toBeCloseTo(
      result.holdings.reduce((sum, holding) => sum + holding.drag20, 0),
      2,
    );
  });

  it('uses supplied assumptions instead of the defaults', () => {
    const holdings = [{ id: 'h1', label: 'Fund A', value: 10000, expenseRatio: 0.0075 }];
    const custom = computeFeeAnalysis({
      holdings,
      assumptions: { grossReturn: 0.1, comparisonRatio: 0.0005 },
    });
    const withDefaults = computeFeeAnalysis({ holdings });

    expect(custom.holdings[0].drag10).toBeCloseTo(1715.18, 2);
    expect(custom.holdings[0].drag20).toBeCloseTo(8603.27, 2);
    expect(custom.holdings[0].excessVsComparison).toBeCloseTo(70, 2);
    expect(custom.comparisonRatio).toBe(0.0005);
    expect(custom.holdings[0].drag10).not.toBeCloseTo(withDefaults.holdings[0].drag10, 2);
    expect(custom.holdings[0].annualCost).toBeCloseTo(withDefaults.holdings[0].annualCost, 2);
  });

  it('compounds the drag so twenty years costs more than twice ten years', () => {
    const result = computeFeeAnalysis({
      holdings: [{ id: 'h1', label: 'Fund A', value: 10000, expenseRatio: 0.0075 }],
    });

    expect(result.holdings[0].drag20).toBeGreaterThan(result.holdings[0].drag10);
    expect(result.holdings[0].drag20).toBeGreaterThan(result.holdings[0].drag10 * 2);
  });

  it('returns a zeroed analysis with the comparison ratio when there are no holdings', () => {
    expect(computeFeeAnalysis({ holdings: [] })).toEqual({
      holdings: [],
      totalAnnualCost: 0,
      totalDrag10: 0,
      totalDrag20: 0,
      comparisonRatio: 0.0003,
    });
  });

  it('stays finite when the expense ratio exceeds the gross return', () => {
    const result = computeFeeAnalysis({
      holdings: [{ id: 'h1', label: 'Expensive', value: 10000, expenseRatio: 0.1 }],
      assumptions: { grossReturn: 0.07, comparisonRatio: 0.0003 },
    });

    expect(result.holdings[0].annualCost).toBeCloseTo(1000, 2);
    expect(result.holdings[0].drag10).toBeCloseTo(12297.27, 2);
    expect(result.holdings[0].drag20).toBeCloseTo(33258.9, 2);
    expect(result.holdings[0].excessVsComparison).toBeCloseTo(997, 2);
    expect(Number.isFinite(result.holdings[0].drag10)).toBe(true);
    expect(Number.isFinite(result.holdings[0].drag20)).toBe(true);
    expect(Number.isFinite(result.totalDrag20)).toBe(true);
  });

  it('never lets excess over the comparison ratio go below zero', () => {
    const result = computeFeeAnalysis({
      holdings: [{ id: 'h1', label: 'Cheaper Than Index', value: 10000, expenseRatio: 0.0001 }],
    });

    expect(result.holdings[0].excessVsComparison).toBe(0);
  });

  it('leaves the exported default assumptions untouched', () => {
    expect(defaultFeeAssumptions).toEqual({ grossReturn: 0.07, comparisonRatio: 0.0003 });
  });
});
