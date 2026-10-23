# Period Recap

Status: shipped
Summary: answers "what moved my net worth" over a chosen period, splitting the change into money the user added and money the market made, per class, account and holding.

## Details

`src/lib/recap.ts` reads the snapshot history and the transactions over the window and returns `netWorthChange`, `contributions`, `market`, and the change per class, per account and per holding. The contributions-versus-market split is the part that matters: a net worth that rose because the user deposited is a different fact from one that rose because the market did, and the recap keeps them apart.

The editorial home screen renders it under the period control, and `hasRecap` hides the block when all three figures are zero rather than showing a row of nothings.

## Related
- Feature: [[Daily Net Worth Snapshots]], [[Period and Segmented Selectors]], [[Returns Engine]], [[Transactions and Lots]]
- Page: [[Editorial Home]]
