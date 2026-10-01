# Native Add Hardwired To Apple

Status: not-fixed
Found: src/app/native/add.tsx (and src/app/editorial/add.tsx)
Summary: The Add-holding flow copies the account, instrument and price from the seeded Apple holding, so every submitted holding becomes another AAPL position regardless of what the form shows.

## Details
The migration wired the Add screen's submit to persist via `addHolding` + a buy `addTransaction`, but the instrument is resolved as `holdings.find((h) => symbol === 'AAPL')` because there is no instrument picker yet. Adding a holding therefore creates a second AAPL row rather than the holding the user intended. The cost-basis side of this (a new holding with no lot) was fixed in the same review pass by creating a FIFO lot on every buy; what remains is the hardwired instrument.

The real fix is Phase 1 ticker search in the Add flow (feature report #9), which gives the sentence/form a real instrument to persist. Tracked here so it is not mistaken for finished.

## Related
- Feature: [[Instrument Search]]
- Enhancement: [[Conversational Add Holding Steps]]
- Page: [[Native Add Holding]], [[Editorial Add Holding]]
