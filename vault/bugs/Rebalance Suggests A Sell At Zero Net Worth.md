# Rebalance Suggests A Sell At Zero Net Worth

Status: fixed
Found: `src/lib/rebalance.ts:45`
Summary: With a net worth of zero every class drifts from its target by the full target, so each hint comes back as `sell` with a delta of 0 — a trade the user is told to make and cannot.

## Details

The action is chosen from the drift, and the direction from the delta:

```
src/lib/rebalance.ts:45     const action: RebalanceAction =
src/lib/rebalance.ts:46       Math.abs(driftPoints) < tolerance ? 'hold' : deltaValue > 0 ? 'buy' : 'sell';
```

At zero net worth, a slice with weight 0 against a target of 40 has `driftPoints` of −40, which clears the default tolerance of 1 (`src/lib/rebalance.ts:39`), so `hold` is skipped. `targetValue` is `(40 / 100) * 0` = 0 and `deltaValue` is `0 - 0` = 0. `deltaValue > 0` is false, so the ternary falls through to `sell`. Every class with a non-zero target becomes a zero-value sell. Frozen at `src/lib/__tests__/rebalance.test.ts:141`, which checks that the figures stay finite and records the `sell` action as current behaviour.

The screen does not filter these out. `src/app/editorial/allocation.tsx:160` keeps every hint whose action is not `hold`, and `:89` renders it as `Sell $0` — the amount passed through `Math.abs(hint.deltaValue)`. So the "To reach target" block would list five rows each telling the user to sell nothing.

This is not the first-run experience, and that part of the original report is wrong. Three things prevent an empty portfolio from reaching the screen:

- `seedIfEmpty` at `src/data/seed.ts:316`–`:317` returns early only when holdings already exist, so a fresh install is always populated with the demo portfolio before anything renders.
- The whole app tree is gated on hydration: `src/app/_layout.tsx:28` returns `null` until the store is ready, so no screen mounts against the empty initial state (`snapshots: []` at `src/store/data-store.ts:108`) that `selectAllocation` would turn into zero-weight slices (`src/store/selectors.ts:105`).
- Nothing deletes holdings from the UI. `deleteHolding` exists in the store at `src/store/data-store.ts:359` and has no caller anywhere in `src/app` or `src/components`.

The onboarding "Skip and add holdings by hand" route (`src/app/editorial/onboarding.tsx:58`) does not produce an empty portfolio either — it replaces to `/editorial`, where the seeded data is already loaded.

So this is latent, with a named trigger: a user holding nothing while targets remain non-zero. It becomes live the moment either a delete-holding path or a genuinely empty start ships — both plausible, since the store already has the delete action waiting for a caller. `hold` is the correct action for a zero delta regardless of drift, which is also the smallest fix.

## Fix

Fixed on `fix/rebalance-targets` with the smallest fix this note identified: a zero delta is a `hold` whatever the drift says. `deltaValue === 0` now short-circuits ahead of the `buy`/`sell` ternary, so an empty portfolio with non-zero targets reports five holds instead of five sells of nothing, and the allocation screen's `action !== 'hold'` filter leaves the block empty rather than listing `Sell $0` five times. The trigger the note named — a delete-holding path, or a genuinely empty start — can now ship without taking this with it.

## Related
- Feature: [[Allocation Class Selection]], [[Demo Seed Data]], [[App State Store]], [[Local SQLite Persistence]]
- Bug: [[Rebalance Does Not Normalise Targets Over 100]]
- Page: [[Editorial Allocation]]
