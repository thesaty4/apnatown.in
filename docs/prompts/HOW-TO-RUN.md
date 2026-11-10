# How to run this (setup and order)

## 1. Put the files in the repository
Unzip `apnatown-copilot-pack.zip` at the repository root. You get:
```
.github/copilot-instructions.md        standing rules Copilot reads on every task
docs/design-context/                   the Design Context Pack (00-11, screenshots, reference prototype and source)
docs/prompts/                          STANDING_REQUIREMENTS.md, 00-MASTER.md, P01..P11, P08a..P08g, C00..C14
scripts/validate-design-pack.mjs       pack validator
```
Run `node scripts/validate-design-pack.mjs` (must print PASSED). Commit to `main` (or a branch merged to `main`): Copilot agents read `.github/copilot-instructions.md` from the default branch.

## 2. Generate the specifications (Copilot agent, one prompt at a time)
For each prompt: open the file, paste its whole content into the Copilot agent (or create a GitHub issue with the content and assign it to Copilot; if a prompt is too large for an issue body (65,536 characters), tell Copilot "Read and execute `docs/prompts/<file>`"). Review the PR, merge, then run the next.

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

Do not start implementation until P11 reports zero gaps.

## 3. Build the product (Copilot agent, one prompt at a time, small PRs)
C00 monorepo -> C01 shared backend layer -> C02 database -> C03 shared frontend + UI library -> C04 auth/account -> C05 catalog/Explore/Search -> C06 profiles/product/service/SEO -> C07 cart/checkout/orders -> C08 delivery/rider -> C09 reviews/engagement/offers -> C10 reels/media -> C11 vendor/provider dashboards -> C12 admin/notifications/communications -> C13 super admin -> C14 hardening.
Humans review and merge every PR.

## 4. Human decisions needed early
Open the Open Issues file (`docs/design-context/11-open-issues-and-assumptions.md`) and decide: payment gateway, maps provider, OTP/SMS and WhatsApp providers, video hosting, delivery slabs per city, commission/plan values, Hindi translation review owner, SEO landing-page URLs, hosting region.
