---
name: spec-writing
description: Lean recipe for writing module BE and FE specs (spec files only, no extra documentation upkeep), used by the spec-writer agent.
---

# Spec writing

Used by `.github/agents/spec-writer.agent.md`. Governing prompt and
templates: `docs/prompts/LEAN-SPECS.md`.

## Scope (no over-engineering)

- Write **only** the requested spec files in `specs/<module>/{be,fe}/`.
- Do not update inventories, progress trackers, registers, lessons or
  other docs unless the user explicitly asks.
- Build only what the features need; no speculative infrastructure
  (microservices, CQRS, event sourcing, GraphQL, external search, Redis
  at launch, plugin systems).
- Reference IDs (F-, S-, BR-, ST-, J-) instead of repeating the design
  pack; standard UX states live in `specs/_foundation/frontend-shared.md`.

## Steps

1. Read the module's features/screens in `docs/design-context/01-*`,
   `02-*`, `07-*`, `08-*` and the prototype in `reference/`.
2. Write `specs/<module>/be/<module>.md` and `specs/<module>/fe/<module>.md`
   using the LEAN-SPECS templates; list every F-ID and S-ID explicitly
   (no ranges).
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
