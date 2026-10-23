# Time-Weighted Return Overstates Gains When A Flow Has No Valuation Mark

Status: fixed
Found: `src/lib/returns.ts:26`
Summary: a contribution inside a period is subtracted from the end value but never added to the denominator, so a mid-period deposit with no valuation mark at its date inflates the reported return.

## Details

```ts
const periodReturn = (end.value - periodFlow - start.value) / start.value;
```

Subtracting the flow from the numerator is correct — that money was not earned. But the denominator stays at `start.value`, as though the contribution were never at work. That is the standard formula and it is right *only* when a valuation mark exists at every flow date, so each sub-period is measured against the capital actually in place for it.

Nothing in the app guarantees such a mark. `computeSnapshot` writes one row per day, which covers the common case, but a flow imported from a broker CSV dated before the user installed Patina has no snapshot beside it. The result is a return attributed to a smaller capital base than was really invested, which reads high.

`returns.test.ts:52` covers a January 15 contribution and asserts 10%, where the capital-weighted answer over the period is nearer 5%. That assertion is correct for the formula as written and the test is not wrong — but nothing documents that the figure depends on a mark existing at the flow date, and nothing covers the case where one does not.

Two honest options. Sub-divide each period at every flow date and require a valuation there, falling back to a money-weighted figure when the mark is missing. Or weight the denominator by the fraction of the period the flow was invested — the Modified Dietz method, which is the conventional answer when daily marks are unavailable and is cheap to compute from data already held.

Lower severity than the two sibling return bugs: it skews a figure rather than destroying it, and only when marks are sparse. Recorded because the skew is upward, and a performance number that flatters is worse than one that is merely imprecise.

## Fix

Fixed on `fix/returns-engine` with the second option, Modified Dietz, since it needs no data the app does not already hold. Each flow inside a period now enters the denominator at the fraction of the period it was invested, so the return is measured against the capital actually at work. The upward skew is gone: a January 15 contribution against marks six months apart reports 5.2% rather than 10%, and a March withdrawal reports 13.7% rather than 10%.

The formula degenerates to plain time-weighted return where a mark exists at every flow date, which is the common case with daily snapshots — a flow dated at a period end weighs nothing and the denominator is `start.value`, exactly as before. So no mode switch and no fallback branch was needed, and the chain-linking tests that put a flow on a mark date are unchanged. The zero-value guard moved from `start.value` to the weighted denominator, which also stops a large early withdrawal flipping the sign of a period return.

## Related
- Feature: [[Returns Engine]], [[Daily Net Worth Snapshots]]
- Bug: [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]], [[Money-Weighted Return Is Absurd Or Absent On Short Windows]]
- Page: [[Editorial Performance]]
