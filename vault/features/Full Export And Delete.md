# Full Export And Delete

Status: shipped
Summary: exports the entire dataset to a shareable file and deletes everything on confirmation, so the user's data is never trapped in the app.

## Details

`src/lib/backup.ts` serialises every table through `tableToRows`, writes the file with `expo-file-system` and hands it off with `expo-sharing`. `src/lib/use-data-management.ts` exposes it to both Settings screens as a single hook, alongside import and delete.

Data portability is a selling point in every manual-tracker roundup the scout report cites, and it is the thing that makes a local-first app trustworthy: there is no account to lock you out, and no server copy to ask about.

Delete clears the SQLite database and resets the store, behind a confirmation.

The codec is untested, which for the one piece of logic that can lose rather than mis-display data is the wrong way round — see [[Extract The Backup Codec For Testing]]. The same note records that `rowsToTable` parses JSON with no guard, so a hand-edited backup throws a raw `SyntaxError` at the user.

## Related
- Feature: [[Local SQLite Persistence]], [[Domain Data Model]], [[Activity CSV Export]]
- Enhancement: [[Extract The Backup Codec For Testing]]
- Page: [[Editorial Settings]], [[Native Settings]]
