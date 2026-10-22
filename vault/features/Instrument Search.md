# Instrument Search

Status: shipped
Summary: Local search over the seeded instruments by symbol or name, feeding the Add holding picker.

## Details
`src/data/providers/instrument-search-provider.ts` filters the seeded instruments on a case-insensitive symbol-or-name substring match (an empty query returns all of them); the store exposes it through `useInstrumentSearchProvider`.

## Related
- Page: [[Editorial Add Holding]], [[Native Add Holding]]
- Features: [[Offline Price Provider]], [[Ticker Search in Add Holding]]
- Bugs: [[Native Add Hardwired To Apple]]
