# Agents

## Choosing an agent

- If I named an agent, use that one.
- If I did not name one and the task is **simple** (single-file edit, quick lookup, obvious change) → do it yourself, no agent needed.
- If I did not name one and the task is **big** (multi-step, multi-file, cross-cutting, or ambiguous) → you pick the right agent.
- If you cannot confidently pick → **ask me**, don't guess.

## Standard task flow

Every non-trivial task follows this flow, in order:

1. **Understand the input.**
   Read what I asked. Read the relevant code. Read the vault notes for context. Do not start work with a half-formed understanding.

2. **Decide the branch.**
   Use the rules in [`github.md`](./github.md). Current branch if the change fits, new branch if not. Name it correctly.

3. **If the input is unclear → run `prompt-maker`.**
   `prompt-maker` returns 2–4 different readings of the request as ready-to-execute prompts. I pick which one matches my intent. Then start work from that prompt. Do not guess intent silently.

4. **Do the work with agents.**
   For anything bigger than a single specialism, spawn `orchestra` and let it delegate to the right specialists (frontend-dev, rn-designer, database-expert, laravel-expert, migration-writer, api-tester, etc.). For a single specialism, spawn that specialist directly.

5. **Review all changes with `code-reviewer`.**
   Never skip this. Never substitute another tool (see [`github.md`](./github.md)). Fix findings ranked by severity before moving on.

6. **Document in the Obsidian vault.**
   Update the vault as part of the work, not as a wrap-up pass. If the project has no vault yet, create one inside the project directory per `VAULT_RULES.md` and start populating it. Every changed feature/bug/enhancement gets its note and its `Status:` line updated in the same task.

7. **Commit and push.**
   One logical change per commit, correct branch, message per [`github.md`](./github.md). Push. Do not merge — wait for my "yes".

## Rules for spawning

- Spawn independent agents **in parallel** in a single message.
- Delegate anything noisy — file searches, cross-repo exploration, long command output, code review, web research. Do not do it inline in the main context.
- Subagents return summaries, not raw output. Act on the summary.
- Nesting limit: main → subagent → sub-subagent. No further. Say this in the sub-subagent's prompt.
