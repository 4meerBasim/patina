# Keyboard Covers Add Holding Fields

Status: fixed
Found: src/app/editorial/add.tsx, src/app/native/add.tsx
Summary: The add-holding sheets start below the top of the screen, so the keyboard covered lower fields and the Next/Add actions.

## Details
Both sheets are offset from the top (editorial 70pt, native 64pt) but their `KeyboardAvoidingView` used no `keyboardVerticalOffset`, so avoidance was miscomputed. Fixed by setting the matching offsets. Editorial now wraps its content in a `Pressable` that calls `Keyboard.dismiss` on empty taps so Next is always reachable; native wraps the rows below the nav in a `ScrollView` (`keyboardShouldPersistTaps="handled"`, `automaticallyAdjustKeyboardInsets` on iOS) so every row stays reachable on small phones. Resting layout is unchanged.

## Related
- Feature: [[Add Holding Live Preview]]
- Page: [[Editorial Add Holding]], [[Native Add Holding]]
