# Offline Price Provider

Status: shipped
Summary: Simulated instrument quotes generated on-device so the app shows live-looking prices with no network.

## Details
`src/data/providers/price-provider.ts` returns deterministic quotes — each instrument's seed price nudged by a day-keyed hash drift of up to ±3% — and is wired in as the active price provider through `src/data/providers/index.ts`. A real market-data provider is parked behind the same `PriceProvider` interface.

## Related
- Page: [[Editorial Home]], [[Editorial Portfolio]], [[Native Home]], [[Native Portfolio]], [[Editorial Holding Detail]], [[Native Holding Detail]]
- Features: [[Instrument Search]]
- Bugs: [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]]
- Enhancements: [[Real Market Price Provider]]
