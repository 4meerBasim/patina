# parseAmount Returns Negative Zero

Status: not-fixed
Found: `src/lib/amount.ts:16`
Summary: `parseAmount('-0')` returns `-0` rather than `0`, which can surface as a displayed minus sign on an empty amount.

## Details

`Number('-0')` is `-0`, `Number.isFinite(-0)` is true, so the value passes through unchanged. A money parser should never hand back negative zero.

`formatDollars` happens to hide it — `(-0).toLocaleString('en-US')` gives `"0"` — so there is no visible defect on that path today. The risk is elsewhere: `formatSignedCurrency` in `money.ts` branches on `value < 0`, which is false for `-0`, but any future code testing `Object.is(value, -0)`, or comparing with `1 / value`, or serialising through a format that preserves the sign, inherits a wrong figure. It also makes `toBe(0)` assertions fail in tests for reasons that have nothing to do with the logic under test.

Minor, and worth fixing only because the fix is one expression: collapse zero to positive zero before returning.

Deliberately not fixed in the harness PR, for the same reason as [[parseAmount Cannot Read The U+2212 Sign money.ts Writes]] — `chore/jest-test-harness` carries no behaviour changes. `src/lib/__tests__/amount.test.ts` asserts the current behaviour and names this note.

## Related
- Feature: [[Money and Numeral Formatting]]
- Bug: [[parseAmount Cannot Read The U+2212 Sign money.ts Writes]]
