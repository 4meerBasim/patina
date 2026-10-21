# Ticker Search in Add Holding

Status: shipped
Summary: Both Add-holding flows let the user search the seeded instruments and pick a real security, instead of hardwiring Apple.

## Details
Feature report #9. The chosen instrument drives the live preview and the submit in each style.
- Editorial `src/app/editorial/add.tsx`: Design Document §4.4 step 2 — when no instrument is picked the sheet shows a search field that streams results as the user types ("AAP" -> "Apple · AAPL"); picking one reveals the quantity/price step, and the instrument fragment is tappable to search again.
- Native `src/app/native/add.tsx`: the hardcoded Security row is replaced by `InstrumentPicker` — a tappable disclosure row that reveals an inline search field and a results list inside the grouped card.
- Both query `useInstrumentSearchProvider().search(query)` (local, over the seeded instruments) and present matches through memoized rows.
- Submit derives the asset class from the instrument kind (stock/etf -> stocks, crypto -> crypto) and the currency from the instrument. If a holding for that instrument already exists it bumps that holding's quantity via `updateHolding` and records a BUY `addTransaction`; otherwise it creates the holding (on a sensible default account — exchange for crypto, brokerage otherwise) then a BUY. The store creates the FIFO lot on buy.
- Reusable UI: `src/components/editorial/instrument-search.tsx`, `src/components/native/instrument-picker.tsx`.

## Related
- Page: [[Editorial Add Holding]], [[Native Add Holding]]
- Features: [[Instrument Search]], [[Add Holding Live Preview]]
- Enhancements: [[Conversational Add Holding Steps]]
- Bugs: [[Native Add Hardwired To Apple]]
