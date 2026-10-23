# Fee Analyzer

Status: shipped
Summary: turns a fund's expense ratio into what it costs this year and what it costs over ten and twenty years of compounding, measured against a low-cost index.

## Details

`src/lib/fees.ts` computes, per holding with an expense ratio: `annualCost`, `drag10`, `drag20` and `excessVsComparison`. The drag is the honest version of the calculation — the current value compounded at the gross return minus the same value compounded at the return net of the fee — rather than fee times years. `defaultFeeAssumptions` fixes the yardstick at a 7% gross return and a 0.03% comparison ratio, and the comment says plainly that it is a yardstick and not advice.

The per-holding figure renders as the `Expense ratio` row on both holding detail screens, as `0.03% · $12/yr`. The portfolio totals feed the Fees note on the Notes screen.

## Related
- Feature: [[Insight Rules Engine]], [[Domain Data Model]], [[Money and Numeral Formatting]], [[Native Notes Screen]]
- Page: [[Editorial Holding Detail]], [[Native Holding Detail]], [[Editorial Notes]]
