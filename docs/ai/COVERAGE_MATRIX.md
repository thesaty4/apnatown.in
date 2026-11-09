# Coverage Matrix

Mandatory self-check (`AGENTS.md`): every feature ID in `docs/FEATURE_INVENTORY.md` and every 
invariant in `docs/PROJECT.md` maps to at least one instruction file, skill, agent, and BE module + 
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

## Business rule invariants (1-17)

| # | Invariant | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) |
|---|---|---|---|---|---|
| 1 | Money integer paise; server computes totals | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `cart-checkout, orders, payments` |
| 2 | UTC storage, IST 12-hour display | `i18n-a11y.instructions.md`, `backend.instructions.md` | `i18n-en-hi` | `developer-backend`, `developer-frontend`, `code-reviewer` | `packages/shared (all modules)` |
| 3 | One order per shop, own status/mode/payment/OTP | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `cart-checkout, orders` |
| 4 | Order status only via state machine; no oversell | `domain-commerce.instructions.md` | `order-state-machine`, `write-tests` | `developer-backend`, `code-reviewer` | `orders, products` |
| 5 | Delivery OTP / pickup code verified server-side only | `security.instructions.md`, `domain-delivery-riders.instructions.md` | `otp-and-codes` | `developer-backend`, `security-auditor`, `code-reviewer` | `delivery, orders` |
| 6 | Only approved vendors/providers/riders sell/accept/go online | `domain-accounts-admin.instructions.md`, `domain-delivery-riders.instructions.md` | `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `users, businesses, delivery` |
| 7 | Main categories super_admin only; subcategory suggestion/approval; one subcategory per service | `domain-catalog-search.instructions.md` | `search-keyword-mapping`, `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `catalog` |
| 8 | Reviews only from verified purchasers/enquirers; moderation for unsafe content | `domain-media-engagement.instructions.md`, `testing.instructions.md` | `write-tests`, `secure-coding-review` | `developer-backend`, `code-reviewer` | `reviews` |
| 9 | Videos public only when approved; reports to moderation; removed shows unavailable | `domain-media-engagement.instructions.md` | `media-embeds-and-reels` | `developer-backend`, `developer-frontend`, `code-reviewer` | `media-videos` |
| 10 | Location optional; consent for marketing; opt-outs honoured; consent-aware counts | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `consent-and-notifications` | `developer-backend`, `security-auditor`, `code-reviewer` | `communications, users` |
| 11 | Admins scoped to city/area + permissions; sensitive actions audit-logged | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit` | `developer-backend`, `security-auditor`, `code-reviewer` | `admin, audit` |
| 12 | Role cannot be deleted while assigned; system roles never deletable | `domain-accounts-admin.instructions.md` | `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `admin` |
| 13 | DPDP: minimise, consent, export/delete; KYC visible only to authorised admins | `security.instructions.md`, `domain-accounts-admin.instructions.md` | `secure-coding-review` | `developer-backend`, `security-auditor`, `code-reviewer` | `users, admin` |
| 14 | Explore filter state in shareable URL; Explore and Search keep separate filter state | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `explore-filter-url-state` | `developer-frontend`, `code-reviewer` | `search` |
| 15 | Media appears in Gallery/Reels only if vendor allows it (consent) | `domain-media-engagement.instructions.md` | `media-embeds-and-reels` | `developer-backend`, `developer-frontend`, `code-reviewer` | `media-videos, businesses` |
| 16 | Offer applies only while active and not expired; expired/out-of-stock states shown clearly | `domain-commerce.instructions.md` | `write-tests` | `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` |
| 17 | A service's subcategory drives Explore/Search filters and counts | `domain-catalog-search.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping` | `developer-backend`, `developer-frontend`, `code-reviewer` | `services, search` |

**All 17 invariants covered; no empty cells above.**


`security-auditor` is additionally required (not re-listed per row) for any PR touching auth, 
payments, uploads/CSV, embeds, admin permissions, or communications, per `AGENTS.md`, regardless of 
whether it is already listed in a row's Agent(s) column.
