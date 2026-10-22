# Domain Data Model

Status: shipped
Summary: The TypeScript domain model — every entity and union the app's data layer is built on.

## Details
`src/data/types.ts` defines the entities (Account, Instrument, Holding, Transaction, Lot, Valuation, Liability, Goal, Note, FxRate, Snapshot, PriceQuote) and the string unions (AssetClass, AccountKind, Ownership, InstrumentKind, TransactionType, LiabilityKind, NoteKind, CurrencyCode), plus the `ASSET_CLASSES` and `CURRENCIES` constants every other data module imports.

## Related
- Page: [[Editorial Home]], [[Editorial Portfolio]], [[Editorial Holding Detail]], [[Editorial Add Holding]], [[Editorial Allocation]], [[Editorial Goals]], [[Editorial Notes]], [[Editorial Activity]], [[Editorial Performance]], [[Native Home]], [[Native Portfolio]], [[Native Holding Detail]], [[Native Add Holding]], [[Native Goals]]
- Features: [[App State Store]], [[Full Export And Delete]], [[Local SQLite Persistence]]
- Bugs: [[Dividend Calendar Sums Foreign Currency Without FX]], [[Oversell Drops The Unmatched Proceeds]]
- Enhancements: [[Extract The Backup Codec For Testing]]
