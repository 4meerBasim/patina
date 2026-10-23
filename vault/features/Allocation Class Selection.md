# Allocation Class Selection

Status: shipped
Summary: Selecting an asset class highlights its arc on the allocation ring and shows its actual, target and drift in the centre.

## Details
`src/app/editorial/allocation.tsx`: selection is made by tapping a legend row (Stocks by default); the ring arcs themselves are not touchable. The selected arc thickens from 4px to 10px, the others drop to 32% opacity, the legend row's hairline turns brass, and the centre label shows name, actual %, target and drift (e.g. +6pt).

## Related
- Page: [[Editorial Allocation]]
- Enhancements: [[Allocation Ring Drill-Down]]
- Bugs: [[Rebalance Does Not Normalise Targets Over 100]], [[Rebalance Suggests A Sell At Zero Net Worth]]
- Features: [[Target Allocation and Rebalance Hints]], [[Interactive Native Home]]
