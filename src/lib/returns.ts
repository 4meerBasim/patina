export type DatedValue = { date: string; value: number };

export type CashFlow = { date: string; amount: number };

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function yearsBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / MS_PER_YEAR;
}

export function timeWeightedReturn(valuations: DatedValue[], flows: CashFlow[]): number {
  const marks = [...valuations].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (marks.length < 2) return 0;

  let linked = 1;
  for (let i = 1; i < marks.length; i += 1) {
    const start = marks[i - 1];
    const end = marks[i];
    const periodFlow = flows
      .filter((flow) => {
        const t = Date.parse(flow.date);
        return t > Date.parse(start.date) && t <= Date.parse(end.date);
      })
      .reduce((sum, flow) => sum + flow.amount, 0);
    if (start.value === 0) continue;
    const periodReturn = (end.value - periodFlow - start.value) / start.value;
    linked *= 1 + periodReturn;
  }
  return linked - 1;
}

export function moneyWeightedReturn(flows: CashFlow[], finalValue: DatedValue): number | null {
  const investorFlows: CashFlow[] = [
    ...flows.map((flow) => ({ date: flow.date, amount: -flow.amount })),
    { date: finalValue.date, amount: finalValue.value },
  ].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const hasInflow = investorFlows.some((flow) => flow.amount > 0);
  const hasOutflow = investorFlows.some((flow) => flow.amount < 0);
  if (!hasInflow || !hasOutflow) return null;

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

export function contributionsVsMarket(
  startValue: number,
  endValue: number,
  flows: CashFlow[],
): { contributions: number; market: number } {
  const contributions = flows.reduce((sum, flow) => sum + flow.amount, 0);
  const market = endValue - startValue - contributions;
  return { contributions, market };
}
