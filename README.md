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
npx --yes pnpm@10.34.9 db:migrate
npx --yes pnpm@10.34.9 db:seed   # optional local demo data
npx --yes pnpm@10.34.9 dev
```

The launcher creates private local-only credentials without overwriting existing
configuration. Web runs on `localhost:3000`, API on `localhost:3001`, and internal
worker probes default to `localhost:3002` (`WORKER_PROBE_PORT` in `.env.local`;
choose an unused port if another local process owns it). `db:down` stops the local database **without
deleting its volume**. No Redis or real external providers are started.

Docker PostgreSQL is bound to `127.0.0.1:5434` to avoid existing Windows/WSL
PostgreSQL services on 5432/5433. Docker Desktop must be running with WSL
integration enabled for this distro.

Run `db:migrate` after pulling new migrations and before starting the app:
it applies the reviewed schema changes, installs/upgrades pg-boss, provisions
the outbox queue and grants its runtime permissions. `db:up` alone does not
perform those steps. The command does not reset or replace the database.
`db:seed` loads local/test-only demo data adapted from
[`10-sample-data.json`](docs/design-context/10-sample-data.json): the Padrauna
city and its seven areas, one owner account per sample business (with the
`customer` plus `vendor`/`provider` role), the 22 approved sample shops and
service providers with category, hours and settings, and their 13 link
videos (10 approved; one each pending, rejected and removed). It also provisions
**53 products with 53 inventory rows, 36 category-scoped product subcategories,
and 38 individual services** (7 from shops, 31 from providers). These are source
rows for the existing discovery projections, not API/UI fallback data.

Run it explicitly after `db:migrate`, including the listing/read-projection
migrations; it needs the compiled API from `pnpm generate` (also run by
`pnpm build`/`pnpm dev`), otherwise it fails with `API_BUILD_REQUIRED`.
There is **no startup seed**. The unchanged target guard requires
`APP_ENV=local|test`, `127.0.0.1:5434`, matching runtime/migration
`apnatown_local` URLs and the `apnatown_shadow` migration target. The explicit
seed now connects as the validated `apnatown_migrator` for isolated demo
provisioning: runtime has SELECT-only access to products/inventory/services,
and those grants are **not widened**. Credentials remain private environment
configuration; output contains counts only. No schema/grant changes are
performed by seeding. Migration and seed execution for this extension are
deferred to a separately authorized local run.

It is insert-only and transactional, with the existing advisory lock and
stable fixture IDs. Existing businesses and videos are still skipped, but
missing listings are backfilled for an existing fixture business only when
its ID, slug, kind, resolved owner and owner's phone hash match; deleted
businesses/owners and unrelated slug/owner conflicts are not adopted.
Existing listing IDs/slugs/SKUs are skipped without updates. Inventory is
created only alongside a newly inserted product: reruns never replenish stock
or restore missing inventory for an existing product. Existing approval,
account visibility, taxonomy activation, settings and listing edits remain
unchanged. Counts above describe the full source fixture, not guaranteed
inserted/public counts on an edited database.

Categories reuse the reference migration identities; each service resolves
its own category + subcategory (not its provider's category or a bare slug).
Only missing product subcategories are added; their EN-only reference labels
are also used in the required Hindi column, without invented translations.
Product/service prices convert exactly to integer paise. Free services use
`fixed` zero; `/ sq ft`, `/ plate`, `/ unit` and `/ chair` map to existing
`sq_ft`, `plate` and `unit` values. The three `/ month` quotes use `enquiry`
with null amounts/unit because the schema has no monthly unit; original
service quote text is retained in the description. Service Gallery preference
comes from the existing business setting; missing settings skip that service.

Discovery still applies current owner/business/city/taxonomy visibility.
In particular, the current `businesses_public_context` projection requires a
PRODUCT-category membership, while reference providers have SERVICE
memberships. Their 31 service rows are provisioned but remain excluded by that
projection unless legitimate qualifying memberships already exist. This seed
does not add false memberships or relax visibility. With unchanged reference
shops, 53 products and the 7 shop services have the required source visibility;
active filters can still reduce those results.

No images are generated/uploaded: reference emoji media is not a storage
asset. Ratings/reviews, offers, subscriptions/payments, verified experience,
provider expertise, variants, delivery settings, orders, likes, shares,
comments, follows and social links are not added by this extension. Selected
product featuring flags grant no Premium entitlement. Only the
YouTube sample videos play; the Instagram sample IDs are placeholders, so those
reels will not play. Sample owners sign in through the normal OTP
flow with their fictional `98765xxxxx` sample numbers. Seeding does not fix
missing translations or queue connection failures.

If an earlier local attempt at `20261112105000_media_reports` failed with
duplicate `media_reports_resolution_check`, the corrected SQL uses a distinct
name for its multi-column check. Before retrying, have a human confirm that
the failed transaction left no `media_reports` table/indexes and no applied
steps; only then use Prisma `migrate resolve --rolled-back` for that exact
failed attempt and rerun `pnpm db:migrate`. Never mark the failed SQL applied
or reset the database to bypass it.

`pnpm db:studio` starts [Prisma Studio](https://www.prisma.io/studio) for the
local database and prints its URL (default `http://localhost:51212`, bound to
`127.0.0.1`). It is local/test-only and connects as the migration owner so every
table is visible, but each session starts with
`default_transaction_read_only=on`. That prevents accidental edits, not a
deliberate `SET` from Studio's SQL console. Studio has no login: run it only
while needed and stop it with Ctrl+C. Change data through the app or
`db:seed`, because direct edits bypass state machines, encryption and audit
logging. Phone/email columns show stored ciphertext and lookup hashes.

Feature translations belong in
[`reviewed-additions.json`](apps/web/src/shared/i18n/reviewed-additions.json);
run `pnpm i18n:generate` to emit both EN/HI catalogs. `pnpm dev` regenerates
and builds current sources; `pnpm start` runs existing build artifacts and
requires a fresh `pnpm build` to include new changes.

With `APP_ENV=local`, the API also serves Swagger UI at
`http://localhost:3001/api/docs` (raw spec: `/api/docs/openapi.json` and
`/api/docs/openapi.yaml`). It is never mounted outside local. Browser
"Try it out" writes are rejected by the API's Origin/CSRF check; use the web
app or `curl` for those. `pnpm api:openapi` regenerates the committed
`packages/api-client/openapi.json`.

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

## Selected media and map integrations

The [implementation contract](specs/_foundation/media-and-maps.md) selects:

- **Images:** Cloudinary for public-purpose images through the backend's
  validated upload and authorized delivery paths. Private KYC, evidence and
  account exports stay separate.
- **Video/Reels:** YouTube videos/Shorts and Instagram Reels/public-post
  embeds; direct video-file upload is disabled.
- **Maps:** Leaflet + OpenStreetMap with Geoman Free for zone editing.
  Attribution and tile-use limits apply; free libraries do not guarantee
  unlimited free hosting or an SLA.

These are specified integrations, not installed/configured runtime features.
See the contract for planned environment keys and manual acceptance checks.

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
