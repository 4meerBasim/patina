# Money-Weighted Return Is Absurd Or Absent On Short Windows

Status: fixed
Found: `src/lib/returns.ts:55` and `src/lib/returns.ts:67`
Summary: annualising a window of days produces either a meaningless rate or no rate at all, depending on which direction the portfolio moved.

## Details

`moneyWeightedReturn` annualises unconditionally. Over a few days or weeks that produces two different wrong answers depending on sign, because two different parts of the solver handle them.

Measured against the real module:

| Case | Result |
|---|---|
| 25% gain over one day | `2.49e35` |
| 25% gain over one month | `12.86` (1286% a year) |
| 10% gain over one month | `2.07` (207% a year) |
| 25% gain over one year | `0.251` — correct |
| 50% loss over one month | `-0.9997` |
| 90% loss over one month | `null` |

**Gains return absurd but finite rates.** Newton's method at line 55 converges happily, so the function reports `2.49e35` as a fact. The Performance screen would render it as a rate of return. Nobody up 25% in their first month is served by being told that.

**Severe losses return nothing.** The bisection fallback brackets `low = -0.9999` at line 67, which is a 99.99% annual loss. Losing 90% in a month annualises past that, the net present value has the same sign at both ends, and the function returns `null`. A 50% monthly loss squeezes in at −99.97%, which is technically inside the bracket and still not a useful thing to show anyone.

So the defect is not that the bracket is too small. It is that the question "what is my annualised rate of return" has no useful answer over a window of days, and the function answers it anyway — loudly for gains, silently for losses.

The suite covers only the extremes where `null` is obviously right: a total loss, a one-hour doubling, a zero-length period, and an end value of `1e-6`. None of the realistic short-window cases above is tested, in either direction.

The fix is to stop annualising below a minimum window — a month is the conventional floor — and show the plain period return instead, labelled as a period return rather than a rate. That addresses both failure modes at once, and it is a product decision about what the Performance screen should say, which is why this is recorded rather than quietly patched.

An earlier version of this note claimed the opposite: that a 25% one-month gain returned `null` because of the `high = 10` bracket. That was wrong on both the value and the mechanism. It came from reimplementing the bisection step in a scratch script instead of running the module, which skipped the Newton pass entirely. The figures above come from executing `src/lib/returns.ts`.

## Fix

Fixed on `fix/returns-engine`, with the product decision this note asked for: below a thirty-day window the function stops annualising and reports the plain period return instead. `moneyWeightedReturn` now returns `{ rate, annualised }` rather than a bare number, and both holding screens read the flag — the row reads `Annualised return` when the rate is annualised and `Return so far` when it is a period return. The absurd gains and the silent `null`s both go: a 25% month reports `0.25` as a period return, an hour's doubling reports `1`, and a zero-length window reports its plain gain instead of nothing. Windows of a month or more still run the Newton-then-bisection solver unchanged, so a true total loss and an end value that rounds to nothing still report no rate.

## Related
- Feature: [[Returns Engine]]
- Bug: [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]], [[Time-Weighted Return Overstates Gains When A Flow Has No Valuation Mark]]
- Page: [[Editorial Performance]]
