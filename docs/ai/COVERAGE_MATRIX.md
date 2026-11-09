# Coverage Matrix

Mandatory self-check (`AGENTS.md`): every feature ID in `docs/FEATURE_INVENTORY.md` and every 
business rule in `docs/project/04-business-rules.md` maps to at least one instruction file, skill, agent, and BE module + 
FE area — no row may be empty. The mapping is area-level (every ID in an area's range shares the same 
row, since that is how the underlying instructions/skills are scoped via `applyTo`); a feature's own 
spec may narrow this to the specific file(s) it actually used.

## Feature areas (all 207 IDs)

| Area | ID range | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|---|
| X (Cross-cutting) | X1-X15 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| AU (Auth and onboarding) | AU1-AU8 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| HM (Home) | HM1-HM14 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| LC (Location and discovery) | LC1-LC5 | `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `geo-zones-delivery-fees`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `geo` | `/location` |
| EX (Explore) | EX1-EX11 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| SR (Search) | SR1-SR10 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| PF (Business and provider profile) | PF1-PF13 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PD (Product details) | PD1-PD9 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| SV (Services) | SV1-SV8 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| OF (Offers) | OF1-OF5 | `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` | `/offers` |
| CK (Cart and checkout) | CK1-CK9 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| OR (Orders and tracking) | OR1-OR8 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| RV (Reviews) | RV1-RV7 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |
| EG (Engagement) | EG1-EG7 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |
| RL (Videos and reels) | RL1-RL10 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| NT (Notifications) | NT1-NT4 | `domain-accounts-admin.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications` | `/notifications` |
| AC (Account) | AC1-AC7 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |
| VD (Vendor dashboard) | VD1-VD18 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| PV (Provider dashboard) | PV1-PV7 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |
| RD (Rider (mobile-first PWA)) | RD1-RD8 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| AD (Admin) | AD1-AD16 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| SA (Super admin) | SA1-SA8 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |

**Total feature IDs covered: 207** (across 22 areas, matching `docs/FEATURE_INVENTORY.md`).

## Business rule invariants (BR-01..BR-22)

Canonical rule text: `docs/project/04-business-rules.md`. These IDs
superseded the old "17 invariants" numbering (see that file's note on
the renumbering) — don't reintroduce bare "invariant N" references.

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) |
|---|---|---|---|---|
| BR-01 | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `cart-checkout, orders, payments` |
| BR-02 | `i18n-a11y.instructions.md`, `backend.instructions.md` | `i18n-en-hi` | `developer-backend`, `developer-frontend`, `code-reviewer` | `packages/shared (all modules)` |
| BR-03 | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `cart-checkout, orders` |
| BR-04 | `domain-commerce.instructions.md` | `order-state-machine`, `write-tests` | `developer-backend`, `code-reviewer` | `orders, products` |
| BR-05 | `security.instructions.md`, `domain-delivery-riders.instructions.md` | `otp-and-codes` | `developer-backend`, `security-auditor`, `code-reviewer` | `delivery, orders` |
| BR-06 | `domain-accounts-admin.instructions.md`, `domain-delivery-riders.instructions.md` | `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `users, businesses, delivery` |
| BR-07 | `domain-catalog-search.instructions.md` | `search-keyword-mapping`, `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `catalog` |
| BR-08 | `domain-catalog-search.instructions.md` | `spec-writing` | `developer-backend`, `code-reviewer` | `catalog, services` |
| BR-09 | `domain-media-engagement.instructions.md`, `testing.instructions.md` | `write-tests`, `secure-coding-review` | `developer-backend`, `code-reviewer` | `reviews` |
| BR-10 | `domain-media-engagement.instructions.md` | `media-embeds-and-reels` | `developer-backend`, `developer-frontend`, `code-reviewer` | `media-videos` |
| BR-11 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `consent-and-notifications` | `developer-backend`, `security-auditor`, `code-reviewer` | `communications, users` |
| BR-12 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit` | `developer-backend`, `security-auditor`, `code-reviewer` | `admin, audit` |
| BR-13 | `domain-accounts-admin.instructions.md` | `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `admin` |
| BR-14 | `security.instructions.md`, `domain-accounts-admin.instructions.md` | `secure-coding-review` | `developer-backend`, `security-auditor`, `code-reviewer` | `users, admin` |
| BR-15 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `explore-filter-url-state` | `developer-frontend`, `code-reviewer` | `search` |
| BR-16 | `domain-media-engagement.instructions.md` | `media-embeds-and-reels` | `developer-backend`, `developer-frontend`, `code-reviewer` | `media-videos, businesses` |
| BR-17 | `domain-commerce.instructions.md` | `write-tests` | `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` |
| BR-18 | `domain-catalog-search.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping` | `developer-backend`, `developer-frontend`, `code-reviewer` | `services, search` |
| BR-19 | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `cart-checkout` |
| BR-20 | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `orders, notifications` |
| BR-21 | `frontend.instructions.md` | `ui-component` | `developer-frontend`, `code-reviewer` | `auth` + all guest-gated FE features |
| BR-22 | `i18n-a11y.instructions.md` | `ui-component` | `developer-frontend`, `code-reviewer` | `packages/ui` |

**All 22 business rules covered; no empty cells above.**


`security-auditor` is additionally required (not re-listed per row) for any PR touching auth, 
payments, uploads/CSV, embeds, admin permissions, or communications, per `AGENTS.md`, regardless of 
whether it is already listed in a row's Agent(s) column.
