# Light Mode

Status: shipped
Summary: A Paper light appearance alongside the default dark one, chosen from either Settings screen.

## Details
`src/constants/theme.ts` now holds two palettes — `DarkPalette` and the design document's
Paper `LightPalette` (#F4F1EA base, #EBE7DE surface, #D9D4C8 hairline, Ink #1A1A17 text,
gain #3D7A69, loss #A85E3E, brass #8F7434). `themedPalette()` wraps each token in
`DynamicColorIOS`, so a `StyleSheet` created once at module scope still resolves per
appearance and no screen has to rebuild its styles. Translucent furniture and the tints
stay plain strings in `Fixed`, because some are interpolated into `boxShadow`, which needs
a colour it can read. `Colors` is the two merged.

`src/lib/appearance.ts` is the small surface around it: `applyAppearance` sets the native
colour scheme (`'unspecified'` for System), `nextAppearance` cycles dark → light → system,
and `usePalette` / `useIsLightAppearance` hand plain strings to the places that need one —
the navigation theme and the status bar.

The root layout applies the stored appearance once hydration finishes, before anything
renders, and `app.json` moved from `userInterfaceStyle: "dark"` to `"automatic"` so iOS
honours the override. Both Settings screens turned their static Appearance row into a
pressable that cycles and persists the choice.

**iOS only.** Android has no equivalent of `DynamicColorIOS` that works from a static
stylesheet, so it stays on the dark palette; making it flip there needs the palette to
move into context or a store, which is a larger change.

## Related
- Page: [[Editorial Home]], [[Editorial Portfolio]], [[Editorial Goals]], [[Editorial Allocation]], [[Editorial Dividends]], [[Editorial Holding Detail]], [[Editorial Performance]], [[Editorial Settings]], [[Native Goals]], [[Native Dividends]], [[Native Holding Detail]], [[Native Settings]]
- Features: [[Design Tokens and Fonts]], [[Persisted Settings]], [[Style Switching]]
- Bugs: none known
