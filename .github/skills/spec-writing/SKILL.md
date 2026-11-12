---
name: spec-writing
description: Lean recipe for architect to write module BE and FE specs with the required React Query API contract (spec files only, no extra documentation upkeep).
---

# Spec writing

Used by `.github/agents/architect.agent.md` in specification mode. Governing prompt and
templates: `docs/prompts/LEAN-SPECS.md`.

## Scope (no over-engineering)

- Write **only** the requested spec files in `specs/<module>/{be,fe}/`.
- Do not update inventories, progress trackers, registers, lessons or
  other docs unless the user explicitly asks.
- Build only what the features need; no speculative infrastructure
  (microservices, CQRS, event sourcing, GraphQL, external search,
  plugin systems). For cache/queue choices, follow
  [`specs/_foundation/architecture.md`](../../../specs/_foundation/architecture.md):
  pg-boss + PostgreSQL outbox is the launch queue, and Redis is not
  selected at launch. Do not copy the legacy P01 Redis/BullMQ proposal
  into a feature spec; a Redis proposal needs measured workload evidence
  and an approved architecture decision.
- Reference IDs (F-, S-, BR-, ST-, J-) instead of repeating the design
  pack; standard UX states live in `specs/_foundation/frontend-shared.md`.

## Steps

1. Read the module's features/screens in `docs/design-context/01-*`,
   `02-*`, `07-*`, `08-*` and the prototype in `reference/`.
2. Write `specs/<module>/be/<module>.md` and `specs/<module>/fe/<module>.md`
   using the LEAN-SPECS templates; list every F-ID and S-ID explicitly
   (no ranges). FE specs follow the [mandatory React Query contract](../../../specs/_foundation/frontend-shared.md#api-integration-with-react-query):
   map endpoints to queries/mutations, define key scope, freshness/retries,
   invalidation, SSR hydration where needed and relevant acceptance tests.
3. Ambiguity: note it in the spec as `Open question:` with the
   assumption used; don't invent behaviour.
4. Acceptance criteria as Given/When/Then incl. one authorisation
   negative.
5. Run `node scripts/check-spec-coverage.mjs`.

## Checklist

- [ ] Only spec files changed.
- [ ] BE and FE within ~250 lines each, IDs listed explicitly.
- [ ] Authorisation = role + ownership + city/area scope + permission.
- [ ] Given/When/Then with a negative case.
- [ ] FE API integration follows the shared React Query contract, not an
  optional library choice or a second API-response store.
