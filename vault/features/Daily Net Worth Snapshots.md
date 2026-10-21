# Daily Net Worth Snapshots

Status: shipped
Summary: One net-worth snapshot per day, recomputed and stored on every edit, backing the home hero and its chart.

## Details
`src/lib/snapshots.ts` `computeSnapshot` totals every holding by asset class and by account in the base currency (converting via the FX rates) to produce a dated `Snapshot`; the store upserts today's snapshot on hydrate and after each edit, and `src/data/seed.ts` lays down a 90-day series anchored to the current date.

## Related
- Page: [[Editorial Home]], [[Native Home]], [[Editorial Performance]]
- Features: [[Returns Engine]], [[App State Store]]
- Bugs: [[Today Delta Frozen To Seed Date]]
