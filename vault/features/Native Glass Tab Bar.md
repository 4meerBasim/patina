# Native Glass Tab Bar

Status: shipped
Summary: Floating blurred-glass pill with four labelled tabs plus a separate round glass "+" that opens Add holding.

## Details
`src/components/native/tab-bar.tsx`, mounted in `src/app/native/(tabs)/_layout.tsx`. Built on the `Glass` component (`expo-blur` BlurView, drop shadow). Tabs: Home, Portfolio, Goals, Notes. Turn 2 has no Notes route, so the Notes tab renders disabled. The "+" pushes `/native/add`.

## Related
- Page: [[Native Home]], [[Native Portfolio]], [[Native Goals]]
- Features: [[Native Glass Surfaces]]
- Enhancements: [[Native Notes Screen]]
- Bugs: [[Four Native Screens Have No Route In]]
