# Patina feature scout report

Date: 2026-10-01. Scope: personal wealth / portfolio trackers. Compared against Kubera, Sharesight, Delta, Getquin, Snowball Analytics, Empower, Copilot Money, Monarch, Wealthfolio, Ghostfolio, Yahoo Finance, Stocks+, plus privacy-first manual trackers (TrackMyStack, Worthy) and halal-investing apps (Zoya, Musaffa).

Not a vault note. Nothing here has `Status:`; pick items and they become `enhancements/` notes.

## How to read this

- Priority: `must` (table stakes, the app is a mock without it), `should` (common in leaders, users ask for it), `creative` (differentiator).
- Effort: S (days), M (1-2 weeks), L (multi-week or needs infra).
- `NEEDS-USER-DECISION` = something only the owner can choose or provide (paid API key, aggregator account, backend, auth, legal, pricing).
- Source tags like [S3] map to the list at the end. Reddit could not be fetched by the research tool, so user sentiment comes from review roundups and store listings.
- "Design doc" = `design/Patina - Design Document.dc.html`. Several items below are drawn in the design doc but have no vault note and no code, so they count as missing.

## Starting point (what exists today)

Screens are static: every figure is hardcoded in the screen file. No data model, no persistence, no store, no network. Settings toggles (Blur, Face ID) flip local `useState` and are lost on reload. The link sheet lists institutions but links nothing. Goals, Notes, Performance and Allocation render fixed copy. Activity CSV export works on the visible mock rows.

---

## Phase 0 - Foundation (do first; everything else reads from it)

| # | Feature | What it does | Why users love it / evidence | Priority | Effort | Flag |
|---|---|---|---|---|---|---|
| 1 | Domain data model | Typed entities: Account, Holding, Transaction/Lot, Valuation mark, Liability, Goal, Note, FX rate, Snapshot. Screens read from it instead of literals. | Every tracker in the set is transaction/activity based; Wealthfolio models holdings, activities, income, goals and limits in one store [S11]. | must | M | - |
| 2 | Local-first persistence | SQLite on device (`expo-sqlite`, optionally `drizzle-orm` for typed schema + migrations). App works offline, no account needed. | Wealthfolio's whole pitch is a SQLite database the user controls [S11][S12]; Worthy and TrackMyStack win privacy-minded users by keeping data on the phone with no login [S14][S15]. | must | M | NEEDS-USER-DECISION: local-only vs. backend-first (affects #31, #32) |
| 3 | App state store | One store for derived portfolio state (totals, weights, deltas) and UI prefs, hydrated from SQLite. Zustand is the lightest fit; Redux Toolkit if you want parity with other projects. | Prerequisite for live recompute (Add holding preview already does this locally per screen). | must | S | NEEDS-USER-DECISION: which state library |
| 4 | Persisted settings | Locale, numeral system, base currency, appearance, blur, biometrics survive restarts (`expo-secure-store` for security flags, SQLite/kv for the rest). | Today both Settings screens forget everything; Privacy Blur and Light Mode enhancements depend on a stored value. | must | S | - |
| 5 | Daily net-worth snapshots | Write one row per day (and on every edit) with totals per class/account, so history charts exist without the user doing anything. | Kubera keeps daily historical snapshots [S2]; the TrackMyStack article names "no history without manually snapshotting" as the core spreadsheet pain [S15]. | must | M | - |
| 6 | Returns engine | Time-weighted return, money-weighted return / IRR, and the contributions-vs-market split the Performance screen already draws. | Sharesight's annualised return (capital + dividends + currency) is its most-cited strength [S3][S4]; Wealthfolio ships TWR and MWR [S11]; Kubera shows IRR per position [S2]. | must | M | - |

## Phase 1 - Core features (turn the mock into a working tracker)

| # | Feature | What it does | Why users love it / evidence | Priority | Effort | Flag |
|---|---|---|---|---|---|---|
| 7 | Transactions and lots | Record buy, sell, dividend, deposit, withdrawal, split; FIFO lots; realised vs unrealised gain; feeds the Provenance list and Activity ledger. | Yahoo Finance added transaction management with automatic FIFO lots [S20]; Monarch Plus sells tax-lot detail [S8]; design doc Holding detail lists a lots view. | must | M | - |
| 8 | Live market prices | Pull quotes for stocks/ETFs/crypto, cache them, refresh on pull-to-refresh and app foreground; offline uses last cached price with an "as of" caption. | Auto-pricing is what separates TrackMyStack-style trackers from spreadsheets [S15]; Delta and Stocks+ are built around it [S9][S19]. Free tiers: Finnhub ~60/min but non-commercial only, Twelve Data 800/day delayed, Alpha Vantage 25/day [S24]. | must | M | NEEDS-USER-DECISION: data provider, API key, licence (commercial use) |
| 9 | Ticker search in Add holding | Step 2 of the accession sheet streams real symbol results instead of a fixed AAPL. | Design doc §4.4 specifies it; every listed app has symbol search. Ties to #8 provider. | must | S | Depends on #8 decision |
| 10 | Multi-currency + FX | Holdings in native currency, converted to a chosen base currency; currency gain shown separately. Base currency picker in Settings becomes real. | Sharesight counts currency gain inside returns [S3]; Kubera supports multi-currency "at every layer" [S2]; Ghostfolio and Wealthfolio both ship it [S10][S11]. Essential for Gulf users holding USD assets with SAR/AED/IQD cash. | must | M | NEEDS-USER-DECISION: FX rate source |
| 11 | Liabilities | Mortgages, loans, cards as negative balances; Home hero becomes true net worth (assets minus debts). | Monarch's net worth is credible because it includes loans and property [S8]; Kubera, TrackMyStack and Worthy all treat debts as first-class [S2][S14][S15]. Patina has five asset classes and no debt side. | must | S | - |
| 12 | Manual valuation marks | Real estate, cash, gold, cars, private equity get dated valuation entries; detail screen shows a valuation timeline instead of a price chart. | Kubera covers real estate, gold, collectibles, cars, private equity [S2]; design doc already specifies the valuation-timeline variant. | must | S | - |
| 13 | Goals CRUD with linked holdings | Create/edit/delete goals, link holdings or accounts, set a monthly contribution; ahead/behind/on-pace computed, not typed. | Getquin and Wealthfolio both put goals with timelines on real portfolio data [S5][S11]. Today the three goals are hardcoded and not tappable. | must | M | - |
| 14 | Biometric app lock | Wire the Face ID toggle to `expo-local-authentication` on launch and resume. | Stocks+ sells "Privacy Lock" with Face ID as a paid feature [S19]; Delta offers biometric lock [S9]. Toggle exists, does nothing. Distinct from the planned Privacy Blur (which hides figures, not access). | must | S | - |
| 15 | CSV import with column mapping | Pick a broker CSV (`expo-document-picker`), map columns once per broker, preview, then import into transactions. | Wealthfolio keeps CSV import "free forever" as the alternative to paid sync [S12]; Ghostfolio has import/export [S10]; Getquin added AI document import for PDF/CSV/Excel in June 2026 [S5]. | must | M | - |
| 16 | Full export and delete | Export all data as JSON + machine-readable CSV; delete everything with confirmation. Settings already shows the text row. | Ghostfolio exports CSV and JSON [S10]; data portability is a selling point in every manual-tracker roundup [S15]. | must | S | - |
| 17 | Accounts and ownership tags | Group holdings by account and by owner (me / spouse / joint / entity); makes Native Portfolio's "By account" segment real. | Kubera's ownership tags and nested portfolios are a headline feature [S2]; Getquin's value is "looking across accounts" [S5]. | should | M | - |
| 18 | Target allocation editor + rebalance hints | "Set targets" action on Allocation; drift computed live; suggests buy/sell amounts to return to target. | Empower Investment Checkup scores against a target and proposes an alternative allocation [S7]; Wealthfolio and Copilot (iOS) include rebalancing [S11][S6]. Design doc lists "Set targets". | should | M | - |
| 19 | Benchmark overlay | Compare portfolio line against S&P 500, MSCI World or any ticker on Performance. | Copilot shows performance vs S&P with intraday updates [S6]; Kubera supports custom ticker benchmarks [S2]; Ghostfolio and Wealthfolio ship it [S10][S11]. Design doc lists it as optional overlay. | should | M | Depends on #8 |
| 20 | Dividend income tracking + calendar | Record dividends, show a month-by-month income calendar and 12-month forecast, yield on cost. | Snowball's dividend calendar and forecast are its main draw [S16][S17]; Sharesight tracks DRPs and corporate actions [S3]; Getquin users single out dividend forecasts [S5]. | should | M | NEEDS-USER-DECISION: dividend data source (forecast needs a provider; manual entry works without) |
| 21 | Insight rules engine | Generate Notes from real data: Concentration, Drift, Fees, Milestone, Pace, with user thresholds ("Rules" link already drawn). Max three unread per design doc. | Ghostfolio X-ray flags concentration and diversification gaps with customisable thresholds [S10]; Empower's Fee Analyzer is a top-cited free tool [S7]. | should | M | - |
| 22 | Fee analyzer | Expense ratio per fund (entered or fetched), annual cost and 10/20-year compounding drag. | Empower's Fee Analyzer projects how fees compound over time [S7]; already teased by the Notes "Fees" card. | should | S | - |
| 23 | Period recap / change attribution | "What moved my net worth": change per class, account and holding over a period, contributions vs market. | Kubera Recap shows value/allocation change daily to yearly [S21]; Copilot's "top movers" [S6]; Delta's "Why is it moving?" [S9]. | should | M | - |
| 24 | Top movers on Home | Short list of holdings with the largest price or value change today. | Copilot lets you sort movers by price change or equity change [S6]. | should | S | - |
| 25 | Stale-value reminders | Gentle local reminder when a manual asset has not been revalued in N days (default monthly). | The spreadsheet pain in [S15] is "data entry on the 1st of every month"; a reminder turns that chore into a 30-second check-in. | should | S | - |
| 26 | Price and threshold alerts | Local notifications when a holding or the total crosses a user threshold; default none, per design doc "calm decline". | Delta's custom price alerts [S9]; Stocks+ sells unlimited alerts [S19]. | should | M | NEEDS-USER-DECISION if alerts must fire while app is closed reliably (server push) |

## Phase 2 - Platform reach and polish

| # | Feature | What it does | Why users love it / evidence | Priority | Effort | Flag |
|---|---|---|---|---|---|---|
| 27 | Home and Lock Screen widget (iOS) | Net worth hero in Newsreader, today's delta, optional sparkline; respects privacy blur. | Delta and Stocks+ both lead with widgets [S9][S19]; design doc platform notes call for one. `expo-widgets` is stable since SDK 56 and builds the extension from React + `@expo/ui` [S22][S23]. | should | M | - |
| 28 | Android widget | Same widget on Android (design doc names Glance). No Expo-first package; needs a config plugin + native module. | Same evidence as #27. | should | L | - |
| 29 | Zen / percentages-only mode | Hide all currency amounts app-wide, show only % and weights; different from launch blur. | Ghostfolio's Zen mode [S10]. Useful when checking the app in public or screen-sharing. | should | S | - |
| 30 | Demo portfolio | Ship today's mock data as a "Sample portfolio" users can explore before entering their own. | Copilot has a demo mode [S6]; it reuses data Patina already has. | should | S | - |
| 31 | Encrypted backup and multi-device sync | Back up the SQLite file (iCloud/Drive) at minimum; full E2E sync later. | Wealthfolio Connect sells encrypted multi-device sync [S12]; Delta syncs across devices [S9]. | should | L | NEEDS-USER-DECISION: backend/sync provider, auth, cost |
| 32 | Real account aggregation | Make the link sheet connect brokers/banks/exchanges read-only. | Getquin (Open Banking, 50+ brokers) [S5], Kubera (thousands of institutions) [S1], Monarch [S8]. Counter-evidence: TrackMyStack users choose manual specifically to avoid broken re-auth and credential sharing [S15]. | should | L | NEEDS-USER-DECISION: aggregator (Plaid/SnapTrade for US, regional open-banking providers for Gulf), contracts, cost, compliance, backend |
| 33 | Retirement / FIRE planner with Monte Carlo | Inputs: retirement age, spend, contributions; output: success probability and median path. Feeds the planned projection fan visual. | Empower's Monte Carlo retirement planner is its best-known tool [S7]; Wealthfolio has Monte Carlo + stress tests [S11]; Ghostfolio has a FIRE calculator [S10]. | should | L | - |
| 34 | Month and Year in Review | End-of-period story: net worth change, best/worst month, income, goal progress; shareable as percentages only. | Copilot's Month/Year in Review with shareable slides [S13]. | creative | M | - |

## Phase 3 - Creative and differentiating

| # | Feature | What it does | Why users love it / evidence | Priority | Effort | Flag |
|---|---|---|---|---|---|---|
| 35 | Zakat calculator | Computes zakat due from zakatable holdings (cash, gold, trade/stock portion), nisab from gold/silver price, hawl anniversary reminder; Arabic-first. | Zoya and Musaffa both ship zakat and purification calculators and lead the halal-investing category [S25][S26]. No mainstream net-worth tracker in this set has one; Patina already supports Arabic RTL and Eastern numerals. | creative | M | NEEDS-USER-DECISION: methodology (which scholarly ruling for stocks), gold price source |
| 36 | Shariah screening of holdings | Show halal/questionable/not-compliant per holding and a portfolio compliance %, with purification amount on dividends. | Zoya syncs a brokerage and shows portfolio halal status with change alerts [S25][S26]. | creative | L | NEEDS-USER-DECISION: licensed screening data (Zoya/Musaffa API or similar), legal disclaimer |
| 37 | Scenario "fast forward" | What-if: sell the house in 2028, add a child, raise contributions; shows net worth path with and without. | Kubera Fast Forward [S2]; Monarch Plus forecasting with life events [S8]. | creative | M | - |
| 38 | Legacy letter / beneficiary export | Inactivity-triggered or manual export of a structured "what I own and where" document for heirs. | Kubera's Dead Man's Switch emails beneficiaries an Excel + documents archive after inactivity [S1]. A local-only version (manual PDF to a sealed share) avoids a server. | creative | M (local) / L (automatic) | NEEDS-USER-DECISION for the automatic version: server, email delivery, legal wording |
| 39 | Statement PDF ("proof of wealth") | One-tap dated statement of assets/liabilities in Patina's editorial typography (`expo-print`). | Kubera Proof of Wealth statements [S2]. Useful for visa, mortgage and rental applications in Gulf markets. | creative | S | - |
| 40 | Ask your portfolio (AI) | Natural-language questions answered from local data ("how much did dividends pay this year?"). | Getquin's in-app AI agents are its headline 2026 feature [S5]; Kubera exposes data to Claude/ChatGPT via MCP [S2]. Conflicts with the "no AI look" brand unless voiced in Notes' plain style. | creative | M | NEEDS-USER-DECISION: LLM provider, privacy policy, cost |
| 41 | Holding thesis and review date | A short "why I own this" note per holding with a review date; Notes surfaces it when due. Extends the planned chart markers. | Patina-original; not verified in competitors. Fits the "notes, not feed" voice. | creative | S | - |
| 42 | Watchlist | Track tickers you do not own, with the same calm price display. | Stocks+ and Delta both have watchlists [S19][S9]. Low fit with "wealth is a slow number"; keep small. | creative | S | Depends on #8 |
| 43 | Shared read-only view | Give a spouse or advisor a read-only view. | Kubera granular access control [S2]. | creative | L | NEEDS-USER-DECISION: backend, auth, permissions model |

## Already covered (found in competitors, already shipped or planned in the vault)

- Allocation ring drill-down and target/actual swap: [[Allocation Ring Drill-Down]]
- Chart scrubbing and annotated markers: [[Holding Chart Scrubbing and Markers]]
- Goal projection fan visual: [[Goal Detail with Projection Fan]] (the Monte Carlo engine behind it is #33)
- Hide figures on launch / app-switcher blur: [[Privacy Blur on Launch]]
- Light mode: [[Light Mode]]; Dynamic type: [[Dynamic Type Caps]]
- Animated number changes and launch reveal: [[Digit Drift Animation]], [[Net Worth Reveal Animation]]
- Conversational add flow steps 1, 2, 4: [[Conversational Add Holding Steps]] (#9 makes step 2 real)
- Native Notes, remaining Native screens, Arabic holding/add: existing enhancement notes
- Shipped: activity filter chips, activity CSV export, add-holding live preview, allocation class selection, account search in link sheet, period selectors, Arabic RTL home, style switching, settings toggles (UI only)

## Suggested build order inside phases

1. #1 -> #2 -> #3 -> #4 -> #5 -> #6 (strict order; each needs the previous).
2. Decide #8 and #10 providers early; #9, #19, #20, #42 wait on them. Everything else in Phase 1 works with manual data.
3. #11, #12, #7, #13, #14, #16 can ship before any provider decision, giving a fully usable manual tracker.
4. Phase 2 and 3 items are independent of each other; #27 and #35 are the highest-leverage differentiators for the effort.

## Likely libraries (Expo SDK 57)

`expo-sqlite`, `drizzle-orm` (optional), `zustand` or `@reduxjs/toolkit`, `expo-secure-store`, `expo-local-authentication`, `expo-notifications`, `expo-background-task`, `expo-document-picker`, `expo-file-system`, `expo-sharing`, `expo-print`, `expo-widgets`, `expo-haptics`, `@shopify/react-native-skia` (design doc's chart choice), `papaparse` for CSV.

## Sources

- [S1] Kubera review, Dead Man's Switch, pricing: https://www.findmymoat.com/tools/kubera
- [S2] Kubera portfolio tracker feature page: https://www.kubera.com/portfolio-tracker
- [S3] Sharesight review: https://www.findmymoat.com/tools/sharesight
- [S4] Sharesight review (annualised return, tax reports): https://thecollegeinvestor.com/69479/sharesight-review/
- [S5] getquin review 2026 (AI agents, document import, Open Banking): https://www.matchmybroker.com/tools/getquin-review and https://www.fighttofire.com/getquin-review-the-best-free-portfolio-management-tool-for-you/
- [S6] Copilot Money review 2026 (investments, benchmark, top movers, demo mode): https://thecollegeinvestor.com/41976/copilot-review/
- [S7] Empower review (retirement planner, Fee Analyzer, Investment Checkup): https://robberger.com/empower-review/
- [S8] Monarch review 2026 and Monarch Plus forecasting: https://www.thepennyhoarder.com/budgeting/monarch-money-review/ and https://help.monarch.com/hc/en-us/articles/48344305092244-Forecasting-in-Monarch
- [S9] Delta by eToro review (alerts, widgets, biometric lock, why is it moving): https://www.matchmybroker.com/tools/delta-investment-tracker-review
- [S10] Ghostfolio (X-ray, FIRE, Zen mode, export): https://github.com/ghostfolio/ghostfolio and https://blog.elest.io/ghostfolio-free-open-source-privacy-first-portfolio-wealth-tracker/
- [S11] Wealthfolio review (TWR/MWR, Monte Carlo, contribution limits): https://www.findmymoat.com/tools/wealthfolio
- [S12] Wealthfolio repo (local-first, CSV free, Connect sync): https://github.com/wealthfolio/wealthfolio
- [S13] Copilot Month and Year in Review: https://help.copilot.money/en/articles/10310024-month-and-year-in-review
- [S14] Worthy (offline manual tracker): https://play.google.com/store/apps/details?id=io.abcdar.worthy&hl=en_US
- [S15] Best net worth tracker without linking bank accounts: https://trackmystack.app/blog/net-worth-tracking/best-net-worth-tracker-without-linking-bank-accounts/
- [S16] Snowball Analytics: https://snowball-analytics.com/
- [S17] Snowball Analytics review: https://thecollegeinvestor.com/44042/snowball-analytics-review/
- [S19] Stocks+ App Store listing: https://apps.apple.com/us/app/stocks-app/id1265086241
- [S20] Yahoo Finance portfolio (transactions, FIFO lots): https://www.hedgethink.com/yahoo-finance-portfolio-2-0-beta/ and https://help.yahoo.com/kb/overview-portfolio-yahoo-finance-sln36784.html
- [S21] Kubera Recap help article: https://help.kubera.com/article/114-what-is-recap-in-kubera
- [S22] Expo blog, widgets stable in SDK 56: https://expo.dev/blog/ios-widgets-and-live-activities-in-expo
- [S23] Expo Widgets docs: https://docs.expo.dev/versions/latest/sdk/widgets/
- [S24] Free stock API limits 2026: https://apicostcalc.com/finnhub.html and https://avogrowth.com/resources/blog/free-stock-market-data-api
- [S25] Zoya app and zakat calculator: https://zoya.finance/ and https://app.zoya.finance/zakat
- [S26] Halal screener apps compared (Zoya, Musaffa): https://akinda.io/article-detail/slug/top-5-halal-stock-screener-apps-in-2026
- Also: Delta App Store listing https://apps.apple.com/us/app/delta-by-etoro/id1288676542 ; Musaffa App Store listing https://apps.apple.com/us/app/musaffa-halal-investing-app/id1614624968
