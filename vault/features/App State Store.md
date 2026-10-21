# App State Store

Status: shipped
Summary: A Zustand store that hydrates every entity from SQLite and exposes it to screens through selector hooks and actions.

## Details
`src/store/data-store.ts` is the zustand v5 store: `hydrate()` seeds the database, loads all entities and computes the current snapshot; each add/update/delete action persists through the repositories and then recomputes and re-stores today's snapshot. `src/store/selectors.ts` derives net worth, allocation, deltas and movers; `src/store/index.ts` exposes the hydration gate and the public `useX` hooks and actions.

## Related
- Page: [[Editorial Home]], [[Editorial Portfolio]], [[Editorial Holding Detail]], [[Editorial Add Holding]], [[Editorial Allocation]], [[Editorial Goals]], [[Editorial Notes]], [[Editorial Activity]], [[Editorial Performance]], [[Native Home]], [[Native Portfolio]], [[Native Holding Detail]], [[Native Add Holding]], [[Native Goals]]
- Features: [[Domain Data Model]], [[Local SQLite Persistence]], [[Daily Net Worth Snapshots]], [[Persisted Settings]]
