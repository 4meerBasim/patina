# Activity CSV Export

Status: shipped
Summary: Export turns the visible activity rows into CSV and hands it to the system share sheet.

## Details
`src/app/editorial/activity.tsx`: builds `date,type,holding,account,detail,amount` rows (fields quoted when they contain commas, quotes or newlines) from the currently filtered rows and calls `Share.share({ message })`.

## Related
- Page: [[Editorial Activity]]
- Features: [[Activity Filter Chips]]
- Bugs: none known
