# Target Allocation and Rebalance Hints

Status: shipped
Summary: the user sets a target weight per asset class, and the allocation screen computes the drift and the buy or sell that would close it.

## Details

`src/lib/rebalance.ts` holds the default targets and `computeRebalance`, which returns a hint per class: actual and target percent, the drift in points, the target value against net worth, the delta, and an action of buy, sell or hold inside a tolerance band of one point. `src/app/editorial/allocation.tsx` renders the targets editor as steppers with a running total, and the hints as a `To reach target` block sorted by the size of the trade.

The stored targets persist through `setAllocationTargets`, so they survive a restart like the rest of the settings.

## Related
- Feature: [[Allocation Class Selection]], [[Persisted Settings]], [[Daily Net Worth Snapshots]], [[Money and Numeral Formatting]]
- Bugs: [[Rebalance Does Not Normalise Targets Over 100]], [[Rebalance Suggests A Sell At Zero Net Worth]]
- Page: [[Editorial Allocation]]
- Enhancement: [[Allocation Ring Drill-Down]]
