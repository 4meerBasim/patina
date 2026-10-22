# Money and Numeral Formatting

Status: shipped
Summary: Locale-, numeral- and currency-aware number formatting, including Latin to Eastern-Arabic digit conversion.

## Details
`src/lib/money.ts` formats numbers, currencies (symbol placement and grouping chosen by locale), signed amounts and percentages, and converts between Latin and Eastern-Arabic digits and separators via `toArabicNumerals`/`toLatinNumerals`.

## Related
- Page: [[Editorial Home]], [[Native Home]], [[Editorial Settings]], [[Native Settings]]
- Features: [[Persisted Settings]], [[Arabic RTL Home]], [[Seeded FX Rates]]
- Bugs: [[Currency Drops The Trailing Cent Zero]], [[Dividend Calendar Sums Foreign Currency Without FX]], [[Half-Cent Value Loses Its Cents In Currency Output]], [[Negative Sub-Cent Renders As Minus Zero]], [[Percent Ignores maximumFractionDigits Unless Minimum Is Also Passed]], [[Sub-Cent Accumulation Lands A Cent Low]], [[formatDollars Loses Precision On Very Large Values]], [[formatDollars Puts The Sign After The Dollar Symbol]], [[formatDollars Renders Negative Zero As $-0]], [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]], [[parseAmount Cannot Read The U+2212 Sign money.ts Writes]], [[parseAmount Returns Negative Zero]]
- Enhancements: [[Test Formatters Against Hermes]]
