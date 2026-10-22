# Half-Cent Value Loses Its Cents In Currency Output

Status: not-fixed
Found: `src/lib/money.ts:57`
Summary: `fractionDigitsFor` decides how many decimals to show using `Math.round(value * 100)`, which disagrees with the rounding `Intl` then applies, so a value that rounds up to a cent can be shown with no cents at all.

## Details

The digit count and the digits come from two different rounding implementations:

```
src/lib/money.ts:57   return Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2;
```

For 1.005 the double `value * 100` is 100.49999999999998579, below the tie, so `Math.round` gives 100, `/100` gives exactly 1, `Number.isInteger` is true, and the ceiling is set to 0 fraction digits. `Intl` is then asked to render 1.005 with no decimals and gives `1`.

`formatCurrency(1.005, 'USD')` gives `$1`. Expected `$1.01`. `formatNumber(1.005)` already gives `1.01`, from the same module, on the same input. `src/lib/__tests__/money.test.ts:218` asserts both side by side, which is the clearest statement of the defect: the two functions disagree.

The trigger is narrower than "any half-cent value", and the severity should be read accordingly. Most `n.005` values are unaffected because `n.005 * 100` lands exactly on or above the tie — `2.005 * 100` is exactly 200.5 and rounds up, giving the correct `$2.01`. Only values where the binary product falls just below the tie fail. Scanning `n + 0.005` for n from 1 to 4000 finds exactly one: 1.005. A broader scan of 400,000 random three-decimal values up to 100,000 finds 51 — about one in 7,800 — including realistic magnitudes such as 37,084.005 and 41,402.005.

So the practical exposure is a rare one-cent display error, not a systematic one. What makes it worth a note is the cause rather than the frequency: the number of digits shown is chosen by a rounding that the digits themselves do not use. The same `Math.round(value * 100)` tie-sensitivity drives [[Sub-Cent Accumulation Lands A Cent Low]], and the fix is the same in kind — decide the digit count from the value `Intl` will actually render, not from a separate hand-rolled rounding.

Twenty-four of the twenty-six `formatCurrency` calls in `src/app/native/` reach this path, since they pass no fraction-digit options; see [[Currency Drops The Trailing Cent Zero]] for the call sites. No write was traced through this function — it is display only.

Not fixed in the harness PR, which carries no behaviour changes. The test asserts the current behaviour and names this note. Per `foundation/github.md` the fix changes behaviour and cannot ride on a `chore/` branch; it needs its own `fix/` PR.

## Related
- Bug: [[Currency Drops The Trailing Cent Zero]], [[Negative Sub-Cent Renders As Minus Zero]], [[Percent Ignores maximumFractionDigits Unless Minimum Is Also Passed]], [[Sub-Cent Accumulation Lands A Cent Low]]
- Feature: [[Money and Numeral Formatting]]
- Enhancement: [[Test Formatters Against Hermes]]
- Page: [[Native Home]], [[Native Holding Detail]], [[Native Portfolio]]
