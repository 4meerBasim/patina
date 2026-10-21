# Conversational Add Holding Steps

Status: planned
Summary: Build steps 1 and 4 of the Editorial add-holding sentence flow; step 2 (instrument search) and step 3 (quantity/price) are now implemented, steps 1 and 4 remain.

## Notes
Design Document §4.4: step 1 asks "What kind of holding?" with five monograms; step 2 shows a search field streaming results ("AAP" → "Apple, AAPL —"); step 4 is the acquired date as prose ("acquired today"), tap to edit. Every sentence fragment is tappable to jump back; "Add to collection" confirms, the Home hero digit-drifts to the new value and the new Portfolio row shows a brass ring for 2 s.

Step 2 shipped as [[Ticker Search in Add Holding]] (feature report #9): the sheet now streams real instrument results and the chosen instrument drives the preview and submit; the instrument fragment is tappable to search again. Still outstanding: step 1 (kind monograms), step 4 (acquired-date prose), the jump-back-to-each-fragment interaction, and the confirm/digit-drift/brass-ring finish.

## Related
- Page: [[Editorial Add Holding]]
- Features: [[Add Holding Live Preview]], [[Ticker Search in Add Holding]]
- Enhancements: [[Digit Drift Animation]]
- Bugs: [[Native Add Hardwired To Apple]]
