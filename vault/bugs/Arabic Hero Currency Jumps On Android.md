# Arabic Hero Currency Jumps On Android

Status: fixed
Found: src/app/editorial/(tabs)/index.tsx (ArabicHome hero)
Summary: The "$" in the Arabic net-worth hero rendered on the left on Android because `writingDirection` is iOS-only.

## Details
The hero relied on `writingDirection: 'ltr'` to keep the digits and trailing "$" in visual order, but that style is a no-op on Android, so the currency symbol jumped to the left. Fixed by wrapping the hero run in a Unicode LTR isolate (U+2066 … U+2069) so ordering is deterministic on both platforms. The Arabic caption `letterSpacing` was also set to 0, since joined Arabic script must not be tracked.

## Related
- Feature: [[Arabic RTL Home]]
- Page: [[Editorial Home]]
