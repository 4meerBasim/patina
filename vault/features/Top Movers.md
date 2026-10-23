# Top Movers

Status: shipped
Summary: lists the few holdings whose value moved most since the last stored quote, so the home screen answers "what changed" without a feed.

## Details

`selectTopMovers` in `src/store/selectors.ts:202` compares each instrument-backed holding's live price against the stored quote, multiplies the difference by the quantity, sorts by the absolute value change and takes the top n. The editorial home screen asks for three.

It reads `livePrices`, the in-memory map the price provider fills, rather than the `priceQuotes` table, so it reflects the current session's refresh and leaves the stored history alone.

## Related
- Feature: [[Offline Price Provider]], [[App State Store]], [[Money and Numeral Formatting]], [[Daily Net Worth Snapshots]], [[Interactive Native Home]]
- Page: [[Editorial Home]]
