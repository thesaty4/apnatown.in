# ApnaTown.in

A hyperlocal marketplace and local business discovery platform for
Indian towns — launching in Padrauna, Kushinagar, Uttar Pradesh.
Customers discover shops and service providers by location, order
products or send service enquiries, watch short videos/reels, and rate
and review everything. See [docs/PROJECT.md](docs/PROJECT.md) for the
full product context.

> **Status:** C00 scaffolds plus incremental C01/C02 shared backend/database
> foundations: checked money, cursors, errors, correlation, event construction,
> shared runtime migrations, transactional outbox writes, a bounded pg-boss
> relay and an unregistered command-idempotency core with trusted request
> hashing. Domain features, consumers, domain migrations/seeds and authentication still follow in the
> owning slices. This is not a production-ready
> marketplace; see the [foundation contracts](specs/_foundation/architecture.md).

## Local development

Use Node from [.node-version](.node-version) and pinned pnpm:

```sh
npx --yes pnpm@10.34.9 install --frozen-lockfile
npx --yes pnpm@10.34.9 env:local
npx --yes pnpm@10.34.9 generate
npx --yes pnpm@10.34.9 db:up
npx --yes pnpm@10.34.9 dev
```

The launcher creates private local-only credentials without overwriting existing
configuration. Web runs on `localhost:3000`, API on `localhost:3001`, and internal
worker probes on `localhost:3002`. `db:down` stops the local database **without
deleting its volume**. No Redis or real external providers are started.

New local configuration generates `IDEMPOTENCY_HASH_KEY` once. Existing
configuration is preserved: provision this required API/worker-only value
with 32 cryptographically random bytes encoded as 64 lowercase hex characters
before the next launch. Missing/invalid values fail explicitly; do not reuse
the cursor key or regenerate it on startup. Retention/rotation rules are in
the [idempotency contract](specs/_foundation/data-model.md#shared-runtime-persistence).

`lint`, `typecheck`, `build` and `check:generated` validate the scaffold.
Follow the [verification policy](.github/instructions/testing.instructions.md):
do not create FE/BE/DB automated test files or runners. Existing suites and
test-only support files have been removed. These commands do not replace
manual behavioral, accessibility or security verification. Readiness remains
unavailable until the specified database/shared-runtime prerequisites exist;
liveness alone is not proof of readiness.

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
3. [docs/PROJECT.md](docs/PROJECT.md) — index into the product
   knowledge base (`docs/project/`): what to build, which rules apply,
   how it should look and read.
4. [docs/architecture.md](docs/architecture.md) — module map.
5. [.github/instructions/](.github/instructions) — path-specific rules.
6. [.github/agents/](.github/agents) — what each agent does.
7. [.github/skills/](.github/skills) — step-by-step recipes for
   recurring tasks.

## Repository layout

```
AGENTS.md                      agent-wide rules and read order
README.md                      this file
docs/                          product knowledge base, architecture, design, AI governance
  PROJECT.md                   index into docs/project/
  project/                     product knowledge base (01-13, see docs/project/README.md)
specs/                         per-module BE/FE feature specs
apps/web/                      Next.js frontend scaffold
apps/api/                      NestJS API and worker scaffold
packages/shared/               shared types and schemas
packages/ui/                   design tokens and shared primitives
packages/api-client/           generated OpenAPI client
.github/copilot-instructions.md  top-priority repo-wide rules
.github/instructions/          path-specific instructions
.github/agents/                agent definitions
.github/skills/                step-by-step recipes
.github/prompts/               reusable task prompts
scripts/validate-ai-setup.mjs        validates the AI lifecycle setup
scripts/validate-project-docs.mjs    validates the product knowledge base
```

Module map (used by `docs/architecture.md`, specs, and `applyTo`
globs): `auth, users, catalog, businesses, products, services, search,
offers, cart-checkout, orders, delivery, payments, reviews,
media-videos, engagement, notifications, communications, geo, admin,
audit, settings`.

## Contributing

- Read [AGENTS.md](AGENTS.md) and [SECURITY.md](SECURITY.md) first.
- Every change needs a spec (`specs/<module>/`) and must keep every
  `.github/instructions/*.instructions.md` file under 4,000 characters
  — run `node scripts/validate-ai-setup.mjs` before opening a PR.
- Humans review and merge every PR; agents open PRs but never merge.
