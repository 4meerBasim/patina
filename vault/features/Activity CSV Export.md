# Activity CSV Export

Status: shipped
Summary: Export turns the visible activity rows into CSV and hands it to the system share sheet.

## Details
`src/app/editorial/activity.tsx`: builds `date,type,holding,account,detail,amount` rows from the currently filtered rows and calls `Share.share({ message })`. Each row carries raw values (`isoDate`, `amountValue`) so the CSV emits ISO 2026 dates and plain ASCII-minus numbers rather than display strings; fields are quoted when they contain a comma, quote, newline or carriage return.

## Related
- Page: [[Editorial Activity]]
- Features: [[Activity Filter Chips]]
- Bugs: [[Activity CSV Export Not Machine Readable]]
