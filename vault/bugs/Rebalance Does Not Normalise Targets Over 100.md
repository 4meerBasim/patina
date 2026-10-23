# Rebalance Does Not Normalise Targets Over 100

Status: fixed
Found: `src/lib/rebalance.ts:43`
Summary: `computeRebalance` multiplies each target percentage by net worth without checking that the targets sum to 100, so a set summing higher asks the user to buy more than they own.

## Details

Each slice's target value is computed in isolation:

```
src/lib/rebalance.ts:43     const targetValue = roundCents((targetPercent / 100) * input.netWorth);
src/lib/rebalance.ts:44     const deltaValue = roundCents(targetValue - slice.value);
```

Nothing sums the targets, normalises them, or rejects the input. With targets of stocks 50, crypto 10, property 40, cash 10 and savings 10 — 120 in total — against a net worth of 100,000, the target values sum to 120,000 and the deltas sum to +20,000. Three classes are marked `buy` and the screen asks for 20,000 of purchases that no sale funds. Frozen at `src/lib/__tests__/rebalance.test.ts:122`.

The under-100 case is handled and tested as intended behaviour at `rebalance.test.ts:102`: targets summing to 80 leave 20,000 unallocated and produce sells. So the function tolerates a deliberate cash buffer, which is a reasonable reading of a sub-100 total — but it extends the same arithmetic to a total above 100, where there is no reasonable reading.

Reachable from the UI, and the editor actively permits it. `src/app/editorial/allocation.tsx:169` clamps each stepper to 0–100 individually:

```
setDraft((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, prev[key] + delta)) }));
```

so five classes can each be raised toward 100. `save` at `:172` writes the draft with no validation. The editor even computes the total — `draftTotal` at `:176`, rendered as "Targets · N% assigned" at `:256` — so the user is shown that they have assigned 120%, and the save proceeds anyway. The resulting hints render as "Buy $X" rows at `:89`, filtered only on `action !== 'hold'` at `:160`.

The default targets ship summing to 100 (`src/lib/rebalance.ts:4`–`:10`: 40 + 5 + 35 + 10 + 10), so nothing is wrong until the user edits them. Nothing is written incorrectly either — the targets themselves persist as entered, which is what the user asked for; it is the derived advice that is unfundable. Severity is a wrong recommendation on one screen, not corrupted data.

The fix has a product decision inside it: normalise the targets pro rata, cap the deltas at available net worth, or block the save above 100 and tell the user. The last is the only one that does not silently alter what the user typed.

## Fix

Fixed on `fix/rebalance-targets`. The product decision: **block the save, and withhold the advice** — the two options that do not rewrite what the user typed.

The editor now refuses a draft over 100. `save` returns early above it, the button is disabled with `accessibilityState` set to match, and the existing total caption reads `Targets · 120% assigned · over 100%` so the reason is on screen where the stepper is.

`computeRebalance` holds every class when the stored targets sum above 100, since no set of trades reaches a portfolio larger than the one that exists. The hints still report `targetPercent` and `targetValue` exactly as entered — nothing is normalised, so the legend keeps showing the user their own figures — only the buy and sell actions are withheld. Targets that already sat above 100 before this change, or that arrive through an import, land on that path, so the allocation screen names the situation in place of the hint rows: `Targets add up to 120% of net worth. Lower them to 100% to see what to trade.`

The sub-100 case is untouched: a deliberate cash buffer still produces sells, which the suite covers.

## Related
- Feature: [[Allocation Class Selection]], [[Persisted Settings]], [[App State Store]], [[Target Allocation and Rebalance Hints]]
- Bug: [[Rebalance Suggests A Sell At Zero Net Worth]]
- Enhancement: [[Allocation Ring Drill-Down]]
- Page: [[Editorial Allocation]]
