---
applyTo: "**"
---
# Copilot instructions — ApnaTown.in

Read `AGENTS.md` first for the full read order, lifecycle and agent
roster. This file holds only the top-priority, repo-wide rules.

Read `docs/PROJECT.md` (index) and the linked `docs/project/*` files
before implementing any feature.

## How to work

1. **Plan before coding.** Find or write the spec in
   `specs/<module>/{be,fe}/` (see `docs/FEATURE_INVENTORY.md`); don't
   invent product behaviour — ambiguity goes to
   `docs/project/12-decisions-assumptions-open-questions.md`, not a
   guess.
2. **Reuse before building.** Check `packages/ui`
   (`docs/design-system.md`), `packages/shared`, and existing
   repositories/services in `docs/architecture.md` before adding new
   ones.
3. **Small PRs.** One feature/task/bug per PR, linked to its spec.
4. **Report honestly.** State what you verified (tests run, commands
   executed) vs. what you assumed.

## SOLID / DRY / KISS

- **SOLID:** one responsibility per service/handler; depend on
  repository/integration **interfaces**, not concrete implementations;
  extend via new strategies (e.g. a new payment method), don't branch
  on type checks. Detail: `solid-dry-design.instructions.md`.
- **DRY:** state a rule or schema once (`packages/shared` for
  types/enums, this file set for process rules); link, don't paste.
- **KISS/YAGNI:** build only what the current spec needs.

## Security non-negotiables

- Parameterized queries only; sort/filter fields are allow-listed, never
  passed through raw.
- Server-side validation with an explicit field allow-list on every
  input (DTOs); never mass-assign a request body to an entity.
- Authorize every request on **role + ownership + scope** (admins are
  scoped to assigned cities/areas and module permissions).
- No secrets or PII in logs, commits, or test fixtures.
- Embeds, uploads, CSV import/export and webhooks follow
  `security.instructions.md` (allow-listed hosts, content-based
  validation, signature verification, idempotency).
- Full detail: `security.instructions.md` and
  `docs/security/security-guidelines.md`.

## India and product rules

- Money is integer paise; server computes all totals; display as INR
  with Indian grouping (`₹1,25,000`).
- Store UTC, display IST 12-hour.
- Full bilingual parity (English + Hindi/Devanagari); status is never
  colour-only.
- Location is always optional; WhatsApp/marketing needs recorded
  consent.
- All business rules: `docs/project/04-business-rules.md` (BR-01..
  BR-22) — these are reviewed on every PR.

## Testing and Definition of Done

- See `testing.instructions.md` for the test pyramid and required
  negative/security/money/concurrency cases.
- A change is done only when: spec acceptance criteria pass, product
  invariants hold, tests exist and pass, docs/specs are updated, and
  `node scripts/validate-ai-setup.mjs` passes if `.github/`/`docs/`
  changed.

## Git, PR and merge rule

- Work on a feature branch; open a PR using
  `.github/pull_request_template.md`.
- **Humans merge. Agents never merge, force-push `main`, or delete
  branches other than their own.**
- `architect` code-review `APPROVE` is required before the owning developer
  opens a PR. `security-auditor` review is also required for changes
  touching `auth`, `payments`, uploads/CSV, embeds, admin permissions,
  or `communications`.

## Memory

Record durable lessons in `docs/ai/LESSONS_LEARNED.md`; read it before
non-trivial work in a module it covers.

## Everything else

Path-specific rules live in `.github/instructions/*.instructions.md`
(matched by `applyTo`) — frontend, backend, security, i18n/a11y, each
domain, testing, specs/docs, integrations, database. Read the ones that
match the files you're changing before editing them.
