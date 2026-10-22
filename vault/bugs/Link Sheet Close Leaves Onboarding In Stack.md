# Link Sheet Close Leaves Onboarding In Stack

Status: fixed
Found: src/app/editorial/link.tsx (grabber close)
Summary: Closing the link sheet with `router.replace('/editorial')` left the onboarding screen underneath in the stack.

## Details
The grabber close called `router.replace('/editorial')`, which swapped the top route but kept onboarding beneath it. Fixed by calling `router.dismissAll()` then `router.replace('/editorial')` so Home is the only screen in the editorial stack. Related: the avatar long-press on both homes now uses `router.dismissTo('/')` instead of `router.replace('/')` so it pops back to the existing chooser rather than stacking a second one.

## Related
- Page: [[Editorial Account Linking]], [[Editorial Home]], [[Editorial Onboarding]], [[Style Chooser]]
