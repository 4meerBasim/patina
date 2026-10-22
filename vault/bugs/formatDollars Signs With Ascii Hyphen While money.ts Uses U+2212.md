# formatDollars Signs With Ascii Hyphen While money.ts Uses U+2212

Status: not-fixed
Found: `src/lib/amount.ts:21`
Summary: `formatDollars` lets `toLocaleString` supply the sign, which is U+002D, while every `money.ts` formatter writes U+2212, so negatives look different depending on which screen renders them.

## Details

`src/lib/money.ts:8` declares the sign explicitly:

```
const MINUS = '−';
```

and all four of its formatters use it. `src/lib/amount.ts` declares nothing and takes whatever `toLocaleString` produces, which for `en-US` is the ASCII hyphen-minus:

```
src/lib/amount.ts:21   return `$${rounded.toLocaleString('en-US', {
```

`formatDollars(-5)` is `$-5` with U+002D at index 1. `src/lib/__tests__/amount.test.ts:170` asserts the code point is `0x2d` and that the string contains no U+2212. The mirror assertions at `src/lib/__tests__/money.test.ts:183`–`:185` state the opposite for `formatCurrency`: code point `0x2212` at index 0, `0x24` at index 1, and no ASCII hyphen anywhere.

The two characters are visibly different. U+2212 is a full-width mathematical minus that aligns with the digits; U+002D is a short hyphen. In a typeface-driven design this is the kind of inconsistency that reads as a rendering bug rather than a choice.

The practical cost is already recorded in the other direction. `parseAmount` strips `$`, spaces, commas and the Arabic group separator but not U+2212, so a figure `money.ts` wrote cannot be read back by the parser — see [[parseAmount Cannot Read The U+2212 Sign money.ts Writes]]. Standardising `amount.ts` on U+2212 without also teaching `parseAmount` to accept it would make that worse, so the two should be fixed together.

Live but cosmetic. `formatDollars` renders on one screen only, the editorial add-holding sheet (`src/app/editorial/add.tsx:188` and `:198`), and a negative total there requires a pasted minus since both fields are `keyboardType="decimal-pad"`. No user-visible figure produced by `money.ts` and one produced by `amount.ts` currently appear side by side.

Not fixed in the harness PR, which carries no behaviour changes. The test asserts the current behaviour and names this note. Per `foundation/github.md` the fix changes behaviour and cannot ride on a `chore/` branch; it needs its own `fix/` PR, best combined with the other three `formatDollars` defects and with the `parseAmount` counterpart.

## Related
- Feature: [[Money and Numeral Formatting]], [[Add Holding Live Preview]]
- Bug: [[parseAmount Cannot Read The U+2212 Sign money.ts Writes]], [[formatDollars Puts The Sign After The Dollar Symbol]], [[formatDollars Renders Negative Zero As $-0]], [[formatDollars Loses Precision On Very Large Values]]
- Enhancement: [[Test Formatters Against Hermes]]
- Page: [[Editorial Add Holding]]
