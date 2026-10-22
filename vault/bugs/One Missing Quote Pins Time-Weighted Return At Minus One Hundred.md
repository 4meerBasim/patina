# One Missing Quote Pins Time-Weighted Return At Minus One Hundred

Status: not-fixed
Found: `src/lib/snapshots.ts:60` composed with `src/lib/returns.ts:27`
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

The guard on line 26 (`if (start.value === 0) continue;`) only skips a period that *starts* at zero. Nothing protects the period that ends at zero.

Verified, with full recovery afterwards:

```
timeWeightedReturn(
  [ {2026-01-01, 100000}, {2026-06-01, 0}, {2026-10-01, 120000} ], []
)  →  -1
```

The portfolio went from 100,000 to 120,000, a real gain of 20%, and the Performance screen reports −100%.

The trigger is not exotic. The app ships with a network price provider; a symbol that is delisted, renamed, rate-limited, or simply absent from the provider's coverage produces no quote. Gulf and Iraqi equities are the likely case, since [[_owner-decisions]] records that no vendor covers the Iraq Stock Exchange at all.

Two separate fixes, and both are probably wanted. `snapshots.ts` should distinguish "no quote" from "worth nothing" rather than collapsing both to zero — a missing quote should carry the last known price with its `asOf` date, which is what the staleness caption was designed for. And `timeWeightedReturn` should skip a period whose end value is zero rather than letting it annihilate the chain.

Found by composing two modules that the suite only tests in isolation: `snapshots.test.ts:109` and `positions.test.ts:505` each document the zero fallback, and `returns.test.ts:115` asserts the −1 while framing it as "without producing NaN". No test puts them together.

## Related
- Feature: [[Returns Engine]], [[Daily Net Worth Snapshots]], [[Offline Price Provider]]
- Enhancement: [[Real Market Price Provider]]
- Bug: [[Money-Weighted Return Is Null For Ordinary Short-Window Gains]]
- Page: [[Editorial Performance]]
