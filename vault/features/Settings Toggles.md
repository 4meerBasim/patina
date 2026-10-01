# Settings Toggles

Status: shipped
Summary: Animated switches for "Blur figures on launch" and "Face ID" on both Settings screens.

## Details
- Editorial: `Toggle` in `src/app/editorial/settings.tsx`, an outlined track with a brass knob that slides 20px over 200 ms (Reanimated).
- Native: `src/components/native/switch.tsx`, an iOS-style switch whose track fades to brass.
Both toggles now persist through the store (`updateSettings` writing `privacyBlur` and `biometricLock`), so the preferences survive restart; the enforcement behind them — the actual launch blur and the biometric gate — and light-mode appearance are still pending later phases.

## Related
- Page: [[Editorial Settings]], [[Native Settings]]
- Features: [[Persisted Settings]]
- Enhancements: [[Privacy Blur on Launch]]
- Bugs: none known
