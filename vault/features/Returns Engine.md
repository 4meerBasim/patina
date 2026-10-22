# Returns Engine

Status: shipped
Summary: The return calculations — time-weighted, money-weighted (IRR) and a contributions-vs-market split.

## Details
`src/lib/returns.ts` computes TWR by linking per-period returns across valuation marks, MWR/IRR by Newton-Raphson on the cash-flow NPV with a bisection fallback when it fails to converge, and `contributionsVsMarket` splits an end-minus-start change into contributed money and market movement.

## Related
- Page: [[Editorial Performance]], [[Editorial Holding Detail]], [[Native Holding Detail]]
- Features: [[Daily Net Worth Snapshots]]
- Bugs: [[Money-Weighted Return Is Null For Ordinary Short-Window Gains]], [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]], [[Oversell Drops The Unmatched Proceeds]], [[Time-Weighted Return Overstates Gains When A Flow Has No Valuation Mark]]
