# formatDollars Puts The Sign After The Dollar Symbol

Status: fixed
Found: `src/lib/amount.ts:21`
Summary: `formatDollars` prepends `$` to a string that `toLocaleString` has already signed, so a negative renders as `$-500` instead of `-$500`.

## Details

The symbol is concatenated in front of the formatted number, and the number carries its own sign:

```
src/lib/amount.ts:21   return `$${rounded.toLocaleString('en-US', {
```

`toLocaleString` emits the minus as part of the digits, so the sign lands between the symbol and the first digit:

| input | expected | actual |
|---|---|---|
| `formatDollars(-5)` | `-$5` | `$-5` |
| `formatDollars(-1234.56)` | `-$1,234.56` | `$-1,234.56` |
| `formatDollars(-0.5)` | `-$0.50` | `$-0.50` |

Frozen at `src/lib/__tests__/amount.test.ts:162`.

The rest of the codebase does it the other way. `src/lib/money.ts:73` returns `${MINUS}${body}` where `body` already includes the symbol, and `src/lib/__tests__/money.test.ts:183`–`:184` assert the sign sits at index 0 and the symbol at index 1. So the two formatters disagree on sign placement as well as on the sign character, which is tracked separately as [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]]. `$-1,234.56` is also wrong by convention: en-US accounting format puts the sign or the parentheses outside the symbol.

`formatDollars` has exactly two call sites, both on the editorial add-holding sheet: the price field placeholder at `src/app/editorial/add.tsx:188` and the live total at `:198`. The placeholder is always positive. The total can go negative only if a negative quantity or price is entered, and both fields are `keyboardType="decimal-pad"` (`src/app/editorial/add.tsx:171` and `:190`), which offers no minus key on iOS — so entry needs a paste or a keyboard variant that supplies one. A negative total is also never saved: `onSubmit` returns early when `quantityValue <= 0` (`src/app/editorial/add.tsx:63`).

That makes it a live but low-severity defect: reachable, visible in the preview line, affecting one screen, with no write behind it. The remaining value of fixing it is consistency — `money.ts` and `amount.ts` should not format the same quantity two different ways.

## Fix

Fixed on `fix/money-formatters`. `formatDollars` formats the magnitude and prepends the sign to the whole body, so the sign sits outside the symbol: `formatDollars(-5)` is `−$5` and `formatDollars(-1234.56)` is `−$1,234.56`. Sign placement now matches `money.ts`, and the sign character does too.

## Related
- Feature: [[Money and Numeral Formatting]], [[Add Holding Live Preview]]
- Bug: [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]], [[formatDollars Renders Negative Zero As $-0]], [[formatDollars Loses Precision On Very Large Values]], [[parseAmount Cannot Read The U+2212 Sign money.ts Writes]]
- Page: [[Editorial Add Holding]]
