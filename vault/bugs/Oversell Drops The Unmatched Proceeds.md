# Oversell Drops The Unmatched Proceeds

Status: not-fixed
Found: `src/lib/positions.ts:82`
Summary: A sell for more units than the lots can cover realises only the matched part, and the unmatched units' proceeds are never counted anywhere.

## Details

`realisedNative` builds a FIFO queue from the holding's lots, then walks each sell against it:

```
src/lib/positions.ts:74   .map((lot) => ({ remaining: lot.quantity, cost: lot.costPerUnit }));
src/lib/positions.ts:82   for (const lot of queue) {
src/lib/positions.ts:86     realised += consumed * (proceedsPerUnit - lot.cost);
```

Line 86 is the only place realised gain accumulates, and it only runs for units a lot actually covers. When the queue is exhausted the inner loop ends with `quantity` still positive, and nothing reads `quantity` again. The leftover proceeds are dropped without an error, a warning or a residual figure.

Two lots — 10 units at 100 and 5 units at 200 — against a single sell of 20 units at 300 realises `10 × 200 + 5 × 100 = 2500`. The remaining 5 units sold at 300 contribute nothing. Treated as zero-cost units the figure would be 4000; rejected as invalid the call would error. It does neither.

The second half is worse. The queue is rebuilt on every `computePositions` call from `lot.quantity` (line 74), not from `lot.remainingQuantity`, so the whole sell history replays from scratch each time. The first oversell drains all 15 units of the queue, so a *later* genuine sell of 5 units finds nothing to match and realises zero. `src/lib/__tests__/positions.test.ts:367` asserts both: 2500 for the oversell, and still 2500 after a second sell of 5 units at 400.

The figure reaches the user as the "Realised" row on both holding detail screens — `src/app/editorial/holding.tsx:238` and `src/app/native/holding.tsx:178`, each gated on `realisedGain !== 0`. A wrong realised-gain number is the most financially consequential of the thirteen frozen defects: the money is not misplaced, it is absent from the total, and nothing on screen indicates anything was skipped.

Not reachable from the UI. Neither add sheet can create a sell — `src/app/editorial/add.tsx:98` and `src/app/native/add.tsx:113` are the only `addTransaction` callers in the app and both pass `type: 'buy'`. No screen offers a sell or a dispose action. The one sell in the system is seeded: `src/data/seed.ts:168` sells 1.2 ETH against a 9.8-unit lot, which is not an oversell, so the demo data computes correctly.

So this is latent, with a named trigger: any sell transaction whose quantity exceeds the sum of `lot.quantity` for its holding, arriving through the seed, a future import, or the sell UI whenever one ships. The write path does not block it either — the sell branch at `src/store/data-store.ts:263` drains the available lots and discards the surplus quantity just as silently.

Not fixed in the harness PR, which carries no behaviour changes. The test asserts the current behaviour and names this note. Per `foundation/github.md` the fix changes behaviour and cannot ride on a `chore/` branch; it needs its own `fix/` PR, and that PR has to decide the policy — reject the oversell, or realise the surplus at zero cost — before the test can be inverted.

## Related
- Feature: [[Returns Engine]], [[Domain Data Model]], [[Local SQLite Persistence]], [[Demo Seed Data]], [[Transactions and Lots]]
- Page: [[Editorial Holding Detail]], [[Native Holding Detail]]
