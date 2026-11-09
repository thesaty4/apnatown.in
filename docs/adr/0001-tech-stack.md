# ADR 0001: Tech stack (working assumption)

## Status

Proposed — this records the assumption in
`docs/project/12-decisions-assumptions-open-questions.md` A-01; it is
**not yet confirmed** by a human decision-maker. See that file's
"Open questions" for the unresolved items this ADR depends on.

## Context

ApnaTown needs a stack that: supports a mobile-first, bilingual,
low-bandwidth web app; a rider PWA; a REST API with clear module
boundaries (`docs/architecture.md`); and India-specific integrations
(UPI, WhatsApp, SMS OTP) behind swappable ports, since none of those
providers are chosen yet.

## Decision

Adopt, as a working assumption, a pnpm monorepo:

- `apps/web`: Next.js (App Router), React, TypeScript strict, Tailwind
  CSS with design tokens from `docs/design-system.md`, TanStack Query,
  `react-hook-form` + `zod`, `next-intl` for EN/HI, Playwright + React
  Testing Library for tests.
- `apps/api`: Node.js + TypeScript, layered (controller -> service ->
  repository -> integration port, see `docs/architecture.md`), REST +
  OpenAPI, `zod`/`class-validator` for DTOs, a queue for background
  jobs (order/notification/media processing).
- `packages/shared`: types, zod schemas, enums/status maps, India
  formatters (money, date/time, distance, phone).
- `packages/ui`: design-system components (`docs/design-system.md`).
- Database: **undecided** — all data access goes through repository
  interfaces (`database.instructions.md`) so the engine can be chosen
  later without touching services or controllers.
- Auth: mobile OTP + httpOnly cookie sessions.
- Integrations as ports with fakes for tests: payments, SMS/OTP,
  WhatsApp Business, email, storage, maps, media processing
  (`integrations.instructions.md`).
- CI: GitHub Actions.

## Consequences

- Positive: strong typing end-to-end via shared zod schemas; clear
  module boundaries make per-module specs and `applyTo` globs
  straightforward; repository/port abstractions defer the database and
  provider decisions without blocking early feature specs and FE/BE
  scaffolding.
- Negative: Next.js App Router and the chosen state/query libraries add
  learning overhead; a layered Node.js API is more boilerplate than a
  minimal framework.
- Follow-up: a database engine ADR, a payments-provider ADR, and a
  WhatsApp/SMS-provider ADR are required before those modules can be
  implemented (see `docs/project/12-decisions-assumptions-open-questions.md`
  Q-16, Q-01, Q-04, Q-17).

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Single Express/Fastify app, no layering | Would blur module boundaries needed for per-module specs, `applyTo` globs and admin permission scoping |
| Remix or a non-React framework for `apps/web` | Next.js App Router has the broadest India-market tooling/ecosystem overlap with the chosen libraries; not re-litigated here |
| Firebase/BaaS instead of a custom `apps/api` | Repository-interface abstraction and the layered API give more control over the order state machine, OTP verification and admin RBAC invariants |
