# Demo Seed Data

Status: shipped
Summary: An idempotent demo dataset that reproduces the mockups' figures exactly on first launch.

## Details
`src/data/seed.ts` seeds accounts, instruments, holdings, lots, transactions, goals, notes, FX rates and a 90-day snapshot series — reproducing net worth $1,284,930.42 and the 46/9/31/6/8 stocks/crypto/property/cash/savings class weights — only when the holdings table is empty, so it runs once and never overwrites real edits.

## Related
- Page: [[Editorial Home]], [[Native Home]], [[Editorial Portfolio]], [[Native Portfolio]], [[Editorial Goals]], [[Native Goals]], [[Editorial Activity]]
- Features: [[Local SQLite Persistence]]
- Bugs: [[Contradictory Lisbon Flat Valuation]], [[Dividend Calendar Sums Foreign Currency Without FX]], [[Oversell Drops The Unmatched Proceeds]], [[Rebalance Suggests A Sell At Zero Net Worth]]
