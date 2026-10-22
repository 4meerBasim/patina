# Negative Sub-Cent Renders As Minus Zero

Status: not-fixed
Found: `src/lib/money.ts:49`, `:73`, `:82`, `:99`
Summary: All four `money.ts` formatters choose the sign from the input and the digits from the rounded value, so any negative that rounds to zero renders with a minus in front of a zero.

## Details

Each formatter decides the sign on the unrounded input, independently of what the digit string turned out to be:

```
src/lib/money.ts:49   const signed = value < 0 ? `${MINUS}${latin}` : latin;
src/lib/money.ts:73   return value < 0 ? `${MINUS}${body}` : body;
src/lib/money.ts:82   if (value < 0) return `${MINUS}${magnitude}`;
src/lib/money.ts:99   if (value < 0) return `${MINUS}${body}`;
```

`Intl` has already rounded the magnitude to the displayed precision by then. When that rounding lands on zero the condition is still true, so the minus is prepended to a zero:

| input | expected | actual |
|---|---|---|
| `formatNumber(-0.004)` | `0` | `−0` |
| `formatCurrency(-0.004, 'USD')` | `$0` | `−$0` |
| `formatSignedCurrency(-0.004, 'USD')` | `+$0` or `$0` | `−$0` |
| `formatPercent(-0.001, { signed: true })` | `+0.00%` | `−0.00%` |

Frozen at four points: `src/lib/__tests__/money.test.ts:147` (`formatNumber`), `:228` (`formatCurrency`), `:314` (`formatSignedCurrency`) and `:380` (`formatPercent`). The sign character is U+2212, so the rendered string is `−0`, not `-0`.

No literal `-0` input is needed, and that is the point. `value < 0` is false for negative zero, so `formatNumber(-0)` and `formatCurrency(-0, 'USD')` correctly give `0` and `$0` — the suite asserts both as intended behaviour. What triggers the defect is any value strictly below zero that rounds to zero at the displayed precision: a sub-cent residue in a currency figure, a sub-basis-point drift in a percentage, a rounding remainder in a delta. Those arise from ordinary arithmetic, not from pathological input.

One `value < 0` test per formatter is the whole cause; a single shared helper that takes the sign from the rounded magnitude fixes all four. The companion defect in `src/lib/amount.ts` produces the same visual result through a different mechanism — `toLocaleString` emitting the sign itself — and is tracked as [[formatDollars Renders Negative Zero As $-0]].

Not fixed in the harness PR, which carries no behaviour changes. The four tests assert the current behaviour and name this note. Per `foundation/github.md` the fix changes behaviour and cannot ride on a `chore/` branch; it needs its own `fix/` PR.

## Related
- Feature: [[Money and Numeral Formatting]]
- Bug: [[Currency Drops The Trailing Cent Zero]], [[Half-Cent Value Loses Its Cents In Currency Output]], [[Percent Ignores maximumFractionDigits Unless Minimum Is Also Passed]], [[formatDollars Renders Negative Zero As $-0]], [[parseAmount Returns Negative Zero]]
- Enhancement: [[Test Formatters Against Hermes]]
- Page: [[Editorial Home]], [[Native Home]]
