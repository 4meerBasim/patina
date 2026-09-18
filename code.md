# Code rules

## No AI-flavored writing

Code and comments should read like a human wrote them, not like a model padded them out.

- No section-header comments like `// === Main logic ===`, `// --- Helpers ---`.
- No restating what the code does in prose above it (`// This function loops through users and returns their names`). If the name and signature don't say it, rename them.
- No "AI-safe" over-explanation: don't warn about hypothetical edge cases in comments, don't apologize for shortcuts, don't narrate decisions.
- No trailing summaries in files or PRs written for the model's benefit.

## Comments

Default: **write none.**

Only write a comment when the *why* is non-obvious and a reader would be surprised without it:

- a hidden constraint (`// mutex must be held before calling`)
- a workaround for a specific bug (`// safari 17.4 crashes without this cast — WebKit bug 12345`)
- a subtle invariant that isn't visible from the types

Never write:

- comments that restate the code
- comments referencing the current task/PR (`// added for the login flow`)
- multi-line block comments explaining a function — the name and types should do it
- TODO comments without an owner and a reason

## No half-finished work

- No placeholder functions that `throw new Error('not implemented')`.
- No stubbed-out branches with `// TODO: handle this later`.
- No commented-out code left in the file. Delete it — git has the history.
- If the task can't be completed, say so in the reply. Don't leave partial code that looks done.

## No premature abstraction

- Three similar lines is fine. Don't extract a helper for two.
- Don't design for hypothetical future requirements.
- Don't add configuration options nothing calls.
- Don't add wrappers, adapters, or facades over things that already have a clean interface.

## No defensive noise

- Don't add try/catch that catches and re-throws with no added context.
- Don't add null checks for values a type guarantees are non-null.
- Don't validate inputs from internal callers — only at system boundaries (user input, external APIs, network).
- Don't add feature flags or backwards-compat shims for code that hasn't shipped yet.

## Naming

- Descriptive, not clever. `getUserById` over `fetchU`.
- Boolean names read as questions: `isReady`, `hasAccess`, `shouldRetry`.
- No Hungarian notation, no type prefixes (`strName`, `IUser`).
- File names match their primary export.

## Files

- Prefer editing existing files. Don't create new ones unless the task actually needs one.
- Never create README, CHANGELOG, or docs files unless asked.
- One primary concern per file.
