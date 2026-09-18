# Design rules

## No gradients

- No background gradients, no gradient text, no gradient borders, no gradient buttons.
- No `linear-gradient`, `radial-gradient`, `conic-gradient`, no `LinearGradient` from `expo-linear-gradient`.
- If depth is needed, use a solid color with a shadow or an outline. Not a gradient.

## No emojis

- No emojis in UI text, headings, buttons, empty states, toasts, alerts, or error messages.
- No emojis in the codebase — comments, commit messages, PR titles, log lines.
- No emojis in documentation files.
- If a visual marker is needed, use an icon from the project's icon library (lucide, phosphor, material, etc.).

## No "AI-generated" look

- No purple-to-pink glow, no "starburst" or "sparkle" motifs, no glassmorphism used as identity.
- No robot avatars, no chat-bubble empty states unless the product actually is a chat app.
- No animated gradient borders around inputs to signal "AI".
- Products should look like the domain they're in (legal, finance, health, e-commerce), not like every LLM demo.

## Color

- Use a defined palette. Every color used must be a token from the project's design system, not an inline hex.
- Neutral gray scale + one primary + one accent + semantic colors (success/warn/error/info). That's usually enough.
- Text on background must meet WCAG AA contrast (4.5:1 body, 3:1 large text). Don't ship low-contrast.

## Spacing

- Use a scale (4 / 8 / 12 / 16 / 24 / 32 / 48). No arbitrary values like `padding: 13px`.
- Consistent gaps within a group; larger gaps between groups. Hierarchy comes from spacing before it comes from color.

## Typography

- One typeface for UI, one for headings max. Don't stack three fonts.
- Fixed type scale — no ad-hoc `font-size: 17.5px`.
- Line height: 1.4–1.6 for body, 1.1–1.3 for headings.
- Never justify body text on screen.

## Motion

- Purposeful only. Motion should communicate state change, not decorate.
- Durations 150–300ms for UI transitions. Longer only for full-page transitions.
- Respect `prefers-reduced-motion` — disable non-essential motion when the user asks.

## Accessibility (baseline, not optional)

- Every interactive element has a label — icon buttons need `accessibilityLabel` / `aria-label`.
- Tap targets ≥ 44×44 pt on mobile.
- Focus states visible on every focusable element on web.
- RTL layouts (Arabic, Kurdish) must mirror correctly — no hardcoded `left` / `right`, use `start` / `end`.
