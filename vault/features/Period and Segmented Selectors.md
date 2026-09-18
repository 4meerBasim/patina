# Period and Segmented Selectors

Status: shipped
Summary: Tappable period and grouping selectors: underlined text tabs in the Editorial style and segmented controls in the Native style.

## Details
- `src/components/editorial/period-selector.tsx`: brass underline on the selected option, Arabic label variant; used for 1W / 1M / 1Y / All on Editorial Home (English and Arabic) and Editorial Holding detail.
- `src/components/native/segmented-control.tsx`: used for periods on Native Home and Native Holding detail, By class / By account / By holding on Native Portfolio, and asset type on Native Add holding.
Selection is UI state only; the charts and lists do not change with it.

## Related
- Page: [[Editorial Home]], [[Editorial Holding Detail]], [[Native Home]], [[Native Portfolio]], [[Native Holding Detail]], [[Native Add Holding]]
- Bugs: none known
