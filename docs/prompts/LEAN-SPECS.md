# PROMPT: Write the lean development specs (backend and frontend) for ApnaTown.in

**Verification policy:** Follow [the repository policy](../../.github/instructions/testing.instructions.md). Do not create automated test files or test-runner scaffolding for FE, BE or DB. Preserve acceptance scenarios as manual checks and report existing non-test command results and gaps.

> Give this to the GitHub Copilot agent. It replaces prompts P02 to P11. Do NOT run those. Save this file as `docs/prompts/LEAN-SPECS.md` and tell Copilot: "Read and execute `docs/prompts/LEAN-SPECS.md` exactly."

You are a senior full-stack engineer writing **short, precise, implementation-ready specs**. You have no memory of earlier work; use only this prompt and the repository files.

## 1. GOAL

Fill the existing folders `specs/<module>/be/` and `specs/<module>/fe/` (they exist and are empty) plus four short foundation files in `specs/_foundation/`, so developers and Copilot can build the whole product from them with UI and behaviour identical to the design. Stack is fixed: **Next.js (App Router, TypeScript) + Tailwind, NestJS (TypeScript), PostgreSQL.**

## 2. READ FIRST (inputs; do not copy their content into the specs, reference it by ID)

- `docs/design-context/01-feature-inventory.md` (206 features, F-IDs) and `02-screen-inventory.md` (105 screens, S-IDs, routes, states, screenshot names)
- `03-user-flows.md`, `04-design-tokens.json`, `05-design-system.md`, `06-component-catalogue.md`
- `07-state-machines-and-business-rules.md` (ST-* and BR-01..22, formulas, validation), `08-permissions-matrix.md`, `09-content-and-i18n.md`, `10-sample-data.json`, `11-open-issues-and-assumptions.md`
- `docs/design-context/screenshots/` and `reference/` (runnable prototype + source = visual and behavioural truth; if the pack and the prototype disagree, the prototype wins and you log it in file 11)
- `.github/copilot-instructions.md` and `docs/specs/_progress.md`

- [Canonical media/maps contract](../../specs/_foundation/media-and-maps.md): settled provider/licensing choices, public/private-purpose separation, readiness and manual acceptance. It governs older media/maps alternatives or direct-video-upload suggestions in the pack/prototype.

## 3. KEEP IT LEAN (hard rules: no over-engineering)

1. **Reference, never repeat.** Do not re-describe things the pack already defines. Cite IDs (F-, S-, BR-, ST-, J-) and screenshot file names. Standard UX states (default, skeleton, empty, error + retry, no-permission, offline) are defined once in the foundation file; screens list only their **special** states.
2. **Size limits:** a module BE spec <= ~250 lines, a module FE spec <= ~250 lines, each foundation file <= ~300 lines. Tables and bullets, no prose padding, no marketing text, no repeated explanations.
3. **Build only what the features need.** Forbidden unless a feature in the pack requires it: microservices, Kubernetes, event sourcing, CQRS, GraphQL, an external search engine, a service mesh, a data lake, multi-region, custom auth protocols, generic plugin systems.
4. **Default lean choices** (change only with a one-line justification in `architecture.md`; the fixed React Query requirement is not optional): modular monolith; REST + OpenAPI generated from DTOs; zod schemas shared between web and api; PostgreSQL with PostGIS (geo), pg_trgm + unaccent + full-text (search); a Postgres-based job queue (pg-boss) and a transactional outbox, so **no Redis at launch**; SSE for realtime (order tracking, rider requests, live map); httpOnly cookie sessions; Next.js cache + ISR for public pages, mandatory TanStack React Query (`@tanstack/react-query`) for all client API reads/mutations per the [shared contract](../../specs/_foundation/frontend-shared.md#api-integration-with-react-query); next-intl for English/Hindi; adapters (ports) for payment gateway, OTP/SMS, WhatsApp, email, maps and file storage with approved local verification adapters; money in integer paise.
5. **One place per fact.** Each table is defined in exactly one module BE spec. Each reusable thing is defined once in a foundation file and only referenced elsewhere.
6. **Do not invent requirements.** Unknowns go to `docs/design-context/11-open-issues-and-assumptions.md` (append: ID, question, assumption used) and you continue.

## 4. WHAT TO PRODUCE

### 4.1 Foundation (write these first; commit as `docs(specs): foundation`)

**`specs/_foundation/architecture.md`**

- Module list (below) with one-line responsibility, allowed dependencies (a table or small Mermaid graph), and owned tables.
- Technology decisions table (Decision | Choice | Why in one line | Switch when): ORM/query layer and migrations, queue, search, realtime, storage, payments, OTP/SMS, WhatsApp, maps, hosting region, observability, CI. Mark undecided vendors as Open Issues with a recommendation.
- **Six critical flows** as numbered steps plus failure handling (Mermaid sequence optional): checkout split into per-shop orders with payment and idempotency; order state machine with notifications via outbox; delivery assignment with 60 s countdown and OTP verification; video submit -> moderation -> publish; admin approval with area-scoped authorisation; Explore services facet counts and URL contract.
**`specs/_foundation/backend-shared.md`**
- `apps/api` folder tree (`src/modules/<module>/{presentation,application,domain,infrastructure}`, `src/shared`), layering controller -> use-case -> repository, dependency rules.
- **Shared layer, each item with one line of purpose and usage rule:** config, logger + correlation id, exception filter + stable error contract (`{code, message_key, status, details, correlationId}`), validation pipe (whitelist) and csv/slug/uuid pipes, `Money` (paise), clock + id providers, pagination helper (keyset cursor, limit cap 50), base repository + unit-of-work, decorators `@Roles @Permission(module,action) @Scoped`, guards (roles, permission, **area/city scope for admins**, ownership policy helper), interceptors (idempotency key, audit), rate-limit guard, outbox publisher + job runner, adapter interfaces with fakes, settings and feature-flag service, OpenAPI setup, i18n message catalogue (en/hi).
- Error-code naming and the starter catalogue for the business rules.
- **One reference module skeleton in real TypeScript** (use `catalog`: suggest subcategory -> admin approve/merge): module, controller, DTO (zod), use-case, repository interface + implementation, entity, event, guard usage, manual rule and authorisation-negative verification scenarios.
**`specs/_foundation/frontend-shared.md`**
- `apps/web` folder tree: route groups `(public) (account) (vendor) (provider) (rider) (admin) (super-admin)`, `src/features/<feature>/{components,hooks,api,schemas,server}`, `src/shared/{ui,hooks,lib,i18n}`; import rules (features import only shared or other features' `index.ts`; shared never imports features; UI components hold no business logic or data fetching).
- **Rendering strategy table by route group** (SSG / ISR with revalidate tags / SSR / CSR) with the reason, plus SEO rules per public page type in a compact table (URL pattern, title/description template EN/HI, JSON-LD type, canonical, index/noindex; filter combinations noindex except category and subcategory landing pages; sitemaps; hreflang EN/HI).
- **API integration:** define the shared React Query contract once: typed transport and errors, provider/request-local SSR hydration, key scope, freshness/retries, pagination, mutation invalidation/rollback, session cleanup and acceptance checks. Module specs reference it and add only endpoint-specific details; Server Components remain the default.
- Tokens -> Tailwind mapping (CSS variables for light/dark from `04-design-tokens.json`, no raw hex in components), fonts (Poppins, Noto Sans, Noto Sans Devanagari via next/font), breakpoints 600/900.
- **Shared component list** (every component in `06-component-catalogue.md`): name, props one-liner, variants, owner file path. Plus shared hooks/utilities (`useUrlState`, `useBackScroll`, `useAuthGate`, formatters).
- Standard UX states component set and rules; i18n rules (keys, EN/HI, long Hindi); auth gate and return-to-origin; URL-state contract for Explore/Search/Reels; performance budgets (LCP < 2.5 s slow 4G, route JS ~170 KB gzip, CLS < 0.1) and image/video rules; PWA/offline/data-saver basics.
- Cross-cutting features covered here, each listed by F-ID: X1-X7, X10, X13, X15, AU1-AU3 and anything else not module-specific.
- Two reference components in real code: **Button** and **Input** (variants via tokens, a11y, loading state, manual verification).
**`specs/_foundation/data-model.md`**
- Conventions (snake_case, UUIDv7, `timestamptz` UTC, money `bigint` paise, soft delete, `version` for optimistic locking, i18n columns `name_en/name_hi`), one overall ERD (Mermaid) with table ownership per module, and the index strategy for the hot queries (Explore facets, nearby via PostGIS, feeds with keyset pagination, admin queues). Full column definitions live in each module's BE spec.

**`specs/_foundation/media-and-maps.md`**
- Keep the [canonical media/maps contract](../../specs/_foundation/media-and-maps.md) authoritative for public-purpose images, link-only videos, map rendering/editing, licensing/tile use, configuration/readiness and manual acceptance. Other foundations and module specs reference it without duplicating its contract or redefining Media's ports, DTOs or image gateway.

### 4.2 Module specs

Modules (existing folders): `auth, users, geo, catalog, businesses, products, services, search, offers, cart-checkout, payments, orders, delivery, reviews, engagement, media-videos, notifications, communications, admin, audit, settings`. Write them **in this dependency order, one module at a time, BE then FE**. Default ownership (if a feature is not listed, put it in the module owning its main data and say so; the coverage script is the final judge):

Module
Features (areas)
Screens (by name in `02`)

auth
AU4, AU6, AU7
Login, Session expired

users
AU5, AU8, AC1-AC4, X8
Account, Profile, Addresses, Account deleted

geo
LC1-LC5, SA4
Cities, City detail (+ location primer overlays)

catalog
HM3-HM4, SV8, AD5, AD6, AD15, SA8, VD6
Services home, Category page, Categories, Subcategory suggestions, Search keywords

businesses
PF1-PF7, PF11-PF13, VD1-VD3, VD11, VD18, PV1, PV2, PV6, PV7, X11
Shop profile, Provider profile, Vendor/Provider onboarding, overview, profile editor, QR, account, analytics

products
PD1-PD3, PD6, PD8-PD9, VD4, VD5, VD9
Product details, Products, Product editor, Inventory (vendor and provider variants)

services
SV1-SV7, VD14, VD16, PV3, PV4
Service details, Services manager, Enquiries

search
HM1-HM2, HM5-HM14, EX1-EX12, SR1-SR10
Home, Explore, Search

offers
OF1-OF5, PD4, VD7, AD11
Offers, Vendor offers, Promotions

cart-checkout
CK1-CK9
Cart, Checkout, Order placed

payments
payment/refund processing for CK6-CK7, OR6, VD17
Earnings and plan

orders
OR1-OR8, VD8, AD7, PV5
My orders, Order detail, Cancel/refund, Invoice, Vendor/Provider orders and detail, Orders and disputes, Case detail

delivery
RD1-RD8, AD8
all Rider screens, Live deliveries

reviews
RV1-RV7, AD9, PD7
My reviews, Write a review, Vendor/Provider reviews, Review moderation

engagement
EG1-EG7, PF8, VD15, NT3
Saved, Followers

media-videos
RL1-RL10, PF9, PF10, PD5, SV4, VD12, VD13, AD10
Videos/Reels, Gallery and videos manager, Provider media, Videos and moderation

notifications
NT1, NT2, X12
Notifications, Notification preferences, Vendor/Provider notifications

communications
AD12
Communications

admin
AD1-AD4, AD13, AD16, SA1-SA3, SA6
Admin overview, Approvals, Listings, Users, Reports, Admin profile, Super admin overview, Admins and areas, Roles and permissions, Platform analytics

audit
X14, AD14, SA7
Audit log, Activity monitor

settings
SA5, AC5-AC7, X9
Global settings, Help, About, Terms, Privacy, 404, 500, Offline, Maintenance

**BE spec template (`specs/<module>/be/<module>.md`; split into several files by feature only if > 250 lines):**

```
# BE: <module>
Features: F-... | Rules: BR-.. | State machines: ST-.. | Depends on / used by: ...
## Responsibility (3-5 lines)
## Tables (this module owns these; full definition): name; columns (name type null default); PK/FK; unique/check; indexes and the query each serves
## Endpoints
| Method | Path | Auth, role, permission, scope | Request -> response (DTO + key fields) | Errors | Idempotent | Features / screens |
## Rules and use-cases (numbered; include state transitions with guards, formulas, validation from file 07)
## Events and jobs (published / consumed; retries)
## Error codes added (stable code, status, message key)
## Acceptance criteria (Given/When/Then; 6-12 key ones: happy path, validation, permission/scope denial, state-machine violation, concurrency/idempotency where relevant)
## Verification (manual API/DB, rules and authorisation negatives; no automated test files)
```

**FE spec template (`specs/<module>/fe/<module>.md`):**

```
# FE: <module>
Features: F-... | Screens: S-... | Flows: J..
## Routes and rendering
| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
## Screens (one compact block each; every screen of this module in `02`)
- Screen S-.. name | route | screenshot files (`m-...`, `d-...`) to match
- Layout: mobile / tablet / desktop regions (shared components named from `frontend-shared.md`)
- Data: endpoints (from BE specs), server-only reads vs required React Query hooks; scoped keys, freshness/retries, mutation invalidation/rollback and hydration where needed (reference the shared API contract)
- Special states (beyond the standard set) and their copy keys
- Interactions: bullets (incl. keyboard, Esc/back, URL state)
- Validation and rules (BR/ST refs)
- Acceptance criteria (Given/When/Then, 3-6; include permission, empty/error, Hindi/dark where relevant)
## Feature components (only those not in shared) and shared components used
## i18n key prefix, analytics events (name + trigger only)
## Verification (manual UI including shared React Query cases and journey IDs; no automated test files)
```

Backend-only modules (payments, audit, notifications BE) may have a very short FE spec that says what screens exist. Every authorisation rule must say **role + ownership + city/area scope + module permission** where applicable.

## 5. PROCESS (small steps, human review)

1. Work on branch `docs/lean-specs`. Commit after the foundation and after **each module** (`docs(specs): <module>`).
2. After the foundation and after every 5 modules, **stop**, post a short summary (IDs covered, open issues added) and wait for the reply "continue".
3. If output is too long, continue in numbered parts; never summarise or skip; end each part with "covered so far / remaining".
4. Keep consistent naming of endpoints, DTOs, tables and error codes across modules; when a module needs something from another, reference the owning spec instead of redefining it.
5. Update `docs/specs/_progress.md` (checklist per module: BE done, FE done).

## 6. COVERAGE CHECK (required, small)

Create `scripts/check-spec-coverage.mjs` (Node, no dependencies) that: reads F-IDs from `docs/design-context/01-feature-inventory.md` (rows starting `| F-`) and S-IDs from `02-screen-inventory.md` (rows starting `| S-`); reads all Markdown under `specs/` (excluding `_templates`); fails (exit 1) if any F-ID or S-ID does not appear, if any module folder lacks `be/*.md` or `fe/*.md`, or if any module spec exceeds 400 lines; prints counts. Run it and fix every gap by editing the specs (not by listing them). Paste the output.

## 7. DONE WHEN

- [ ] `specs/_foundation/` contains the current foundations, including [media and maps](../../specs/_foundation/media-and-maps.md); reference code for the module skeleton, Button and Input is included
- [ ] All 21 modules have a BE and an FE spec following the templates, within the size limits
- [ ] `node scripts/check-spec-coverage.mjs` passes (all 206 features and 105 screens covered)
- [ ] No forbidden over-engineering (section 3); open questions appended to file 11
- [ ] `docs/specs/_progress.md` updated; PR opened for human review (do not merge)