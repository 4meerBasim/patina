import type { AllocationTargets, AssetClass } from '@/data/types';

// The figures the allocation screen has shown as targets.
export const defaultAllocationTargets: AllocationTargets = {
  stocks: 40,
  crypto: 5,
  property: 35,
  cash: 10,
  savings: 10,
};

export type RebalanceAction = 'buy' | 'sell' | 'hold';

export type RebalanceHint = {
  assetClass: AssetClass;
  actualPercent: number;
  targetPercent: number;
  driftPoints: number;
  actualValue: number;
  targetValue: number;
  deltaValue: number;
  action: RebalanceAction;
};

export type RebalanceAllocation = { assetClass: AssetClass; value: number; weight: number };

export type RebalanceInput = {
  allocation: RebalanceAllocation[];
  targets: AllocationTargets;
  netWorth: number;
  tolerancePoints?: number;
};

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function targetTotal(targets: AllocationTargets): number {
  return Object.values(targets).reduce((sum, percent) => sum + percent, 0);
}

export function computeRebalance(input: RebalanceInput): RebalanceHint[] {
  const tolerance = input.tolerancePoints ?? 1;
  // Targets over 100% describe a portfolio larger than the one that exists, so there is
  // no set of trades that reaches them. Advising none beats advising unfunded buys.
  const fundable = targetTotal(input.targets) <= 100;
  return input.allocation.map((slice) => {
    const targetPercent = input.targets[slice.assetClass] ?? 0;
    const driftPoints = slice.weight - targetPercent;
    const targetValue = roundCents((targetPercent / 100) * input.netWorth);
    const deltaValue = roundCents(targetValue - slice.value);
    const action: RebalanceAction =
      !fundable || deltaValue === 0 || Math.abs(driftPoints) < tolerance
        ? 'hold'
        : deltaValue > 0
          ? 'buy'
          : 'sell';
    return {
      assetClass: slice.assetClass,
      actualPercent: slice.weight,
      targetPercent,
      driftPoints,
      actualValue: roundCents(slice.value),
      targetValue,
      deltaValue,
      action,
    };
  });
}
