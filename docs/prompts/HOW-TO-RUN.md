# How to run this (setup and order)

**Verification policy:** Follow [the repository policy](../../.github/instructions/testing.instructions.md). Do not create automated test files or test-runner scaffolding for FE, BE or DB. Preserve acceptance scenarios as manual checks and report existing non-test command results and gaps.

## 1. Put the files in the repository
Unzip `apnatown-copilot-pack.zip` at the repository root. You get:
```
.github/copilot-instructions.md        standing rules Copilot reads on every task
docs/design-context/                   the Design Context Pack (00-11, screenshots, reference prototype and source)
docs/prompts/                          STANDING_REQUIREMENTS.md, 00-MASTER.md, P01..P11, P08a..P08g, C00..C14
scripts/validate-design-pack.mjs       pack validator
```
Run `node scripts/validate-design-pack.mjs` (must print PASSED). Work on
a feature branch and let a human review/merge; this guide does not
authorize committing or pushing unreviewed changes.

## 2. Current specifications

[LEAN-SPECS.md](./LEAN-SPECS.md) supersedes P02-P11. Use the four
[foundation specs](../../specs/_foundation/) and 21 module BE/FE pairs
under [specs/](../../specs/). Repair only a relevant spec gap; do not
regenerate inventories/progress files or create missing legacy outputs.
Run `node scripts/check-spec-coverage.mjs` for structural coverage and
review the actual contracts/acceptance criteria for readiness.

### Historical generation sequence (reference only; do not run P02-P11)

| Order | Prompt | Result |
|---|---|---|
| 0 | 00-MASTER.md | `docs/specs/_progress.md` |
| 1 | P01-product-and-feature-spec.md | docs/specs/01-product/ |
| 2 | P02-system-architecture.md | docs/specs/02-architecture/ |
| 3 | P03-database-postgresql.md | docs/specs/03-database/ |
| 4 | P04-backend-nestjs.md | docs/specs/04-backend/ |
| 5 | P05-frontend-architecture-nextjs.md | docs/specs/05-frontend/ |
| 6 | P06-shared-component-library.md | docs/specs/06-shared-ui/ |
| 7 | P08g-reference-vertical-slice-explore-services.md | docs/specs/08-screens/reference-slice-explore-services.md |
| 8 | P07-seo.md | docs/specs/07-seo/ |
| 9 | P08a, P08b, P08c, P08d, P08e, P08f | docs/specs/08-screens/ (customer in 3 parts) |
| 10 | P09-infrastructure-security-operations.md | docs/specs/09-infra-security-ops/ |
| 11 | P10-testing-delivery-traceability.md | docs/specs/10-delivery/ |
| 12 | P11-coverage-audit.md | docs/specs/11-coverage-audit.md + audit script + fixes |

The old P11 prerequisite applies only to that superseded workflow.
Current implementation follows the foundation dependencies and owning
module specs; their explicit product/provider/policy gates still apply.

## 3. Build the product (Copilot agent, one prompt at a time, small PRs)
C00 monorepo; C01 shared backend; C02 database; C03 shared frontend;
C04 auth/account; C05 discovery; C06 profiles/listings/SEO; C07 commerce;
C08 delivery; C09 reviews/engagement/offers; C10 media; C11 dashboards;
C12 administration/notifications/communications; C13 super admin;
C14 hardening. These are scope groupings, not a strict dependency order:
migrations and real Auth/owner ports precede the protected Catalog
reference verification; Web/API slices precede authenticated browser smoke.
The foundation defines exact future setup/build/start/verification commands.
Humans review and merge every PR.

## 4. Human decisions needed early
Open the Open Issues file (`docs/design-context/11-open-issues-and-assumptions.md`) and decide: payment gateway, maps provider, OTP/SMS and WhatsApp providers, video hosting, delivery slabs per city, commission/plan values, Hindi translation review owner, SEO landing-page URLs, hosting region.
