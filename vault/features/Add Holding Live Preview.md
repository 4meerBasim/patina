# Add Holding Live Preview

Status: shipped
Summary: The add-holding sheet recomputes the new holding's value and its share of net worth on every keystroke, in both styles.

## Details
Both sheets are transparent modals that slide up over 400 ms on the Settle curve; value = quantity × price (price falls back to $248.20 when empty), weight is against $1,284,930.42. Nothing is saved.
- Editorial `src/app/editorial/add.tsx` (1f): "A stock — Apple, AAPL —" sentence, Quantity (default 50, autofocused) and Price fields, "That's $X · Y% of net worth", "3 of 4 · acquired date next"; Next and the grabber close the sheet.
- Native `src/app/native/add.tsx` (2d): asset-type segmented control, Security / Shares / Price per share / Acquired rows, "Adds $X · Y% of net worth" footnote, Account and Notes rows; Cancel and Add both dismiss.

## Related
- Page: [[Editorial Add Holding]], [[Native Add Holding]]
- Enhancements: [[Conversational Add Holding Steps]], [[Digit Drift Animation]]
- Bugs: none known
