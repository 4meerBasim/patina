# Interactive Native Home

Status: shipped
Summary: the native home's cards respond to a press, and the note card shows the user's actual note instead of a mocked sentence.

## Details

Two cards on `src/app/native/(tabs)/index.tsx` were inert views.

**The allocation card** is now a `Pressable` that navigates to the Portfolio tab, which opens on its `By class` grouping — the same split the card draws. The legend items are left as plain text deliberately: at their size an individual tap target would be well under the 44pt minimum in `foundation/design.md`, so the whole card is the target.

**The note card** drew a chevron and said `Crypto drove 62% of today's change` — hardcoded prose, one of the mocked figures the feature scout report flagged across the original screens. It now reads the first unread note from [[Insight Rules Engine]], or the newest note if all are read, and renders its body and detail. The chevron finally means something: a press navigates to [[Native Notes Screen]]. With no notes at all the whole section is omitted rather than showing an empty card.

What still does not respond, and why: the hero chart has no native performance screen to open, and the `What moved` recap rows have no native screen either. Both wait on [[Native Style for Remaining Screens]]. The hero itself responds to a press, but for privacy — see [[Privacy Blur on Launch]].

## Related
- Feature: [[Insight Rules Engine]], [[Native Notes Screen]], [[Native Glass Surfaces]], [[Period Recap]], [[Top Movers]], [[Privacy Blur on Launch]], [[Allocation Class Selection]]
- Page: [[Native Home]], [[Native Portfolio]]
- Enhancement: [[Native Style for Remaining Screens]]
- Bugs: [[Four Finished Screens Have No Route In]]
