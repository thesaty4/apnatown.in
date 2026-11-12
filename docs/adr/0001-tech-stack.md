# ADR 0001: Tech stack

## Status

Superseded for implementation by the user-directed
[lean specs](../prompts/LEAN-SPECS.md) and
[architecture foundation](../../specs/_foundation/architecture.md).
Next.js/NestJS, PostgreSQL/Prisma and pg-boss without Redis are the
current baseline. The 2026-11-12 user decision selects the
[media/map integrations](../../specs/_foundation/media-and-maps.md).
Unrelated providers, private-storage vendor/residency, payment topology
and production hosting decisions remain separate.

## Context

ApnaTown needs a stack that: supports a mobile-first, bilingual,
low-bandwidth web app; a rider PWA; a REST API with clear module
boundaries (`docs/architecture.md`); and India-specific integrations
(UPI, WhatsApp, SMS OTP) behind swappable ports, since none of those
providers are chosen yet.

## Decision

Use the foundation's pnpm workspace/package and version-pinning contracts:

- `apps/web`: Next.js (App Router), React, TypeScript strict, Tailwind
  CSS with design tokens from `docs/design-system.md`, mandatory
  TanStack React Query (`@tanstack/react-query`) for client API integration
  per the [shared contract](../../specs/_foundation/frontend-shared.md#api-integration-with-react-query),
  `react-hook-form` + `zod`, `next-intl` for EN/HI; manual UI/API verification and existing
  lint/type-check/build checks, not automated test files.
- `apps/api`: NestJS + TypeScript, layered (controller -> service ->
  repository -> integration port, see `docs/architecture.md`), REST +
  OpenAPI from shared `zod` DTOs, pg-boss plus transactional outbox for background
  jobs (order/notification/media processing).
- `packages/shared`: types, zod schemas, enums/status maps, India
  formatters (money, date/time, distance, phone).
- `packages/ui`: design-system components (`docs/design-system.md`).
- Database: **PostgreSQL + PostGIS, pg_trgm, unaccent**, with Prisma
  repository adapters and reviewed Prisma migrations. Ports isolate
  persistence from domain logic; there is no multi-engine requirement.
- Auth: mobile OTP + httpOnly cookie sessions.
- Integrations as ports with approved local adapters: payments, SMS/OTP,
  WhatsApp Business, email, storage, maps, media processing
  (`integrations.instructions.md`).
- Public-purpose images: Cloudinary behind Media/StoragePort and the
  same-origin authorization gateway; private KYC/evidence/exports stay
  separate. Video: YouTube/Instagram links only, no direct uploads.
- Maps: shared client-only Leaflet (BSD-2-Clause), Geoman Free (MIT),
  policy-compliant OpenStreetMap tiles. Alternatives and switch conditions,
  configuration and capacity/licensing limits live in the
  [canonical contract](../../specs/_foundation/media-and-maps.md).
- CI: GitHub Actions.

## Consequences

- Positive: strong typing end-to-end via shared zod schemas; clear
  module boundaries make per-module specs and `applyTo` globs
  straightforward; repository/integration ports support safe local
  verification and defer unchosen external providers without blocking the
  local scaffold.
- Negative: Next.js App Router and the chosen state/query libraries add
  learning overhead; a layered Node.js API is more boilerplate than a
  minimal framework.
- Follow-up: configure and verify the selected media/map integrations;
  confirm the remaining providers and production policies before enabling
  their adapters. Local verification stays explicit and isolated; provider
  selection does not promise unlimited free hosting.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Single Express/Fastify app, no layering | Would blur module boundaries needed for per-module specs, `applyTo` globs and admin permission scoping |
| Remix or a non-React framework for `apps/web` | Next.js App Router has the broadest India-market tooling/ecosystem overlap with the chosen libraries; not re-litigated here |
| Firebase/BaaS instead of a custom `apps/api` | Repository-interface abstraction and the layered API give more control over the order state machine, OTP verification and admin RBAC invariants |
