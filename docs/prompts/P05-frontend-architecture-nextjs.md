# P5: Frontend architecture for Next.js with Tailwind

> Paste this prompt into the GitHub Copilot agent. It is self-contained.

You are a principal engineer and technical writer working in the ApnaTown.in repository. You have no memory of earlier work. Everything you need is in this prompt and in the repository files named below. Read the Design Context Pack files first; do not rely on assumptions or outside knowledge of the product.

**Your role in this task:** principal frontend architect focused on SEO and performance

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
Also read `docs/specs/01-product/`, `docs/specs/02-architecture/`, `docs/specs/04-backend/04-endpoint-catalogue.md`.

## OUTPUT FILES (exact paths)
- `docs/specs/05-frontend/01-architecture.md`
- `docs/specs/05-frontend/02-routes-and-rendering.md`
- `docs/specs/05-frontend/03-folder-structure-and-import-rules.md`
- `docs/specs/05-frontend/04-state-and-data.md`
- `docs/specs/05-frontend/05-auth-and-session.md`
- `docs/specs/05-frontend/06-i18n.md`
- `docs/specs/05-frontend/07-performance-and-budgets.md`
- `docs/specs/05-frontend/08-pwa-offline-lite-mode.md`
- `docs/specs/05-frontend/09-url-state-contract.md`
- `docs/specs/05-frontend/10-forms-and-validation.md`
- `docs/specs/05-frontend/11-ux-states.md`
- `docs/specs/05-frontend/12-analytics-events.md`

## REQUIRED CONTENTS
### Routes and rendering (core table)
One row per production route in `02-screen-inventory.md`: route, role, **rendering strategy (SSG, ISR with revalidate/tag, SSR, CSR) with the reason**, data fetching (server component fetch, route handler, client query), cache and revalidation (tags on product/offer/category/keyword changes), auth guard, SEO index policy, layout group, loading/error/not-found files, parallel/intercepting routes if used (for example filter sheet, viewer). Public discovery pages must be Server Components with streaming; dashboards behind auth are client-heavy and `noindex`; Reels is client-driven with server-rendered shell.
### Architecture and folder structure
App Router layout groups: `(public)`, `(account)`, `(vendor)`, `(provider)`, `(rider)`, `(admin)`, `(super-admin)`. Feature-based structure `src/features/<feature>/{components,hooks,api,schemas,types,server}`, `src/shared/{ui,hooks,lib,config,i18n}`, import rules (no cross-feature imports except via a feature's `index.ts`; shared never imports features; UI components contain no business logic or data fetching), lint boundaries, naming, barrel policy, server-only modules.
### State and data
Server Components first; TanStack React Query (`@tanstack/react-query`) is mandatory for every client API read/mutation over the generated OpenAPI client. Follow the [shared API integration contract](../../specs/_foundation/frontend-shared.md#api-integration-with-react-query) for query keys, provider/hydration, errors, retries, pagination, mutation invalidation/rollback and cleanup. Do not duplicate cart/session/API responses in Zustand, Context or `useEffect` request state; local UI/forms and URL filters remain separate. Optimistic updates must be permitted by the owning module spec.
### Auth, i18n, performance, PWA
httpOnly cookie sessions, middleware guards and return-to-origin for guests (BR-21); i18n with locale strategy (justify path prefix vs cookie; hreflang), message catalogues seeded from `09a-i18n-en-hi.json`, formatters; budgets (LCP, INP, CLS, JS per route), `next/image`, `next/font` (Poppins, Noto Sans, Noto Sans Devanagari with subsetting and `display: swap`), code splitting (maps, charts, reels, editors), lite/data-saver mode; PWA for rider and installable customer app, offline shell, background-safe request countdown.
### URL state contract
Exact schema for Explore (`tab`, `category`, `subcategory`, `q`, `sort`, price, rating, distance, flags), Search, Reels (`/videos/:id`); parsing/validation with zod; canonicalisation; Back-button and scroll restoration; per-screen filter state; copy-link behaviour.
### Forms, UX states, analytics
Shared form pattern (react-hook-form + shared zod schemas), the five UX states and offline/data-saver patterns as reusable components, and an analytics event catalogue (name, trigger, properties, screens) for every key interaction.


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
- [ ] Every production route has a rendering strategy with reason, cache policy, auth and index policy
- [ ] Import rules and lint boundaries are explicit
- [ ] URL state contract covers every filter in EX/SR
- [ ] Performance budgets and font/image strategy are measurable
- [ ] Every ID listed in the coverage table at the end exists in the output (no empty cells)
- [ ] All standing requirements above were applied; assumptions are recorded as Open Issues
- [ ] A coverage table (feature IDs / screen IDs covered by this document) is included
