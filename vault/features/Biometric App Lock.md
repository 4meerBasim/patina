# Biometric App Lock

Status: shipped
Summary: Face ID or Touch ID gates the app on launch and on resume when the user turns it on, so the figures are not readable by whoever picks up the phone.

## Details

`src/lib/biometric.ts` wraps `expo-local-authentication` and reports what the device actually supports, so the toggle can tell the difference between "off" and "no hardware". `src/lib/use-biometric-setting.ts` persists the flag, and `src/lib/biometric-gate.tsx` wraps the app tree and holds the prompt on launch and on return from the background.

Distinct from the planned [[Privacy Blur on Launch]], which hides the figures rather than the app: the lock controls access, the blur controls shoulder-surfing.

## Related
- Feature: [[Persisted Settings]], [[Settings Toggles]], [[App State Store]]
- Page: [[Editorial Settings]], [[Native Settings]]
- Enhancement: [[Privacy Blur on Launch]]
