---
name: spec-writing
description: Step-by-step recipe for turning a docs/FEATURE_INVENTORY.md row into linked BE and FE specs, used by the spec-writer agent.
---

# Spec writing

Used by `.github/agents/spec-writer.agent.md`. Templates:
`specs/_templates/`.

## Steps

1. Locate the feature row in `docs/FEATURE_INVENTORY.md` (ID, module,
   roles, routes).
2. Read `docs/PROJECT.md` invariants and the matching
   `.github/instructions/domain-*.instructions.md` file for this
   module.
3. If behaviour is ambiguous, ask a clarifying question or record it in
   `docs/PROJECT.md` "Open questions" — never guess
   (`specs-and-docs.instructions.md`).
4. Copy `specs/_templates/feature-be.md` ->
   `specs/<module>/be/<id>-<slug>.md` and
   `specs/_templates/feature-fe.md` -> `specs/<module>/fe/<id>-<slug>.md`.
5. Write acceptance criteria as Given/When/Then, including at least one
   negative/authorization case.
6. Fill states/transitions (if a status model applies), permissions,
   validation, security notes, i18n keys, and a test plan.
7. Cross-link the BE and FE spec to each other.
8. Update the `docs/FEATURE_INVENTORY.md` row: real spec paths, status
   `spec written`.

## Checklist

- [ ] Feature row located and context read.
- [ ] No invented behaviour — ambiguity recorded, not guessed.
- [ ] Both BE and FE specs created from the templates and cross-linked.
- [ ] Acceptance criteria are Given/When/Then with a negative case.
- [ ] `docs/FEATURE_INVENTORY.md` row updated.
