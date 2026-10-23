# formatDollars Renders Negative Zero As $-0

Status: fixed
Found: `src/lib/amount.ts:21`
Summary: `toLocaleString` keeps the sign of negative zero, so `formatDollars` renders `$-0`, and any negative value below half a cent produces the same string.

## Details

`formatDollars` rounds to cents and hands the result to `toLocaleString`:

```
src/lib/amount.ts:19   const rounded = Math.round(amount * 100) / 100;
src/lib/amount.ts:21   return `$${rounded.toLocaleString('en-US', {
```

`Math.round(-0.004 * 100) / 100` is `-0`, `Number.isInteger(-0)` is true, so the call asks for no fraction digits — and `toLocaleString` preserves the sign:

```
node -e "console.log((-0).toLocaleString('en-US'))"   →  -0
```

So `formatDollars(-0)` and `formatDollars(-0.004)` both give `$-0`. Expected `$0`. Frozen at `src/lib/__tests__/amount.test.ts:178`, which asserts both inputs. No literal `-0` is required: anything strictly negative that rounds to zero at cent precision renders a minus in front of a zero.

Traced to the screen, and the trace holds:

- `src/app/editorial/add.tsx:57` — `const quantityValue = parseAmount(quantity) ?? 0;`. `??` does not catch `-0`, because `-0` is not nullish, so a `-0` from the field survives. `parseAmount('-0')` returns `-0`; that upstream half is [[parseAmount Returns Negative Zero]].
- `src/app/editorial/add.tsx:59` — `const total = quantityValue * priceValue;`. `-0 * 248.2` is `-0`, so the sign carries through the multiply.
- `src/app/editorial/add.tsx:198` — `formatDollars(total)` inside the live preview line.

The preview therefore reads `That's $-0`. The percentage beside it does not match: `weight` at line 60 is also `-0`, but `(-0).toFixed(2)` is `"0.00"`, so the line renders `That's $-0 · 0.00% of net worth` — a signed zero next to an unsigned one.

Two things bound the severity. Both fields are `keyboardType="decimal-pad"` (`src/app/editorial/add.tsx:171` for quantity, `:190` for price), which gives no minus key on iOS, so getting a minus in needs a paste or a keyboard variant that offers one. And nothing is written: `onSubmit` returns early at `src/app/editorial/add.tsx:63` when `quantityValue <= 0`, so no holding, lot or transaction is created from a negative quantity.

Fixing `parseAmount` alone would not remove the rendering, since `formatDollars(-0.004)` produces `$-0` without any help from the parser. `formatDollars` has to normalise the sign of its own rounded zero. The `money.ts` formatters get the negative-zero case right — `value < 0` is false for `-0` — but fail the sub-cent case for the opposite reason, which is [[Negative Sub-Cent Renders As Minus Zero]].

## Fix

Fixed on `fix/money-formatters`. `formatDollars` formats `Math.abs(amount)` and adds the sign only when the rendered digits contain a non-zero digit, so `toLocaleString` never sees a negative and cannot carry a sign. `formatDollars(-0)` and `formatDollars(-0.004)` both give `$0`. The upstream half is fixed too — [[parseAmount Returns Negative Zero]] — so the add-holding preview can no longer read `That's $-0`.

## Related
- Feature: [[Money and Numeral Formatting]], [[Add Holding Live Preview]]
- Bug: [[parseAmount Returns Negative Zero]], [[Negative Sub-Cent Renders As Minus Zero]], [[formatDollars Puts The Sign After The Dollar Symbol]], [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]], [[formatDollars Loses Precision On Very Large Values]]
- Page: [[Editorial Add Holding]]
