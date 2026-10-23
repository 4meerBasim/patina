# Currency Drops The Trailing Cent Zero

Status: fixed
Found: `src/lib/money.ts:70`
Summary: `formatCurrency` raises the maximum fraction digits to 2 for a non-whole value but leaves the minimum at 0, so an amount with one significant decimal renders with one decimal instead of two.

## Details

Line 70 computes the digit ceiling and passes the floor straight through untouched:

```
src/lib/money.ts:70   maximumFractionDigits: rest.maximumFractionDigits ?? Math.max(rest.minimumFractionDigits ?? 0, fractionDigitsFor(value)),
```

`fractionDigitsFor(1234.5)` returns 2, so the ceiling is right. But `minimumFractionDigits` stays `undefined`, and `formatNumber` defaults it to 0 (`src/lib/money.ts:43`), so `Intl` is asked for between 0 and 2 digits and drops the trailing zero.

`formatCurrency(1234.5, 'USD')` gives `$1,234.5`. Expected `$1,234.50`. Frozen at `src/lib/__tests__/money.test.ts:188`.

The condition is not a rare one. Any amount whose cents are a non-zero multiple of ten hits it: `$29,544.10` renders as `$29,544.1`, `$1,284,930.40` as `$1,284,930.4`. Roughly one in ten cent-bearing amounts. Whole amounts are unaffected — `fractionDigitsFor` returns 0 and `$1,234` is the intended output — and two-decimal amounts are unaffected because the floor never binds.

Live, and the native style is where it shows. Twenty-four of the twenty-six `formatCurrency` call sites in `src/app/native/` pass no fraction-digit options and so take the default path: the home hero at `src/app/native/(tabs)/index.tsx:116`, the holding detail hero and cost basis at `src/app/native/holding.tsx:219` and `:160`, the portfolio rows at `src/app/native/(tabs)/portfolio.tsx:238`, the goals progress line at `src/app/native/(tabs)/goals.tsx:131`. The two native calls that do pass `minimumFractionDigits: 2` escape it, at `src/app/native/add.tsx:72` and `src/app/native/holding.tsx:166`. The editorial style mostly passes explicit digits and escapes it too. The test at `money.test.ts:193` confirms that passing `minimumFractionDigits: 2` yields the correct `$1,234.50`, which is why the editorial screens look right and the native ones do not.

The fix is to pass the chosen digit count as both floor and ceiling when the caller supplied neither, which is what `fractionDigitsFor` was evidently meant to express.

## Fix

Fixed on `fix/money-formatters`. `currencyFractionDigits` now probes what `Intl` will actually render: when the caller supplies no fraction digits, the magnitude is formatted once with a ceiling of 2, and if that probe carries a decimal separator both the floor and the ceiling are set to 2. `formatCurrency(1234.5, 'USD')` is `$1,234.50` and `formatCurrency(29544.1, 'USD')` is `$29,544.10`; a whole value still renders bare. The twenty-four native call sites that pass no options now read like the editorial ones.

## Related
- Bug: [[Half-Cent Value Loses Its Cents In Currency Output]], [[Negative Sub-Cent Renders As Minus Zero]], [[Percent Ignores maximumFractionDigits Unless Minimum Is Also Passed]], [[Sub-Cent Accumulation Lands A Cent Low]]
- Feature: [[Money and Numeral Formatting]]
- Enhancement: [[Test Formatters Against Hermes]]
- Page: [[Native Home]], [[Native Holding Detail]], [[Native Portfolio]]
