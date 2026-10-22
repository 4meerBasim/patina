# Test Formatters Against Hermes

Status: planned
Summary: the money formatter tests assert strings produced by Node's ICU, but the app renders on Hermes, whose `Intl` is a different implementation.

## Notes

81 of the suite's cases assert exact output from `src/lib/money.ts`, which rests entirely on `Intl.NumberFormat`. Jest runs them in Node. The app runs them in Hermes. The two ship different `Intl` implementations and different ICU data, so a green suite is not evidence that the device renders the same string.

This matters more here than in a typical app because Patina formats in six currencies and two numeral systems, including Eastern Arabic digits and the Arabic decimal separator. Locale data is precisely where the two engines are most likely to diverge, and a wrong currency symbol or separator in Arabic is the kind of defect that looks like carelessness to the user it affects most.

Not solvable inside the current harness, which is pure-logic by design and runs no device code. Options, cheapest first: assert on the parts rather than the assembled string via `formatToParts`, which is more stable across implementations; or pin a known-good table of expected outputs per locale and currency and compare it once on a real device, treating any drift as a bug; or add a thin device-side check when the project next has a dev build for another reason.

Worth doing before any release that claims Arabic support, not before.

## Related
- Feature: [[Money and Numeral Formatting]], [[Arabic RTL Home]]
- Enhancement: [[Arabic Holding and Add Holding]]
- Bug: [[Arabic Hero Currency Jumps On Android]]
