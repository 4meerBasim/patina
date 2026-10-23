# Insight Rules Engine

Status: shipped
Summary: generates the Notes cards from real portfolio data instead of fixed copy, against thresholds the user can change.

## Details

`src/lib/insights.ts` turns the current portfolio into candidate notes and ranks them by priority, so the screen shows what matters rather than everything it could say. `src/store/data-store.ts` is the only consumer.

Five kinds, each with its own threshold in `defaultInsightThresholds`:

- **concentration** — an asset class over 45% of the portfolio, or a single holding over 12%
- **drift** — a class more than 5 points from its target allocation
- **fees** — a holding costing more than 250 a year, quoted against a low-cost index ratio
- **milestone** — a goal crossing 25, 50, 75 or 100%, reporting only the highest crossed
- **pace** — a goal running ahead of or behind schedule

Priority ordering puts concentration above holding concentration, above drift, above fees, above milestones, above pace, with the magnitude of the breach breaking ties inside each kind. The scout report's evidence for the feature is Ghostfolio's X-ray and Empower's Fee Analyzer.

Thresholds are passed in rather than read from a constant, so the planned per-user "Rules" screen can supply them without touching this module.

Covered by `src/lib/__tests__/insights.test.ts`, including each threshold exactly at its limit versus just over.

## Related
- Feature: [[Returns Engine]], [[App State Store]], [[Fee Analyzer]], [[Goals With Linked Holdings]]
- Bug: [[Pace Note Reads Running Behind Of Schedule]]
- Page: [[Editorial Notes]], [[Editorial Goal Detail]]
- Enhancement: [[Native Notes Screen]]
