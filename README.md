# ApnaTown.in

A hyperlocal marketplace and local business discovery platform for
Indian towns — launching in Padrauna, Kushinagar, Uttar Pradesh.
Customers discover shops and service providers by location, order
products or send service enquiries, watch short videos/reels, and rate
and review everything. See [docs/PROJECT.md](docs/PROJECT.md) for the
full product context.

> **Status:** this repository currently contains the AI development
> lifecycle setup only (instructions, agents, skills, specs scaffolding,
> docs). Application code (`apps/`, `packages/`) is added feature by
> feature after a spec exists — see [docs/FEATURE_INVENTORY.md](docs/FEATURE_INVENTORY.md).

## How the AI workflow works

This repository is built with GitHub Copilot coding agents following a
spec-driven lifecycle: every feature in
[docs/FEATURE_INVENTORY.md](docs/FEATURE_INVENTORY.md) gets a backend
and frontend spec under `specs/<module>/{be,fe}/` before it is
implemented, is reviewed against product invariants and security rules,
and is opened as a PR for a human to review and merge. Agents never
merge their own work.

Start here, in order:

1. [AGENTS.md](AGENTS.md) — read order, lifecycle, agent roster, hard
   limits.
2. [.github/copilot-instructions.md](.github/copilot-instructions.md) —
   top-priority repo-wide rules.
3. [docs/PROJECT.md](docs/PROJECT.md) — product context and invariants.
4. [docs/architecture.md](docs/architecture.md) — module map.
5. [.github/instructions/](.github/instructions) — path-specific rules.
6. [.github/agents/](.github/agents) — what each agent does.
7. [.github/skills/](.github/skills) — step-by-step recipes for
   recurring tasks.

## Repository layout

See [docs/PROJECT.md](docs/PROJECT.md) section "Repository map" for the
full layout and module list.

## Contributing

- Read [AGENTS.md](AGENTS.md) and [SECURITY.md](SECURITY.md) first.
- Every change needs a spec (`specs/<module>/`) and must keep every
  `.github/instructions/*.instructions.md` file under 4,000 characters
  — run `node scripts/validate-ai-setup.mjs` before opening a PR.
- Humans review and merge every PR; agents open PRs but never merge.
