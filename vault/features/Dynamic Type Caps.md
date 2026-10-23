# Dynamic Type Caps

Status: shipped
Summary: text scales with the system text size, each role to its own ceiling, and the hero figures abbreviate rather than grow past theirs.

## Details

`TypeCap` in `src/constants/theme.ts` carries the design document's per-role ceilings: titles and headings to 1.6×, the hero and display figures to 1.3×, and `large` at 1.2× as the point where layouts respond rather than only grow. Body, secondary, caption and data roles have no cap, because the document asks them to scale all the way to AX5.

`src/lib/type-scale.ts` reads the scale reactively through `useWindowDimensions().fontScale`, so a change in the system settings re-renders rather than waiting for a remount. It exposes the two questions screens actually ask: `useIsLargeType` and `useCompactHero`.

**The caps.** The three net-worth heroes — editorial English, editorial Arabic and native — pass `maxFontSizeMultiplier={TypeCap.hero}`, including through `DriftingFigure`, which now carries the cap down to both the invisible width-holding copy and the animated glyph so a capped figure cannot drift out of its own cell. The editorial tab-bar labels cap at the heading ceiling.

**The abbreviation.** Past 1.3× the hero stops growing and shortens instead. `formatCompactCurrency` and `formatCompactNumber` in `src/lib/money.ts` abbreviate at a million, a billion and a trillion to two decimals — `$1.28M` — and leave anything smaller alone, since there is nothing to gain below that. `formatCurrency` gained a `unit` option so the symbol placement stays in the one function that knows about it: the unit sits with the digits and inside the symbol, which gives `$1.28M` in English and `١٫٢٨ مليون $` in Arabic. The unit word follows the *locale* rather than the numeral system, so an Arabic UI showing Latin digits still reads `مليون`. Twelve cases cover it.

**The layout responses.** At Large and above, the editorial tab bar shows its labels under the icons — the strings were already there as accessibility labels — and the Provenance block on the holding detail stops being a two-column definition list and stacks each label above its value, which is the pair that would otherwise collide first.

## Related
- Feature: [[Design Tokens and Fonts]], [[Money and Numeral Formatting]], [[Digit Drift Animation]], [[Editorial Tab Bar]], [[Transactions and Lots]], [[Arabic RTL Home]]
- Page: [[Editorial Home]], [[Native Home]], [[Editorial Holding Detail]], [[Editorial Portfolio]]
