# Today Delta Frozen To Seed Date

Status: fixed
Found: src/data/seed.ts (buildSnapshotSeries)
Summary: The snapshot series was anchored to the literal 2026-10-01, so once the device date passed it, hydrate's real-date snapshot equalled the series' last row and the home "today" delta collapsed to 0.

## Details
The seed built its 90-day series ending on a hardcoded `TODAY = '2026-10-01'`, while the store computes and upserts a snapshot for the real current date. Any day after the seed date, that live snapshot landed beyond the series and read as flat against the stale last row, zeroing the hero's today change. Fixed by anchoring the series to the real current date (a `new Date().toISOString()` basis, matching the store's `todayIso`), so the last two rows keep the intended −$3,102 today / +$12,410 30-day deltas on any date.

## Related
- Feature: [[Daily Net Worth Snapshots]]
- Page: [[Editorial Home]], [[Native Home]]
