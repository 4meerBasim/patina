# Local SQLite Persistence

Status: shipped
Summary: An on-device SQLite database that stores every domain entity and survives app launches.

## Details
`src/data/db/client.ts` opens `patina.db` once (WAL journal, foreign keys on); `src/data/db/schema.ts` creates the tables and indexes and migrates forward against `PRAGMA user_version`; `src/data/db/repositories.ts` holds the parameterized get/insert/update/delete queries for each entity plus the `kv` key-value table.

## Related
- Page: [[Editorial Home]], [[Editorial Portfolio]], [[Editorial Holding Detail]], [[Editorial Add Holding]], [[Editorial Allocation]], [[Editorial Goals]], [[Editorial Notes]], [[Editorial Activity]], [[Editorial Performance]], [[Native Home]], [[Native Portfolio]], [[Native Holding Detail]], [[Native Add Holding]], [[Native Goals]]
- Features: [[Domain Data Model]], [[App State Store]], [[Persisted Settings]], [[Demo Seed Data]]
- Bugs: [[Oversell Drops The Unmatched Proceeds]], [[Rebalance Suggests A Sell At Zero Net Worth]]
