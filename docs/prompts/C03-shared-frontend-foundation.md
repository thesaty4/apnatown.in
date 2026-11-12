# C03: Shared frontend foundation and UI library

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
Also read the current [frontend foundation](../../specs/_foundation/frontend-shared.md),
[workspace/transport contracts](../../specs/_foundation/architecture.md)
and the owning module FE/BE specs for the components being built.

## OUTPUT FILES (exact paths)
- Web shared shell/hooks/transport, `packages/ui` components and shared
  formatters/catalogues, with manual component/a11y/visual verification and required stories.
  No duplicated API DTOs or unrelated documentation.

## REQUIRED CONTENTS
Implement [frontend-shared.md](../../specs/_foundation/frontend-shared.md): deterministic token/Tailwind and semantic EN/HI catalogue generation, the specified fonts/theme, Server Component root and bounded client providers, standard loading/error/offline/empty/disabled states, shared primitives and typed hooks. Implement the mandatory [React Query API integration contract](../../specs/_foundation/frontend-shared.md#api-integration-with-react-query) over the generated API client and common browser/server cookie/CSRF wrappers, including its provider, hydration and acceptance checks; no handwritten duplicate DTOs or business logic in UI.

Build the catalogued components in small owner-linked batches, reusing Button/Input and URL/Back-scroll contracts. Apply the specified rendering, metadata, accessibility, low-bandwidth and PWA rules. Keep unapproved route/copy/button metrics explicit rather than inventing them. Verify real transport only after its API dependencies exist; otherwise report the check as pending, not passed with intercepted success responses.

Build shared media/map components against the
[canonical media/maps contract](../../specs/_foundation/media-and-maps.md):
client-only Leaflet `MapView`, Geoman Free editing, gateway-backed images and
provider-specific embeds. Do not assume `react-leaflet` is selected or add
direct Cloudinary browser transport or direct video-file upload controls.
Preserve the generated-client/React Query ownership above.

## IMPLEMENTATION RULES (in addition to the standing requirements)
- Read the current foundation and owning FE/BE specs plus the Design Context Pack. Record a blocking ambiguity inline in its owning spec and ask; no legacy shared-UI document generation or progress trackers.
- Work in small pull requests (about 400 changed lines or fewer), one concern each. Branch `feat/<scope>-<name>`; Conventional Commits. Never merge; humans review and merge.
- Reuse shared components, hooks, utilities, guards and base classes; if you copy code a second time, extract it to the shared layer first.
- Every change includes manual acceptance evidence and passing existing lint/type-check/build commands. Do not generate automated test files. Include English and Hindi strings, accessibility checks, and a screenshot comparison (mobile 390px and desktop 1280px, light and dark) against `docs/design-context/screenshots/` for UI work.
- Security: parameterised queries only; validate input; enforce authorisation on every endpoint; no secrets in code; no PII in logs.
- At the end report: what was built (IDs), verification performed with real results and explicit gaps, screenshots, deviations from the spec, and open issues.

## STANDING REQUIREMENTS (apply every one; they are binding)

1. **Complete coverage within this scope.** Cover the shared frontend/component contracts and manual acceptance scenarios. Feature screens remain in their module tasks; do not build unrelated dashboards or maintain duplicate inventories as part of the shared foundation.
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
- [ ] Every component in 06 exists with stories and manual acceptance evidence
- [ ] Visual parity checked in light, dark and Hindi
- [ ] Every ID listed in the coverage table at the end exists in the output (no empty cells)
- [ ] All standing requirements above were applied; assumptions are recorded as Open Issues
- [ ] A coverage table (feature IDs / screen IDs covered by this document) is included
