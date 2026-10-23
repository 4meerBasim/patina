# Four Native Screens Have No Route In

Status: not-fixed
Found: `src/app/native/` against every `router.push` in `src/app/`
Summary: four finished native screens are registered as routes and reachable only by deep link, because nothing in the native shell navigates to them.

## Details

Every navigation target in the app, collected from `router.push`, `router.replace` and `href`:

```
/editorial/allocation, /editorial/performance, /editorial/add, /editorial/activity,
/editorial/settings, /editorial/onboarding, /editorial/link, /editorial/goal,
/editorial/holding, /editorial, /native, /native/settings, /native/holding
```

The native shell therefore reaches its three tabs, settings and holding detail. These four screens are built, styled and wired to the store, and nothing pushes to them:

| Screen | File | What it does |
|---|---|---|
| Add holding | `src/app/native/add.tsx` | the native accession sheet |
| Goal detail | `src/app/native/goal.tsx` | create and edit a goal |
| Dividends | `src/app/native/dividends.tsx` | income received and projected |
| Liabilities | `src/app/native/liabilities.tsx` | the debts editor |

Each one calls `router.back()` from its own header control, so each was written expecting to be pushed onto a stack. In the editorial shell the equivalents are all reachable: the goals tab pushes `/editorial/goal`, the home and portfolio screens push `/editorial/holding`, and the tab bar's accession control pushes `/editorial/add`.

The practical effect is that the native style looks feature-poor against the editorial one for reasons that have nothing to do with the screens themselves. Liabilities is the sharpest case: it is the only editor for the debt side of net worth in either style, so with no route into it a user cannot record a mortgage at all without deep-linking.

Not a styling gap — [[Native Style for Remaining Screens]] is about screens that exist only in the editorial style, and these four already exist in the native one. Not covered by [[Interactive Native Home]] either, which is about the home cards being inert rather than about missing routes.

## Related
- Feature: [[Liabilities]], [[Goals With Linked Holdings]], [[Dividend Tracking and Calendar]], [[Native Glass Tab Bar]]
- Page: [[Native Home]], [[Native Portfolio]], [[Native Goals]], [[Native Settings]], [[Native Add Holding]], [[Native Goal Detail]], [[Native Dividends]], [[Native Liabilities]], [[Editorial Dividends]]
- Enhancement: [[Native Style for Remaining Screens]], [[Interactive Native Home]]
