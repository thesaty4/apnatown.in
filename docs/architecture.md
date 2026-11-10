# Architecture

This is the canonical module map. `specs/<module>/{be,fe}/`,
`.github/instructions/*.instructions.md` `applyTo` globs, and
`docs/FEATURE_INVENTORY.md` all use these exact module names.

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
client built on the OpenAPI contract; no feature imports another
feature's internals (see `frontend.instructions.md`).

## 2. Module map (21 modules)

| Module | Responsibility | Primary FE areas |
|---|---|---|
| `auth` | OTP login, sessions, logout, account deletion | AU |
| `users` | Customer/vendor/provider/rider/admin profiles, roles | AU, AC, RD, AD |
| `catalog` | Main categories (super admin only), subcategories, suggestion queue, keyword mapping | AD5, AD6, AD15, SA8 |
| `businesses` | Shop/provider profile, onboarding, hours, delivery settings and private approval documents | PF, VD, PV |
| `products` | Product CRUD, variants, stock, media sorter | PD, VD4 |
| `services` | Service CRUD, one subcategory per service, "expert in" | SV, VD14, PV |
| `search` | Keyword mapping, autocomplete, Explore/Search filters, URL state | EX, SR |
| `offers` | Offer lifecycle and approval | OF, PD4, VD7 |
| `cart-checkout` | Cart, per-shop order split, coupons, delivery/pickup choice | CK |
| `orders` | Order state machine, refunds, disputes, invoices | OR, VD8, AD7 |
| `delivery` | Delivery job lifecycle, OTP/pickup code, rider assignment, fee slabs | RD, OR3, AD8 |
| `payments` | Payment intents, retries, idempotency, COD, refunds | CK6-7, OR6 |
| `reviews` | Review submission, eligibility, moderation, replies | RV, PD7, SV6 |
| `media-videos` | Reels/gallery upload, embeds, moderation, consent | RL, PF9-10, VD12-13, AD10 |
| `engagement` | Follow, like, heart, save/bookmark, comments | EG |
| `notifications` | Notification centre, preferences, templates | NT, X12 |
| `communications` | Admin bulk campaigns (WhatsApp/in-app/email), consent-aware audience | AD12 |
| `geo` | Location detection, cities/zones, polygons, delivery range | LC, SA4 |
| `admin` | Admin console shell, approvals, RBAC, permission matrix | AD, SA2-3 |
| `audit` | Audit log (before/after) for admin and settings changes | X14, AD14, SA7 |
| `settings` | Global settings (branding, fee slabs, commission, SEO defaults, feature flags) | SA5, AC |

Cross-cutting concerns (X1-X15 in `docs/FEATURE_INVENTORY.md`) are
implemented in `packages/shared` and `packages/ui`, not as a separate
backend module.

## 3. Event flows

### Checkout (CK, OR)
1. `cart-checkout` validates cart against `products`/`services` stock and
   `businesses` delivery/pickup eligibility and minimum order.
2. On confirm, `cart-checkout` calls `payments` to create a payment
   intent (or marks COD) then calls `orders` to create **one order per
   shop**, splitting any coupon discount proportionally (BR-03, BR-19
   in `docs/project/04-business-rules.md`).
3. `orders` emits `order.created` per shop; `notifications` sends
   "order placed"; `delivery` creates a pending delivery job once the
   vendor accepts (or immediately for self-pickup, which skips
   `delivery`).

### Delivery OTP (RD, OR)
1. `delivery` generates a one-time delivery OTP when a job reaches
   `picked_up`, stored server-side only.
2. The rider app collects the OTP from the customer at drop; `delivery`
   verifies it server-side with attempt limits before transitioning to
   `delivered` (BR-05).
3. Self-pickup uses a separate pickup code verified the same way.

### Approvals (AU, VD, PV, RD, AD)
1. `users` creates a vendor/provider/rider application in `pending`.
2. `admin` approval queue (AD2) reviews documents; transitions to
   `approved`/`rejected`/`changes_requested`/`suspended`/`inactive`.
3. Only `approved` accounts can sell / accept orders / go online
   (BR-06); `audit` records every decision with a reason.

### Moderation (RV, RL, AD9, AD10)
1. `reviews`/`media-videos` default new content to `pending` when it
   contains links/abusive words or is reported.
2. `admin` moderation queues approve/hide/delete/remove; `notifications`
   informs the author on rejection where applicable.

### Communications (AD12)
1. `communications` resolves an audience (Overall/City-wise/Zone-wise)
   via `users` + `geo`, filtered to consented recipients only
   (BR-11).
2. Admin picks a template/channel, previews, schedules; a
   review-before-send summary is mandatory; `audit` logs the send and a
   delivery report with opt-outs is produced.

## 4. Where each status model lives

See `docs/project/05-domain-model.md` for the full state diagrams and
transition tables; each enum and its transition rules are owned by exactly one
module's `packages/shared` schema: order/payment/refund ->
`orders`/`payments`; delivery job -> `delivery`; approval -> `users`;
review -> `reviews`; offer -> `offers`; video -> `media-videos`;
enquiry -> `services`; subcategory suggestion -> `catalog`; comment ->
`engagement`; campaign -> `communications`.
