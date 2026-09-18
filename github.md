# GitHub rules

## Branching

Before making any change, decide whether it fits the current branch or needs a new one.

- If the change is in scope of the current branch → work on it directly.
- If it is a different concern (a new feature while on a fix branch, a fix while on a feature branch, etc.) → create a new branch first, then work.
- Never mix unrelated changes on the same branch.

### Branch naming

Always `<type>/<short-kebab-name>`. Types:

| Type | When to use |
|---|---|
| `feature/` | new user-facing capability |
| `fix/` | bug fix |
| `refactor/` | internal restructuring, no behavior change |
| `chore/` | tooling, deps, configs, non-user-facing housekeeping |
| `docs/` | documentation only |
| `style/` | formatting, whitespace, non-semantic UI polish |
| `test/` | adding or fixing tests only |

Rules for the name:

- kebab-case, lowercase, no spaces, no underscores
- short — 2 to 5 words describing the change, not the ticket number
- no author names, no dates
- examples: `feature/kurdish-locale`, `fix/login-crash-ios`, `refactor/auth-service`, `chore/bump-expo-52`

## Merging

- **Never merge without an explicit "yes" from me.** Not even trivial merges. Not even after a green review. Always ask, wait for the sign, then merge.
- Standard flow: feature → stage → dev → main. Do not skip levels.
- Never force-push, never `reset --hard`, never rewrite published history without explicit permission.

## Code review

- The only reviewer is the `code-reviewer` agent.
- **Never install, enable, request, or wait for CodeRabbit, Codium, Greptile, Sourcery, or any other automated/AI review tool.** If a repo already has one wired into CI, tell me — do not use its output as a review signal.
- If a human reviewer is needed, I will bring one in. Do not solicit one.

## Commits

- One logical change per commit. If a diff mixes two concerns, split it.
- Commit message: imperative, present tense, no trailing period. Example: `add kurdish locale to i18n loader`.
- No emojis in commit messages.
- Never skip hooks (`--no-verify`, `--no-gpg-sign`) unless I explicitly say so. If a hook fails, fix the underlying cause.

## Pushing

- Push freely to feature/fix/chore branches.
- Never push directly to `main`, `dev`, or `stage`. Those only change via merge, and only after I say "yes".
