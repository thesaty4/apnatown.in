---
applyTo: "apps/api/src/**/repositories/**,**/migrations/**"
---

# Database

The engine is **undecided** (`docs/adr/0001-tech-stack.md`,
`docs/project/12-decisions-assumptions-open-questions.md`). These rules apply regardless of
engine; schema design itself comes in a later stage — this file is
placeholder guidance that is already valid and enforceable today.

## Repository-only data access

- `apps/api/src/**/repositories/**` is the **only** place that imports
  a database driver/ORM; services and controllers call repository
  interfaces only (`backend.instructions.md`,
  `solid-dry-design.instructions.md`).
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
- Every migration is reversible in principle (a corresponding down path
  documented, even if not auto-run in production) and reviewed for data
  loss risk before merge.
- Use `.github/skills/db-migration/SKILL.md` for the step-by-step
  recipe and skeleton.

## Naming

- Tables/collections: `snake_case`, plural (e.g. `orders`,
  `delivery_jobs`); columns: `snake_case`; foreign keys:
  `<singular_entity>_id` (e.g. `shop_id`, `rider_id`).
- Enum-like status columns use the exact string values from
  `docs/project/05-domain-model.md` — don't invent synonyms.

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

## Next stage

Schema design (tables, relations, actual engine choice) is out of
scope for this setup; it is tracked in
`docs/project/12-decisions-assumptions-open-questions.md` Q-16 and
will follow in `docs/adr/000X-database-engine.md` plus per-module
`specs/*/be/*.md`.
