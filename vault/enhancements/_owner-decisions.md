# Owner decisions

Date: 2026-10-22. Companion to [[_feature-scout-report]], which numbers the features referenced here as #N.

Not a vault note. Nothing here has `Status:`. These are the nine things only the owner can decide. Everything buildable without them is being built.

Prices and coverage were verified against primary sources on 2026-10-22. Anything that could not be confirmed on the vendor's own page is marked `unverified` rather than guessed — treat those as "check before you commit money", not as fact.

## The table

| # | Decision | What you must provide | Recommendation | Breaks local-first? |
|---|---|---|---|---|
| 1 | Market data licence | ~$20-400/mo, or accept non-commercial | **Twelve Data Grow, $29/mo, at launch.** Not before. | No |
| 2 | ISX coverage | A scraping call, or a scope cut | **Cut Iraqi equities from v1.** Manual holdings cover it. | No |
| 3 | #35 Zakat methodology | Confirm the default below | **Ship AAOIFI dual-intent, default to full market value.** | No |
| 4 | #32 Account aggregation | Aggregator contract + backend + compliance | **Don't build. No vendor covers Iraq.** | Yes |
| 5 | #36 Shariah screening | $399-1,399/mo commercial licence | **Defer. Revisit if zakat lands well.** | No |
| 6 | #40 Ask your portfolio | LLM key, ~$0.10/$0.50 per 1M tokens | **Build it, on-device prompt, Haiku-tier.** | Partially |
| 7 | #27/#28 Widgets | Reverse the no-native-deps rule | **Reverse it for this one. Highest leverage per day of work.** | No |
| 8 | #31 Multi-device sync | Backend + auth + hosting cost | **Ship the local encrypted backup only.** | Yes |
| 9 | #43 / #38 Sharing and legacy delivery | Backend + legal wording | **Local export only. Skip the server.** | Yes |

Read the table in thirty seconds. Read the rest when you want the reasoning.

---

## 1. Market data licence — the only item with a shipping deadline

Tonight's sanctioned source is Yahoo's undocumented `query1.finance.yahoo.com` endpoint. It works, it needs no key, and it returns real prices. Its terms forbid commercial use, it has no SLA, and it rate-limits by IP. That is fine for building and wrong for shipping.

Every free tier in the market has the same restriction, so "find a free one that allows commercial use" is not an available answer:

| Provider | Free tier | Cheapest paid | Commercial use on free tier |
|---|---|---|---|
| Finnhub | ~60 req/min | ~$50/mo | No — personal use only |
| Twelve Data | 800 req/day | $29/mo (Grow) | No — "personal, internal, non-commercial" |
| Alpha Vantage | 25 req/day | $49.99/mo | No — personal licence unless agreed in writing |
| Polygon (now Massive) | 5 req/min, EOD only | $29/mo | No — "individual use only, non-pros only" |
| EODHD | 20 req/day | $19.99/mo | No — personal plans exclude commercial; B2B tier is quote-only, reported ~$399/mo (`unverified`) |

**Recommendation: Twelve Data Grow at $29/mo, and only when you decide to put Patina in a store.** It removes the daily cap, covers 20+ markets, and is the cheapest tier that is honest about a consumer app. Do not pay for it now — the Yahoo endpoint costs nothing and the swap is one line.

What is already built and waiting: `src/data/providers/price-provider.ts` holds the `PriceProvider` interface, with `fx-provider.ts` and `instrument-search-provider.ts` beside it. Changing provider means writing one new implementation and changing one binding in `src/data/providers/index.ts`. Nothing downstream — the benchmark overlay, the dividend forecast, the watchlist — knows or cares where quotes come from.

## 2. Iraq Stock Exchange coverage — a product scope question, not a vendor question

**No commercial market-data vendor covers the ISX.** Not Twelve Data (confirmed absent from its 85-exchange list), not Finnhub, Alpha Vantage, Polygon or EODHD. This is the one finding that should change how you think about the product.

What exists instead: the exchange's own site at isx-iq.net with no public API, a regional terminal at decypha.com that publishes ISX pages, and a couple of community scraper projects on GitHub (`ReusX/isx-market`, `iraq-stock-ai/isx-data-store`).

Gulf exchanges are better but not free. Twelve Data carries Tadawul, DFM, ADX, Boursa Kuwait and Qatar — but gates them behind its Pro/Ultra tiers, not the $29 Grow tier. EODHD reportedly carries Tadawul and ADX, but that is from aggregator sites, not EODHD's own exchange list, which would not render on direct fetch: `unverified`.

Three honest options:

- **Cut Iraqi and Gulf equities from v1.** Patina already handles manual holdings with dated valuation marks — the mechanism built for real estate and gold works unchanged for an ISX position. The user types the price. For a market this illiquid, a monthly manual mark is close to the real information rate anyway.
- **Scrape the ISX yourself** behind the existing provider interface. A day or two of work, fragile, and it makes you the data source.
- **Pay for Gulf coverage** at a Twelve Data Pro tier if Saudi and UAE equities matter more than Iraqi ones. Price not confirmed on the public page.

**Recommendation: cut it from v1.** Say plainly in the UI that Iraqi equities are entered manually. An Arabic-first tracker that handles IQD cash, gold, property and manually-marked local shares correctly is more useful to an Iraqi user than one that half-supports automatic quotes.

## 3. #35 Zakat methodology — I am shipping this tonight and need you to confirm the default

This is the biggest differentiator in the scout report. None of Kubera, Sharesight, Delta, Getquin, Snowball, Empower, Copilot, Monarch, Wealthfolio or Ghostfolio has a zakat calculator. Patina already does Arabic RTL and Eastern numerals, so it is unusually well placed to.

Three sub-decisions. I am implementing a default for each and a settings picker, so changing your mind later costs nothing.

**(a) The basis for stocks.** What the recognised bodies and the two leading halal apps actually do:

- **AAOIFI Shari'ah Standard No. 35 (Zakah)** splits by intent. Shares held **for trading** are treated as trade goods: 2.5% of full current market value. Shares held **for investment** (dividends, long term): 2.5% of the holder's proportional share of the company's zakatable assets — cash, receivables and inventory, net of certain liabilities — not of market value. The full text is paywalled; the summary above is from course and library catalogues describing the standard. Wording inside: `unverified`.
- **Zoya** implements exactly that split. Active holdings at full market value; passive holdings at ownership share of current assets. Where balance-sheet data is unavailable it uses **30% of market value** as an approximation, which it states scholars have approved, citing Joe Bradford's *Simple Zakat Guide*.
- **Musaffa** offers both and labels full market value as "recommended", describing the zakatable-assets method as more precise but hard to source data for.

**My default: implement the AAOIFI dual-intent split, with full market value as the shipped default and the zakatable-assets proportion available per holding.** Reasons: full market value needs no data you do not already have, it is what Musaffa recommends, and it yields a higher figure — erring toward paying more zakat rather than less is the safer error for the user. The 30% approximation is available as a third option for passive holdings, attributed to its source in the UI.

I am taking no religious position here. The app will name the methodology on screen and in the output so the user can take it to someone qualified.

**(b) Hawl anniversary: lunar or Gregorian.** The hawl is a lunar year, so the anniversary drifts about 11 days earlier each Gregorian year. **Default: lunar (Hijri), with a Gregorian option.** Lunar is correct; the option exists because some people track against a fixed Gregorian date for convenience.

**(c) Nisab price source.** Nisab is 85g gold or 595g silver. The silver threshold is far lower, so choosing it means more people owe zakat — a scholarly difference, your call. **Default: gold, with a silver option.** Feed: **goldprice.dev**, which has a free tier of 5,000 calls/month and, unusually, a gram-denominated endpoint across 35 currencies, so no ounce-to-gram conversion to get wrong. Keyless access works at a 15-minute delay, which is irrelevant for an annual calculation.

## 4. #32 Real account aggregation — the answer is no, and the reason is structural

This is the largest gap against Kubera, Getquin and Monarch, and the link sheet already lists institutions while connecting nothing. I expected to recommend a provider. The research says otherwise.

**No aggregator covers Iraqi banks or brokerages.** Verified absent from every vendor checked:

| Provider | Covers | Iraq | Self-serve for a solo dev |
|---|---|---|---|
| Plaid | US, Canada, UK, most of EU | No | No — sales-gated |
| SnapTrade | 40+ US/Canada brokerages | No | Yes (Build free, Launch $100/mo + $1-2/user) |
| Lean Technologies | UAE, Saudi | No | `unverified`, positioned institutional |
| Tarabut Gateway | Bahrain, Saudi, UAE | No | `unverified`, B2B for licensed entities |
| Fintech Galaxy | UAE, Bahrain, Egypt, Saudi, Lebanon, Jordan | No | `unverified` |
| Dapi | Pakistan, Saudi, UAE, Egypt | No | Sandbox yes, production `unverified` |

Plaid's figures: no public pricing, reported per-successful-call ~$0.10-0.60 or per-connection, with a median contract around $9,000/year from third-party aggregators — `unverified` against Plaid's own page.

Beyond coverage, this is the one item that breaks Patina's architecture. Aggregation means a backend holding tokens, an account system, re-auth flows, and compliance exposure. The app currently has no server and no login, and that is a feature — the scout report's own evidence [S14][S15] is that privacy-minded users pick manual trackers specifically to avoid credential sharing and broken re-auth.

**Recommendation: don't build it.** If you later want it for Gulf users specifically, SnapTrade is the only self-serve option and it covers US brokerages, not Gulf banks — so it would serve an expat holding a US brokerage account, not someone banking in Baghdad. CSV import (#15, shipping tonight) covers the same ground with no backend, which is how Wealthfolio positions it [S12].

## 5. #36 Shariah screening — real, licensable, and priced for a business

| Vendor | Commercial licence | Coverage |
|---|---|---|
| Zoya | $399/mo Basic, $1,399/mo Advanced (annual: $332 / $1,165) | 60,000+ stocks and funds |
| Musaffa | Starter $550 / Pro $900 / Premium $1,400 per month — from a secondary source; Musaffa's own page lists features but no prices, `unverified` | 120,000+ instruments, 70+ exchanges |
| IdealRatings | Enterprise quote only, no public pricing | 40,000+ companies; powers LSEG Islamic indices |

Zoya has documented developer docs and the cheapest commercial entry. All three require a legal disclaimer — you would be redistributing someone else's religious ruling.

**Recommendation: defer.** $399/mo is a real business expense before the app has users. Ship the zakat calculator first, see whether that audience materialises, and revisit with evidence. The two features appeal to the same user but zakat costs you a gold price feed, and screening costs you five thousand dollars a year.

## 6. #40 Ask your portfolio — cheaper than expected, with one honest conflict

Natural-language questions over local data ("how much did dividends pay this year?"). Getquin's headline 2026 feature; Kubera exposes data to Claude and ChatGPT over MCP.

Pricing at the cheap tier is low enough not to be the deciding factor — roughly $0.10 per million input tokens and $0.50 per million output at the cheapest tier across Anthropic, OpenAI and Google, and roughly $2/$10 at mid tier. Specific model names move faster than this document, so confirm at decision time; the tier shape is what matters for budgeting. A typical question sends a few thousand tokens of portfolio summary, so realistic cost is a fraction of a cent per question.

Training terms matter more than price here, because this is someone's complete financial position:

- **Anthropic** — contractually does not train on API customer content. Strongest default.
- **OpenAI** — API and Enterprise/Team data not used for training by default.
- **Google Gemini** — paid tier no; **free tier yes**, content may be used to improve Google's products, except for EEA/Switzerland/UK users. Do not ship this feature on a Gemini free key.

The conflict: `foundation/design.md` forbids the AI-generated look, and the scout report flags the same tension. This is resolvable but only deliberately — the answer must arrive in the existing Notes voice, as a plain sentence in the app's own typography, with no chat bubbles, no sparkle icon, no streaming-token animation, no assistant persona.

It also partially breaks local-first: the query and a portfolio summary leave the device. That needs to be a clearly-worded opt-in, default off, and the prompt should carry aggregates rather than raw holdings wherever the question allows.

**Recommendation: build it, cheapest tier, Anthropic for the training terms, opt-in and off by default, answers rendered as Notes prose.** Say in the UI exactly what leaves the device.

## 7. #27 / #28 Widgets — your no-native-deps rule is the only thing blocking this

Delta and Stocks+ both lead with widgets; the design doc's platform notes call for one. A net worth hero in Newsreader on the home screen, respecting the privacy blur, is close to the whole point of a calm wealth tracker — the figure you glance at without opening anything.

Current state of `expo-widgets` on SDK 57, from the changelog and docs rather than blog summaries:

- Stable since 55.0.0 (Feb 2026); the 57.0.x line is marked stable.
- **Not available in Expo Go.** Requires a development build and `npx expo prebuild`.
- **Both platforms**, but Android is newer and opt-in behind an `enableAndroid` config flag. iOS has the fuller feature set: timelines, configurable widgets, and Live Activities are iOS-only.
- **Correction to the scout report:** it says Android uses Glance. It does not — Android widgets are built with Jetpack Compose. The report is wrong on that point and #28's effort estimate should be read with that in mind.
- The pinned v57.0.0 docs page says iOS only, while the latest docs and changelog show Android arriving in later 57.0.x patches. Check your exact installed patch version before relying on Android.

Cost of reversing the rule: a prebuild, a dev build, and the `ios/` and `android/` directories appearing in the repo. The real cost is verification — I cannot confirm native code compiles without building it, so I would flag any widget PR as compiles-unverified.

**Recommendation: reverse the rule for this one feature, iOS first.** It is the highest user-visible value per day of work left in the report, and the scout report rates #27 and #28 the two highest-leverage differentiators alongside zakat. Everything else in the queue genuinely does not need native code, so this is a one-time exception rather than opening a door.

## 8. #31 Multi-device encrypted sync

The local half ships tonight: an encrypted SQLite backup exported through `expo-file-system` and `expo-sharing`, which the user can drop in iCloud, Drive or anywhere else. No server, no account, works offline.

The sync half is a different product. It needs a backend, an account system, key management for end-to-end encryption, conflict resolution between devices, and ongoing hosting. Wealthfolio sells exactly this as its paid Connect tier [S12], which tells you it is worth money and also that it is a tier, not a weekend.

**Recommendation: ship the local backup, stop there.** Manual file backup covers the real fear, which is losing the phone. Revisit sync only if users ask for two devices, and price it as a subscription when you do, because it costs you money every month.

## 9. #43 Shared read-only view, and #38 automatic legacy delivery

Both need the same thing Patina does not have: a server.

**#43** gives a spouse or advisor read-only access — Kubera's granular access control. Needs backend, auth, and a permissions model.

**#38** is Kubera's Dead Man's Switch: after a period of inactivity, email beneficiaries a structured archive of what you own and where. Needs a server to notice the inactivity, email delivery, and legal wording you should not write yourself. The **local half ships tonight** — a manual structured export you can seal and hand to someone, or leave with a will.

**Recommendation: local export only for both, no server.** For #43, the statement PDF (#39, shipping tonight) already covers most of the real need — a dated, readable summary you can hand to an advisor without giving them live access. For #38, a document in a sealed envelope is more robust than a service that has to still exist and still have your credit card on file when it matters.

---

## Related
- [[_feature-scout-report]]
- [[Offline Price Provider]], [[Real Market Price Provider]], [[Network FX Rates]]
- [[Seeded FX Rates]], [[Local SQLite Persistence]], [[Persisted Settings]]
- [[Editorial Account Linking]], [[Editorial Settings]], [[Native Settings]]
