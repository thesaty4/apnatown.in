# BE: offers

Features: F-OF-001, F-OF-002, F-OF-003, F-OF-004, F-OF-005, F-PD-004, F-VD-007, F-AD-011 | Rules: BR-01, BR-02, BR-06, BR-12, BR-17, BR-19 | State machines: ST-offer | Depends on / used by: businesses, products, services / search, cart-checkout, products, businesses, services, admin

Frontend counterpart: [FE offers](../fe/offers.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own offer/coupon records, offer eligibility and lifecycle, vendor offer management, and the offer-approval portion of Admin Promotions. Search, product, service and business surfaces consume public offer DTOs; cart-checkout consumes the pricing/eligibility contract and remains responsible for checkout totals and proportional coupon distribution.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `offers` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `title_en text NOT NULL`; `title_hi text NULL`; `terms_en text NULL`; `terms_hi text NULL`; `discount_type text NOT NULL CHECK ('percent','flat','free_delivery')`; `discount_percent smallint NULL CHECK 1..100`; `discount_paise bigint NULL CHECK >=0`; CHECK selects exactly the value field matching `discount_type` (neither for `free_delivery`); `scope text NOT NULL CHECK ('business','targets')`; `valid_from/valid_to timestamptz NOT NULL CHECK valid_from < valid_to`; `status text NOT NULL CHECK ('pending','active','paused','ended')`; `review_decision text NULL CHECK ('approved','rejected')`; `reviewed_by uuid NULL FK users`; `reviewed_at timestamptz NULL`; `rejection_reason text NULL`; `featured boolean NOT NULL DEFAULT false`; `banner_storage_key text NULL` (server-issued storage key); `views_count/uses_count bigint NOT NULL DEFAULT 0 CHECK >=0`; `version int NOT NULL DEFAULT 1`; timestamps. A rejected decision is retained with `status='ended'`; active applicability also requires the validity window. | `(business_id,created_at DESC,id DESC)` serves owner manager; partial `(status,created_at,id) WHERE status='pending'` serves approval queue; partial `(featured,valid_to,id) WHERE status='active'` serves Home; `(status,valid_to,id)` serves expiry work. |
| `offer_targets` | `id uuid PK`; `offer_id uuid NOT NULL FK offers`; `target_kind text NOT NULL CHECK ('product','service')`; `product_id uuid NULL FK products`; `service_id uuid NULL FK services`; CHECK exactly the target matching `target_kind` is set. Target entity must belong to `offers.business_id`; business-wide offers have `scope='business'` and no target rows; `scope='targets'` requires at least one target. | Partial unique `(offer_id,product_id) WHERE product_id IS NOT NULL`; partial unique `(offer_id,service_id) WHERE service_id IS NOT NULL`; `(product_id,offer_id)` and `(service_id,offer_id)` serve target reads. |
| `coupons` | `id uuid PK`; `code text NOT NULL`; `normalized_code text NOT NULL UNIQUE`; `discount_type text NOT NULL CHECK ('percent','flat')`; `discount_percent smallint NULL CHECK 1..100`; `discount_paise bigint NULL CHECK >=0`; CHECK selects the value field matching `discount_type`; `minimum_order_paise bigint NOT NULL DEFAULT 0 CHECK >=0`; `maximum_discount_paise bigint NULL CHECK >=0`; `description_en text NOT NULL`; `description_hi text NULL`; `active boolean NOT NULL DEFAULT true`; `version int NOT NULL DEFAULT 1`; timestamps. Sample codes/amounts are not production configuration (A-01). | Unique `normalized_code` serves case-insensitive validation; partial `(active,normalized_code) WHERE active` serves checkout validation. |

Offer target writes validate same-business ownership through the Products/Services application contracts. `banner_storage_key` is never a client URL; use the shared StoragePort, content-based image validation and EXIF stripping. Exact banner limits remain open in Q-66. `terms_*` may be absent until Q-63 is resolved; never synthesize legal terms.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/offers?businessId=&categoryId=&targetKind=&targetId=&featured=&cursor=&limit=` | Public; all filters allow-listed | Active, in-window, public offers; optional business/category/target/featured filters; keyset page, limit ≤50 | `COMMON_VALIDATION_FAILED` | Yes | F-OF-001/004, F-HM-005, F-PD-004, S-CUST-20 |
| GET | `/offers/{offerId}` | Public; active/valid, expired or out-of-stock public offer only | Localized title/terms if present, discount DTO, target projection, status (`active`, `expired`, `out_of_stock`) and validity | `OFFER_NOT_FOUND` | Yes | F-OF-001–003, F-PD-004, J3 |
| GET | `/businesses/me/offers?status=&cursor=&limit=` | Authenticated approved owner; role/business kind and ownership from session | Allow-listed status + keyset page of own offers with views/uses counters | `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-007, S-VEND-07 |
| POST | `/businesses/me/offers` | Authenticated approved vendor/provider; own business; provider service-offer API follows prototype pending Q-61 | Allow-listed title/terms, type/value, target IDs or business scope, validity and server-issued banner asset key → pending offer | `OFFER_INVALID`, `OFFER_TARGET_INVALID` | Idempotency key | F-OF-005, F-VD-007 |
| PATCH | `/businesses/me/offers/{offerId}` | Same owner and business checks; expected version | Allow-listed editable fields; save requeues the offer as pending approval, so the edited version is not live until approved | `OFFER_NOT_FOUND`, `OFFER_NOT_OWNED`, `OFFER_INVALID`, `OFFER_VERSION_CONFLICT` | Expected version | F-OF-005, F-VD-007 |
| PATCH | `/businesses/me/offers/{offerId}/status` | Same owner checks; active/paused offer only | `{status:"paused"|"active"|"ended",expectedVersion}`; resume only within validity window; ended is terminal | `OFFER_NOT_FOUND`, `OFFER_NOT_OWNED`, `OFFER_STATE_INVALID`, `OFFER_VERSION_CONFLICT` | Expected version | F-OF-005, F-VD-007 |
| GET | `/admin/promotions/offers?status=pending&cursor=&limit=` | `admin` + `promos:view` + offer business in assigned city/area; `super_admin` platform-wide | Scoped offer queue with business public summary; keyset page | `COMMON_FORBIDDEN`, `ADMIN_SCOPE_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-AD-011, S-ADMN-12 |
| POST | `/admin/promotions/offers/{offerId}/decision` | `admin` + `promos:edit` + offer business in assigned city/area; `super_admin` platform-wide; audit required | `{decision:"approve"|"reject",reason?,expectedVersion}` → decision/status DTO | `OFFER_NOT_FOUND`, `ADMIN_SCOPE_FORBIDDEN`, `OFFER_STATE_INVALID`, `OFFER_VERSION_CONFLICT` | Idempotency key + version | F-OF-005, F-AD-011, S-ADMN-12 |

`cart-checkout` calls the Offers application pricing/eligibility port for offers and coupons; no client-supplied amount or coupon status is trusted. Coupon definitions have no management screen in the inventory; do not add a CRUD endpoint until Q-67 is resolved. Offer approval covers only the offer panel of S-ADMN-12; banner and featured-business writes remain with their confirmed owners (Q-57/Q-60).

## Rules and use-cases

1. Require an approved owner business (BR-06). Derive `business_id` from the session; verify every product/service target belongs to that business and matches the offer scope.
2. Creation starts `pending`. Admin approval moves `pending` to `active`; rejection records `review_decision='rejected'`, ends the offer, and stores the reason. Vendor can pause/resume an approved offer or end it; `ended` is terminal. A rejected offer cannot be activated by its owner.
3. An edit requeues the updated offer as `pending` as observed in the prototype; its edited terms/discount stop applying until reapproved. This interaction with ST-offer is tracked in Q-68.
4. An offer applies only when approved/active, `valid_from <= now < valid_to`, and its target is eligible. End expired offers idempotently; derive out-of-stock state from current product inventory and never apply an unavailable target (BR-17).
5. Public lists and Home contain only active, valid offers; detail surfaces may show expired or out-of-stock states, never pending/rejected records. `featured` affects placement only after approval and does not bypass eligibility.
6. Offers store discount parameters, not a client-calculated total. Return the applicable offer/coupon rules to cart-checkout; all money is integer paise and server-computed (BR-01). Coupon minimum and cap are checked before checkout; checkout owns coupon allocation across shop orders (BR-19). Exact offer stacking/calculation is Q-62; coupon lifecycle and redemption limits are Q-67.
7. Admin review filters by the offer's owning business scope, not a client-supplied city/area. Enforce role + `promos` permission + city/area scope server-side; audit actor, timestamp, action and before/after values (BR-12).
8. Store UTC validity instants and render in IST (BR-02). Date-only boundary semantics are unresolved in Q-64; until decided, eligibility uses the persisted exclusive `valid_to` instant.
9. Offer view/use metrics are informational only; they never decide eligibility or ranking until their definitions are approved (Q-65).

## Events and jobs

- Publish `offer.submitted`, `offer.approved`, `offer.rejected`, `offer.paused`, `offer.resumed`, `offer.ended` through the transactional outbox; notification consumers notify the owner and Search/public caches revalidate affected offer/business/product/service tags.
- `offers.expire-due` marks eligible active/paused rows ended when `valid_to <= now`; job is idempotent and emits one expiry event per offer.
- Cart-checkout reports a committed offer/coupon use through an idempotent event for the manager counter; views/uses attribution remains Q-65. Retry consumers by stable event ID; no direct provider calls.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `OFFER_NOT_FOUND` | 404 | `errors.offers.notFound` |
| `OFFER_NOT_OWNED` | 403 | `errors.offers.notOwned` |
| `OFFER_INVALID` | 422 | `errors.offers.invalid` |
| `OFFER_TARGET_INVALID` | 422 | `errors.offers.targetInvalid` |
| `OFFER_STATE_INVALID` | 409 | `errors.offers.invalidTransition` |
| `OFFER_VERSION_CONFLICT` | 409 | `errors.offers.versionConflict` |

Use shared `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` and `ADMIN_SCOPE_FORBIDDEN` for authorization/DTO failures; coupon-specific checkout errors are defined by the cart-checkout contract.

## Acceptance criteria

- Given an approved owner submits a valid offer, when creation succeeds, then it is `pending`, excluded from public reads, and one approval event is persisted.
- Given an offer target belongs to another business or conflicts with `scope`, when create/update is requested, then validation rejects it without changing either business's data.
- Given an admin with `promos:edit` and matching area scope approves a pending offer, when the decision is saved, then it becomes active only within its validity window and before/after are audit-recorded.
- Given an admin lacks `promos:edit` or is outside the offer business scope, when the decision is attempted, then it is denied and status remains unchanged.
- Given an offer is paused, ended, expired, pending or rejected, when public discovery or checkout reads it, then it is not applied; expired/out-of-stock public detail has its distinct state.
- Given a vendor edits an active offer, when the versioned update succeeds, then the edited offer returns to pending and no longer applies before approval.
- Given coupon code case differs from storage, when cart-checkout validates it, then normalized lookup returns the same eligibility result; invalid/inactive coupons cannot change the quote.
- Given expiration or approval events are retried, when the job/consumer repeats, then status, counters and notifications are not applied twice.

## Tests

- Unit: offer state transitions, percent/flat/free-delivery value constraints, validity boundaries, target scope and coupon minimum/cap.
- Integration: approved-only public reads; active/expired/out-of-stock detail; own-business CRUD; keyset queue scope; cache/outbox writes in the same transaction.
- Authorization negatives: missing `promos:view/edit`, admin outside assigned city/area, vendor modifying another business's offer, and provider target mismatch.
