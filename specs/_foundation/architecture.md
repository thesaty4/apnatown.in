# Architecture foundation

## Contents

- [Boundaries and ownership](#boundaries-and-ownership)
- [Technology decisions](#technology-decisions)
- [Reproducible workspace and bootstrap](#reproducible-workspace-and-bootstrap)
- [Runtime composition and lifecycle](#runtime-composition-and-lifecycle)
- [Browser and server API transport](#browser-and-server-api-transport)
- [Verification and clean-checkout CI](#verification-and-clean-checkout-ci)
- [Implementation alignment gates](#implementation-alignment-gates)
- [Critical flows](#critical-flows)

## Boundaries and ownership

### Decision precedence for implementation

The user's 2026-11-11 authorization resolves the following historical questions with conservative launch defaults. These owning specs supersede older “open” entries in the reference pack **for these decisions only**; this specs-only change does not edit reference documents or waive unrelated gates:

| Resolved contract | Canonical implementation source |
|---|---|
| Q-62/Q-64/Q-65/Q-67 coupon/offer price precedence, validity, finite use and refund allocation | [Offers](../offers/be/offers.md#launch-coupon-and-offer-policy) and [Checkout](../cart-checkout/be/cart-checkout.md) |
| Q-74 paid-plan/promotion period, renewal, cancellation and verified activation | [Payments](../payments/be/payments.md#launch-billing-policy) |
| Q-06 fiscal documents, tax extraction, supplier/funding separation; commission basis | [Orders](../orders/be/orders.md#invoice-and-tax-policy), [Payments](../payments/be/payments.md), [Settings](../settings/be/settings.md#resolved-launch-configuration) |
| Q-46/Q-53/Q-66/Q-81 public image limits and transformations | [Media](../media-videos/be/media-videos.md#public-image-policy) |
| Q-23/Q-24 subcategory and EN/HI public routes | [Frontend shared](./frontend-shared.md#public-url-and-locale-policy) |
| ADM-Q4/Q-11 existing operational financial, cohort and engagement reports | [Admin](../admin/be/admin.md#reporting-definitions) and its owner-port contracts |

The user's 2026-11-12 provider decision additionally selects Cloudinary for
public-purpose images, link-only YouTube/Instagram videos, and Leaflet/OSM.
The [media and maps contract](./media-and-maps.md) supersedes older Q-02/Q-03/
Q-19/Q-22 proposals only within that scope; private storage, residency,
production capacity and other vendors are not approved by this decision.

Runtime configuration (real prices, verified supplier tax identities/classifications and configured integration credentials) is required input, not a guessed default or an unresolved implementation algorithm. Only the affected feature is unavailable until its readiness check passes. Manual verification uses explicit synthetic fiscal data; no spec declares legal registration, actual performance or production readiness already verified.

Modular monolith: NestJS modules own their domain tables and use-cases. Cross-module calls require the purpose-limited owner ports below and in the paired module contracts; state changes use those typed application interfaces or domain events, never another module's repositories. Controllers validate DTOs and call use-cases. Shared contracts live in `packages/shared`.

| Module | Responsibility | Allowed dependencies | Owned tables (names only) |
|---|---|---|---|
| `auth` | OTP verification and cookie sessions | `users` | `otp_challenges`, `sessions` |
| `users` | Profiles, roles, versioned addresses, consent and privacy processing | `geo`, `auth`; affected owners' registered `UserDataPort` and approval-fact ports only | `users`, `user_roles`, `addresses`, `consents`, `data_requests` |
| `geo` | Cities, areas, delivery zones/fees, serviceability and service-area waitlist | `settings` (global fallback delivery-fee schedule) | `cities`, `areas`, `zones`, `zone_fee_slabs`, `service_area_waitlist` |
| `catalog` | Product/service taxonomy (shops reuse product categories), category relations, suggestions and keyword mappings | — | `categories`, `subcategories`, `category_relations`, `subcategory_suggestions`, `keyword_mappings`, `keyword_mapping_terms`, `keyword_mapping_targets` |
| `businesses` | Shop/provider profile, onboarding, hours, delivery settings and private approval references | `users`, `geo`, `catalog`, `media-videos`; overview reads from `products`, `orders`, `payments`, `services`, `reviews`, `engagement` | `businesses`, `business_hours`, `business_settings`, `business_documents` |
| `products` | Product listings, variants, stock and business category-pill preferences | `businesses`, `catalog`, `media-videos` (assets) | `products`, `product_variants`, `inventory`, `product_category_pills` |
| `services` | Service listings, independently versioned expertise and enquiries | `businesses`, `catalog`, `geo`, `media-videos` (assets) | `services`, `provider_expertise`, `provider_expertise_versions`, `enquiries` |
| `search` | Home, Explore, Search, suggestions and facet queries | `catalog`, `businesses`, `products`, `services`, `offers`, `media-videos`, `geo`, `reviews` (public read ports/projections) | No source-of-truth tables; read-only queries over owning modules |
| `offers` | Offers, coupons, placements and approval lifecycle | `businesses`, `products`, `services`, `geo`, `media-videos`, `payments` (purchase contracts) | `offers`, `offer_targets`, `coupons`, `promotion_placements` |
| `cart-checkout` | Cart, immutable quote, fenced payment rounds and per-shop checkout | `products`, `businesses`, `offers`, `geo`, `payments`, `orders`, `users`, `settings` | `carts`, `cart_lines`, `checkout_quotes`, `checkout_attempts` |
| `payments` | Physical charges, per-shop allocations, refunds, compensation and billing | `businesses`, `settings`, `offers`; typed contracts/events from `cart-checkout`, `orders`, `delivery` | `payment_charges`, `payment_attempts`, `refunds`, `payment_compensations`, `billing_purchases`, `earnings`, `business_subscriptions` |
| `orders` | Per-shop lifecycle, stock-operation ledger, adjustments, cases and invoices | `users`, `businesses`, `products`, `payments`, `delivery`, `media-videos` (private assets) | `orders`, `order_items`, `order_adjustments`, `order_stock_allocations`, `order_stock_operations`, `order_status_history`, `order_cases`, `order_case_events`, `order_case_attachments` |
| `delivery` | Rider applications, assignments, delivery/pickup codes and earned snapshots | `geo`, `users`, `settings`, `orders`, `businesses`, `reviews`, `media-videos`, `payments` | `rider_profiles`, `rider_documents`, `delivery_jobs`, `delivery_offers`, `delivery_codes` |
| `reviews` | Eligibility, moderation, reviews and replies | `users`, `orders`, `businesses`, `products`, `services`, `delivery`, `media-videos` | `reviews`, `review_reports`, `review_helpful_votes`, `review_aggregates` |
| `engagement` | Follows, likes, hearts, saves, comments and follower metrics | `users`, `businesses`, `products`, `media-videos` | `follows`, `follower_daily_counts`, `likes`, `hearts`, `bookmarks`, `video_comments`, `video_engagement_counts`, `follower_announcements` |
| `media-videos` | Canonical assets, embeds, consent, photo/video reports and frozen Reels ranks | `businesses`, `products`, `services`, `delivery`, `orders`, `reviews`, `offers`, `engagement` (purpose/visibility ports) | `media_assets`, `gallery_photos`, `videos`, `video_links`, `media_reports`, `business_media_order`, `reel_rank_snapshots`, `video_view_dedup` |
| `notifications` | Notifications, preferences, templates, delivery receipts and fan-out | `users`, `settings`, `admin`; registered producer context/eligibility ports from `orders`, `delivery`, `businesses`, `services`, `catalog`, `offers`, `media-videos`, `reviews`, `engagement`, `communications` | `notifications`, `notification_preferences`, `notification_templates`, `notification_deliveries`, `notification_provider_receipts`, `notification_fanouts` |
| `communications` | Reviewed, scoped, consent-aware campaigns | `users`, `geo`, `notifications`, `admin`, `businesses`, `orders`, `services` (audience/authorization reads) | `campaign_audience_snapshots`, `campaign_audience_members`, `campaign_reviews`, `campaigns`, `campaign_recipients`, `campaign_reports` |
| `admin` | Admin approvals, permissions, reports and console composition | `users`, `geo`, `catalog`, `businesses`, `products`, `services`, `offers`, `orders`, `payments`, `delivery`, `reviews`, `media-videos`, `engagement`, `communications`, `settings` | `roles`, `role_permissions`, `admin_accounts`, `admin_permissions`, `admin_scopes`, `listing_reports` |
| `audit` | Append-only record of sensitive changes | — | `audit_logs` |
| `settings` | Global settings, feature flags and legal content | — | `settings`, `feature_flags`, `legal_pages`, `support_messages` |

`outbox_events`, `idempotency_keys` and `rate_limit_buckets` are shared runtime infrastructure, defined only in [data-model.md](./data-model.md#shared-runtime-persistence). Each domain table's columns and constraints are defined only in its owning module BE spec. Payments consumes order/delivery events and publishes billing events; it never reads another module's repositories. Offers owns promotion placement and consumes the successful-purchase event.
Cross-cutting Auth/live-principal, Admin authorization, Audit append and Settings gate ports are available to protected use-cases; they do not authorize foreign repository access. Wire purpose-specific read/write ports in the composition root without circular Nest module imports or recursive authorization calls. Search alone composes **owner-exported public SQL projections** so visibility predicates, facets and keyset ordering apply before limiting; it never joins arbitrary private columns or filters only an owner's first page.

## Technology decisions

| Decision | Choice | Why | Switch when |
|---|---|---|---|
| Frontend API integration | TanStack React Query (`@tanstack/react-query`) for all client API reads/mutations over the generated OpenAPI transport; [shared contract](./frontend-shared.md#api-integration-with-react-query) | User-required, consistent server-state lifecycle instead of SWR or hand-managed request state; Server Components keep server-only loading | Only an explicit user-approved stack change; not a per-feature choice |
| ORM/query layer | Prisma Client; parameterized SQL through repository adapters for PostGIS-only queries | Typed repository implementation without leaking the DB client into use-cases | PostGIS/query complexity makes a SQL-first typed layer materially simpler |
| Migrations | Prisma Migrate; reviewed SQL migrations for PostgreSQL extensions | One versioned migration path with explicit extension setup | A required extension or online migration cannot be safely represented |
| Database | PostgreSQL + PostGIS, `pg_trgm`, `unaccent`, full-text search | Explicit target in this prompt; supports geo and local search without another service | Human-approved stack ADR changes |
| Queue | `pg-boss` + transactional outbox; no Redis at launch | Explicit LEAN SPECS default; supersedes P01's Redis/BullMQ proposal ([Q-29](../../docs/design-context/11-open-issues-and-assumptions.md)) | Measured throughput or availability needs justify a separately operated broker |
| Cache | PostgreSQL remains authoritative; public read fragments use existing Next.js ISR/tag boundaries; no Redis use is selected for launch | Existing query-plan, indexing and public-cache contracts cover the specified workloads; no workload measurements justify another service | Consider Redis only after production-like measurements show a named hot-read workload misses existing p95 budgets after query/index/cache-boundary review, and a reviewed ADR defines owner, key/scope, TTL, invalidation, memory bounds, stampede protection, observability and outage behavior |
| Search | PostgreSQL keyword mappings, `pg_trgm`, `unaccent`, full-text indexes | Matches SR2/SR3 and avoids an external search engine | Product requirements exceed PostgreSQL's measured capability |
| Realtime | SSE for order tracking, rider requests and live map | One-way updates fit the required live views | A feature requires bidirectional realtime |
| Public image storage | Cloudinary behind `StoragePort`, authenticated sanitized variants and the existing same-origin publication gateway; [contract](./media-and-maps.md#cloudinary-public-images) | User-selected provider without bypassing Media ownership/revocation | Approved change for measured cost, residency or capability needs |
| Private storage | Separate private-storage port/adapter for KYC, evidence and account exports; production vendor/region remain open | Public-image selection must not expose sensitive records | Separate security-reviewed private-storage decision |
| Video embeds | YouTube watch/Shorts and Instagram Reels/public posts; direct video upload disabled | User-confirmed link-only launch, no hosting/transcoding pipeline | New approved scope, limits, processing and cost contract |
| Payments | `PaymentProvider` port and fake; gateway and split-charge topology open (Q-01, Q-19, Q-21) | Gateway and webhooks remain replaceable | Human selects a compliant gateway and charge/capture model |
| OTP/SMS | `OtpDeliveryPort` and fake; primary/failover open (Q-15, Q-19) | No provider is named in product decisions | Human selects delivery providers and verifies sender setup |
| WhatsApp | `WhatsAppPort`; BSP/template approval open (Q-04, Q-19) | Consent and approved templates are provider-independent | Human confirms BSP, sender and template approval |
| Maps | Leaflet shared React client island + Geoman Free; policy-compliant OSM tiles; [contract](./media-and-maps.md#leaflet-and-openstreetmap) | Free permissive map/editing libraries; Geo/PostGIS and manual address fallback remain authoritative | Approved tiles/self-hosting for capacity/SLA needs; MapLibre only for justified vector requirements |
| Hosting region | Recommend India region; deployment vendor/region open (Q-13, Q-25) | Fits India launch while data residency and backup policy are unresolved | Human approves region and recovery policy |
| Observability | Pino structured logs + OpenTelemetry traces/metrics; no vendor lock-in | Correlation IDs and request/job tracing cover the monolith | An operations platform requires a specific exporter |
| CI | GitHub Actions | Existing stack ADR and repository workflow | Repository hosting or org policy changes |

The decisions above are implementation targets, not permission to provision
production infrastructure. Only explicitly named providers are selected;
their credentials, plans and operational readiness still require verification.
See the alignment gates below.

Redis workload evaluation for this specification: taxonomy/home/profile reads use public ISR tags; relationship/rate-limit state remains in PostgreSQL; durable notification/media work uses the outbox and `pg-boss`; local search remains PostgreSQL-backed. None has a measured launch workload justifying Redis. Before reconsidering, measure p95/p99 read latency, PostgreSQL CPU/IO, query plans, request/cache hit rates and queue throughput under representative launch traffic; Redis is a proposal until an ADR approves a specific use and its operational contract.

## Reproducible workspace and bootstrap

These are **future scaffold contracts**, not claims that apps, packages, scripts or builds already exist.

| Workspace path / package name | Public surface and build |
|---|---|
| Root, private workspace | pnpm workspaces `apps/*`, `packages/*`; committed lockfile; strict shared TS config, lint/format configs and root orchestration scripts. No task runner/service beyond what the workspace needs. |
| `packages/shared` / `@apnatown/shared` | Explicit root and module subpath exports (`./catalog`, `./wire`, `./formatters`); Zod DTOs, pure types/status maps and formatters only. Emit declarations plus ESM `import` and CJS `require` exports for Next/Nest; no Nest/Prisma/env imports or browser-wide barrel pulling every module. |
| `packages/ui` / `@apnatown/ui` | Explicit primitive/component subpaths and `./tokens.css`, `./tailwind`; ESM + declarations, React peers shared with Web. Preserve per-file `"use client"` directives; no package-wide client boundary. CSS exports are side-effectful. Component owners remain in [frontend-shared](./frontend-shared.md). |
| `packages/api-client` / `@apnatown/api-client` | Generated OpenAPI `paths`/DTO types via `openapi-typescript`, consumed through `openapi-fetch`; typed transport factory with injected base URL/fetch, no session globals or env access. No handwritten duplicate DTOs; only Web imports this package. |
| `apps/api` / `@apnatown/api` | Nest application and worker entry points; compiled JS with decorator metadata, repository-only Prisma imports, API-owned `prisma/schema.prisma`, `prisma/migrations` and seed adapter. Does not import UI or generated HTTP client. |
| `apps/web` / `@apnatown/web` | Next App Router; consumes the three public package surfaces. `next.config` uses `transpilePackages: ['@apnatown/shared','@apnatown/ui','@apnatown/api-client']`; no alias to another package's private `src`. |

Scaffold root files are `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.node-version`, `tsconfig.base.json`, project-reference build configs, `.env.example` and local `compose.yaml`. Internal dependencies use `workspace:*`; package scripts use workspace-local CLIs. Install has no hidden migration/seed/network-provider lifecycle hook.
TS/library build contract: strict types, explicit project references and public exports, not TS-only aliases that Node cannot load. Shared emits `dist/esm/<entry>.js/.d.ts` and `dist/cjs/<entry>.js/.d.ts`; conditional `import`/`require` exports each select the corresponding JS **and** types, with ESM/CJS package type markers. UI/client emit ESM `dist/<entry>.js/.d.ts`; copy generated client declarations/CSS assets explicitly. UI exports component paths such as `./primitives/Button` plus token/theme entries; do not strip directives in a bundle. API compiles as CommonJS with `experimentalDecorators`/`emitDecoratorMetadata`; Web uses Next's bundler resolution and preserved JSX. Existing build/type-check tools plus manual package export inspection verify supported artifacts, a single React peer version and resolved aliases; do not create a package test suite.

**Toolchain pinning contract:** at scaffold implementation, select one mutually supported set from maintained upstream releases, not a guessed version or `latest`: Node active/maintenance LTS, pnpm, TypeScript, Nest, Next + React, Tailwind + PostCSS integration, Zod + Nest/OpenAPI bridge, Prisma CLI/client (same version), csrf-sync, pg-boss and PostgreSQL/PostGIS image. Verify Node engines, peer dependencies, extension availability and queue schema compatibility on the clean-checkout job before accepting the set.
Pin exact direct dependency/devDependency versions, Node in `.node-version` and root engines, pnpm in `packageManager`, all transitives in `pnpm-lock.yaml`, DB image by version **and digest**, and CI actions by immutable SHA. CI checks the pins agree; no global CLI is assumed. The installer must obtain the pinned pnpm explicitly (Corepack only if available/pinned); upgrades re-run the compatibility proof. Exact releases are selected and verified during scaffold implementation, not an unresolved product decision or a reason to require another human stack choice.

| Root command (contract to implement) | Responsibility / output |
|---|---|
| `pnpm env:local` | Create ignored local config from `.env.example` if absent; generate disposable cryptographic test/local secrets, never print them or overwrite existing config. Validate owner-specific keys; reject production targets. |
| `pnpm db:up` / `pnpm db:down` | Start/stop the pinned local PostgreSQL/PostGIS Compose service; named local volume and loopback port, health wait. `down` preserves data; destructive reset is a separate explicit local/test-only command. No Redis container. |
| `pnpm db:generate` | API-owned `prisma generate`, using the pinned schema/client version; no DB connection or migrations. |
| `pnpm tokens:generate` / `pnpm i18n:generate` | Produce deterministic UI token CSS/Tailwind mappings and semantic EN/HI catalogues using [frontend-shared](./frontend-shared.md#tokens-and-typography); fail on missing mapping/translation, not silent fallback. |
| `pnpm api:openapi` | API-owned offline export to `packages/api-client/openapi.json`, using shared DTOs and actual controller method/path/auth metadata; all success/error responses, cookies, CSRF/idempotency headers and operation IDs included. Paths **omit** `/api`, with `servers.url=/api`; wrappers apply the prefix exactly once. Compile export metadata with the same Nest decorator support; no listen, DB, worker or provider credentials. |
| `pnpm client:generate` | Generate `packages/api-client/src/schema.d.ts` from that artifact with the pinned generator; client build consumes it. Module BE owners review contract changes; FE consumes generated contracts, never edits output. |
| `pnpm generate` | Build shared contracts, run DB generation, tokens/catalogues, OpenAPI export and client generation in dependency order. Export-only DI/metadata adapters are not reachable from the runtime `AppModule`. |
| `pnpm db:migrate` / `pnpm db:seed` | Apply reviewed migrations with the migration role, then deterministic local/test seed; details and database safety gates in [data-model](./data-model.md#migrations-seeds-and-isolation). No `db push` shortcut. |
| `pnpm build` | Topological build: shared -> generated client/UI -> API -> Web. Nest uses TS decorator metadata; Web production build consumes generated CSS/messages/client. No DB mutation or live provider call during any build. |
| `pnpm dev` | Watch shared/generated inputs, start API + Web + one worker with validated local config; fail the process group if a required child fails. Development must not silently use stale package output. |
| `pnpm start` | Launch built API, Web and worker locally/for CI; forward signals and aggregate failures. Separate `start:api`, `start:web`, `start:worker` entry scripts support independently managed processes without selecting hosting. |
| `pnpm lint`, `pnpm typecheck`, `pnpm check:generated` | Check workspace boundaries, all TS projects, bilingual/token completeness, OpenAPI/client drift and generated reproducibility (regenerate into a temporary directory, compare; do not rewrite reviewed output in CI). |
| `node scripts/check-spec-coverage.mjs`, `node scripts/validate-ai-setup.mjs`, `node scripts/validate-project-docs.mjs` | Existing structural documentation/customization validators; not behavioral or security coverage. |

**Environment ownership:** root launchers inject only each process's allow-list; Web must never receive API DB/PII/provider secrets. `.env.example` documents names, owner, required/optional status and safe placeholders, never usable credentials. CI injects ephemeral values; production uses approved secret injection, not checked-in env files.

Adding runtime configuration requires updating its validated schema, template
and owning launcher's explicit allow-list together. Local API and worker entry
points both use `environmentFor('api', ...)`; retry, lease, relay and cleanup
tuning must survive that projection unchanged, including allowed zero values.
Check the projected child environment, not only direct schema parsing; never
solve missing configuration by forwarding all inherited environment variables.

| Owner | Configuration boundary |
|---|---|
| API + worker | `APP_ENV`, `DATABASE_URL`, `WEB_ORIGIN`, `CURSOR_SIGNING_KEY`, `IDEMPOTENCY_HASH_KEY`, API `PORT`, `WORKER_PROBE_PORT`, `LOG_LEVEL` and bounded shutdown/job retry settings; the durable idempotency-key lifecycle is defined in [data-model](./data-model.md#shared-runtime-persistence). Auth/PII key schemas belong to their server owners. Provider-specific keys are validated/read only by the chosen adapter. |
| Migration/seed launcher | `MIGRATION_DATABASE_URL`, local/test `SHADOW_DATABASE_URL`, seed environment/database marker. Neither privileged URL is passed to API, worker or Web. |
| Web server | `API_INTERNAL_ORIGIN` (trusted fixed API origin, local `http://localhost:3001`) and public site origin (local `http://localhost:3000`); locale/theme config. Server-only module access, never `NEXT_PUBLIC_` for these or any secret. Browser base path is the constant `/api`. |
| Local/test adapters | Explicit fake-port selection, disposable test data and isolated DB identity. Production rejects fake adapters, missing required keys, unsafe cookie/proxy settings or unapproved required integration configuration; no silent fake fallback. |

## Runtime composition and lifecycle

| Entry / owner | Required composition |
|---|---|
| API `main.ts` | Validate config before listen; create `AppModule`, install structured logger/correlation middleware, bounded JSON/raw-webhook parsers, cookie parser and security headers; set global prefix `api`. Install DI-backed global pipes/filter/guards/interceptors once, enable shutdown hooks, then listen. Module paths in specs omit this prefix. |
| `AppModule` | Static imports of shared runtime/integration bindings and the 21 feature modules above; no plugin discovery. Runtime exports config, logger, clock/ID, transaction/outbox/idempotency/rate-limit ports and access policies. Bind interfaces using explicit injection tokens/factories; no controller constructs a repository. |
| Global enforcement | `APP_PIPE`: strict shared Zod validation; `APP_FILTER`: flat error mapping; ordered `APP_GUARD`s: session/live principal (or explicitly declared capability verification) -> CSRF/Origin -> route rate policy -> applicable roles -> permission -> trusted scope/ownership. Coarse IP rate limiting/body limits precede authentication. Guards run before pipes: resource resolvers validate UUIDs themselves. |
| Route metadata | Deny protected requests by default. `@Public()` bypasses session requirement **only**, not validation, CSRF, rate limits or required policy metadata. Protected endpoints declare roles or their explicit owned-applicant capability plus applicable ownership/scope/permission. Review metadata for every route and reject unclassified routes. |
| Session exemptions | Inventory-marked public reads, Auth OTP challenge/verify and CSRF bootstrap, minimal health probes. Users' deletion-status poll has explicit **status-only capability authentication**, verified by its owning port against request ID/hash/expiry after session revocation; it is not unrestricted public or general user access. Browser state changes still require CSRF + Origin. Only registered, signature-verified provider webhooks bypass browser CSRF; they retain raw-body verification, replay protection and rate limits. |
| `worker.ts` / `WorkerModule` | Separate Nest application context in the same codebase, same validated config/persistence/adapter bindings; only outbox relay, pg-boss consumers and module jobs, no public controllers. No in-process second worker accidentally started by API imports. |
| Probes | `GET /api/health/live`: process/event loop alive; `GET /api/health/ready`: 200 only after valid config, DB connection, expected migration/extension versions and pg-boss schema checks; otherwise 503. Return minimal status, no credentials/schema dumps. Worker exposes equivalent internal-only probes for its DB/queue connection and consumer registration. |
| Failures/shutdown | Invalid config fails startup nonzero before listen. Dependency loss makes readiness fail, not liveness; transient external-provider outages are observable but do not kill the process. SIGTERM marks unready, stops intake/leases, drains in-flight HTTP/jobs to a bounded deadline, releases/lets leases expire, closes SSE/queue/DB/loggers and exits; uncommitted transactions roll back. |
| Fakes | Replace only integration ports (and unit-test clocks/IDs), never session verification, guards, CSRF, ownership, permissions or production randomness. Local/CI OTP goes to a private fake delivery sink read by the test harness, never an HTTP “get OTP”/login-as route, fixed accepted code, header or bypass flag. Runtime modules cannot import test fixtures. |

Manual Nest HTTP verification uses this same bootstrap/guard/filter/pipe composition; compilation alone is not evidence that HTTP authorization works. Shared interfaces and Catalog bindings are specified in [backend-shared](./backend-shared.md). Known feature modules register their public ownership/scope policy callbacks in the shared registry before listen; missing/duplicate resolvers fail startup. Runtime depends on those contracts, not feature repositories or circular `forwardRef` imports; opposite-direction asset/read ports do not authorize cross-module table access.

**Next shell:** `app/layout.tsx` is a Server Component loading global token CSS, next/font variables, validated locale/theme and `<html lang>`/skip-to-content. A small client `providers.tsx` owns next-intl, theme, toast/overlay and React Query's `QueryClientProvider` per the [API integration contract](./frontend-shared.md#api-integration-with-react-query); never serialize a session token or an entire API principal into shared cache. `loading.tsx` uses shared skeletons; client `error.tsx` supplies safe retry/reset; `global-error.tsx` supplies its own html/body and local copy; `not-found.tsx` uses the shared not-found screen. Error/offline shells cannot require a healthy API. Route-group layouts enforce the [rendering gates](./frontend-shared.md#rendering-and-seo); Web gates are UX, never authorization substitutes.

## Browser and server API transport

- React Query is the required client server-state layer above this transport, not a replacement for it. Queries/mutations, hydration, error propagation, cache scoping and lifecycle follow [frontend-shared](./frontend-shared.md#api-integration-with-react-query).
- One external origin: browser `/api/<module path>` reaches Nest `/api/<module path>`. Local Next rewrite uses fixed `API_INTERNAL_ORIGIN`; production ingress/rewrite preserves that path, cookies, headers, raw webhook bodies and SSE streaming without choosing a hosting vendor. No permissive credentialed CORS, double `/api` prefix or unrelated Next route shadowing this namespace.
- `apps/web/src/shared/api/browser.ts` injects `/api`, `credentials: 'same-origin'`, abort/timeouts and correlation headers into the generated client. `server.ts` is `server-only`, uses the fixed internal origin + `/api`, forwards only the current request's required cookies/correlation (and verified Origin/CSRF context for mutations), never user-supplied upstream URLs or a process-global cookie jar.
- Owner routes supply `X-Business-Kind: shop|provider` from the vendor/provider route context. The API resolves the authenticated user's **owned** business server-side; omission is allowed only with exactly one business, while two without the header return `BUSINESS_CONTEXT_REQUIRED` 422. Validate the enum, never accept an arbitrary business ID or infer ownership from this header. Forward it only for owner operations and partition private query/idempotency context by the resolved business. It grants no role/approval: pending applicants get only their documented owned-application/profile capabilities, and selling still requires the live matching role/approval.
- Public server reads explicitly omit cookies and use declared tags/revalidation. Authenticated SSR and every session/CSRF response use `no-store`; query caches are per request on the server and cleared on logout/account switch. Server reads do not refresh cookies invisibly; mutations/login/logout pass `Set-Cookie` to the browser through the same-origin response, not an RSC fetch whose cookies would be lost.
- Discovery's optional `X-Discovery-Latitude`/`X-Discovery-Longitude` headers are an all-or-neither, finite/range-validated pair supplied only to its typed operations. Redact both in HTTP/job/error logs; a request using precise location and its response are private/no-store, including Next fetch/CDN/service-worker paths, even for a guest. Do not copy coordinates into URL params, public cache tags or persisted analytics; manual public location/filter IDs follow Search/Geo DTOs.
- Session cookie: opaque, host-only, HttpOnly, Secure in non-local environments, SameSite=Lax, Path=/; use the Auth-owned name/expiry/revocation policy. Only explicit loopback HTTP local/test config may relax Secure and cannot use a `__Host-` name there. No auth tokens in localStorage, URLs or browser-visible env.
- **Auth-owned `GET /auth/csrf`** (externally `/api/auth/csrf`) uses the maintained [csrf-sync](https://github.com/Psifi-Solutions/csrf-sync) synchronizer middleware with Auth-owned PostgreSQL session state, no-store. This reuses the required server-side session store; a signed double-submit library is the alternative only if the session architecture changes. Browser bootstrap holds the token in memory; every browser state change, including OTP challenge/verify and logout, sends `X-CSRF-Token` plus same-origin cookies. Nest checks the library token and `Origin` against `WEB_ORIGIN`; invalid/missing values -> `CSRF_INVALID` 403 before work. Auth defines state persistence, anonymous/authenticated separation, expiry and login/logout rotation in [Auth BE](../auth/be/auth.md#rules-and-use-cases); anonymous CSRF is never authentication.
- `GET /auth/session` remains authenticated/no-store, returning the Auth DTO including live `accountStatus`, `roles`, `approvalStates`; suspension/deletion/revocation invalidates access. Never authorize from cookie-embedded roles, the role switcher or cached frontend state.
- Wrappers normalize only the canonical flat error envelope, preserving `code`, `message_key`, `status`, safe `details`, `correlationId`. Reuse an `Idempotency-Key` for one documented logical mutation; do not automatically retry unsafe requests without that contract. A 401 invokes the module login/session-expired UX with a validated same-origin return path; 403 is not converted into “empty success”.

## Verification and clean-checkout CI

Follow the [verification policy](../../.github/instructions/testing.instructions.md).
No FE/BE/DB automated test files, test-only fixtures, test runners or renamed
application verification suites are deliverables.

| Layer | Required reproducible evidence |
|---|---|
| Static/contracts | Existing lint, type-check, build and generated-contract checks; review Zod/wire/formatter rules, money overflow and cursor/version boundaries. Static success is not runtime proof. |
| Manual Nest HTTP + PostgreSQL | Real bootstrap, isolated migrated DB and real guards; inspect DTO/OpenAPI/error parity, malformed input, missing CSRF, wrong role/owner/city/area/permission, live suspension, idempotency races and actual outbox/audit commit/rollback. Record cases that cannot safely be exercised. |
| Manual UI/accessibility | Keyboard/focus/labels, disabled/error states, Hindi/theme, contrast and reduced motion for changed controls; inspect actual generated CSS. No generated component or accessibility test files. |
| Manual browser journeys | Built Web + API + worker with isolated data and approved local external-provider adapters. Use the generated client/rewrite/cookies, not intercepted success bodies; reference critical journeys J1-J15 and record observations. |

Clean-checkout verification order (**required procedure, not claimed executions**):
The relevant owner slices must exist: migrations/shared runtime before manual DB/HTTP checks, Auth/Users and Business ownership before protected Catalog checks, and Web transport before browser login. C00 proves workspace/probes, not later journeys; never substitute fake guards for missing dependencies.
1. Install the pinned Node/pnpm tooling and `pnpm install --frozen-lockfile` on a clean checkout.
2. Run `pnpm generate`, `pnpm check:generated`, `pnpm lint`, `pnpm typecheck`, `pnpm build` as applicable. These non-test commands may run in CI without provisioning behavioral test suites.
3. For manual runtime verification, explicitly select an isolated disposable local DB, then use `pnpm env:local`, `pnpm db:up`, `pnpm db:migrate` and `pnpm db:seed` as appropriate. Inspect the target before mutation; repeat seed only on that isolated target to check stable identities/counts.
4. Start built API/Web/worker using the existing supervised launcher; verify readiness with a bounded wait and stop on early exit or timeout.
5. Manually open a public category through Web -> `/api/catalog/categories`; obtain anonymous CSRF, complete real OTP verification using approved local delivery, read live session and check protected-call missing-CSRF/role/scope denial. Inspect flat errors and cookie flags, not merely Home's HTTP 200.
6. Manually exercise affected journeys. Run `node scripts/check-spec-coverage.mjs` and relevant documentation validators; `git diff --check`. Stop only owned processes, clean only explicitly allocated disposable resources, and retain redacted evidence plus unverified gaps. Never reset a shared DB.

Acceptance:
- Given a clean checkout and the approved pins, when this pipeline runs, then generated exports resolve and a real browser reaches Nest with cookies/CSRF; no app-specific global tools, hand-created tables or provider credentials are needed.
- Given a protected endpoint without a session or scope, when accessed through the Web proxy, then the real API denies it and no domain/outbox/audit mutation occurs.
- Given one user owns a shop and provider profile, when an owner call omits/selects `X-Business-Kind`, then it fails explicitly/resolves only that owned business; switching the header cannot grant a missing seller capability or replay another business's result.
- Given invalid required config or a production fake-adapter selection, when API/worker boot, then they exit nonzero before becoming ready.
- Given DB loss or SIGTERM, when probes/workers run, then readiness fails and shutdown drains or safely replays work without silently dropping committed outbox events.

## Implementation alignment gates

- **Current implementation baseline:** LEAN-SPECS fixes Nest/Next TS/Tailwind, PostgreSQL/Prisma, pg-boss/no Redis and flat `{code,message_key,status,details,correlationId}`. The [backend guidance](../../.github/instructions/backend.instructions.md), [database guidance](../../.github/instructions/database.instructions.md), [migration recipe](../../.github/skills/db-migration/SKILL.md) and C00-C03 prompts follow these foundations. Earlier P01 Redis/BullMQ and database-undecided proposals are historical, not alternatives to implement (Q-20/Q-26/Q-29; [ADR 0001](../../docs/adr/0001-tech-stack.md)).
- Toolchain pins are a scaffold implementation/CI deliverable above. Hosting/
  region/backups (Q-25), unselected external providers and payment topology
  (Q-21) remain human decisions. Cloudinary/link embeds/Leaflet choices follow
  [media and maps](./media-and-maps.md); local bootstrap does not provision them.
- Auth owns synchronizer state in `sessions`, including anonymous rows that cannot authenticate; cross-process/restart, concurrent-tab and rotation verification is required without automated test-file generation. Catalog owns optional suggestion Hindi plus conditional approval translation described in [backend-shared](./backend-shared.md#catalog-reference-slice). These are implementation contracts, not unresolved ownership decisions.
- Q-23/Q-24 canonical subcategory/locale URL choices, Q-27 compact/large-button metrics, reviewed Hindi/SEO copy and Catalog's matching/slug policy remain explicit implementation/content gates where affected. No locale URL, translation, similarity threshold or missing design metric is invented here.

## Critical flows

1. **Checkout: per-shop orders, payment, idempotency (CK1-CK9, BR-01, BR-03, BR-19)**
   1. `cart-checkout` validates the current cart, stock, business eligibility, delivery/pickup choice, address, minimums and coupon; the server computes all totals in paise.
   2. Require an idempotency key for confirmation. Persist the key and immutable quote before calling an external provider; replay returns the original attempt/result.
   3. COD creates one order per shop, with pending cash collection. Online payment uses fenced payment-round/quote references; verified current-round success funds each shop's allocation without duplicating a physical charge.
   4. Orders' stock ledger, Products inventory, orders, payment links, attempt, outbox and clearing only the pinned cart lines commit in one UoW.
   - **Failure:** stale quote/stock/address -> no order; captured-but-unplaceable funds trigger durable compensation **without requiring an order**, with explicit reconciliation when unknown. A crash retries only still-valid placement or compensates. Retry/COD requires closed prior exposure; late old-round capture is separately compensated, never used to place another order set.
2. **Order state and notifications (ST-order-delivery, ST-order-pickup, BR-04, BR-20)**
   1. `orders` checks state, actor ownership/role and transition guard; transaction writes state/history and the exact `order.created` or `order.status_changed` contract to outbox.
   2. Outbox publisher enqueues an idempotent `pg-boss` job; notification handlers render approved EN/HI templates and channel preferences.
   3. Consumers deduplicate by event ID; `order.status_changed` to **ready** requests a platform-rider job only for configured `delivery + apna_town_rider`.
   - **Failure:** invalid transition -> stable 409; consumer/channel failure -> retry with bounded backoff and observable terminal failure; the committed order state is not rolled back because notification delivery is asynchronous.
3. **Delivery assignment and OTP (ST-delivery-job, BR-05)**
   1. A ready platform-rider order creates one job; every inserted offer commits `delivery.offer_created` and its fixed 60-second expiry. Self-delivery and pickup create no rider job.
   2. Lock rider/job/offer atomically and enforce one active job per rider. Expired/rejected offers requeue; no eligible rider is an explicit unassigned state.
   3. At platform/self delivery or customer pickup, Delivery verifies the customer-held code, explicit current cash confirmation when due, Orders transition and code consumption in one UoW.
   - **Failure:** concurrent acceptance -> one winner; wrong attempts/lockouts commit as rejected non-2xx outcomes without fulfilment, even on idempotent retry. Customer-only authorized disclosure decrypts the live code generation; rider/vendor/admin DTOs, logs and idempotency records never contain it.
4. **Video submit -> moderation -> publish (RL, VD12-13, AD10, BR-10, BR-16)**
   1. Owner submits a permitted YouTube/Instagram link; server validates exact host/path/ID, builds typed playback, stores per-item Gallery/Reels consent and sets moderation state. Direct video upload is rejected; optional image thumbnails use the Cloudinary image contract.
   2. Area-scoped admin with `reviews:edit` approves/rejects/removes with reason; decision/audit commit together and author notification is queued.
   3. Only currently approved, surface-consented content appears publicly. A report creates a separate review-queue record, not an automatic pending/removal transition; explicit moderation determines visibility.
   - **Failure:** invalid host/media -> reject before fetch/render; missing consent -> do not surface on that surface; unauthorized moderation -> 403; rejected/removed media stays non-public.
5. **Admin approval with area-scoped authorization (AU, VD, PV, RD, AD2, BR-06, BR-12)**
   1. Application is pending and visible only to authorized approvers within assigned city/area.
   2. Server checks role, module/action permission, target ownership/scope and allowed state transition on every read/write; KYC documents require the relevant approval permission.
   3. Decision/reason and audit commit together; the approval transaction assigns the matching seller role through the Users port. Pending applicants retain only owned-application/profile capabilities; the live approval check still gates selling even after a role is assigned.
   - **Failure:** missing permission or scope -> 403 with no document disclosure or mutation; stale state -> 409; audit persistence failure -> fail the sensitive mutation rather than report success.
6. **Explore Services facets and URL (EX1-EX12, SR, BR-15, BR-18)**
   1. `search` reads taxonomy and directed, ordered cross-kind `category_relations` (RELP/RELS, never inferred reversals) from `catalog`, active listings from `services`, location context from Geo and rating facets from Reviews' read ports; no private repository imports. Facet counts use the displayed list's predicate.
   2. Use Search's typed URL contract: active-tab filters stay unprefixed (e.g. `/explore?tab=services&category=<slugs>&subcategory=<slugs>`); inactive filters use `products.`/`shops.`/`services.` and the removable shared Home category is `contextCategory`. Search's `/search?q=` state is independent; precise private location stays request context, not a shareable param.
   3. Back/forward restores the URL-derived state; count updates do not overwrite another screen's filter state.
   - **Failure:** stale/unknown filter values return a valid empty/error state per the search contract; counts and result rows must never use different predicates.

## Product references

- Product IDs, screens and states: [Design Context feature inventory](../../docs/design-context/01-feature-inventory.md), [screen inventory](../../docs/design-context/02-screen-inventory.md), [state machines and rules](../../docs/design-context/07-state-machines-and-business-rules.md).
- Architecture/layering source: [repository module map](../../docs/architecture.md); visual and behavioural source: `docs/design-context/reference/` and `docs/design-context/screenshots/`.
