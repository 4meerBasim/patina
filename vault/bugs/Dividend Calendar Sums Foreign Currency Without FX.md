# Dividend Calendar Sums Foreign Currency Without FX

Status: not-fixed
Found: `src/lib/dividends.ts:47`, `src/lib/dividends.ts:119`
Summary: Both dividend aggregations add `tx.amount` across currencies with no conversion, so a mixed-currency portfolio produces a total that is not denominated in anything.

## Details

`computeDividendCalendar` keys payments by month and adds their raw amounts:

```
src/lib/dividends.ts:47   byMonth.set(key, (byMonth.get(key) ?? 0) + tx.amount);
```

`Transaction` carries `currency: CurrencyCode` (`src/data/types.ts:55`) and the module never reads it. A 100 USD payment and a 100 EUR payment in the same month total 200 — a number in no currency at all. `src/lib/__tests__/dividends.test.ts:152` asserts exactly that: `{ month: '2026-05', amount: 200 }`.

`computeYieldOnCost` has the same flaw with a second error stacked on it:

```
src/lib/dividends.ts:119   incomeByHolding.set(tx.holdingId, (incomeByHolding.get(tx.holdingId) ?? 0) + tx.amount);
src/lib/dividends.ts:126     (costByHolding.get(lot.holdingId) ?? 0) + lot.remainingQuantity * lot.costPerUnit,
src/lib/dividends.ts:138     yieldOnCost: (trailingIncome / costBasis) * 100,
```

Line 119 sums trailing income across currencies; line 126 builds the cost basis from `lot.costPerUnit`, which is in the holding's native currency. Line 138 divides one by the other. For a holding whose dividends are paid in a currency other than its cost currency, the resulting percentage is off by the FX ratio — a EUR-cost holding paid in USD at 0.92 EUR/USD yields a figure roughly 8% away from the truth, and the error scales with the rate, not with the amounts.

The conversion data exists and is unused. `convertCurrency` in `src/lib/snapshots.ts` already converts against the seeded USD-based rates for all six currencies, and `src/lib/positions.ts` uses it throughout. `src/lib/dividends.ts` imports nothing from it.

Reachability is narrower than it first looks, and the correction matters. The yield-on-cost percentage is live on a reachable screen: `src/app/editorial/holding.tsx:291` renders `formatPercent(yoc.yieldOnCost, …)`, and `src/app/native/holding.tsx:129` reads the same row. The calendar is not — nothing in the app navigates to `/editorial/dividends` or `/native/dividends`; the only in-source matches for the string are the activity filter chips in `src/app/editorial/activity.tsx:17`. Those two screens are reachable by deep link only.

More importantly, no dividend transaction can be created in the app at all. The two add sheets write only `type: 'buy'`, so every dividend in the system is seeded, and every seeded dividend is USD (`src/data/seed.ts:163`, `169`–`179`). The one non-USD holding, ASML on the DEGIRO account (`src/data/seed.ts:123`), has no dividends. So with demo data both figures are currently correct.

That makes this latent, with two named triggers: a dividend in a currency other than its holding's cost currency makes the yield-on-cost percentage wrong on a screen the user can already reach; a dividend in a currency other than the base currency makes the calendar total wrong, though only a deep link gets there today. A third variant is already true on the deep-linked screen — `src/app/editorial/dividends.tsx:98` formats the un-converted sum with `baseCurrency`, so once the base currency is cycled in native settings (`src/app/native/settings.tsx:132`) the USD seed totals render under an IQD, SAR or AED symbol. Six currencies ship; the data that would expose this does not exist yet.

Not fixed in the harness PR, which carries no behaviour changes. The test asserts the current behaviour. Per `foundation/github.md` the fix changes behaviour and cannot ride on a `chore/` branch; it needs its own `fix/` PR, covering both functions since it is one defect in one module.

## Related
- Feature: [[Seeded FX Rates]], [[Domain Data Model]], [[Money and Numeral Formatting]], [[Demo Seed Data]], [[Persisted Settings]]
- Page: [[Editorial Holding Detail]], [[Native Holding Detail]]
