# parseAmount Cannot Read The U+2212 Sign money.ts Writes

Status: not-fixed
Found: `src/lib/amount.ts:7` against `src/lib/money.ts:8`
Summary: every negative figure the app displays is formatted with a true minus sign that its own parser rejects, so editing one returns null.

## Details

`money.ts` defines `const MINUS = '−'` (U+2212, the typographic minus) and uses it for every negative value it renders — `formatSignedCurrency`, `formatPercent` and two other sites at lines 49, 73, 82 and 99. It is the right character typographically and matches Patina's editorial voice.

`parseAmount` strips `$`, whitespace, `٬` and `,`, maps Eastern Arabic and Persian digits to Latin, and converts the Arabic decimal separator `٫` to `.`. It never maps U+2212 to an ASCII hyphen. So `Number('−5')` is `NaN` and the function returns `null`.

Round trip:

```
parseAmount(formatSignedCurrency(-5, 'USD'))  →  null
parseAmount('-5')                             →  -5
```

A formatter and a parser in the same module pair disagree on what a minus sign is. Any screen that seeds a text input from formatted output and parses the result back cannot accept a negative number. The reachable surfaces are the valuation mark input at `src/app/editorial/holding.tsx:151` and `src/app/native/holding.tsx:55`, plus the liability balance at `src/app/native/liabilities.tsx:118`, where `?? 0` silently swallows the null and writes zero instead of the figure the user typed.

Fix is one entry in the replace chain, mapping U+2212 to `-` alongside the existing Arabic separator handling. Deliberately not fixed in the harness PR: `chore/jest-test-harness` must not mix a behaviour change with test setup, per `foundation/github.md`. `src/lib/__tests__/amount.test.ts` currently asserts the broken behaviour and names this note.

## Related
- Feature: [[Money and Numeral Formatting]]
- Bug: [[parseAmount Returns Negative Zero]]
- Page: [[Native Holding Detail]], [[Editorial Holding Detail]]
