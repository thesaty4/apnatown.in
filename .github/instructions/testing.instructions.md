---
applyTo: "**/*.test.*,**/*.spec.*,tests/**,e2e/**"
---

# Testing

Builds on `.github/copilot-instructions.md`. Journeys referenced below
are defined in `docs/PROJECT.md` section "Critical journeys" (J1-J10).

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

J1 browse -> category -> Explore -> product -> cart -> checkout (two
shops, split) -> track -> delivery OTP -> review. J2 Home -> category ->
Explore Services -> filters -> service details -> send enquiry. J3
offer card -> product/service/list, including expired/out-of-stock. J4
Reels -> follow/like/share (guest -> login -> same video) -> linked
product -> cart. J5 search "AC"/"iPhone 15" -> grouped results ->
service details. J6 vendor uploads video, links products, Gallery
option -> admin approves -> appears in Reels and Gallery. J7 vendor
onboarding -> admin approval -> first product -> first order -> accept
-> ready -> rider accepts -> OTP delivery. J8 cancel/refund/dispute with
admin workflow. J9 subcategory suggestion -> admin approve/reject/merge
-> notification. J10 super admin: deactivate admin (confirmation),
edit/delete role (reassign rule), draw zone, communications with scope
and review step, live map city filter.

## Conventions

- Test fixtures never contain real secrets/PII
  (`security.instructions.md`); use realistic but fake Indian names/
  phone numbers/addresses.
- Each bug fix (`bug-fixer` agent) adds a failing regression test
  first, then the fix — never fix without a reproducing test.
- New/changed acceptance criteria in a spec (`specs/<module>/`) map
  1:1 to at least one test.
