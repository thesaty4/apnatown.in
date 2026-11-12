# 12 — Decisions, Assumptions, Open Questions

**Purpose:** Every product decision made, every assumption not yet confirmed, and every open question — so no one guesses.
**Audience:** Everyone, especially before starting ambiguous work. This is where `architect` and any agent record instead of inventing.
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [`docs/adr/0001-tech-stack.md`](../adr/0001-tech-stack.md) (tech-stack ADR — not repeated here) · [04-business-rules.md](./04-business-rules.md) · [`specs-and-docs.instructions.md`](../../.github/instructions/specs-and-docs.instructions.md)
**Last updated:** 2026-11-09
**Owner:** Product

This file replaces and supersedes the old "Open questions" table that
used to live directly in `docs/PROJECT.md` — those 6 items are folded
into the list below (one is now resolved).

## 1. Decisions (D-01..)

| ID | Decision |
|---|---|
| D-01 | Main categories are fixed and managed only by Super Admin (BR-07). |
| D-02 | Each service has exactly one subcategory; a provider sets which subcategories they are "expert in" separately (BR-08). |
| D-03 | One checkout always splits into one order per shop (BR-03). |
| D-04 | Videos are link-based (YouTube/Instagram) or uploads, public only after admin approval, first — no dedicated video-hosting build yet (BR-10). |
| D-05 | Search uses a keyword-mapping table with Hindi/Hinglish and typo tolerance — not a full search engine — for this stage (SR2, SR3). |
| D-06 | Services are enquiry-only for now; booking/quotation/online payment are feature-flagged off (SV5, PV7). |
| D-07 | Explore and Search keep separate filter state (BR-15). |
| D-08 | Explore filter state is a shareable URL (BR-15, EX8). |

## 2. Assumptions `[ASSUMPTION]`

| ID | Assumption | Confirm via |
|---|---|---|
| A-01 | Tech stack: pnpm monorepo, Next.js + TypeScript + Tailwind frontend, Node/TypeScript layered API, REST + OpenAPI, OTP + httpOnly cookies. Database engine, and payment/SMS/WhatsApp/maps providers, are not yet chosen. | [`docs/adr/0001-tech-stack.md`](../adr/0001-tech-stack.md) (full detail lives there, not duplicated here) |

## 3. Open questions `[OPEN]`

| ID | Question | Status |
|---|---|---|
| Q-01 | Payment gateway choice (e.g. Razorpay, Cashfree) for UPI/cards. | Open |
| Q-02 | Maps/geocoding provider. | Open |
| Q-03 | Video upload hosting (beyond link-based YouTube/Instagram). | Open |
| Q-04 | WhatsApp Business template approval process and sender numbers; which BSP. | Open |
| Q-05 | KYC document retention period. | Open |
| Q-06 | Commission model invoicing rules (the commission **percentages** themselves are decided — see [04-business-rules.md](./04-business-rules.md)). | Open |
| Q-07 | GST handling details beyond "shown as included in item prices". | Open |
| Q-08 | Refund SLA (how fast admin must act, beyond the 24h customer request window). | Open |
| Q-09 | Moderation SLAs (reviews, videos, subcategory suggestions). | Open |
| Q-10 | Hindi translation review owner/process. | Open |
| Q-11 | Exact delivery fee slabs for cities beyond Padrauna as they launch. | Open |
| Q-12 | Staff roles for vendors (VD18 mentions a "staff access list" placeholder). | Open |
| Q-13 | Analytics/event tracking plan. | Open |
| Q-14 | Legal copy (terms, privacy, refund policy) — needs legal review. | Open |
| Q-15 | Data residency and backup policy. | Open |
| Q-16 | Target database engine (Postgres vs. MySQL vs. other). | Open |
| Q-17 | SMS/OTP provider and its failover provider. | Open |
| Q-18 | Hosting/infra target for CI runner (`copilot-setup-steps.yml`). | Open |
| Q-19 | Dark-mode colour-token shades need an AA-contrast pass before launch (see [08-design-system.md](./08-design-system.md)). | Open |
| Q-74 | Subscription/promotion purchase rules: plan periods/prices, renewal timing, proration, vendor cancellation, promotion activation/duration and invoice/tax evidence. | Partly resolved: provider cancellation ends at paid expiry with no refund; owner selections persist but are inactive after Premium expiry and reactivate after verified renewal. Expiry notices go to the owner, authorized area `promos:view` admins and super_admin. No automatic renewal. Plan configuration, renewal timing, vendor cancellation, promotion lifecycle and tax/legal invoice rules remain open. |
| Q-75 | Vendor payout eligibility, calculation, schedule, status, failure/retry and dispute rules for earnings and next payout. | Open |
| Q-76 | Full/partial refund amount and approval policy, fee/tax reversal, and interaction with ST-payment's no-partial-refund state. | Open |
| Q-77 | Unavailable-item replacement/substitution approval, repricing, discount recalculation and refund behavior. | Open |
| Q-78 | Customer/vendor/admin visibility, retention and redaction rules for dispute/case notes and evidence. | Open |
| Q-79 | Refund eligibility/window start for pickup, cancelled and vendor-rejected orders. | Open |
| Q-80 | File format, limits, retention and visibility for optional order-refund evidence photos. | Open |
| Q-81 | Image formats, dimensions, limits and compression variants for category/subcategory images. | Open; uploads remain disabled until a Media `catalog_taxonomy` policy is configured. |

## 4. Resolved (for traceability — don't re-open without new evidence)

| Former question | Resolution |
|---|---|
| Exact commission/plan tiers and promotion fee amounts | Resolved — see [04-business-rules.md](./04-business-rules.md) "Formulas and defaults" (sample/default, still marked confirm). |
