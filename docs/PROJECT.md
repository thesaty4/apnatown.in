# ApnaTown.in — Project Overview

This is the single source of truth for product context. Instruction files,
agents and skills link here instead of repeating this content — see
`.github/copilot-instructions.md` for the read order.

## 1. What ApnaTown is

A **hyperlocal marketplace and local business discovery platform**. Shops,
vendors and service providers create profiles and list **products** and
**services**. Customers discover them by location, order products (**home
delivery or self-pickup**), send enquiries for services, watch short
**videos/reels**, and rate and review everything.

- **Launch city:** Padrauna, Kushinagar, Uttar Pradesh, India. The system
  must scale to more cities.
- **Feel:** "my town's bazaar, digitised" — warm, trustworthy, simple.
- **Users:** first-time online shoppers on mid-range Android with slow
  3G/4G; vendors are often non-technical.

### Design and platform principles

- Mobile-first (360px), bilingual **English + Hindi (Devanagari)** with
  long-label tolerance, light and dark mode.
- WCAG 2.2 AA — status is never conveyed by colour alone.
- 48px touch targets, skeleton loaders, lazy media, pagination with a
  "Load more" fallback, a data-saver / lite mode.
- India patterns: UPI, COD / pay-at-pickup, WhatsApp, mobile OTP, 6-digit
  PIN, landmark addresses, INR with Indian digit grouping (`₹1,25,000`),
  IST 12-hour time.

## 2. Roles (6)

`customer`, `vendor` (shop), `provider` (service provider), `rider`,
`admin`, `super_admin`.

Approval states for vendor/provider/rider applications: `pending`,
`approved`, `rejected`, `suspended`, `inactive`, `changes_requested`.
Non-approved accounts cannot sell, accept orders or go online.

Admins are scoped to assigned **cities/areas** and **per-module
permissions** (view/edit; the permission matrix also supports
create/delete/export). Only `super_admin` manages main categories,
cities/zones, roles/permissions, admins, and global settings.

## 3. Business rules (invariants)

These are product invariants. Every backend and frontend change that
touches them must preserve them; see `docs/ai/COVERAGE_MATRIX.md` for
which instructions/skills/agents enforce each one.

1. Money is integer **paise**; currency is INR with Indian digit
   grouping; the **server** computes prices, fees, discounts and totals.
2. Storage is **UTC**; display is **IST, 12-hour**.
3. One checkout produces **one order per shop**, each with its own
   status, mode (delivery/pickup), payment, and OTP/pickup code.
4. Order status changes only via the **state machine**; stock never
   oversells.
5. Delivery OTP and pickup code are verified **server-side only**, with
   attempt limits.
6. Only **approved** vendors/providers/riders can sell, accept orders or
   go online.
7. Main categories are managed only by `super_admin`; subcategory
   suggestions require admin approval and duplicate detection; each
   service has exactly **one** subcategory.
8. Reviews are allowed only from verified purchasers/enquirers; unsafe
   content goes to moderation.
9. Videos are public only when **approved**; reports go to the
   moderation queue; removed content shows "unavailable".
10. Location is optional; WhatsApp/marketing only with recorded
    **consent**; opt-outs are honoured; campaigns show consent-aware
    recipient counts.
11. Admins act only within their assigned cities/areas and module
    permissions; sensitive actions are **audit-logged** with
    before/after values.
12. A role cannot be deleted while admins use it; **system roles** can
    never be deleted.
13. **DPDP** principles: minimise data, record consent, support
    export/delete on request; KYC documents are visible only to
    authorised admins.
14. Explore filter state lives in a **shareable URL**; Explore and
    Search keep **separate** filter state.
15. Media added to a product/service appears in the business
    Gallery/Reels only if the **vendor allows it**.
16. An offer applies only while **active and not expired**; expired and
    out-of-stock offers show clear, distinct states.
17. A service's subcategory drives Explore/Search filters and counts.

## 4. Status and lifecycle models

| Entity | States |
|---|---|
| Order (delivery/pickup) | see `domain-commerce` order state machine |
| Delivery job | `requested, accepted, reached_shop, picked_up, reached_drop, delivered, failed` |
| Approval (vendor/provider/rider) | `pending, approved, rejected, suspended, inactive, changes_requested` |
| Payment | `pending, paid, failed, refunded` (COD: `pending` → `collected`) |
| Refund | see `domain-commerce.instructions.md` |
| Review moderation | `pending, published, reported, hidden, deleted` |
| Offer | `pending, active, paused, ended` |
| Video | `pending, approved, rejected, removed` |
| Enquiry | `new, contacted, converted, closed` |
| Subcategory suggestion | `pending, approved, rejected, merged` |
| Comment | `pending, published` |
| Campaign | `scheduled, sent` |

Canonical enums and status maps live in `packages/shared` (see
`docs/architecture.md` and `database.instructions.md`).

## 5. Data relationships

```
Category -< Subcategory -< Service type
Service >- Subcategory (exactly one)
Provider -< Service
Provider >-< Subcategory              ("expert in")
Product >- Category/Subcategory
Business -< Product
Business -< Service
Video -< linked Product/Service
Video >- Owner
User -< Follow >- Owner
User -< Like >- Video
User -< Heart >- Photo/Video
Keyword -< Category/Subcategory/Product tag
Offer >-< Product/Service/Shop
Order >- Shop (one order per shop)
Order -< Item
Order - Delivery job - Rider
City -< Zone (polygon + fee slabs)
Admin >-< City/Area
Admin - Role -< Permission (module, action)
```

`-<` = one-to-many, `>-<` = many-to-many, `>-` = many-to-one.

## 6. Non-functional requirements

- Security aligned with **OWASP ASVS** and the **OWASP Top 10** — see
  `security.instructions.md` and `docs/security/security-guidelines.md`.
- Performance budget: LCP < 2.5s on a mid-range Android device over
  slow 3G/4G; lazy-load media; prefer skeletons over spinners.
- Accessibility: WCAG 2.2 AA, keyboard-operable, reduced-motion support.
- Internationalisation: English + Hindi (Devanagari) complete parity,
  no hard-coded user-facing strings.
- Observability: structured logs (no secrets/PII), audit trail for all
  admin actions, metrics for queues/integrations.
- Privacy: DPDP-aligned consent and data subject rights (export/delete).

## 7. Tech stack (working assumption — confirm)

> This is a **working assumption**, not a decision. Every instruction
> file must point here instead of hard-coding versions. Record the
> decision itself in `docs/adr/0001-tech-stack.md`.

pnpm monorepo:

- `apps/web` — Next.js (App Router), React, TypeScript strict, Tailwind
  CSS with design tokens, TanStack Query, `react-hook-form` + `zod`,
  `next-intl`, Playwright + React Testing Library.
- `apps/api` — Node.js + TypeScript layered framework, REST + OpenAPI,
  `zod`/`class-validator`, a queue for background jobs.
- `packages/shared` — types, zod schemas, enums, status maps,
  formatters (money, date/time, distance, phone).
- `packages/ui` — design-system components (`docs/design-system.md`).
- **Database:** decided later; code depends only on repository
  interfaces (`database.instructions.md`). <!-- TODO(verify): pick DB engine -->
- **Auth:** mobile OTP + httpOnly cookie sessions.
- **Integrations as ports:** payments, SMS/OTP, WhatsApp Business,
  email, storage, maps, media processing — see
  `integrations.instructions.md`.
- **CI:** GitHub Actions. <!-- TODO(verify): confirm hosting/CI runner limits -->

## 8. Repository map

```
AGENTS.md                      agent-wide rules and read order
README.md                      overview + how the AI workflow works
docs/                          product, architecture, design, AI governance
specs/                         per-module BE/FE feature specs
apps/web/                      Next.js frontend              (future)
apps/api/                      Node.js backend               (future)
packages/shared/               shared types/schemas/enums    (future)
packages/ui/                   design-system components      (future)
.github/copilot-instructions.md  top-priority repo-wide rules
.github/instructions/          path-specific instructions
.github/agents/                agent definitions
.github/skills/                step-by-step recipes
.github/prompts/               reusable task prompts
scripts/validate-ai-setup.mjs  validates this whole setup
```

Module map (used by `docs/architecture.md`, specs, and `applyTo`
globs): `auth, users, catalog, businesses, products, services, search,
offers, cart-checkout, orders, delivery, payments, reviews,
media-videos, engagement, notifications, communications, geo, admin,
audit, settings`.

## 9. Glossary

See `docs/glossary.md` for English/Hindi terms and microcopy tone.

## 10. Open questions

Record anything ambiguous here instead of inventing behaviour. Each
entry needs an owner and a status.

| # | Question | Raised in | Status |
|---|---|---|---|
| 1 | Target database engine (Postgres vs. MySQL vs. other) is undecided; repositories abstract it, but migration tooling choice is blocked on this. | `docs/adr/0001-tech-stack.md` | Open |
| 2 | Payment gateway(s) to integrate for UPI/cards in India (e.g. Razorpay, Cashfree) not yet chosen. | `integrations.instructions.md` | Open |
| 3 | WhatsApp Business API provider (official BSP) not yet chosen; affects template approval workflow in `communications`. | `domain-accounts-admin.instructions.md` | Open |
| 4 | SMS/OTP provider and failover provider not yet chosen. | `integrations.instructions.md` | Open |
| 5 | Hosting/infra target (for `copilot-setup-steps.yml` and CI runner) not yet confirmed. | `.github/workflows/copilot-setup-steps.yml` | Open |
| 6 | Exact commission/plan tiers and promotion fee amounts (SA5) are not specified numerically in the product brief. | `docs/FEATURE_INVENTORY.md` (SA5) | Open |
