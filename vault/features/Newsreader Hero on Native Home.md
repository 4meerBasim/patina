# Newsreader Hero on Native Home

Status: shipped
Summary: the native home's net-worth figure is set in the same Newsreader serif as the editorial hero, so the one number the app is about reads the same in both styles.

## Details

`src/app/native/(tabs)/index.tsx` styles `heroValue` with `Fonts.newsreaderLight44`, the optical-size cut made for 44pt, at the editorial hero's letter-spacing ratio (−0.02em, so −0.88 at 44pt against −1.12 at 56pt). The system font at weight 600 is gone, and with it the `fontWeight` declarations on the hero and its cents: the Newsreader files carry their own weight, and asking for 600 on a Light face is what produces synthetic bolding on Android.

`fontVariant: ['tabular-nums']` stays, so the digits keep their width when the figure changes — the thing [[Digit Drift Animation]] depends on.

Everything else on the native home keeps the system font. The serif is for the hero only, which is the distinction the design document draws between the two styles: the native shell is iOS-native furniture around an editorial number.

## Related
- Feature: [[Design Tokens and Fonts]], [[Money and Numeral Formatting]], [[Native Glass Surfaces]], [[Privacy Blur on Launch]]
- Page: [[Native Home]]
- Enhancement: [[Digit Drift Animation]], [[Net Worth Reveal Animation]]
