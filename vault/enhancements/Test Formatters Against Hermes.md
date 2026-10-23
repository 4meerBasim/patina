# Test Formatters Against Hermes

Status: planned
Summary: the money formatter tests assert strings produced by Node's ICU, but the app renders on Hermes, whose `Intl` is a different implementation.

## Notes

81 of the suite's cases assert exact output from `src/lib/money.ts`, which rests entirely on `Intl.NumberFormat`. Jest runs them in Node. The app runs them in Hermes. The two ship different `Intl` implementations and different ICU data, so a green suite is not evidence that the device renders the same string.

This matters more here than in a typical app because Patina formats in six currencies and two numeral systems, including Eastern Arabic digits and the Arabic decimal separator. Locale data is precisely where the two engines are most likely to diverge, and a wrong currency symbol or separator in Arabic is the kind of defect that looks like carelessness to the user it affects most.

## Done: the first of the three options

`src/lib/__tests__/money-portability.test.ts` takes the cheapest option from the original note — assert the structure rather than the assembled string — and adds the engine's own behaviour as a precondition, so a divergent `Intl` fails on the thing that actually broke:

- The `Intl` behaviour `money.ts` rests on, asserted directly through `formatToParts`: the en-US group separator is `,` and the decimal is `.`, grouping splits `1234567.89` into `1`/`234`/`567`, rounding is half-away-from-zero rather than half-to-even, rounding reads the decimal the number prints as rather than its binary value (the `1.005` → `1.01` case the digit-count probe depends on), `1e21` writes in full rather than in exponential notation, and en-US digits are latin because `money.ts` converts the script itself.
- The structure of all four formatters: the sign is U+2212 at index 0 and nowhere else, the Arabic system uses `٬` and `٫` with Eastern digits and never a comma or a dot, the latin system never uses Eastern digits, a formatted figure reads back as the same number through `toLatinNumerals`, the symbol leads in the `en` locale and trails in `ar` for all six currencies, the sign stays outside the symbol in both, a currency figure shows two fraction digits or none and never one, and the percent mark trails in both scripts.

A Hermes build with different locale data now fails a named assertion about separators or rounding instead of a string comparison five levels down.

## Outstanding: the device run

Still needed, and not possible in this repo as it stands: executing those assertions under Hermes. `node_modules` carries `hermesc`, the bytecode compiler, but no Hermes runtime, and the project has no `ios/` or `android/` directory because it has never been prebuilt — so there is nothing to run them in. The remaining work is a dev build plus one pass of this suite on the device, which is why this note stays `planned` rather than moving to `features/`.

Worth doing before any release that claims Arabic support, not before.

## Related
- Feature: [[Money and Numeral Formatting]], [[Arabic RTL Home]]
- Enhancement: [[Arabic Holding and Add Holding]]
- Page: [[Editorial Home]], [[Editorial Settings]]
- Bugs: [[Arabic Hero Currency Jumps On Android]], [[Currency Drops The Trailing Cent Zero]], [[Half-Cent Value Loses Its Cents In Currency Output]], [[Negative Sub-Cent Renders As Minus Zero]], [[Percent Ignores maximumFractionDigits Unless Minimum Is Also Passed]], [[Sub-Cent Accumulation Lands A Cent Low]], [[formatDollars Loses Precision On Very Large Values]], [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]]
