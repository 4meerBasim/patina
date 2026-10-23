# Manual Valuation Marks

Status: shipped
Summary: property, gold, cash and anything else without a ticker is valued by dated marks the user enters, so an illiquid asset has a history rather than a single number.

## Details

A holding with a null `instrumentId` takes its value from the latest `Valuation` row for it rather than from a price quote — `holdingValue` in `src/lib/snapshots.ts` picks between the two. `addValuation` is wired into both holding detail screens (`src/app/editorial/holding.tsx:149`, `src/app/native/holding.tsx:111`), which show a dated list of previous marks in place of a price chart and a `Valued <month> <day>` caption under the hero.

This is the mechanism that covers Iraqi equities, which no market-data vendor carries — see `_owner-decisions.md` decision 2. The user enters the price; the app keeps the series.

## Related
- Feature: [[Domain Data Model]], [[Daily Net Worth Snapshots]], [[Offline Price Provider]], [[Money and Numeral Formatting]]
- Bugs: [[Contradictory Lisbon Flat Valuation]], [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]]
- Page: [[Editorial Holding Detail]], [[Native Holding Detail]]
