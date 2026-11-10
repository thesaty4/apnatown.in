---
applyTo: "apps/api/src/**/infrastructure/**,apps/api/src/shared/persistence/**,apps/api/prisma/**,**/migrations/**"
---

# Database

Use **PostgreSQL + PostGIS, pg_trgm and unaccent**, Prisma Client and
Prisma Migrate. Canonical ownership, wire types, runtime tables and
bootstrap: `specs/_foundation/data-model.md`. Each module's BE spec
defines its domain columns/constraints; don't duplicate that schema here.

## Repository-only data access

- Only owning repository adapters under module `infrastructure/`
  and shared persistence infrastructure import Prisma. Services and
  controllers use ports, never another module's repositories.
- One repository per aggregate (e.g. `OrderRepository`,
  `ProductRepository`), matching the 21 modules in
  `docs/architecture.md`.

## Parameterized queries

- Every query uses parameter binding; never string-concatenate or
  template-interpolate user input into a query
  (`security.instructions.md`).
- Dynamic sort/filter is built only from an allow-listed field-to-column
  map, never from a raw client field name.

## Forward-only migrations

- Migrations only move forward; don't edit a migration already merged
  to `main` — write a new one to fix it.
- API owns `apps/api/prisma/migrations`; reviewed SQL enables extensions.
  Use a separate migration role; runtime cannot perform DDL or mutate
  Audit history. Never use `db push` as migration evidence.
- Document forward repair/restore and data-loss risks; destructive
  changes require human sign-off. Do not promise automatic down
  migrations or restoration of irreversibly erased data.
- Use `.github/skills/db-migration/SKILL.md` for the step-by-step
  recipe and skeleton.

## Naming

- Tables: `snake_case`, plural (e.g. `orders`,
  `delivery_jobs`); columns: `snake_case`; foreign keys:
  `<singular_entity>_id` (e.g. `shop_id`, `rider_id`).
- Status columns use the owning BE spec/shared schema's exact values,
  reconciled with the reference state machine; don't invent synonyms.

## Indexes

- Every field used as an Explore/Search/admin-list filter or sort
  (`domain-catalog-search.instructions.md`, `backend.instructions.md`
  pagination) has a supporting index; composite indexes match the most
  common filter+sort combinations, not one index per single column
  blindly.
- Foreign keys are indexed.

## Soft delete

- User-facing deletable records (products, services, reviews, videos)
  use a soft-delete flag/timestamp, not a hard delete, so moderation
  history, order history, and audit trails stay intact
  (`docs/project/04-business-rules.md` BR-12, BR-14).
- Hard delete is reserved for explicit DPDP erasure requests (BR-14),
  applied narrowly to the requester's own PII, not cascaded
  destructively through shared records (e.g. an order a vendor still
  needs for accounting).

## PII encryption

- Encrypt at rest: KYC document references, bank/UPI payout details,
  full phone numbers where not already masked at the application layer.
- Decryption only happens inside the repository/service boundary that
  needs it, gated by the same role+ownership+scope checks as any other
  access (`security.instructions.md`).

## No raw SQL outside repositories

- Report/analytics queries (AD13, SA6) still go through a repository
  method, even if they're read-only and complex — never an inline raw
  query in a controller or a one-off script against production data.

## Seed and test isolation

Follow `specs/_foundation/data-model.md` for extension checks, pg-boss
schema setup, idempotent synthetic seeds and isolated suite databases.
No seed/reset on API startup; destructive commands must verify an
explicit local/test target. Never seed real PII or an authentication bypass.
