export type DatedValue = { date: string; value: number };

export type CashFlow = { date: string; amount: number };

export type MoneyWeightedReturn = { rate: number; annualised: boolean };

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

// Annualising a window of days turns a 25% month into a four-figure rate, so below a
// month the plain period return is reported and the caller labels it as one.
const MIN_ANNUALISED_DAYS = 30;

function yearsBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / MS_PER_YEAR;
}

// A zero mark followed by a non-zero mark with no contribution between them cannot be a
// real wipeout, since a wiped-out portfolio has nothing to recover from. Such a mark is a
// missing valuation, and left in the series it pins the chain at -1 forever.
function withoutMissingMarks(marks: DatedValue[], flows: CashFlow[]): DatedValue[] {
  return marks.filter((mark, index) => {
    if (mark.value !== 0) return true;
    const next = marks[index + 1];
    if (!next || next.value === 0) return true;
    return flows.some((flow) => {
      const t = Date.parse(flow.date);
      return flow.amount > 0 && t > Date.parse(mark.date) && t <= Date.parse(next.date);
    });
  });
}

export function timeWeightedReturn(valuations: DatedValue[], flows: CashFlow[]): number {
  const sorted = [...valuations].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const marks = withoutMissingMarks(sorted, flows);
  if (marks.length < 2) return 0;

  let linked = 1;
  for (let i = 1; i < marks.length; i += 1) {
    const start = marks[i - 1];
    const end = marks[i];
    const from = Date.parse(start.date);
    const to = Date.parse(end.date);
    const span = to - from;

    let periodFlow = 0;
    let weightedFlow = 0;
    for (const flow of flows) {
      const t = Date.parse(flow.date);
      if (t <= from || t > to) continue;
      periodFlow += flow.amount;
      // Modified Dietz: a flow earns for the part of the period it was invested, so the
      // denominator carries it at that weight. A flow dated at the period end weighs
      // nothing, which is the plain time-weighted formula.
      weightedFlow += span === 0 ? 0 : (flow.amount * (to - t)) / span;
    }

    const invested = start.value + weightedFlow;
    if (invested <= 0) continue;
    linked *= 1 + (end.value - periodFlow - start.value) / invested;
  }
  return linked - 1;
}

function solveIrr(investorFlows: CashFlow[]): number | null {
  const origin = investorFlows[0].date;
  const npv = (rate: number): number =>
    investorFlows.reduce(
      (sum, flow) => sum + flow.amount / (1 + rate) ** yearsBetween(origin, flow.date),
      0,
    );
  const dNpv = (rate: number): number =>
    investorFlows.reduce((sum, flow) => {
      const t = yearsBetween(origin, flow.date);
      if (t === 0) return sum;
      return sum - (t * flow.amount) / (1 + rate) ** (t + 1);
    }, 0);

  let rate = 0.1;
  for (let i = 0; i < 50; i += 1) {
    const value = npv(rate);
    const slope = dNpv(rate);
    if (Math.abs(value) < 1e-7) return rate;
    if (slope === 0) break;
    const next = rate - value / slope;
    if (!Number.isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - rate) < 1e-9) return next;
    rate = next;
  }

  let low = -0.9999;
  let high = 10;
  let lowValue = npv(low);
  const highValue = npv(high);
  if (lowValue * highValue > 0) return null;
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    const midValue = npv(mid);
    if (Math.abs(midValue) < 1e-7) return mid;
    if (lowValue * midValue < 0) {
      high = mid;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }
  return (low + high) / 2;
}

export function moneyWeightedReturn(
  flows: CashFlow[],
  finalValue: DatedValue,
): MoneyWeightedReturn | null {
  if (flows.length === 0) return null;

  const contributed = flows.reduce((sum, flow) => sum + Math.max(flow.amount, 0), 0);
  if (contributed === 0) return null;

  const opened = flows.reduce(
    (earliest, flow) => (Date.parse(flow.date) < Date.parse(earliest) ? flow.date : earliest),
    flows[0].date,
  );
  if ((Date.parse(finalValue.date) - Date.parse(opened)) / MS_PER_DAY < MIN_ANNUALISED_DAYS) {
    const withdrawn = flows.reduce((sum, flow) => sum - Math.min(flow.amount, 0), 0);
    return {
      rate: (finalValue.value + withdrawn - contributed) / contributed,
      annualised: false,
    };
  }

  const investorFlows: CashFlow[] = [
    ...flows.map((flow) => ({ date: flow.date, amount: -flow.amount })),
    { date: finalValue.date, amount: finalValue.value },
  ].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const hasInflow = investorFlows.some((flow) => flow.amount > 0);
  const hasOutflow = investorFlows.some((flow) => flow.amount < 0);
  if (!hasInflow || !hasOutflow) return null;

  const rate = solveIrr(investorFlows);
  return rate === null ? null : { rate, annualised: true };
}

export function contributionsVsMarket(
  startValue: number,
  endValue: number,
  flows: CashFlow[],
): { contributions: number; market: number } {
  const contributions = flows.reduce((sum, flow) => sum + flow.amount, 0);
  const market = endValue - startValue - contributions;
  return { contributions, market };
}
