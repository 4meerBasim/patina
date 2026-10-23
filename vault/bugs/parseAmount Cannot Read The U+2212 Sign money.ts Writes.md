# parseAmount Cannot Read The U+2212 Sign money.ts Writes

Status: fixed
Found: `src/lib/amount.ts:8-12` against `src/lib/money.ts:8`
Summary: the app formats negatives with a typographic minus its own parser rejects, so pasting a displayed figure back into a field silently fails.

## Details

`money.ts:8` defines `const MINUS = '−'` (U+2212, the typographic minus) and renders every negative with it, at lines 49, 73, 82 and 99. That is the right character for Patina's editorial type.

`parseAmount` strips `$`, whitespace, `٬` and `,`, maps Eastern Arabic and Persian digits to Latin, and converts the Arabic decimal separator `٫` to `.`. It never maps U+2212 to an ASCII hyphen, so `Number('−5')` is `NaN` and the function returns `null`.

```
parseAmount(formatSignedCurrency(-5, 'USD'))  →  null
parseAmount('-5')                             →  -5
```

A formatter and a parser in the same module pair disagree on what a minus sign is.

## Severity, corrected

An earlier version of this note claimed the defect silently writes zero on the liability-balance and valuation-mark inputs because callers use `?? 0`. **That claim is wrong.** Checked against the screens:

- `src/app/editorial/holding.tsx:152` — `if (value == null || value <= 0) return;`. No `?? 0`. A null aborts the save.
- `src/app/native/holding.tsx:58` — same guard. No `?? 0`.
- `src/app/native/liabilities.tsx:118` — does use `?? 0`, but line 119 returns on `balanceValue <= 0`, and `canSave` at line 108 already disables the button on the same condition. Nothing is written.

No input in `src/app` is seeded from formatter output. The editable fields start at `''`, the literal `'50'`, or `String(number)` — `liabilities.tsx:104` uses `String(liability.balance)`, which is plain ASCII from `Number.prototype.toString`. The `formatCurrency` call at `liabilities.tsx:238` feeds a read-only display row, not an input.

So the real consequence is a **dead-end paste**: a user who copies a displayed negative and pastes it into an amount field gets a rejected input with no explanation, not a corrupted figure. All three surfaces also require a value greater than zero, so a negative could not be entered there even if the character parsed.

Latent rather than live, and worth fixing because the asymmetry will bite the moment any screen does seed an input from formatted output. The fix is one entry in the replace chain, mapping U+2212 to `-` beside the existing Arabic separator handling.

## Fix

Fixed on `fix/money-formatters` with one more entry in the replace chain, mapping U+2212 to an ascii hyphen beside the existing Arabic separator handling. `parseAmount('−5')` is `-5` and `parseAmount('−1,234.56')` is `-1234.56`, so a figure the app displays can be pasted back into a field. The formatter counterpart is [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]], fixed in the same change, which means both modules now write the one sign the parser reads.

## Related
- Bug: [[formatDollars Puts The Sign After The Dollar Symbol]], [[formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212]], [[parseAmount Returns Negative Zero]]
- Feature: [[Money and Numeral Formatting]]
- Page: [[Native Holding Detail]], [[Editorial Holding Detail]]
