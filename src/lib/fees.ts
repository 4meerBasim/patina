export type FeeAssumptions = {
  grossReturn: number;
  comparisonRatio: number;
};

// A broad index fund's gross return and a low-cost index expense ratio to
// measure the drag against. Not advice, just a fixed yardstick.
export const defaultFeeAssumptions: FeeAssumptions = {
  grossReturn: 0.07,
  comparisonRatio: 0.0003,
};

export type FeeHoldingInput = {
  id: string;
  label: string;
  value: number;
  expenseRatio: number | null;
};

export type FeeInput = {
  holdings: FeeHoldingInput[];
  assumptions?: FeeAssumptions;
};

export type HoldingFee = {
  holdingId: string;
  name: string;
  ratio: number;
  value: number;
  annualCost: number;
  drag10: number;
  drag20: number;
  excessVsComparison: number;
};

export type FeeAnalysis = {
  holdings: HoldingFee[];
  totalAnnualCost: number;
  totalDrag10: number;
  totalDrag20: number;
  comparisonRatio: number;
};

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// Lost future value after n years: the current amount compounded at the gross
// return, minus the same amount compounded at the return net of the fee.
function compoundingDrag(value: number, ratio: number, grossReturn: number, years: number): number {
  const gross = (1 + grossReturn) ** years;
  const net = (1 + grossReturn - ratio) ** years;
  return value * (gross - net);
}

export function computeFeeAnalysis(input: FeeInput): FeeAnalysis {
  const assumptions = input.assumptions ?? defaultFeeAssumptions;
  const { grossReturn, comparisonRatio } = assumptions;

  const holdings: HoldingFee[] = input.holdings
    .filter((holding) => holding.expenseRatio != null && holding.expenseRatio > 0)
    .map((holding) => {
      const ratio = holding.expenseRatio as number;
      return {
        holdingId: holding.id,
        name: holding.label,
        ratio,
        value: roundCents(holding.value),
        annualCost: roundCents(holding.value * ratio),
        drag10: roundCents(compoundingDrag(holding.value, ratio, grossReturn, 10)),
        drag20: roundCents(compoundingDrag(holding.value, ratio, grossReturn, 20)),
        excessVsComparison: roundCents(holding.value * Math.max(ratio - comparisonRatio, 0)),
      };
    })
    .sort((a, b) => b.annualCost - a.annualCost);

  return {
    holdings,
    totalAnnualCost: roundCents(holdings.reduce((sum, h) => sum + h.annualCost, 0)),
    totalDrag10: roundCents(holdings.reduce((sum, h) => sum + h.drag10, 0)),
    totalDrag20: roundCents(holdings.reduce((sum, h) => sum + h.drag20, 0)),
    comparisonRatio,
  };
}
