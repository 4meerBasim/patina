# Liabilities

Status: shipped
Summary: mortgages, loans and cards are held as named balances and subtracted from net worth, so the hero figure is what the user owns minus what they owe.

## Details

`Liability` in `src/data/types.ts` carries a name, a kind and a balance. `src/store/data-store.ts:410` holds `addLiability`, `updateLiability` and `deleteLiability`, and `computeSnapshot` in `src/lib/snapshots.ts` writes `totalAssets`, `totalLiabilities` and `totalNetWorth` as three separate figures so the subtraction is visible in the stored history rather than folded away.

`src/app/native/liabilities.tsx` is the editor: a grouped list of balances with name and balance fields, a delete action per liability, and the caption `Subtracted from your net worth.` The save is gated on a positive balance.

The screen has a back control but nothing in the native shell pushes to it — see [[Four Native Screens Have No Route In]].

## Related
- Feature: [[Domain Data Model]], [[Local SQLite Persistence]], [[Daily Net Worth Snapshots]], [[Money and Numeral Formatting]]
- Bugs: [[Four Native Screens Have No Route In]]
- Page: [[Native Liabilities]], [[Native Home]], [[Editorial Home]]
