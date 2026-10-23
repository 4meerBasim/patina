# Native Notes Screen

Status: shipped
Summary: the native shell's fourth tab now opens a Notes screen instead of rendering disabled, listing the insight notes in the native grouped-list vocabulary.

## Details

`src/app/native/(tabs)/notes.tsx` renders the same notes the editorial screen does — from [[Insight Rules Engine]], regenerated on mount — in the native idiom: a large title, a subtitle counting unread against total, and one grouped card whose rows carry the kind, the date, the body and the detail, separated by hairlines. An unread note is marked with a brass bullet and keeps its body in bone; a read one drops to ash. An empty portfolio gets a card rather than bare text, so the screen never renders as a blank page.

`src/app/native/(tabs)/_layout.tsx` registers the route. The tab bar at `src/components/native/tab-bar.tsx:14` had always drawn a Notes tab, and resolved it against the registered routes — with no `notes` route the `Pressable` was `disabled` and the icon sat in ash. Registering the screen is what turns the tab on; no tab-bar change was needed.

One thing the editorial screen has is deliberately absent: the `Review allocation` action on a concentration note. The native shell has no allocation screen to send the user to yet — that is [[Native Style for Remaining Screens]] — and jumping from the native shell into an editorial screen would break the style the user chose.

## Related
- Feature: [[Insight Rules Engine]], [[Native Glass Tab Bar]], [[Native Glass Surfaces]], [[Design Tokens and Fonts]], [[Fee Analyzer]], [[Goals With Linked Holdings]]
- Page: [[Native Home]], [[Editorial Notes]], [[Native Goals]], [[Native Portfolio]]
- Enhancement: [[Native Style for Remaining Screens]], [[Interactive Native Home]]
- Bugs: [[Pace Note Reads Running Behind Of Schedule]]
