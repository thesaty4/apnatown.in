# P4: Backend specification for NestJS

**Verification policy:** Follow [the repository policy](../../.github/instructions/testing.instructions.md). Do not create automated test files or test-runner scaffolding for FE, BE or DB. Preserve acceptance scenarios as manual checks and report existing non-test command results and gaps.

> Paste this prompt into the GitHub Copilot agent. It is self-contained.

You are a principal engineer and technical writer working in the ApnaTown.in repository. You have no memory of earlier work. Everything you need is in this prompt and in the repository files named below. Read the Design Context Pack files first; do not rely on assumptions or outside knowledge of the product.

**Your role in this task:** senior NestJS architect

## INPUTS (read these first, in full)
docs/design-context/00-product-summary.md
docs/design-context/01-feature-inventory.md   (206 features, IDs F-<AREA>-NNN)
docs/design-context/02-screen-inventory.md    (105 screens, IDs S-<ROLE>-NN, routes, states, feature map)
docs/design-context/03-user-flows.md          (14 flows J1-J14 with diagrams)
docs/design-context/04-design-tokens.json     (exact token values, light and dark)
docs/design-context/05-design-system.md
docs/design-context/06-component-catalogue.md
docs/design-context/07-state-machines-and-business-rules.md  (ST-* and BR-01..22, formulas, validation)
docs/design-context/08-permissions-matrix.md
docs/design-context/09-content-and-i18n.md and 09a-i18n-en-hi.json (927 strings)
docs/design-context/10-sample-data.json       (Padrauna sample data)
docs/design-context/11-open-issues-and-assumptions.md
docs/design-context/screenshots/              (reference images: m-<role>-<view>.jpg = 390px, d-<role>-<view>.jpg = 1280px, plus dark and Hindi samples)
docs/design-context/reference/apnatown-prototype.html and reference/prototype-source/ (the runnable prototype and its complete source and stylesheet; the visual and behavioural source of truth)
Also read `docs/specs/01-product/`, `docs/specs/02-architecture/`, `docs/specs/03-database/`.

## OUTPUT FILES (exact paths)
- `docs/specs/04-backend/01-structure-and-patterns.md`
- `docs/specs/04-backend/02-shared-layer.md`
- `docs/specs/04-backend/03-modules/<module>.md` (one per module)
- `docs/specs/04-backend/04-endpoint-catalogue.md`
- `docs/specs/04-backend/05-dtos-and-validation.md`
- `docs/specs/04-backend/06-realtime-and-queues.md`
- `docs/specs/04-backend/07-security-and-authorisation.md`
- `docs/specs/04-backend/08-error-codes.md`
- `docs/specs/04-backend/09-reference-module-skeleton.md` (real code)

## REQUIRED CONTENTS
### Structure and patterns
Folder tree for `apps/api` (`src/modules/<module>/{domain,application,infrastructure,presentation}`, `src/shared`, `src/config`), layering controller -> use-case -> repository, ports and adapters, domain events, DI rules, naming, verification boundaries, dependency rules enforced by lint (for example eslint boundaries).
### Shared layer (everything reused lives here)
Specify: base repository and unit-of-work/transaction helper; `Money` value object (paise); id and clock providers; pagination helper (keyset cursors + limit caps); `@Roles`, `@Permission(module, action)`, `@Scoped()` decorators; `RolesGuard`, `PermissionGuard`, **`AreaScopeGuard`/policy service (city/area scoped admin permissions)**; ownership policy helpers; `IdempotencyInterceptor`; `AuditInterceptor/@Audit`; `RateLimitGuard`; `ValidationPipe` with whitelist; `ParseUuidPipe`, `ParseSlugPipe`, `ParseCsvPipe` (comma lists such as `subcategory=dj-sound,tent-lighting`); `AllExceptionsFilter` mapping domain errors to the stable error contract; localisation of messages (en/hi); correlation-id middleware; logger; OpenAPI helpers; outbox publisher; adapter interfaces (PaymentGateway, OtpSender, WhatsAppClient, EmailSender, FileStorage, Geocoder, MapsClient); feature-flag service; settings service (admin-editable config cache with invalidation).
### One file per module
For each module (auth, users, catalog, businesses, products, services, search, offers, cart-checkout, orders, delivery, payments, reviews, media-videos, engagement, notifications, communications, geo, admin, audit, settings, files): responsibilities; entities and tables; use-cases (name, input, output, rules, errors); endpoints (method, path, auth, role, permission, scope, request DTO, response DTO, errors, idempotency, rate limit); events published/consumed; jobs; caching; manual acceptance scenarios; the feature IDs and rules (BR) it implements. Include state-machine implementation approach for orders, delivery jobs, approvals, offers, videos, enquiries, subcategory suggestions, campaigns.
### Endpoint catalogue
One table for the whole API (`/api/v1/...`): every endpoint needed by every screen in `02-screen-inventory.md`, including: Explore (`GET /explore/products|shops|services` with filters, facet counts and cursor), search with keyword mapping and suggestions, home sections, offers resolution, profile, product, service, cart, checkout (split orders), payments and webhooks, orders and tracking, cancel/refund, reviews, engagement, videos feed and moderation, vendor/provider dashboards, rider flows, admin queues, communications, super-admin (admins, roles, cities/zones, settings, analytics), keyword mapping with preview. Columns: ID, method, path, module, roles, permission, scope, request, response, errors, idempotent, rate limit, features, screens.
### DTOs and validation
Shared DTO base types, zod or class-validator schemas shared with the frontend package, example DTOs (ExploreServicesQuery, CheckoutRequest, OrderResponse, VideoSubmitRequest, RolePermissionMatrix).
### Realtime and queues
SSE/WebSocket channels (order tracking, rider requests with countdown, live deliveries, notifications), queues (notifications, media, campaigns, reports, search indexing), retries, dead-letter, idempotent consumers.
### Security and authorisation
Authn flows, session model, CSRF, rate limits, OTP protections, **authorisation matrix implementation** (role + ownership + city/area scope + module permission), audit log events list, webhook verification, upload and embed validation (allow-listed hosts, server-rebuilt embed URLs), PII handling, secrets.
### Error codes
Stable code catalogue (domain.code, HTTP status, message key en/hi, when thrown) covering every business rule.
### Reference module skeleton (real code)
Full TypeScript skeleton for ONE module end to end (use `catalog` with subcategory suggestion approve/merge): module file, controller, DTOs, use-case, repository interface + implementation, domain entity, events, guard usage, manual verification scenarios, OpenAPI decorators.


## STANDING REQUIREMENTS (apply every one; they are binding)

1. **Complete coverage.** Every feature, screen, flow, state and rule from the Design Context Pack must appear in your output. No "etc.", no "similar to above", no deferred items. Every feature ID (F-...) must be traceable to screens (S-...), components, APIs, tables and verification evidence. Do not drop anything from the later additions: category tiles that deep-link to Explore (pre-selected in Products, Shops and Services tabs), offers that open product/service/list, the Explore Services filter with category + subcategory multi-select and URL state, Products & Services section with pills, Videos/Reels (feed, follow, like, share, comments, report, linked items, moderation), videos on product/service pages, service cards and service details, smart search with keyword mapping, gallery and media-consent rules, keyword mapping tool, and the dashboards for every role.
2. **UI and behaviour parity.** The built UI and functionality must match the design exactly: colours, typography, spacing, radius, shadows, icons, copy in English and Hindi, states and interactions. Use only the tokens in `docs/design-context/04-design-tokens.json` (and the prototype stylesheet) through the Tailwind theme. Never invent styles or behaviour. When the pack and the prototype disagree, the prototype wins and you record the conflict in `docs/design-context/11-open-issues-and-assumptions.md`.
3. **Tech stack (fixed).** Next.js (App Router, TypeScript) with Tailwind CSS; NestJS (TypeScript); PostgreSQL. For everything else (ORM, cache, queue, search, storage, realtime, payments, OTP/SMS, WhatsApp, maps, video processing, hosting) choose the option most suitable for each feature and justify it in 2 to 3 lines: the alternative considered and when to switch. Prefer proven, low-cost choices suited to a Padrauna launch that can scale to more cities.
4. **System design per feature.** Use the design approach suited to each feature, for example: state machines for orders, deliveries, approvals, offers and videos; transactional outbox for notifications and webhooks; queues for media processing and campaigns; idempotency keys for payments, orders, refunds and messages; PostGIS geospatial indexing for nearby search; cursor (keyset) pagination for feeds and lists; denormalised counters for likes, followers and views; caching with explicit invalidation; optimistic locking for stock and status. Give a sequence description (Mermaid sequence diagram plus numbered steps) for each critical flow.
5. **Frontend rules.** (a) Anything used more than once becomes a shared component (Input, Button, Select, Checkbox, Chip, Pill, Card, ShopCard, ProductCard, ServiceCard, Modal, Sheet, FilterPanel, SubcategoryMultiSelect, Tabs, DataTable, Timeline, Charts, EmptyState, etc.) and is reused everywhere; list every shared component with props, variants and states. (b) DRY: shared hooks, utilities, zod schemas, types and constants (one source in a shared package). (c) SOLID: single responsibility, open/closed extension points, small interfaces, dependency inversion. (d) Best SEO architecture: Server Components by default; an explicit rendering strategy per route (SSG, ISR, SSR, CSR) with reasons; readable stable URLs; metadata; JSON-LD; canonical and robots policy (faceted filters policy); sitemaps; image and font optimisation; Core Web Vitals budgets. (e) Feature-based folder structure with import rules (no cross-feature imports except through public APIs), URL state for filters, and no business logic inside UI components.
6. **Backend rules.** (a) Anything reused becomes a shared module, guard, decorator, interceptor, pipe, filter, base class or helper in a shared layer. (b) Modular monolith with clean layering controller -> use-case/service -> repository, domain events, and adapters (ports) for every third-party service (payment, OTP/SMS, WhatsApp, storage, maps, email). (c) DRY and SOLID. (d) Always choose the best system design for each functionality and justify it. (e) Authorisation, including area-scoped admin permissions, enforced on the backend for every endpoint (role + ownership + city/area scope + module permission). (f) Money stored as integer paise; stable machine-readable error codes; OpenAPI generated from DTOs; idempotency; rate limiting; audit logging; structured logs with correlation ids; parameterised queries only.
7. **Output format.** Markdown files with a table of contents and consistent feature IDs; tables for matrices; code blocks for schemas, folder trees and examples; Mermaid for diagrams (architecture, ERD, state machines, sequences). Include the reference implementations required by the master prompt: one shared component, one NestJS module skeleton and one vertical slice (Explore services with the subcategory multi-select filter).
8. **Never invent requirements.** If something is unclear, record it as an Open Issue (ID, question, assumption used, impact) in `docs/design-context/11-open-issues-and-assumptions.md` and continue with the stated assumption.
9. **Security, quality and operations baseline.** OWASP ASVS/Top 10 aligned; DPDP-aligned privacy (consent, export/delete); no secrets in code; accessibility WCAG 2.2 AA; English and Hindi for every user-facing string; INR in integer paise; UTC storage and IST display; all lists paginated; all state machines enforced server-side.


## LONG OUTPUT RULE
If the output is too long for one response, continue in numbered parts (Part 1, Part 2, ...). Never summarise, never skip, never write "and so on". At the end of every part list: (a) what is covered so far (IDs), and (b) what remains. Continue until everything is covered, then end with "ALL PARTS COMPLETE" and the final coverage table.

## DONE WHEN (tick every box before you finish and paste the ticked list)
- [ ] All 22 modules specified; every screen has the endpoints it needs in the catalogue
- [ ] Shared layer lists every reusable provider and who uses it
- [ ] Area-scoped admin authorisation fully specified and testable
- [ ] Reference module skeleton compiles in principle and follows the specified layering
- [ ] Every ID listed in the coverage table at the end exists in the output (no empty cells)
- [ ] All standing requirements above were applied; assumptions are recorded as Open Issues
- [ ] A coverage table (feature IDs / screen IDs covered by this document) is included
