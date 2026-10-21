# Editorial Tab Bar

Status: shipped
Summary: Bottom bar of four unlabelled line glyphs (Home, Portfolio, Goals, Notes) with a brass "+" in the middle that opens Add holding.

## Details
`src/components/editorial/tab-bar.tsx`, mounted as the custom `tabBar` in `src/app/editorial/(tabs)/_layout.tsx` (expo-router js-tabs). Each glyph carries an accessibility label; the focused glyph turns Bone, others Slate. The "+" pushes `/editorial/add`. The row is wrapped in `DirectionView`, so it mirrors when the locale is Arabic.

## Related
- Page: [[Editorial Home]], [[Editorial Portfolio]], [[Editorial Goals]], [[Editorial Notes]]
- Features: [[Arabic RTL Home]]
- Enhancements: [[Dynamic Type Caps]]
- Bugs: none known
