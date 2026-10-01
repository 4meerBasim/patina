# Native Add Hardwired To Apple

Status: fixed
Found: src/app/native/add.tsx (and src/app/editorial/add.tsx)
Summary: The Add-holding flow copied the account, instrument and price from the seeded Apple holding, so every submitted holding became another AAPL position regardless of what the form showed.

## Details
The migration wired the Add screen's submit to persist via `addHolding` + a buy `addTransaction`, but the instrument was resolved as `holdings.find((h) => symbol === 'AAPL')` because there was no instrument picker yet. Adding a holding therefore created a second AAPL row rather than the holding the user intended. The cost-basis side of this (a new holding with no lot) was fixed in an earlier review pass by creating a FIFO lot on every buy.

Fixed by feature report #9 (Phase 1 ticker search in the Add flow). Both screens now pick a real instrument from `useInstrumentSearchProvider`: the editorial sentence flow gains the §4.4 step-2 search; the native form replaces the hardcoded Security row with `InstrumentPicker`. Submit derives the asset class from the instrument kind (stock/etf -> stocks, crypto -> crypto), uses the instrument's currency, and either bumps the quantity of an existing holding for that instrument (via `updateHolding`) plus a BUY transaction, or creates a new holding then a BUY. No more AAPL hardwiring.

## Related
- Feature: [[Instrument Search]], [[Ticker Search in Add Holding]]
- Enhancement: [[Conversational Add Holding Steps]]
- Page: [[Native Add Holding]], [[Editorial Add Holding]]
