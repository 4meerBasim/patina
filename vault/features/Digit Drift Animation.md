# Digit Drift Animation

Status: shipped
Summary: when a figure changes, only the digits that differ move — the old glyph drifts 24px in the direction of the change while the new one arrives from the opposite side.

## Details

`src/components/drifting-figure.tsx` splits a formatted figure into one cell per glyph. Each cell holds an invisible in-flow copy that fixes its width, and an absolutely positioned animated copy keyed on the glyph — so React mounts and unmounts only the cells whose character actually changed, and Reanimated's entering and exiting animations do the cross-fade. Unchanged digits never re-render, which is exactly the design document's rule.

The direction comes from the figure itself: pass `amount` and the component compares it with the previous value, drifting up for an increase and down for a decrease. `tailStyle` dims the cents, which both heroes do.

Motion lives in tokens now rather than in each screen. `Motion` in `src/constants/theme.ts` carries the design document's two curves — Settle `cubic-bezier(.2,.8,.2,1)` and Drift `cubic-bezier(.4,0,.2,1)` — with its durations: 220ms for a state change, 320ms for layout, 480ms for the reveal, a 40ms stagger, a 12px rise and the 24px digit drift. Digit drift uses Drift at 220ms, all digits simultaneously, no odometer and no count-up.

Reduce Motion is honoured through `useReducedMotion`: durations go to zero and the offset to nothing, leaving the cross-fade only, which is what the document specifies.

Wired at the three places the document names: the editorial home hero in both English and Arabic (the Arabic figure keeps its isolate marks and its trailing currency word), the native home hero, and the add-holding live preview, whose prose line became a baseline-aligned row so the figure can be a view inside it.

The fourth site, the holding chart's scrub header, arrives with [[Holding Chart Scrubbing and Markers]] — the component is what that header will cross-fade through. Masked figures skip the drift entirely: there is nothing to animate behind the bullets of [[Privacy Blur on Launch]].

## Related
- Feature: [[Money and Numeral Formatting]], [[Design Tokens and Fonts]], [[Add Holding Live Preview]], [[Newsreader Hero on Native Home]], [[Privacy Blur on Launch]], [[Arabic RTL Home]], [[Dynamic Type Caps]]
- Page: [[Editorial Home]], [[Native Home]], [[Editorial Add Holding]], [[Editorial Holding Detail]]
- Enhancement: [[Holding Chart Scrubbing and Markers]], [[Net Worth Reveal Animation]], [[Conversational Add Holding Steps]]
