# Architecture foundation

## Contents

- [Boundaries and ownership](#boundaries-and-ownership)
- [Technology decisions](#technology-decisions)
- [Critical flows](#critical-flows)

## Boundaries and ownership

Modular monolith: NestJS modules own their domain tables and use-cases. A module may call only the modules listed below; cross-module state changes use typed application interfaces or domain events, never another module's repositories. Controllers validate DTOs and call use-cases. Repository access is confined to the owning module. Shared contracts live in `packages/shared`.

| Module | Responsibility | Allowed dependencies | Owned tables (names only) |
|---|---|---|---|
| `auth` | OTP verification and cookie sessions | `users` | `otp_challenges`, `sessions` |
| `users` | Profiles, roles, addresses, consent | `geo` | `users`, `user_roles`, `addresses`, `consents`, `data_requests` |
| `geo` | Cities, areas, delivery zones/fees, serviceability and service-area waitlist | `settings` (global fallback delivery-fee schedule) | `cities`, `areas`, `zones`, `zone_fee_slabs`, `service_area_waitlist` |
| `catalog` | Categories, subcategories, suggestions, keyword mappings | — | `categories`, `subcategories`, `subcategory_suggestions`, `keyword_mappings`, `keyword_mapping_terms`, `keyword_mapping_targets` |
| `businesses` | Shop/provider profile, onboarding, hours, location, delivery settings and private approval documents | `users`, `geo`, `catalog` | `businesses`, `business_hours`, `business_settings`, `business_documents` |
| `products` | Product listings, variants and stock | `businesses`, `catalog` | `products`, `product_variants`, `inventory` |
| `services` | Service listings, expertise and enquiries | `businesses`, `catalog`, `geo` | `services`, `provider_expertise`, `enquiries` |
| `search` | Home, Explore, Search, suggestions and facet queries | `catalog`, `businesses`, `products`, `services`, `offers`, `media-videos` | No source-of-truth tables; read-only queries over owning modules |
| `offers` | Offers, coupons and approval lifecycle | `businesses`, `products`, `services` | `offers`, `offer_targets`, `coupons` |
| `cart-checkout` | Cart, quote, per-shop checkout orchestration | `products`, `businesses`, `offers`, `geo`, `payments`, `orders`, `users`, `settings` | `carts`, `cart_lines`, `checkout_attempts` |
| `payments` | Payment attempts, collection, refunds and vendor billing records | `businesses`, `settings`, typed event/contracts from `cart-checkout`, `orders`, `delivery` | `payment_attempts`, `refunds`, `earnings`, `business_subscriptions` |
| `orders` | Per-shop order lifecycle, status history, cases and invoices | `users`, `businesses`, `products`, `payments`, `media-videos` (private-asset contract), Delivery event contracts | `orders`, `order_items`, `order_status_history`, `order_cases`, `order_case_events`, `order_case_attachments` |
| `delivery` | Rider requests, assignments, delivery and pickup codes | `geo`, `users`, `settings`, `media-videos` (private assets), `payments` (cash collection) | `rider_profiles`, `rider_documents`, `delivery_jobs`, `delivery_offers`, `delivery_codes`, `rider_payouts` |
| `reviews` | Eligibility, moderation, reviews and replies | `users`, `orders`, `businesses`, `products`, `services` | `reviews`, `review_reports`, `review_helpful_votes`, `review_aggregates` |
| `engagement` | Follows, likes, hearts, saves and comments | `users`, `businesses`, `products`, `media-videos` | `follows`, `likes`, `hearts`, `bookmarks`, `video_comments` |
| `media-videos` | Media assets, embeds, consent, video moderation | `businesses`, `products`, `services` | `media_assets`, `videos`, `video_links` |
| `notifications` | In-app notifications, preferences and templates | `users`, `settings` | `notifications`, `notification_preferences`, `notification_templates` |
| `communications` | Scoped, consent-aware admin campaigns | `users`, `geo`, `notifications` | `campaigns`, `campaign_recipients`, `campaign_reports` |
| `admin` | Admin approvals, roles, permissions and console actions | `users`, `geo`, `catalog`, `businesses`, `offers`, `orders`, `reviews`, `media-videos`, `communications` | `roles`, `role_permissions`, `admin_scopes` |
| `audit` | Append-only record of sensitive changes | — | `audit_logs` |
| `settings` | Global settings, feature flags and legal content | — | `settings`, `feature_flags` |

`outbox_events` and `idempotency_keys` are shared runtime infrastructure, not domain-owned tables; their schema is specified once by the shared persistence layer. Each domain table's columns and constraints are defined only in its owning module BE spec. Payments consumes order/delivery events and publishes billing events; it never reads another module's repositories. Offers owns promotion placement and consumes the successful-purchase event.

### Technology decisions

| Decision | Choice | Why | Switch when |
|---|---|---|---|
| ORM/query layer | Prisma Client; parameterized SQL through repository adapters for PostGIS-only queries | Typed repository implementation without leaking the DB client into use-cases | PostGIS/query complexity makes a SQL-first typed layer materially simpler |
| Migrations | Prisma Migrate; reviewed SQL migrations for PostgreSQL extensions | One versioned migration path with explicit extension setup | A required extension or online migration cannot be safely represented |
| Database | PostgreSQL + PostGIS, `pg_trgm`, `unaccent`, full-text search | Explicit target in this prompt; supports geo and local search without another service | Human-approved stack ADR changes |
| Queue | `pg-boss` + transactional outbox; no Redis at launch | Explicit LEAN SPECS default; supersedes P01's Redis/BullMQ proposal ([Q-29](../../docs/design-context/11-open-issues-and-assumptions.md)) | Measured throughput or availability needs justify a separately operated broker |
| Search | PostgreSQL keyword mappings, `pg_trgm`, `unaccent`, full-text indexes | Matches SR2/SR3 and avoids an external search engine | Product requirements exceed PostgreSQL's measured capability |
| Realtime | SSE for order tracking, rider requests and live map | One-way updates fit the required live views | A feature requires bidirectional realtime |
| Object storage | `StoragePort`; recommend S3-compatible storage with private uploads and signed access; vendor open (Q-22) | Keeps credentials and provider-specific logic in an adapter | Provider selection or measured media needs require a different adapter |
| Payments | `PaymentProvider` port and fake; gateway and split-charge topology open (Q-01, Q-19, Q-21) | Gateway and webhooks remain replaceable | Human selects a compliant gateway and charge/capture model |
| OTP/SMS | `OtpDeliveryPort` and fake; primary/failover open (Q-15, Q-19) | No provider is named in product decisions | Human selects delivery providers and verifies sender setup |
| WhatsApp | `WhatsAppPort`; BSP/template approval open (Q-04, Q-19) | Consent and approved templates are provider-independent | Human confirms BSP, sender and template approval |
| Maps | `MapsPort`; provider open (Q-02, Q-19) | Manual address fallback stays available | Human selects provider after Padrauna coverage review |
| Hosting region | Recommend India region; deployment vendor/region open (Q-13, Q-25) | Fits India launch while data residency and backup policy are unresolved | Human approves region and recovery policy |
| Observability | Pino structured logs + OpenTelemetry traces/metrics; no vendor lock-in | Correlation IDs and request/job tracing cover the monolith | An operations platform requires a specific exporter |
| CI | GitHub Actions | Existing stack ADR and repository workflow | Repository hosting or org policy changes |

PostgreSQL is the target for these specs per the current prompt; [Q-20](../../docs/design-context/11-open-issues-and-assumptions.md) and the proposed stack ADR still need human reconciliation.

### Critical flows

1. **Checkout: per-shop orders, payment, idempotency (CK1-CK9, BR-01, BR-03, BR-19)**
   1. `cart-checkout` validates the current cart, stock, business eligibility, delivery/pickup choice, address, minimums and coupon; the server computes all totals in paise.
   2. Require an idempotency key for confirmation. Persist the key and immutable quote before calling an external provider; replay returns the original attempt/result.
   3. COD creates one order per shop. Online payment uses the payment adapter; on verified success, create one order per shop, each with its own status, mode and payment record.
   4. Persist order and outbox records transactionally; clear only the confirmed cart snapshot.
   - **Failure:** invalid/stale quote or stock -> no order and refreshable error; failed payment -> retry or COD when eligible; repeated key -> same result; provider success followed by process failure -> verified webhook/reconciliation resumes order creation without duplicate charges or orders.
2. **Order state and notifications (ST-order-delivery, ST-order-pickup, BR-04, BR-20)**
   1. `orders` checks current state, actor ownership/role and transition guard; transaction updates state and writes `order.<event>` to outbox.
   2. Outbox publisher enqueues an idempotent `pg-boss` job; notification handlers render approved EN/HI templates and channel preferences.
   3. Consumers deduplicate by event ID; delivery work begins from the documented order-accepted event.
   - **Failure:** invalid transition -> stable 409; consumer/channel failure -> retry with bounded backoff and observable terminal failure; the committed order state is not rolled back because notification delivery is asynchronous.
3. **Delivery assignment and OTP (ST-delivery-job, BR-05)**
   1. After vendor acceptance of an order in delivery mode, the documented order event creates a request and presents the 60-second countdown to an eligible rider; pickup orders skip rider assignment.
   2. Acceptance is atomic; expired/rejected requests return to reassignment or fail when no rider is available.
   3. At drop-off, the rider submits the customer-held code; the server verifies it with attempt limits before marking delivery complete. Self-pickup uses its separate code.
   - **Failure:** concurrent acceptance -> only one succeeds; expired request -> reassign/fail; invalid or exhausted code attempts -> reject and retain the non-delivered state. Codes are never returned to rider/vendor APIs or logs.
4. **Video submit -> moderation -> publish (RL, VD12-13, AD10, BR-10, BR-16)**
   1. Owner submits a permitted YouTube/Instagram link or upload; server validates host/content, rebuilds embed URL, stores per-item Gallery/Reels consent and sets moderation state.
   2. Area-scoped admin with video permission approves or rejects with reason; decision is audit-logged and author notification is queued.
   3. Only approved content appears in public feeds and business surfaces; removal/report state is respected by every read path.
   - **Failure:** invalid host/media -> reject before fetch/render; missing consent -> do not surface on that surface; unauthorized moderation -> 403; rejected/removed media stays non-public.
5. **Admin approval with area-scoped authorization (AU, VD, PV, RD, AD2, BR-06, BR-12)**
   1. Application is pending and visible only to authorized approvers within assigned city/area.
   2. Server checks role, module/action permission, target ownership/scope and allowed state transition on every read/write; KYC documents require the relevant approval permission.
   3. Decision and reason commit with before/after audit record; only approved accounts gain the capabilities specified by ST-approval.
   - **Failure:** missing permission or scope -> 403 with no document disclosure or mutation; stale state -> 409; audit persistence failure -> fail the sensitive mutation rather than report success.
6. **Explore Services facets and URL (EX1-EX12, SR, BR-15, BR-18)**
   1. `search` reads category/subcategory relationships from `catalog` and active service listings from `services`; facet counts use the same result predicate as the displayed list.
   2. Selecting filters updates the URL: `/explore?tab=services&category=<comma-separated-slugs>&subcategory=<comma-separated-slugs>`. Search state remains separate at `/search?q=`.
   3. Back/forward restores the URL-derived state; count updates do not overwrite another screen's filter state.
   - **Failure:** stale/unknown filter values return a valid empty/error state per the search contract; counts and result rows must never use different predicates.

## Product references

- Product IDs, screens and states: [Design Context feature inventory](../../docs/design-context/01-feature-inventory.md), [screen inventory](../../docs/design-context/02-screen-inventory.md), [state machines and rules](../../docs/design-context/07-state-machines-and-business-rules.md).
- Architecture/layering source: [repository module map](../../docs/architecture.md); visual and behavioural source: `docs/design-context/reference/` and `docs/design-context/screenshots/`.
