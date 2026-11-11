# P8a: Screen-by-screen implementation specs - Customer (guest and logged in)

> Paste this prompt into the GitHub Copilot agent. It is self-contained.

You are a principal engineer and technical writer working in the ApnaTown.in repository. You have no memory of earlier work. Everything you need is in this prompt and in the repository files named below. Read the Design Context Pack files first; do not rely on assumptions or outside knowledge of the product.

**Your role in this task:** senior full-stack engineer and UX analyst

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
Also read `docs/specs/05-frontend/`, `docs/specs/06-shared-ui/`, `docs/specs/04-backend/04-endpoint-catalogue.md`, `docs/specs/08-screens/reference-slice-explore-services.md`. Look at the matching screenshots in `docs/design-context/screenshots/` for every screen (mobile `m-...`, desktop `d-...`) and open the prototype source for exact behaviour.

## OUTPUT FILES (exact paths)
- `docs/specs/08-screens/screens-customer.md` (split into numbered parts if long)

## REQUIRED CONTENTS
Write one section for **every Customer (guest and logged in) screen** in `02-screen-inventory.md` (38 screens; role code C). None may be skipped. Each section must contain:
1. **Header:** screen ID, name, production route (and query contract), rendering strategy, role/permission, linked feature IDs and flows.
2. **Purpose and layout:** mobile (360px), tablet, desktop layouts with regions and the shared components used (by name from `06-shared-ui`), plus the screenshot file names to match.
3. **Data and API:** each endpoint called (from the endpoint catalogue), params, caching, loading strategy.
4. **States:** default, loading skeleton (shape), empty (copy EN/HI and action), error (retry), no-permission, offline, plus every special state from the inventory.
5. **Interactions:** step-by-step behaviour for every control (including keyboard, focus, Esc/back behaviour, animations and reduced-motion).
6. **Validation and rules:** field rules, BR/ST references, error messages (EN/HI keys).
7. **Analytics events, SEO (if public), i18n keys, tokens used** (token names only).
8. **Acceptance criteria** in Given/When/Then (happy, negative, permission, empty/error, Hindi/long text, dark mode).
9. **Test plan** (component, integration, e2e) and a **visual parity checklist** against the screenshots (colours, spacing, radius, shadows, icons, copy).
Run this prompt in numbered parts (for example Part 1 discovery: Home, Explore, Search, Services, Category, profiles, product, service; Part 2 commerce: Cart, Checkout, Orders, Refund, Invoice, Reviews; Part 3 engagement and account: Saved, Offers, Videos/Reels, Notifications, Preferences, Account, Profile, Addresses, Login, Session, Help, legal, system pages). Include the overlays that are not separate routes: splash and language, location primer, cookie and WhatsApp consent, login prompt sheet, share sheet, filter sheet, full-screen viewer, enquiry success, payment failure, outside-service-area. Reels (S-CUST for `videos`) must specify every overlay, pill, state and the desktop side panel.

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
- [ ] All 38 Customer (guest and logged in) screens have a section with every item above
- [ ] Every shared component referenced exists in `06-shared-ui`; any missing component is added to P6 spec (note it)
- [ ] Every endpoint referenced exists in the endpoint catalogue
- [ ] Every ID listed in the coverage table at the end exists in the output (no empty cells)
- [ ] All standing requirements above were applied; assumptions are recorded as Open Issues
- [ ] A coverage table (feature IDs / screen IDs covered by this document) is included
