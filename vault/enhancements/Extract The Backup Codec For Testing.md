# Extract The Backup Codec For Testing

Status: planned
Summary: split the pure encode/decode logic in `src/lib/backup.ts` out from its filesystem calls so the highest-stakes code in the repo can be tested.

## Notes

`backup.ts` round-trips the user's entire dataset through `tableToRows` and `rowsToTable`, storing JSON inside CSV cells. A defect here loses data outright rather than displaying a wrong figure, which makes it the most consequential pure logic in the project — and it has no tests.

It cannot be tested as written. The module imports `expo-file-system` and `expo-sharing` at the top level, so loading it in a jest process pulls in native modules the suite deliberately avoids. The codec itself is pure and has no reason to sit beside the IO.

Move `tableToRows` and `rowsToTable` into their own module, leave the file and share calls in `backup.ts` importing from it, then test the codec directly: every entity type round-tripping, cells containing commas, quotes, newlines and non-ASCII text, Arabic strings and Eastern numerals, an empty table, and a single-column table.

Two real defects to fix while in there. `rowsToTable` calls `JSON.parse(cell)` with no guard, so a truncated or hand-edited backup throws a raw `SyntaxError` at the user instead of a message saying the file is not readable. And `parseJson` at `backup.ts:69` checks only that `version` is a number and `holdings` is an array, defaulting every other table to `[]` — which is the live trigger for [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]], since a file with holdings and snapshots but no price quotes imports cleanly and pins the performance figure at −100%. Import is a system boundary, which is exactly where `foundation/code.md` says validation belongs.

Pairs with [[Full Export And Delete]] and blocks confident work on [[_owner-decisions]] item 8, the local encrypted backup, which will build on this codec.

## Related
- Bug: [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]]
- Feature: [[Local SQLite Persistence]], [[Domain Data Model]]
- Page: [[Editorial Settings]], [[Native Settings]]
