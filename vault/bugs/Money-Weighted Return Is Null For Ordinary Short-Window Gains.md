# Money-Weighted Return Is Null For Ordinary Short-Window Gains

Status: not-fixed
Found: `src/lib/returns.ts:69`
Summary: the IRR search is bracketed at 1000% a year, so a healthy gain in the first few weeks annualises past the bracket and the screen shows no money-weighted return at all.

## Details

`moneyWeightedReturn` falls back to bisection over a fixed bracket:

```ts
let low = -0.9999;
let high = 10;
```

`high = 10` means 1000% a year. If the net present value has the same sign at both ends, the function returns `null`.

Short windows annualise violently. A 25% gain one month after the first deposit implies roughly 1355% a year, which is outside the bracket:

```
mwr([{2026-01-01, 10000}], {2026-02-01, 12500})  →  null      (25% in a month)
mwr([{2026-01-01, 10000}], {2026-02-01, 11000})  →  a rate    (10% in a month)
mwr([{2026-01-01, 10000}], {2026-12-31, 12500})  →  a rate    (25% in a year)
```

So the failure is specific: a good early month. That is exactly the window a new user looks at. They add their holdings, the market moves in their favour, and the money-weighted figure is blank while the time-weighted one beside it reads fine — which looks like a broken screen rather than a mathematical limit.

The suite only covers the extreme: `returns.test.ts` asserts `null` for a gain over one hour, where annualising to nothing sensible is the right answer. The realistic first-month case is the one users will hit and it is untested.

Raising the bracket is the obvious change but not obviously right — an annualised 1355% is a true answer to a meaningless question, and reporting it would be worse than reporting nothing. The better fix is probably to stop annualising below some minimum window and show the plain period return instead, labelled as such. That is a product decision about what the Performance screen should say, not just a constant to bump, which is why this is recorded rather than quietly patched.

## Related
- Feature: [[Returns Engine]]
- Bug: [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]], [[Time-Weighted Return Overstates Gains When A Flow Has No Valuation Mark]]
- Page: [[Editorial Performance]]
