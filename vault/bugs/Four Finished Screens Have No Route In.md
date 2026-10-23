# Four Finished Screens Have No Route In

Status: fixed
Found: `src/app/native/` against every `router.push` in `src/app/`
Summary: four finished screens — three native, one editorial — were registered as routes and reachable only by deep link, because nothing navigated to them.

## Details

Every navigation target in the app, collected from `router.push`, `router.replace` and `href`:

```
/editorial/allocation, /editorial/performance, /editorial/add, /editorial/activity,
/editorial/settings, /editorial/onboarding, /editorial/link, /editorial/goal,
/editorial/holding, /editorial, /native, /native/add, /native/settings, /native/holding
```

The native shell therefore reached its three tabs, settings, holding detail and the add sheet — the add control lives on the tab bar at `src/components/native/tab-bar.tsx:68`, outside `src/app/`, which is why a first pass over the screens alone missed it. These four screens are built, styled and wired to the store, and nothing pushed to them:

| Screen | File | What it does |
|---|---|---|
| Native goal detail | `src/app/native/goal.tsx` | create and edit a goal |
| Native dividends | `src/app/native/dividends.tsx` | income received and projected |
| Native liabilities | `src/app/native/liabilities.tsx` | the debts editor |
| Editorial dividends | `src/app/editorial/dividends.tsx` | the same income screen in the editorial style |

Each one calls `router.back()` from its own header control, so each was written expecting to be pushed onto a stack. The native goals tab even draws a chevron on every goal card and a plus pill in its header, neither of which did anything.

The practical effect was that the native style looked feature-poor against the editorial one for reasons that had nothing to do with the screens themselves. Liabilities was the sharpest case: it is the only editor for the debt side of net worth in either style, so with no route into it a user could not record a mortgage at all without deep-linking.

Not a styling gap — [[Native Style for Remaining Screens]] is about screens that exist only in the editorial style, and these four already exist in the native one. Not covered by [[Interactive Native Home]] either, which is about the home cards being inert rather than about missing routes.

## Fix

Fixed on `fix/unreachable-screens`. Each screen got a route from the place that already pointed at its subject, rather than a new menu:

- **Native goal detail.** The goal cards on the goals tab push `/native/goal` with the goal id, and the plus pill in the header pushes it with none, which creates one — the same pair the editorial goals tab already had. The chevron on the card now means something.
- **Native liabilities.** A `Net worth` section in native settings carries a `Liabilities` row showing what is owed, or `None`, and pushes to the editor.
- **Native dividends.** The `Income` card on the native holding detail — the yield-on-cost and trailing-income rows — is now pressable and opens the income screen.
- **Editorial dividends.** The `Dividend` row in the editorial home's `Recent` block opens the income screen instead of the activity ledger. The `Buy` row beside it still opens activity, so nothing lost a route.

Every route in the app now has something that navigates to it, checked by collecting every `router.push`, `router.replace` and `pathname:` in `src/` and diffing against the files under `src/app/`.

One gap is deliberate: the Arabic home variant keeps its single `Recent` row pointing at the activity ledger, because repointing it would have left Arabic with no route to activity at all and adding a second row means new Arabic copy. The Arabic shell's missing routes belong with [[Arabic Holding and Add Holding]].

## Related
- Feature: [[Liabilities]], [[Goals With Linked Holdings]], [[Dividend Tracking and Calendar]], [[Native Glass Tab Bar]]
- Page: [[Native Home]], [[Native Portfolio]], [[Native Goals]], [[Native Settings]], [[Native Add Holding]], [[Native Goal Detail]], [[Native Dividends]], [[Native Liabilities]], [[Editorial Dividends]], [[Editorial Home]], [[Editorial Holding Detail]]
- Enhancement: [[Native Style for Remaining Screens]], [[Interactive Native Home]], [[Arabic Holding and Add Holding]]
