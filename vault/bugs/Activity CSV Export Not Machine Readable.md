# Activity CSV Export Not Machine Readable

Status: fixed
Found: src/app/editorial/activity.tsx (onExport)
Summary: CSV export emitted display strings — localized dates, grouped amounts and a Unicode minus/em-dash — that tools cannot parse.

## Details
Export re-used the on-screen strings ("17 Sept", "−12,410.00", "—"). Fixed by storing raw values on each row (`isoDate` like 2026-09-17, `amountValue` as a number or null) and emitting ISO dates, plain numbers with ASCII minus and no grouping (-12410.00), and an empty field for the valuation with no amount. Display strings on screen are unchanged. The CSV field quoter now also escapes `\r`.

## Related
- Feature: [[Activity CSV Export]]
- Page: [[Editorial Activity]]
