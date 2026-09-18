# Settings Toggles

Status: shipped
Summary: Animated switches for "Blur figures on launch" and "Face ID" on both Settings screens.

## Details
- Editorial: `Toggle` in `src/app/editorial/settings.tsx`, an outlined track with a brass knob that slides 20px over 200 ms (Reanimated).
- Native: `src/components/native/switch.tsx`, an iOS-style switch whose track fades to brass.
Both hold local state only; no blur or biometric behaviour sits behind them yet.

## Related
- Page: [[Editorial Settings]], [[Native Settings]]
- Enhancements: [[Privacy Blur on Launch]]
- Bugs: none known
