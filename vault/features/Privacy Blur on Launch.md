# Privacy Blur on Launch

Status: shipped
Summary: with the setting on, the app opens with its figures masked and covers itself in the app switcher, and a tap hides the figures again at any time.

## Details

`src/lib/privacy-blur.tsx` holds both halves.

**The app-switcher cover.** `PrivacyBlurGate` wraps the navigation stack in `src/app/_layout.tsx`, inside `BiometricGate`. It listens to `AppState` and, while the app is anything other than `active`, renders an `expo-blur` `BlurView` over everything at an ink scrim — so the snapshot iOS takes for the switcher carries the blur rather than the balances. It is driven by `settings.privacyBlur`, the toggle both Settings screens already wrote and nothing read.

**The masked hero.** `useFigureMask` exposes `hidden`, a `mask` function, and the press pair the design document asks for: a tap hides the figures, a long press brings them back. The net-worth hero on the editorial home (English and Arabic) and the native home is wrapped in a `Pressable` carrying both, with an `accessibilityHint` that says which gesture does what and a label that reports `hidden` rather than reading the balance aloud. `maskFigure` returns between four and six bullets, scaled to the digits it replaces, so the mask does not leak the size of the number.

Visibility is session state in its own small zustand store, deliberately not persisted: the setting decides how the app *opens*, and hiding or revealing by hand lasts only while the app stays open. Leaving the app re-hides the figures when the setting is on, so returning to a masked hero is the default rather than something to remember.

Distinct from [[Biometric App Lock]], which controls access rather than shoulder-surfing; the two gates nest, lock outside blur.

## Related
- Feature: [[Biometric App Lock]], [[Persisted Settings]], [[Settings Toggles]], [[Design Tokens and Fonts]], [[Money and Numeral Formatting]], [[Arabic RTL Home]]
- Page: [[Editorial Home]], [[Native Home]], [[Editorial Settings]], [[Native Settings]]
- Enhancements: [[Net Worth Reveal Animation]]
