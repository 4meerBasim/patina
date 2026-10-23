# Design Tokens and Fonts

Status: shipped
Summary: Shared colour, asset-class and typography tokens plus the bundled font set every screen draws with.

## Details
The editorial primitives built on these tokens: `src/components/editorial/caption.tsx` (the small-caps section label), `screen-header.tsx` (the back control and trailing slot every pushed screen uses), `monogram.tsx`, `months.ts`, and `direction-view.tsx` with its `.web.tsx` counterpart, which is what keeps RTL mirroring working on both native and web.

`src/constants/theme.ts` defines `Colors` (Ink, Bone, Ash, Slate, Brass, Verdigris, Copper, glass fills, gain/loss tints…), `AssetClassColors`, `Fonts` and `FontFiles`. `src/app/_layout.tsx` loads the fonts from `assets/fonts/` with `useFonts`, keeps the splash screen up until they load, and applies a dark theme on Ink. Bundled fonts: Newsreader optical-size cuts (Light 32/36/40/44/56, Regular 13/15/18/20/22/24, Italic 13), Manrope (Regular, Medium, SemiBold), IBM Plex Mono, IBM Plex Sans Arabic (Regular, Medium) and Noto Naskh Arabic. `app.json` locks `userInterfaceStyle` to dark.

## Related
- Page: [[Style Chooser]], [[Editorial Onboarding]], [[Editorial Account Linking]], [[Editorial Home]], [[Editorial Portfolio]], [[Editorial Holding Detail]], [[Editorial Add Holding]], [[Editorial Performance]], [[Editorial Allocation]], [[Editorial Goals]], [[Editorial Notes]], [[Editorial Activity]], [[Editorial Settings]], [[Native Home]], [[Native Portfolio]], [[Native Holding Detail]], [[Native Add Holding]], [[Native Goals]], [[Native Settings]], [[Editorial Dividends]], [[Editorial Goal Detail]]
- Features: [[Arabic RTL Home]], [[Privacy Blur on Launch]], [[Newsreader Hero on Native Home]], [[Native Notes Screen]], [[Digit Drift Animation]], [[Net Worth Reveal Animation]]
- Enhancements: [[Light Mode]], [[Dynamic Type Caps]]
- Bugs: none known
