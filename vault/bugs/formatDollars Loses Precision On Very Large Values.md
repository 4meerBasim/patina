# formatDollars Loses Precision On Very Large Values

Status: not-fixed
Found: `src/lib/amount.ts:19`
Summary: `formatDollars` multiplies by 100 before rounding, and above about 90 trillion that product exceeds the exact-integer range of a double, so the formatted figure can differ from the value passed in.

## Details

```
src/lib/amount.ts:19   const rounded = Math.round(amount * 100) / 100;
```

`amount * 100` is exact only while the product stays within 2⁵³ (9,007,199,254,740,992). That puts the threshold at roughly 9.007 × 10¹³ — about 90 trillion. Above it the multiply lands on a neighbouring double, and the divide does not always bring it back.

`formatDollars(1e21)` gives `$999,999,999,999,999,900,000`. Expected `$1,000,000,000,000,000,000,000`. The figure is 100,000 short. Frozen at `src/lib/__tests__/amount.test.ts:184`, which also asserts the output contains no `e`, so the exponential-notation hazard is handled — only the precision is not.

The loss is not uniform above the threshold. Sampling 5,000 random integers per decade finds no failures at 10¹³ and roughly 12 to 18 percent failing from 10¹⁴ upward; `1e20` and `1e22` round-trip exactly while `1e21` does not. So the correct statement is that the result is unreliable above ~9 × 10¹³, not that it is always wrong.

`src/lib/money.ts` does not share the defect. `formatNumber` passes `Math.abs(value)` straight to `Intl.NumberFormat` and uses `Math.round(value * 100)` only inside `fractionDigitsFor`, where it decides a digit count rather than the digits — `src/lib/__tests__/money.test.ts:157` asserts `formatNumber(1e21)` is exactly `1,000,000,000,000,000,000,000`. Dropping the pre-multiply and letting `Intl` do the rounding would fix `formatDollars` the same way.

Latent for this app's data, and the threshold is the reason. `formatDollars` renders only on the editorial add-holding sheet (`src/app/editorial/add.tsx:188` and `:198`), where the value is quantity × price typed by the user. Reaching 9 × 10¹³ there takes a deliberately absurd entry, and the demo portfolio is around 1.28 million. Named trigger: a quantity or price entry large enough that their product crosses the threshold, or any future reuse of `formatDollars` for an aggregate figure.

Not fixed in the harness PR, which carries no behaviour changes. The test asserts the current behaviour and names this note. Per `foundation/github.md` the fix changes behaviour and cannot ride on a `chore/` branch; it needs its own `fix/` PR.

## Related
- Feature: [[Money and Numeral Formatting]], [[Add Holding Live Preview]]
- Bug: [[Sub-Cent Accumulation Lands A Cent Low]], [[formatDollars Puts The Sign After The Dollar Symbol]], [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]], [[formatDollars Renders Negative Zero As $-0]]
- Enhancement: [[Test Formatters Against Hermes]]
- Page: [[Editorial Add Holding]]
