# Architecture

This is the canonical module map. `specs/<module>/{be,fe}/`,
`.github/instructions/*.instructions.md` `applyTo` globs, and
`docs/FEATURE_INVENTORY.md` all use these exact module names.
Current implementation contracts, dependency boundaries and bootstrap commands
live in [the architecture foundation](../specs/_foundation/architecture.md);
the linked module specs own detailed schemas and transitions.

## 1. Layering (per `apps/api`)

```
routes/controllers  -> validate DTO (zod) -> call service
services             -> business rules, orchestration, transactions
repositories          -> only place that talks to the database
integrations/ports    -> payments, SMS/OTP, WhatsApp, email, storage, maps, media
packages/shared       -> types, zod schemas, enums, status maps, formatters
```

Controllers never call repositories directly; services never import a
specific database driver (see `database.instructions.md` and
`backend.instructions.md`).

`apps/web` features call `apps/api` only through a generated/typed API
client built on the OpenAPI contract. TanStack React Query
(`@tanstack/react-query`) is the required client-side API server-state
layer; server-only reads remain in Server Components. Follow the
[API integration contract](../specs/_foundation/frontend-shared.md#api-integration-with-react-query);
no feature imports another feature's internals (see `frontend.instructions.md`).

Selected image, embed and map integrations follow the
[media and maps contract](../specs/_foundation/media-and-maps.md):
Cloudinary for public-purpose images behind Media's authorization gateway,
YouTube/Instagram links only, and shared Leaflet/OSM maps with Geoman Free.
Private documents/exports remain separate. Provider selection does not mean
the integrations are implemented or production-ready.

## 2. Module map (21 modules)

| Module | Responsibility | Primary FE areas |
|---|---|---|
| `auth` | OTP login, anonymous CSRF state, sessions and logout | AU |
| `users` | User profiles, roles, addresses, consent and export/deletion processing | AU, AC, RD, AD |
| `catalog` | Main categories (super admin only), subcategories, suggestion queue, keyword mapping | AD5, AD6, AD15, SA8 |
| `businesses` | Shop/provider profile, onboarding, hours, delivery settings and private approval documents | PF, VD, PV |
| `products` | Product CRUD, variants, stock, media sorter | PD, VD4 |
| `services` | Service CRUD, one subcategory per service, "expert in" | SV, VD14, PV |
| `search` | Consumes Catalog keyword mappings; autocomplete, Explore/Search queries | EX, SR |
| `offers` | Offers, coupons, promotion placements and approval | OF, PD4, VD7 |
| `cart-checkout` | Cart, per-shop order split, coupons, delivery/pickup choice | CK |
| `orders` | Order state machine, refunds, disputes, invoices | OR, VD8, AD7 |
| `delivery` | Rider applications, assignments, job lifecycle, delivery/pickup codes and earnings | RD, OR3, AD8 |
| `payments` | Charges, per-shop allocations, cash collection, refunds, compensation and billing | CK6-7, OR6 |
| `reviews` | Review submission, eligibility, moderation, replies | RV, PD7, SV6 |
| `media-videos` | Gallery/image uploads, link-only Reels/embeds, moderation, consent | RL, PF9-10, VD12-13, AD10 |
| `engagement` | Follow, like, heart, save/bookmark, comments | EG |
| `notifications` | Notification centre, preferences, templates | NT, X12 |
| `communications` | Admin bulk campaigns (WhatsApp/in-app/email), consent-aware audience | AD12 |
| `geo` | Location, cities/areas/zones, polygons, serviceability and delivery fee slabs | LC, SA4 |
| `admin` | Admin console shell, approvals, RBAC, permission matrix | AD, SA2-3 |
| `audit` | Audit log (before/after) for admin and settings changes | X14, AD14, SA7 |
| `settings` | Global settings (branding, fee slabs, commission, SEO defaults, feature flags) | SA5, AC |

Cross-cutting concerns (X1-X15 in `docs/FEATURE_INVENTORY.md`) are
implemented in `packages/shared` and `packages/ui`, not as a separate
backend module.

## 3. Event flows

### Checkout (CK, OR)
1. `cart-checkout` pins a versioned Products-only cart, address and
   server-priced quote; services remain enquiry-only.
2. Current-round verified payment or eligible cash confirmation creates
   one order per shop. Orders owns the stock-operation ledger; stock,
   orders, payment links and cart clearing commit together. Cash remains
   uncollected until explicit verified handover.
3. `order.created` notifies each shop/customer. Captured funds that cannot
   place orders enter compensation/reconciliation, even with no order ID.
   The [critical-flow contract](../specs/_foundation/architecture.md#critical-flows)
   defines retry fencing and failure handling.

### Delivery OTP (RD, OR)
1. A platform-rider order reaching **ready**, not accepted, requests one
   job. Self-delivery and pickup create no rider job.
2. Delivery issues codes at platform pickup, self-dispatch or pickup-ready.
   Only the authorized customer can read the live generation; operational
   APIs never disclose it.
3. Code verification, explicit cash collection when due and Orders'
   fulfilment transition commit together. Failed-attempt bookkeeping also
   persists on rejection; see [Delivery](../specs/delivery/be/delivery.md).

### Approvals (AU, VD, PV, RD, AD)
1. Businesses owns shop/provider applications; Delivery owns rider
   applications. Users owns identity/roles, not those application records.
2. Admin delegates scoped decisions to the owner, which commits the
   transition, audit and any approved-role grant via Users together.
3. Pending applicants have narrow owned-application capabilities; only
   currently approved owners/riders may sell, accept orders or go online.

### Moderation (RV, RL, AD9, AD10)
1. Reviews, Media and Engagement own their content-specific moderation
   transitions. A report queues evidence; it does not itself change
   approval or automatically take down content.
2. Scoped `reviews` permissions guard moderation actions; publication
   requires current owner visibility, moderation state and surface consent.
   Decisions are audited and notify authors through the owner event contract.

### Communications (AD12)
1. Communications resolves an authorized audience through owner ports.
   Review binds immutable membership, content, channels, scope and schedule.
2. Confirming requires that same reviewed snapshot; actual sends/retries
   recheck current authority, preferences and consent. Receipts drive
   deduplicated reports; preview counts alone never authorize a send.

## 4. Where each status model lives

See `docs/project/05-domain-model.md` for the full state diagrams and
transition tables; each enum and its transition rules are owned by exactly one
module's `packages/shared` schema: order/payment/refund ->
`orders`/`payments`; delivery job/rider approval -> `delivery`;
shop/provider approval -> `businesses`;
review -> `reviews`; offer -> `offers`; video -> `media-videos`;
enquiry -> `services`; subcategory suggestion -> `catalog`; comment ->
`engagement`; campaign -> `communications`.
