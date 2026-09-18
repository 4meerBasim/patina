# Style Switching

Status: shipped
Summary: Lets the user pick the Editorial or Native style at launch and get back to that choice by long-pressing the avatar on either Home.

## Details
`src/app/index.tsx` pushes `/editorial/onboarding` (Editorial, turn 1) or `/native` (Native, turn 2). The avatar on Editorial Home (`src/app/editorial/(tabs)/index.tsx`) and Native Home (`src/app/native/(tabs)/index.tsx`) calls `router.replace('/')` on long press; a normal tap opens that style's Settings.

## Related
- Page: [[Style Chooser]], [[Editorial Onboarding]], [[Editorial Home]], [[Native Home]]
- Bugs: none known
