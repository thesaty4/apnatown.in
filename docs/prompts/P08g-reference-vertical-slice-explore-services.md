# P8g: Reference vertical slice - Explore Services with the subcategory multi-select filter

> Paste this prompt into the GitHub Copilot agent. It is self-contained.

You are a principal engineer and technical writer working in the ApnaTown.in repository. You have no memory of earlier work. Everything you need is in this prompt and in the repository files named below. Read the Design Context Pack files first; do not rely on assumptions or outside knowledge of the product.

**Your role in this task:** staff engineer producing the reference vertical slice that every other feature will copy

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
Also read `docs/specs/03-database/`, `docs/specs/04-backend/`, `docs/specs/05-frontend/`, `docs/specs/06-shared-ui/`. Study in the prototype: `reference/prototype-source/js16.js`, `js21.js`, `js22.js`, `js23.js` (Explore, services filter, search) and screenshots `m-customer-explore.jpg`, `d-customer-explore.jpg`, `m-customer-cat-wedding.jpg`.

## OUTPUT FILES (exact paths)
- `docs/specs/08-screens/reference-slice-explore-services.md`

## REQUIRED CONTENTS
Write the complete, end-to-end specification **with real code** for the feature set F-EX-001..012, F-SR-006..007, F-HM-004 and F-SV-001 (service card), covering all layers:
1. **Behaviour**: all rules from `01-feature-inventory.md` (EX6 in full), the URL contract (`/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting`), Back/scroll, per-tab filters, counts per tab, empty states, Hindi long labels, keyboard and screen-reader behaviour, the five UX states and the states 'default, one subcategory selected, several across two categories, no results with suggestion to remove the last filter, loading, error'.
2. **Database**: tables and indexes involved; the facet-count query (counts per category and subcategory given the other filters, distance via PostGIS) with SQL and EXPLAIN-friendly design; keyset pagination query.
3. **Backend (NestJS)**: `GET /api/v1/explore/services` request/response DTOs (items, `facets.categories[]`, `facets.subcategories[]` with counts, `nextCursor`), validation of comma-separated slug lists, allow-listed sort, caching strategy, tests; module skeleton code (`explore` use-case calling `catalog` and `services` ports).
4. **Frontend (Next.js + Tailwind + React Query)**: route file with Server Component data loading and streaming; client filter island with mandatory TanStack React Query hooks over the typed API client, URL-derived keys and hydration per the [shared API contract](../../specs/_foundation/frontend-shared.md#api-integration-with-react-query); `useUrlState`; **`SubcategoryMultiSelect` full TSX code** (grouped, counts, Select all/Clear, inner search >8, Show more, disabled at 0, OR logic, removing a category removes its subcategories, chips + Clear all, skeleton while counts update), `FilterPanel` (sheet/sidebar/tablet bar), `ServiceCard`, `ActiveFilterChips`; shared components used; token classes; i18n keys (EN/HI).
5. **SEO**: indexable vs noindex rules for filter combinations, canonical, metadata, JSON-LD ItemList.
6. **Tests**: unit (reducer/URL parser), integration (API with facets), component (a11y, keyboard), e2e (Home -> Wedding & Events -> Explore Services -> filters -> tick DJ & Sound and Tent & Lighting -> results/chips update -> open a service card).
7. A **'how to copy this slice'** checklist for other features (file by file).


## STANDING REQUIREMENTS (apply every one; they are binding)

1. **Complete coverage.** Every feature, screen, flow, state and rule from the Design Context Pack must appear in your output. No "etc.", no "similar to above", no deferred items. Every feature ID (F-...) must be traceable to screens (S-...), components, APIs, tables and tests. Do not drop anything from the later additions: category tiles that deep-link to Explore (pre-selected in Products, Shops and Services tabs), offers that open product/service/list, the Explore Services filter with category + subcategory multi-select and URL state, Products & Services section with pills, Videos/Reels (feed, follow, like, share, comments, report, linked items, moderation), videos on product/service pages, service cards and service details, smart search with keyword mapping, gallery and media-consent rules, keyword mapping tool, and the dashboards for every role.
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
- [ ] Code blocks are complete and consistent with P4, P5 and P6
- [ ] Every EX6 rule is implemented in the code and covered by a test
- [ ] The e2e test matches flow J2 step by step
- [ ] Every ID listed in the coverage table at the end exists in the output (no empty cells)
- [ ] All standing requirements above were applied; assumptions are recorded as Open Issues
- [ ] A coverage table (feature IDs / screen IDs covered by this document) is included
