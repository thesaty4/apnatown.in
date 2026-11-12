# P7: SEO specification

**Verification policy:** Follow [the repository policy](../../.github/instructions/testing.instructions.md). Do not create automated test files or test-runner scaffolding for FE, BE or DB. Preserve acceptance scenarios as manual checks and report existing non-test command results and gaps.

> Paste this prompt into the GitHub Copilot agent. It is self-contained.

You are a principal engineer and technical writer working in the ApnaTown.in repository. You have no memory of earlier work. Everything you need is in this prompt and in the repository files named below. Read the Design Context Pack files first; do not rely on assumptions or outside knowledge of the product.

**Your role in this task:** technical SEO lead

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
Also read `docs/specs/05-frontend/`.

## OUTPUT FILES (exact paths)
- `docs/specs/07-seo/01-seo-strategy.md`
- `docs/specs/07-seo/02-page-types.md`
- `docs/specs/07-seo/03-structured-data.md`
- `docs/specs/07-seo/04-faceted-navigation-policy.md`
- `docs/specs/07-seo/05-sitemaps-robots-hreflang.md`
- `docs/specs/07-seo/06-core-web-vitals-and-assets.md`
- `docs/specs/07-seo/07-social-previews.md`
- `docs/specs/07-seo/08-seo-testing-and-monitoring.md`

## REQUIRED CONTENTS
### Per page type (one subsection each, none skipped)
Home, category (product and service), Explore (by tab), Search, shop profile, provider profile, product, service, offers, Videos feed and `/videos/:id`, shareable video page, about/help/legal, dashboards (noindex), account (noindex), system pages. For each: URL pattern and slug rules; rendering (from P5); `title` and `description` templates (EN and HI, with variables and length limits); H1 rules; breadcrumbs; canonical; robots (index/noindex, follow); **JSON-LD** (Organization, WebSite with SearchAction, LocalBusiness/Store, Product with Offer and AggregateRating, Service, Offer, Review, VideoObject, BreadcrumbList, ItemList, FAQPage); Open Graph/Twitter; hreflang; pagination handling; internal linking; image/alt rules; what happens when a listing is removed (410/404/redirect).
### Faceted navigation policy
Which filter combinations are indexable (propose clean landing pages for category and subcategory, for example `/services/wedding-events/dj-sound`, canonicalised from the query-URL contract) and which are `noindex, follow` or canonicalised; sorting and pagination parameters; crawl budget protection. Record the clean-URL proposal as an Open Issue because the design uses query URLs.
### Sitemaps, robots, hreflang
Sitemap index and splitting by type (shops, providers, products, services, categories, subcategories, videos, images), `lastmod` from `updated_at`, max 50k URLs per file, generation job, robots.txt rules, EN/HI alternates.
### Core Web Vitals and assets
Budgets per page type, LCP element strategy, font loading for Devanagari, image sizes/formats/lazy rules, third-party script policy (analytics, embeds on interaction), caching headers, CDN.
Use the [public-image gateway contract](../../specs/_foundation/media-and-maps.md#cloudinary-public-images)
for images in pages, metadata, sitemaps and social previews. Do not expose
Cloudinary URLs/signatures or introduce image-optimizer/CDN caching that
bypasses current placement authorization.

### Social previews and testing
Dynamic OG images (shop, product, service, video), WhatsApp link previews (critical for India), validation tools, CI checks (Lighthouse CI, structured-data validation, link checker), Search Console and monitoring plan.


## STANDING REQUIREMENTS (apply every one; they are binding)

1. **Complete coverage.** Every feature, screen, flow, state and rule from the Design Context Pack must appear in your output. No "etc.", no "similar to above", no deferred items. Every feature ID (F-...) must be traceable to screens (S-...), components, APIs, tables and verification evidence. Do not drop anything from the later additions: category tiles that deep-link to Explore (pre-selected in Products, Shops and Services tabs), offers that open product/service/list, the Explore Services filter with category + subcategory multi-select and URL state, Products & Services section with pills, Videos/Reels (feed, follow, like, share, comments, report, linked items, moderation), videos on product/service pages, service cards and service details, smart search with keyword mapping, gallery and media-consent rules, keyword mapping tool, and the dashboards for every role.
2. **UI and behaviour parity.** The built UI and functionality must match the design exactly: colours, typography, spacing, radius, shadows, icons, copy in English and Hindi, states and interactions. Use only the tokens in `docs/design-context/04-design-tokens.json` (and the prototype stylesheet) through the Tailwind theme. Never invent styles or behaviour. When the pack and the prototype disagree, the prototype wins and you record the conflict in `docs/design-context/11-open-issues-and-assumptions.md`.
3. **Tech stack (fixed).** Follow the tech-stack rule in [STANDING_REQUIREMENTS.md](./STANDING_REQUIREMENTS.md) and read the [canonical media/maps contract](../../specs/_foundation/media-and-maps.md). Preserve the mandatory [React Query API integration contract](../../specs/_foundation/frontend-shared.md#api-integration-with-react-query). Choose only technologies those contracts leave unresolved.
4. **System design per feature.** Use the design approach suited to each feature, for example: state machines for orders, deliveries, approvals, offers and videos; transactional outbox for notifications and webhooks; queues for media processing and campaigns; idempotency keys for payments, orders, refunds and messages; PostGIS geospatial indexing for nearby search; cursor (keyset) pagination for feeds and lists; denormalised counters for likes, followers and views; caching with explicit invalidation; optimistic locking for stock and status. Give a sequence description (Mermaid sequence diagram plus numbered steps) for each critical flow.
5. **Frontend rules.** (a) Anything used more than once becomes a shared component (Input, Button, Select, Checkbox, Chip, Pill, Card, ShopCard, ProductCard, ServiceCard, Modal, Sheet, FilterPanel, SubcategoryMultiSelect, Tabs, DataTable, Timeline, Charts, EmptyState, etc.) and is reused everywhere; list every shared component with props, variants and states. (b) DRY: shared hooks, utilities, zod schemas, types and constants (one source in a shared package). (c) SOLID: single responsibility, open/closed extension points, small interfaces, dependency inversion. (d) Best SEO architecture: Server Components by default; an explicit rendering strategy per route (SSG, ISR, SSR, CSR) with reasons; readable stable URLs; metadata; JSON-LD; canonical and robots policy (faceted filters policy); sitemaps; image and font optimisation; Core Web Vitals budgets. (e) Feature-based folder structure with import rules (no cross-feature imports except through public APIs), URL state for filters, and no business logic inside UI components.
6. **Backend rules.** (a) Anything reused becomes a shared module, guard, decorator, interceptor, pipe, filter, base class or helper in a shared layer. (b) Modular monolith with clean layering controller -> use-case/service -> repository, domain events, and adapters (ports) for every third-party service (payment, OTP/SMS, WhatsApp, storage, maps, email). (c) DRY and SOLID. (d) Always choose the best system design for each functionality and justify it. (e) Authorisation, including area-scoped admin permissions, enforced on the backend for every endpoint (role + ownership + city/area scope + module permission). (f) Money stored as integer paise; stable machine-readable error codes; OpenAPI generated from DTOs; idempotency; rate limiting; audit logging; structured logs with correlation ids; parameterised queries only.
7. **Output format.** Markdown files with a table of contents and consistent feature IDs; tables for matrices; code blocks for schemas, folder trees and examples; Mermaid for diagrams (architecture, ERD, state machines, sequences). Include the reference implementations required by the master prompt: one shared component, one NestJS module skeleton and one vertical slice (Explore services with the subcategory multi-select filter).
8. **Never invent requirements.** If something is unclear, record it as an Open Issue (ID, question, assumption used, impact) in `docs/design-context/11-open-issues-and-assumptions.md` and continue with the stated assumption.
9. **Security, quality and operations baseline.** OWASP ASVS/Top 10 aligned; DPDP-aligned privacy (consent, export/delete); no secrets in code; accessibility WCAG 2.2 AA; English and Hindi for every user-facing string; INR in integer paise; UTC storage and IST display; all lists paginated; all state machines enforced server-side.


## LONG OUTPUT RULE
If the output is too long for one response, continue in numbered parts (Part 1, Part 2, ...). Never summarise, never skip, never write "and so on". At the end of every part list: (a) what is covered so far (IDs), and (b) what remains. Continue until everything is covered, then end with "ALL PARTS COMPLETE" and the final coverage table.

## DONE WHEN (tick every box before you finish and paste the ticked list)
- [ ] Every public page type has URL, metadata templates (EN/HI), JSON-LD, canonical and robots rules
- [ ] Faceted policy is explicit and consistent with the Explore URL contract
- [ ] Sitemaps and hreflang are fully specified
- [ ] Every ID listed in the coverage table at the end exists in the output (no empty cells)
- [ ] All standing requirements above were applied; assumptions are recorded as Open Issues
- [ ] A coverage table (feature IDs / screen IDs covered by this document) is included
