# foundation

Base rules every project inherits. Clone this repo (or add as a submodule / git subtree) into a project so Claude and I share the same conventions across everything I build.

## Contents

- [`github.md`](./github.md) — branching, merging, review rules
- [`agents.md`](./agents.md) — how to use Claude agents and the standard task flow
- [`code.md`](./code.md) — code style and quality rules
- [`design.md`](./design.md) — visual design rules (no gradients, no emojis, etc.)

## How to use in a project

At the top of the project's `CLAUDE.md`, reference these files:

```
@foundation/github.md
@foundation/agents.md
@foundation/code.md
@foundation/design.md
```

Then add project-specific rules below. Foundation covers the defaults — the project's own `CLAUDE.md` overrides only where it needs to.
