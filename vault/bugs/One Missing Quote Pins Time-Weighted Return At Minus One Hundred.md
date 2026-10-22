# One Missing Quote Pins Time-Weighted Return At Minus One Hundred

Status: not-fixed
Found: `src/lib/snapshots.ts:60` composed with `src/lib/returns.ts:26`
Summary: a single day with a missing price quote values the holding at zero, which drives time-weighted return to exactly −1 and keeps it there for every later period.

## Details

Two individually defensible lines combine into a bad one.

`snapshots.ts:60` falls back to zero when no quote is found:

```ts
return roundCents(holding.quantity * (quote?.price ?? 0));
```

That zero flows into `computeSnapshot`, into `totalNetWorth`, and then into `timeWeightedReturn`, where each period multiplies into a running product:

```ts
const periodReturn = (end.value - periodFlow - start.value) / start.value;
linked *= 1 + periodReturn;
```

A period that *ends* at zero makes `periodReturn` exactly −1, so `linked` becomes 0 and every subsequent multiplication leaves it at 0. The function returns `linked - 1`, so the answer is −1 forever.

The guard on line 25 (`if (start.value === 0) continue;`) only skips a period that *starts* at zero. Nothing protects the period that ends at zero.

Verified, with full recovery afterwards:

```
timeWeightedReturn(
  [ {2026-01-01, 100000}, {2026-06-01, 0}, {2026-10-01, 120000} ], []
)  →  -1
```

The portfolio went from 100,000 to 120,000, a real gain of 20%, and the Performance screen reports −100%.

## Reachability

**Reachable today through a shipped action.** Two triggers, one live and one planned.

**Live: importing a backup.** `parseJson` (`src/lib/backup.ts:69`) validates only that `version` is a number and `holdings` is an array. Everything else defaults away silently:

```ts
priceQuotes: parsed.priceQuotes ?? [],
```

`importBackup` (`src/store/data-store.ts:578`) then calls `deleteAllRows` and inserts whatever the file held. A truncated, hand-edited, or partially-written backup whose `holdings` and `snapshots` survive but whose `priceQuotes` are missing produces exactly the series this note describes: a non-zero history with today's mark at zero, and TWR pinned at −1 for every later day. `parseCsvBackup` is laxer still — its `table()` helper returns `[]` for any missing `#TABLE:` block with no validation at all.

"Import data" is a labelled action on both settings screens (`src/app/editorial/settings.tsx:141`, `src/app/native/settings.tsx:224`, via `use-data-management.ts:33`). [[Extract The Backup Codec For Testing]] already treats a hand-edited backup as a real scenario; this is the same input class.

**Planned: a network price provider.** The provider chain cannot trip it today. `createSimulatedPriceProvider` (`src/data/providers/price-provider.ts:23`, wired at `providers/index.ts:28`) returns a quote for *any* `instrumentId`, its output goes into the in-memory `livePrices` map at `data-store.ts:331` and never reaches the `priceQuotes` table `holdingValue` reads, and `seed.ts` covers all 21 catalogue instruments — the 14 held plus the 7 in `extraPrices` at `seed.ts:149`. Once quotes come from a network, a delisted, renamed, rate-limited or uncovered symbol produces nothing and the fallback fires. See [[Real Market Price Provider]].

Two earlier versions of this note got this section wrong in opposite directions: the first claimed a network provider already shipped, the second concluded "not currently reachable" after checking only the provider chain and treating `data-store.ts:593` as merely a writer rather than the one path that can leave `priceQuotes` under-populated relative to `holdings`. Validating the import at the system boundary — which `foundation/code.md` requires anyway — removes the live trigger independently of the snapshot fix below.

## Fixes

`snapshots.ts` should distinguish "no quote" from "worth nothing" rather than collapsing both to zero. A missing quote should carry the last known price with its `asOf` date, which is what the staleness caption was designed for. This is the fix that matters.

The obvious companion fix is wrong, and worth recording so nobody tries it. Skipping a period whose *end* value is zero leaves the zero mark as the next period's *start*, which the line-25 guard then also skips, so the chain never resumes and TWR reports 0 rather than the real +20%. Dropping zero-valued marks from the series entirely does give +0.2. But neither should be applied unconditionally: if the portfolio genuinely went to zero, −1 is the correct answer, and suppressing it would hide a real wipeout. Any guard here has to distinguish a missing valuation from a true one. A local inference gets most of the way without touching `snapshots.ts`: a zero mark followed by a non-zero mark with no intervening inflow cannot be a genuine wipeout, since a wiped-out portfolio cannot recover without one. That rule gives +0.2 on the spurious case, −1 on a plain wipeout, and −1 on a wipeout followed by re-funding. So the first fix makes the second far more robust rather than being strictly required for it.

Found by composing two modules that the suite only tests in isolation: `snapshots.test.ts:109` and `positions.test.ts:505` each document the zero fallback, and `returns.test.ts:115` asserts the −1 while framing it as "without producing NaN". No test puts them together.

## Related
- Bug: [[Money-Weighted Return Is Absurd Or Absent On Short Windows]], [[Time-Weighted Return Overstates Gains When A Flow Has No Valuation Mark]]
- Feature: [[Returns Engine]], [[Daily Net Worth Snapshots]], [[Offline Price Provider]]
- Enhancement: [[Real Market Price Provider]]
- Page: [[Editorial Performance]]
