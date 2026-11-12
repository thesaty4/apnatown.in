# C01: Shared backend layer (NestJS)

**Verification policy:** Follow [the repository policy](../../.github/instructions/testing.instructions.md). Do not create automated test files or test-runner scaffolding for FE, BE or DB. Preserve acceptance scenarios as manual checks and report existing non-test command results and gaps.

> Paste this prompt into the GitHub Copilot agent. It is self-contained.

You are a principal engineer and technical writer working in the ApnaTown.in repository. You have no memory of earlier work. Everything you need is in this prompt and in the repository files named below. Read the Design Context Pack files first; do not rely on assumptions or outside knowledge of the product.

**Your role in this task:** senior engineer implementing a defined scope from the specifications

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
Also read the current [backend foundation](../../specs/_foundation/backend-shared.md),
[architecture](../../specs/_foundation/architecture.md),
[data model](../../specs/_foundation/data-model.md) and
[Catalog BE spec](../../specs/catalog/be/catalog.md).

## OUTPUT FILES (exact paths)
- API shared runtime/integration ports, shared DTOs, the Catalog reference
  slice and manual acceptance scenarios. No frontend or unrelated documentation.

## REQUIRED CONTENTS
Implement `apps/api/src/shared` from [backend-shared.md](../../specs/_foundation/backend-shared.md): config/logger/correlation, strict Zod DTO validation, the flat error envelope, real live-session/CSRF/role/permission/ownership/scope enforcement, keyset pagination, checked Money, opaque transaction ports, atomic outbox/audit/idempotency and rate limits. Wire API versus pg-boss worker composition, integration ports/fakes, health probes and offline OpenAPI generation as specified in the other foundations.

Implement the Catalog suggestion reference with its documented collaborators, DI bindings, guarded controller, repository mappings and manual observations of real DB state. Its migrations and Auth/Users/Business ownership prerequisites must exist first; take them from their owner specs in dependency-sized changes. Manual HTTP verification uses real authentication and guards, not authorization mocks. Do not invent helpers or claim integration success from mocks.

For media-related shared interfaces and configuration, follow the
[media/maps configuration and readiness contract](../../specs/_foundation/media-and-maps.md#configuration-and-readiness).
Reuse Media's `AssetPort` and purpose-separated storage adapters rather
than introducing a second upload/storage contract. This does not expand
the shared-layer task into Media feature implementation.

## IMPLEMENTATION RULES (in addition to the standing requirements)
- Read the current foundation and owning module specs plus the Design Context Pack. Record a blocking ambiguity inline in the owning spec and ask; do not generate missing legacy documentation or trackers.
- Work in small pull requests (about 400 changed lines or fewer), one concern each. Branch `feat/<scope>-<name>`; Conventional Commits. Never merge; humans review and merge.
- Reuse shared components, hooks, utilities, guards and base classes; if you copy code a second time, extract it to the shared layer first.
- Every change includes manual acceptance evidence and passing existing lint/type-check/build commands. Do not generate automated test files. Include English and Hindi strings, accessibility checks, and a screenshot comparison (mobile 390px and desktop 1280px, light and dark) against `docs/design-context/screenshots/` for UI work.
- Security: parameterised queries only; validate input; enforce authorisation on every endpoint; no secrets in code; no PII in logs.
- At the end report: what was built (IDs), verification performed with real results and explicit gaps, screenshots, deviations from the spec, and open issues.

## STANDING REQUIREMENTS (apply every one; they are binding)

1. **Complete coverage within this scope.** Cover all shared-backend and reference-slice contracts with manual acceptance evidence. Feature behavior outside this slice belongs to its module task; do not expand this task into the whole product or maintain extra coverage documents.
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
- [ ] Manual verification evidence for changed shared providers
- [ ] Area-scoped authorisation has negative verification evidence
- [ ] Every ID listed in the coverage table at the end exists in the output (no empty cells)
- [ ] All standing requirements above were applied; assumptions are recorded as Open Issues
- [ ] A coverage table (feature IDs / screen IDs covered by this document) is included
