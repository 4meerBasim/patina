# Arabic RTL Home

Status: shipped
Summary: Switching the Editorial locale to Arabic renders Home as a right-to-left screen with Eastern Arabic-Indic numerals (design 1m).

## Details
`src/components/editorial/locale.tsx` keeps an in-memory `en`/`ar` locale for the Editorial stack (`src/app/editorial/_layout.tsx`); it is not persisted. The onboarding Language · Numerals picker sets it and the Settings Language row toggles it. With `ar`, Home renders `ArabicHome`: RTL layout via `DirectionView` (native `direction`, web `dir`), digits with ٫/٬ separators, Arabic period labels, a mirrored chart and IBM Plex Sans Arabic / Noto Naskh Arabic type. The editorial tab bar mirrors too. Other editorial screens stay in English.

## Related
- Page: [[Editorial Home]], [[Editorial Onboarding]], [[Editorial Settings]]
- Features: [[Editorial Tab Bar]], [[Design Tokens and Fonts]], [[Money and Numeral Formatting]]
- Enhancements: [[Arabic Holding and Add Holding]]
- Bugs: [[Arabic Hero Currency Jumps On Android]]
