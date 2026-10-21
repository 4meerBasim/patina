# Seeded FX Rates

Status: shipped
Summary: Static USD-based FX rates for the six supported currencies, used to convert everything into the base currency.

## Details
`src/data/providers/fx-provider.ts` serves the seeded USD→{USD, EUR, GBP, SAR, AED, IQD} rates behind an `FxProvider` interface; `convertCurrency` in `src/lib/snapshots.ts` uses them to express holdings and net worth in whichever base currency the user has chosen.

## Related
- Page: [[Editorial Settings]], [[Native Settings]], [[Editorial Home]]
- Features: [[Money and Numeral Formatting]]
- Enhancements: [[Network FX Rates]]
