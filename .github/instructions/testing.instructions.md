---
applyTo: "**/*.test.*,**/*.spec.*,tests/**,e2e/**"
---

# Testing

Builds on `.github/copilot-instructions.md`. Journeys referenced below
are defined in `docs/project/06-user-journeys.md` (J1-J14).

## Pyramid

- **Unit** (most): pure functions, formatters (`packages/shared`), state
  machine transitions, service logic with fakes for repositories/
  integrations.
- **Integration** (some): controller -> service -> repository against a
  real/test database; API contract tests against the OpenAPI spec.
- **E2E / Playwright** (few, critical journeys only): full user flows
  across `apps/web` + `apps/api`.

## Required case categories

- **Authorization negatives:** every endpoint has a test for wrong
  role, wrong ownership, and wrong admin scope (all three, not just
  "no role") expecting a 403/404, not a 200 with filtered data leaking
  existence.
- **Malicious input:** injection attempts in filter/sort params,
  oversized payloads, invalid enum values, script tags in free-text
  fields — must be rejected or safely rendered, never executed/stored
  raw.
- **Money and time:** paise rounding in proportional coupon splits
  (`domain-commerce.instructions.md`), UTC storage vs. IST display,
  timezone edge cases (midnight boundaries for "today's hours"/
  earnings).
- **Concurrency/idempotency:** two near-simultaneous checkouts against
  limited stock (no oversell), duplicate webhook delivery (no double
  payment/order), double-tap "Accept" on a delivery request (only one
  rider wins).
- **Accessibility:** automated a11y checks (axe or equivalent) on new
  screens; keyboard-only navigation test for new interactive
  components (`i18n-a11y.instructions.md`).

## Critical Playwright journeys (cover at least these)

Full step-by-step descriptions:
[docs/project/06-user-journeys.md](../../docs/project/06-user-journeys.md)
— don't restate them here. Minimum coverage: **J1-J10** (customer
commerce, services, offers, reels, search, moderation, vendor
onboarding, disputes, subcategory suggestions, super-admin ops) plus
**J11-J14** (rider onboarding, guest-to-login, language/theme switch,
enquiry-to-review) where the change touches those areas.

## Conventions

- Test fixtures never contain real secrets/PII
  (`security.instructions.md`); use realistic but fake Indian names/
  phone numbers/addresses.
- Each bug fix (`bug-fixer` agent) adds a failing regression test
  first, then the fix — never fix without a reproducing test.
- New/changed acceptance criteria in a spec (`specs/<module>/`) map
  1:1 to at least one test.
