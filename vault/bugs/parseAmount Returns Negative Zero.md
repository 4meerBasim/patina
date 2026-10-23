# parseAmount Returns Negative Zero

Status: fixed
Found: `src/lib/amount.ts:15`
Summary: `parseAmount('-0')` returns `-0` rather than `0`, and that sign survives into the rendered figure.

## Details

`Number('-0')` is `-0`, `Number.isFinite(-0)` is true, so the value passes through unchanged. A money parser should never hand back negative zero.

An earlier version of this note claimed `formatDollars` hid the problem, on the reasoning that `(-0).toLocaleString('en-US')` gives `"0"`. That is wrong. It returns `"-0"`:

```
node -e "console.log((-0).toLocaleString('en-US'))"   →  -0
```

So the sign is rendered, not swallowed. `src/lib/__tests__/amount.test.ts:180` in the same commit asserts `formatDollars(-0)` is `'$-0'`, which contradicted the claim from inside the same change.

`formatDollars` reaches the screen through the add-holding live preview: `src/app/editorial/add.tsx:57` parses the quantity with `?? 0`, line 59 folds it into `total`, and line 198 renders `formatDollars(total)`. A quantity of `-0` therefore shows `That's $-0`.

Two things keep this minor rather than serious. The quantity field is `keyboardType="decimal-pad"`, so a literal `-0` needs a paste or a keyboard that offers a minus. And `formatDollars` produces `$-0` from any small negative anyway — `formatDollars(-0.004)` is also `'$-0'` — so fixing `parseAmount` alone would not remove the rendering, which is why [[formatDollars Renders Negative Zero As $-0]] is tracked separately. This note is the upstream half: one expression, collapsing zero to positive zero before returning.

## Fix

Fixed on `fix/money-formatters`. `parseAmount` returns `value === 0 ? 0 : value`, so a negated zero collapses to positive zero. `parseAmount('-0')` is `0`. The rendering half is fixed in the same change — [[formatDollars Renders Negative Zero As $-0]] — since neither one alone removes the `$-0` from the preview line.

## Related
- Feature: [[Money and Numeral Formatting]], [[Add Holding Live Preview]]
- Bug: [[formatDollars Renders Negative Zero As $-0]], [[parseAmount Cannot Read The U+2212 Sign money.ts Writes]], [[Negative Sub-Cent Renders As Minus Zero]]
- Page: [[Editorial Add Holding]]
