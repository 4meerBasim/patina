# Activity CSV Export

Status: shipped
Summary: Export turns the visible activity rows into CSV and hands it to the system share sheet.

## Details
`src/lib/csv.ts` holds the shared codec — `toCsv` quotes a field when it contains a comma, quote, newline or carriage return, and `parseCsv` reads the same dialect back, which is what lets the backup file ride on the same writer.

`src/app/editorial/activity.tsx`: builds `date,type,holding,account,detail,amount` rows from the currently filtered rows and calls `Share.share({ message })`. Each row carries raw values (`isoDate`, `amountValue`) so the CSV emits ISO 2026 dates and plain ASCII-minus numbers rather than display strings; fields are quoted when they contain a comma, quote, newline or carriage return.

## Related
- Page: [[Editorial Activity]]
- Features: [[Activity Filter Chips]], [[Full Export And Delete]]
- Bugs: [[Activity CSV Export Not Machine Readable]]
