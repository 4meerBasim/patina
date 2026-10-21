import type { AllocationTargets, AssetClass, CurrencyCode, NoteKind } from '@/data/types';
import { formatCurrency } from '@/lib/money';
import type { FeeAnalysis } from '@/lib/fees';

export type InsightThresholds = {
  concentrationClassPercent: number;
  concentrationHoldingPercent: number;
  driftPoints: number;
  feeAnnualCost: number;
};

export const defaultInsightThresholds: InsightThresholds = {
  concentrationClassPercent: 45,
  concentrationHoldingPercent: 12,
  driftPoints: 5,
  feeAnnualCost: 250,
};

export type InsightAllocation = { assetClass: AssetClass; value: number; weight: number };

export type InsightHolding = { id: string; label: string; value: number };

export type InsightGoal = {
  id: string;
  name: string;
  percent: number;
  pace: 'ahead' | 'behind' | 'on-pace';
};

export type InsightInput = {
  allocation: InsightAllocation[];
  targets: AllocationTargets;
  holdings: InsightHolding[];
  totalAssets: number;
  fees: FeeAnalysis;
  goals: InsightGoal[];
  baseCurrency: CurrencyCode;
  thresholds: InsightThresholds;
};

export type InsightCandidate = {
  kind: NoteKind;
  key: string;
  body: string;
  detail: string | null;
  priority: number;
};

const CLASS_LABELS: Record<AssetClass, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  property: 'Real estate',
  cash: 'Cash',
  savings: 'Savings',
};

const MILESTONES = [100, 75, 50, 25];

function pointWord(points: number): string {
  return points === 1 ? 'point' : 'points';
}

export function computeInsights(input: InsightInput): InsightCandidate[] {
  const { allocation, targets, holdings, totalAssets, fees, goals, baseCurrency, thresholds } =
    input;
  const money = (value: number) => formatCurrency(value, baseCurrency, { maximumFractionDigits: 0 });
  const candidates: InsightCandidate[] = [];

  for (const slice of allocation) {
    if (slice.weight >= thresholds.concentrationClassPercent) {
      candidates.push({
        kind: 'concentration',
        key: `concentration-class-${slice.assetClass}`,
        body: `${CLASS_LABELS[slice.assetClass]} is ${Math.round(slice.weight)}% of your portfolio.`,
        detail: `Target is ${targets[slice.assetClass]}%.`,
        priority: 100 + slice.weight,
      });
    }
  }

  if (totalAssets > 0) {
    for (const holding of holdings) {
      const weight = (holding.value / totalAssets) * 100;
      if (weight >= thresholds.concentrationHoldingPercent) {
        candidates.push({
          kind: 'concentration',
          key: `concentration-holding-${holding.id}`,
          body: `${holding.label} alone is ${Math.round(weight)}% of your portfolio.`,
          detail: `${money(holding.value)} in one position.`,
          priority: 80 + weight,
        });
      }
    }
  }

  for (const slice of allocation) {
    const drift = slice.weight - targets[slice.assetClass];
    const points = Math.round(Math.abs(drift));
    if (Math.abs(drift) >= thresholds.driftPoints) {
      candidates.push({
        kind: 'drift',
        key: `drift-${slice.assetClass}`,
        body: `${CLASS_LABELS[slice.assetClass]} is ${points} ${pointWord(points)} ${
          drift > 0 ? 'above' : 'below'
        } target.`,
        detail: `Actual ${Math.round(slice.weight)}% versus ${targets[slice.assetClass]}% target.`,
        priority: 60 + Math.abs(drift),
      });
    }
  }

  for (const fee of fees.holdings) {
    if (fee.annualCost >= thresholds.feeAnnualCost) {
      candidates.push({
        kind: 'fees',
        key: `fees-${fee.holdingId}`,
        body: `${fee.name} costs ${(fee.ratio * 100).toFixed(2)}% a year.`,
        detail: `About ${money(fee.annualCost)} a year; a comparable index fund costs ${(
          fees.comparisonRatio * 100
        ).toFixed(2)}%.`,
        priority: 40 + fee.annualCost / 100,
      });
    }
  }

  for (const goal of goals) {
    const crossed = MILESTONES.find((milestone) => goal.percent >= milestone);
    if (crossed) {
      candidates.push({
        kind: 'milestone',
        key: `milestone-${goal.id}-${crossed}`,
        body:
          crossed === 100
            ? `You reached your ${goal.name} goal.`
            : `Your ${goal.name} goal passed the ${crossed}% mark.`,
        detail: `${Math.round(goal.percent)}% of the way there.`,
        priority: 20 + crossed / 10,
      });
    }
  }

  for (const goal of goals) {
    if (goal.pace === 'on-pace') continue;
    candidates.push({
      kind: 'pace',
      key: `pace-${goal.id}`,
      body: `${goal.name} is running ${goal.pace} of schedule.`,
      detail: null,
      priority: 10,
    });
  }

  return candidates.sort((a, b) => b.priority - a.priority);
}
