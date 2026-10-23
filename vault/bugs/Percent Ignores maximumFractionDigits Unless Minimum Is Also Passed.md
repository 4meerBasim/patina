# Percent Ignores maximumFractionDigits Unless Minimum Is Also Passed

Status: fixed
Found: `src/lib/money.ts:94`
Summary: `formatPercent` defaults the minimum fraction digits to 2, and `formatNumber` then clamps the maximum up to the minimum, so lowering only `maximumFractionDigits` has no effect.

## Details

Two defaults interact. `formatPercent` substitutes 2 for a missing floor:

```
src/lib/money.ts:94     minimumFractionDigits: minimumFractionDigits ?? 2,
```

and `formatNumber` refuses to let the ceiling fall below the floor:

```
src/lib/money.ts:46     maximumFractionDigits: Math.max(min, max),
```

So `formatPercent(5, { maximumFractionDigits: 0 })` arrives at `Intl` as min 2, max `Math.max(2, 0)` = 2.

Actual `5.00%`. Expected `5%`. Frozen at `src/lib/__tests__/money.test.ts:370`. The adjacent test at `:375` shows the workaround: passing both options to 0 does give `8%`, so the option is not broken, only silently unreachable on its own.

`formatNumber` and `formatCurrency` share the `Math.max` clamp but escape the consequence, because their floor defaults to 0 rather than 2 (`src/lib/money.ts:43`). `formatCurrency(1234.5678, 'USD', { maximumFractionDigits: 3 })` correctly gives `$1,234.568`. `formatPercent` is the only one of the four where the defaults collide.

Latent. Every `formatPercent` caller in the app that lowers the precision passes both options — `src/app/native/(tabs)/index.tsx:127` and `src/app/native/(tabs)/goals.tsx:125` pass 0 and 0, the holding and performance screens pass 1 and 1, the yield rows pass 2 and 2. None currently pass `maximumFractionDigits` alone, so nothing on screen is wrong today. The named trigger is the next caller who passes only the ceiling, reasonably expecting it to apply, and gets two decimals with no error and no warning.

## Fix

Fixed on `fix/money-formatters`. `formatPercent` defaults its floor to `Math.min(2, max)` rather than a flat 2, so a lowered ceiling pulls the floor down with it: `formatPercent(5, { maximumFractionDigits: 0 })` is `5%` and `formatPercent(7.5, { maximumFractionDigits: 1 })` is `7.5%`. The default with no options is unchanged at two digits. The `Math.max` clamp in `formatNumber` stays — it is what keeps `Intl` from a RangeError when a caller deliberately raises the floor above the ceiling.

## Related
- Feature: [[Money and Numeral Formatting]]
- Bug: [[Currency Drops The Trailing Cent Zero]], [[Half-Cent Value Loses Its Cents In Currency Output]], [[Negative Sub-Cent Renders As Minus Zero]]
- Enhancement: [[Test Formatters Against Hermes]]
- Page: [[Editorial Performance]], [[Editorial Holding Detail]], [[Native Holding Detail]]
