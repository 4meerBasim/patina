# Sub-Cent Accumulation Lands A Cent Low

Status: fixed
Found: `src/lib/money.ts:57`, `src/lib/amount.ts:19`
Summary: A total built by repeatedly adding a half cent lands just below the exact decimal value in binary, so the formatters round it down and display one cent less than the arithmetic says.

## Details

Adding 0.005 eleven times gives 0.05499999999999999, not 0.055:

```
node -e "let s=0; for(let i=0;i<11;i++) s+=0.005; console.log(s)"   →  0.05499999999999999
```

Multiplied by 100 that is 5.4999999999999991118, which is below the tie, so both cent-rounding paths round down:

```
src/lib/money.ts:57   return Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2;
src/lib/amount.ts:19   const rounded = Math.round(amount * 100) / 100;
```

`formatCurrency(sum, 'USD', { minimumFractionDigits: 2 })` gives `$0.05`, and `formatCurrency(0.055, 'USD', { minimumFractionDigits: 2 })` — the same total written as a literal — gives `$0.06`. `formatDollars` behaves identically: `$0.05` against `$0.06`. Frozen in both modules, at `src/lib/__tests__/money.test.ts:422` and `src/lib/__tests__/amount.test.ts:222`.

The error is exactly one cent, and it does not grow. It is not a drift that accumulates with the number of terms: the sum is wrong by less than 10⁻¹⁶, and the only reason it shows is that the true total happens to sit on a half-cent tie where a rounding decision flips. The surrounding tests make this clear — 1000 additions of 0.01, 100 additions of 0.07, 100 additions of 1.10 and `0.1 + 0.2` all format correctly, because none of them land on a tie. So the figure is never more than a cent out, and the scale at which a user could see it is any total displayed to cents whose exact decimal value ends in a half cent.

No such accumulation was traced in the current computation layer, which makes this the least severe of the thirteen. Every `roundCents` in `src/lib/positions.ts`, `src/lib/dividends.ts`, `src/lib/rebalance.ts` and `src/lib/fees.ts` rounds each item to cents before summing — `src/lib/fees.ts:79` sums already-rounded values — and that per-item rounding is exactly the pattern that avoids the tie. The trigger would be a future figure that sums sub-cent steps and formats the running total directly.

Not a logic error so much as a consequence of carrying money in binary doubles and rounding half-up at the display edge. A real fix means accumulating in integer cents, or rounding with an epsilon, and it belongs in one place rather than in each formatter. The same `Math.round(value * 100)` tie-sensitivity is the cause of [[Half-Cent Value Loses Its Cents In Currency Output]].

## Fix

Fixed on `fix/money-formatters` by rounding with an epsilon in one place, as this note prescribed. `snapDecimalNoise` in `src/lib/amount.ts` snaps a magnitude to its 15 significant digits before any formatting, and both `amount.ts` and `money.ts` route their magnitudes through it. Eleven additions of 0.005 now format as `$0.06`, the same as the literal 0.055. Above 1e12 the snap is skipped, because 15 digits no longer reach the cents there and the raw double is the more accurate value — which is also what keeps the large-value fix in [[formatDollars Loses Precision On Very Large Values]] true.

## Related
- Feature: [[Money and Numeral Formatting]], [[Add Holding Live Preview]]
- Bug: [[Half-Cent Value Loses Its Cents In Currency Output]], [[Currency Drops The Trailing Cent Zero]], [[formatDollars Loses Precision On Very Large Values]]
- Enhancement: [[Test Formatters Against Hermes]]
- Page: [[Editorial Add Holding]], [[Native Home]]
