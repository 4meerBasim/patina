# Money-Weighted Return Is Absurd Or Absent On Short Windows

Status: not-fixed
Found: `src/lib/returns.ts:55` and `src/lib/returns.ts:68`
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

**Gains return absurd but finite rates.** Newton's method at line 55 converges happily, so the function reports `2.49e35` as a fact. The Performance screen would render it. A user who is up 25% in their first month does not want to be told they are earning 2,491,048,885,614,683,600,000,000,000,000,000,000 percent a year.

**Severe losses return nothing.** The bisection fallback at line 68 brackets `low = -0.9999`, which is a 99.99% annual loss. Losing 90% in a month annualises past that, the net present value has the same sign at both ends, and the function returns `null`. A 50% monthly loss squeezes in at −99.97%, which is technically inside the bracket and still not a useful thing to show anyone.

So the defect is not that the bracket is too small. It is that the question "what is the annualised rate of return over nine days" has no useful answer, and the function answers it anyway — loudly for gains, silently for losses.

The suite covers only the extremes where `null` is obviously right: a total loss, a one-hour doubling, a zero-length period, and an end value of `1e-6`. None of the realistic short-window cases above is tested, in either direction.

The fix is to stop annualising below a minimum window — a month is the conventional floor — and show the plain period return instead, labelled as a period return rather than a rate. That addresses both failure modes at once, and it is a product decision about what the Performance screen should say, which is why this is recorded rather than quietly patched.

An earlier version of this note claimed the opposite: that a 25% one-month gain returned `null` because of the `high = 10` bracket. That was wrong on both the value and the mechanism. It came from reimplementing the bisection step in a scratch script instead of running the module, which skipped the Newton pass entirely. The figures above come from executing `src/lib/returns.ts`.

## Related
- Feature: [[Returns Engine]]
- Bug: [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]], [[Time-Weighted Return Overstates Gains When A Flow Has No Valuation Mark]]
- Page: [[Editorial Performance]]
