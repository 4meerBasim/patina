# Net Worth Reveal Animation

Status: shipped
Summary: on a cold launch the editorial home develops rather than appears — the brass hairline draws itself, then the hero resolves and the rest staggers in behind it.

## Details

`src/components/reveal.tsx` holds three pieces.

`BrassRule` draws the hairline under the caption over 240ms on the Settle curve, animating `scaleX` with a `transformOrigin` anchored to the edge the layout starts from — so it draws left-to-right in English and right-to-left once `I18nManager.isRTL` is set, which is the mirroring the design document asks for, without a second code path.

`Reveal` is the only entrance the document allows: opacity from 0 with a 12px rise. The hero starts at 120ms and resolves over 480ms, while the deltas and then the period control with its chart follow at the 40ms stagger — four steps, inside the document's limit of six.

`useReveal` decides whether this mount is a cold launch. The last time the app left `active` is kept in module state rather than component state, because the question belongs to the app's launch and not to one component's lifetime: a cold launch finds it null and plays, and a resume inside five minutes finds a recent timestamp and renders everything settled.

Both editorial homes are wired, English and Arabic. The native home is deliberately untouched — the reveal is specified for screen 1c, and the native shell's own hero already arrives inside a card rather than against the page.

One part of the specification is approximated rather than implemented: the document asks for the hero to be blurred 12px as it resolves. React Native has no text blur, and an animated `BlurView` over the hero would mean a native layer whose `intensity` animation is unreliable on Android. Since the hero starts at zero opacity, the perceptible part of that beat is the fade and the rise, which are both in place; the blur is the one thing the screen does not do.

Reduce Motion is honoured throughout: durations go to zero and the rule renders fully drawn, matching the document's rule that chart draws appear complete.

## Related
- Feature: [[Digit Drift Animation]], [[Design Tokens and Fonts]], [[Money and Numeral Formatting]], [[Arabic RTL Home]], [[Privacy Blur on Launch]], [[Period and Segmented Selectors]], [[Newsreader Hero on Native Home]]
- Page: [[Editorial Home]], [[Native Home]]
