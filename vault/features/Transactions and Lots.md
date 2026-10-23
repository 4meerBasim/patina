# Transactions and Lots

Status: shipped
Summary: records buys, sells, dividends and deposits as dated transactions with FIFO lots behind them, so cost basis and realised gain are computed rather than typed.

## Details

`src/data/types.ts` models `Transaction` and `Lot` separately: a transaction is what happened, a lot is the parcel of units it created, carrying `costPerUnit`, `acquiredAt`, `remainingQuantity` and the FX rate at acquisition. `src/store/data-store.ts:250` turns a buy into a lot and a sell into a drain across the holding's lots in acquisition order.

`src/lib/positions.ts` is where the figures come from. `realisedNative` replays every sell against the lots in FIFO order and matches proceeds to the cost of the units consumed; `computePositions` derives cost basis, average cost, unrealised gain and percent per holding, and splits a foreign holding's gain into market and currency parts using `acquiredFxRate`. `src/lib/__tests__/positions.test.ts` is the largest suite in the repo.

A sell can be seeded or imported but not entered: both add sheets write `type: 'buy'` only, so the sell path has no UI yet.

## Related
- Feature: [[Domain Data Model]], [[Local SQLite Persistence]], [[Returns Engine]], [[Money and Numeral Formatting]], [[Demo Seed Data]], [[Dividend Tracking and Calendar]], [[Period Recap]]
- Bugs: [[Oversell Drops The Unmatched Proceeds]]
- Page: [[Editorial Holding Detail]], [[Native Holding Detail]], [[Editorial Activity]], [[Editorial Add Holding]], [[Native Add Holding]]
