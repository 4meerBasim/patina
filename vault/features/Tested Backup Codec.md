# Tested Backup Codec

Status: shipped
Summary: the encode/decode half of the backup lives apart from the filesystem calls, so the one piece of logic that can lose rather than mis-display data is covered by tests.

## Details

`src/lib/backup-codec.ts` holds everything pure: `BACKUP_VERSION`, `BackupData`, `tableToRows` and `rowsToTable` (which store JSON inside CSV cells so numbers, nulls, booleans and nested values survive exactly), `serializeJson`, `parseJson`, `serializeCsv`, `parseCsvBackup` and `assertPriceable`. `src/lib/backup.ts` keeps only `freshFile`, `writeAndShareBackup` and `readBackup`, which are the `expo-file-system` and `expo-sharing` calls, and re-exports the type and version so nothing downstream had to change.

That split is what makes the codec testable at all: importing the old module in a jest process pulled in native modules the suite deliberately avoids. `src/lib/__tests__/backup-codec.test.ts` now covers 24 cases — every entity type round-tripping through both formats, cells carrying commas, quotes, CRLF newlines and non-ASCII text, Arabic strings and Eastern numerals, an empty table, a header-only table, a single-column table, a column a later record introduces, and the validation paths.

Two defects named in the original enhancement were fixed in the same change:

- `rowsToTable` called `JSON.parse` with no guard, so a truncated or hand-edited backup threw a raw `SyntaxError` at the user. It now names the cell: `Backup file is not readable: the "name" value in row 1 is damaged.`
- `parseJson` checked only that `version` was a number and `holdings` an array, defaulting every other table to `[]`. A table that is *present but not a list* is now a damaged file; a table that is simply *absent* still defaults to empty, because a backup written before a table existed is a different thing from a corrupt one. `parseCsvBackup` rejects a file with no holdings block at all, which closes the laxer of the two parsers.

The import-coverage check is `assertPriceable`, which refuses a file that leaves a holding with neither a quote for its instrument nor a dated mark of its own — the live trigger behind [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]].

This is the layer the local encrypted backup in `_owner-decisions` item 8 would build on.

## Related
- Feature: [[Full Export And Delete]], [[Local SQLite Persistence]], [[Domain Data Model]], [[Activity CSV Export]]
- Bugs: [[One Missing Quote Pins Time-Weighted Return At Minus One Hundred]]
- Page: [[Editorial Settings]], [[Native Settings]]
