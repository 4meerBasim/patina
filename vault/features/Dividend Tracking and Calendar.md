# Dividend Tracking and Calendar

Status: shipped
Summary: dividends are recorded as transactions, totalled into a trailing twelve-month calendar, projected forward from each holding's own cadence, and divided into cost to give yield on cost.

## Details

`src/lib/dividends.ts` holds three functions. `computeDividendCalendar` totals payments by month across the trailing year. `computeDividendForecast` projects the next twelve months by repeating each holding's recorded interval — a single payment is assumed annual, two or more set the interval from the median gap — and no external yield data is used, which is why the screen captions it `Projected from each holding's recorded cadence.` `computeYieldOnCost` divides trailing income by the remaining lot cost.

Yield on cost reaches the user on both holding detail screens. The calendar and forecast have their own screens, `src/app/editorial/dividends.tsx` and `src/app/native/dividends.tsx`, which nothing navigates to yet — see [[Four Finished Screens Have No Route In]].

No dividend can be entered in the app: the add sheets write buys only, so every dividend in the system is seeded.

## Related
- Feature: [[Transactions and Lots]], [[Domain Data Model]], [[Seeded FX Rates]], [[Money and Numeral Formatting]]
- Bugs: [[Dividend Calendar Sums Foreign Currency Without FX]], [[Four Finished Screens Have No Route In]]
- Page: [[Editorial Dividends]], [[Native Dividends]], [[Editorial Holding Detail]], [[Native Holding Detail]], [[Editorial Activity]]
