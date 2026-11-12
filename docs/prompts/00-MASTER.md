# MASTER PROMPT: Generate the complete development specifications for ApnaTown.in

**Verification policy:** Follow [the repository policy](../../.github/instructions/testing.instructions.md). Do not create automated test files or test-runner scaffolding for FE, BE or DB. Preserve acceptance scenarios as manual checks and report existing non-test command results and gaps.

> Paste this into the GitHub Copilot agent first. It explains the whole job and the order of the follow-up prompts.

You are a principal engineer and technical writer working in the ApnaTown.in repository. You have no memory of earlier work. Everything you need is in this prompt and in the repository files named below. Read the Design Context Pack files first; do not rely on assumptions or outside knowledge of the product.

## GOAL
Generate the complete, implementation-ready development specifications for ApnaTown.in into `docs/specs/`, so that Copilot agents and developers can later build the product with zero ambiguity and with UI and behaviour identical to the finished design.

## STEP 0: READ THE PACK
Read every file in `docs/design-context/` listed below before writing anything. Then write `docs/specs/_progress.md` containing: counts (features, screens, flows, components, tokens, states, business rules, status models, i18n strings), and a checklist of every prompt below (P1..P11, P8a..P8g) with status.
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

## RULES
1. Work one prompt at a time, in the order below. Each prompt file is in `docs/prompts/`. Commit after each prompt with message `docs(specs): <prompt id> <title>`.
2. Do not write application code except the three reference implementations required: (a) one shared component (P6), (b) one NestJS module skeleton (P4), (c) one vertical slice, Explore services with the subcategory multi-select filter (P8g).
3. Everything must be traceable: features F-..., screens S-..., flows J..., rules BR-.., states ST-.. .
4. Record every gap, conflict or assumption in `docs/design-context/11-open-issues-and-assumptions.md` (append; never delete).
5. Tech stack is fixed: Next.js (App Router) + Tailwind, NestJS, PostgreSQL. Choose and justify everything else per feature.
6. UI and functionality must match the prototype exactly (see `reference/` and `screenshots/`).

## ORDER OF PROMPTS AND OUTPUTS
| Order | Prompt file | Output |
|---|---|---|
| 1 | P01-product-and-feature-spec.md | docs/specs/01-product/ |
| 2 | P02-system-architecture.md | docs/specs/02-architecture/ |
| 3 | P03-database-postgresql.md | docs/specs/03-database/ |
| 4 | P04-backend-nestjs.md | docs/specs/04-backend/ |
| 5 | P05-frontend-architecture-nextjs.md | docs/specs/05-frontend/ |
| 6 | P06-shared-component-library.md | docs/specs/06-shared-ui/ |
| 7 | P08g-reference-vertical-slice-explore-services.md | docs/specs/08-screens/reference-slice-explore-services.md |
| 8 | P07-seo.md | docs/specs/07-seo/ |
| 9 | P08a..P08f screen specs by role | docs/specs/08-screens/ |
| 10 | P09-infrastructure-security-operations.md | docs/specs/09-infra-security-ops/ |
| 11 | P10-testing-delivery-traceability.md | docs/specs/10-delivery/ |
| 12 | P11-coverage-audit.md | docs/specs/11-coverage-audit.md (and fixes to all specs) |
After P11 passes, run the implementation prompts `C00` .. `C14` in order (they build the code from the specs).

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

## DONE WHEN
- [ ] `docs/specs/_progress.md` exists with counts and the checklist
- [ ] You confirmed you read every pack file (list them with sizes)
- [ ] You wrote nothing beyond the progress file in this step, and stopped for the next prompt
