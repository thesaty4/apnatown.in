# BE: orders

Features: F-OR-001, F-OR-002, F-OR-003, F-OR-004, F-OR-005, F-OR-006, F-OR-007, F-OR-008, F-VD-008, F-PV-005, F-AD-007 | Rules: BR-01–05, BR-12, BR-14, BR-20, BR-22 | State machines: ST-order-delivery, ST-order-pickup, ST-refund, ST-case | Depends on / used by: users, businesses, products, payments; consumes Delivery events; Cart/Checkout calls the per-shop creation contract; Notifications and Audit consume committed events.

Frontend counterpart: [FE orders](../fe/orders.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own each per-shop order, its immutable purchase snapshot, lifecycle history, cases, and printable order invoice. Cart/Checkout creates orders through an idempotent application contract. Delivery owns rider jobs/codes; Payments owns payment/refund records and provider processing.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `orders` | `id uuid PK`; `order_number text NOT NULL UNIQUE`; `checkout_attempt_id uuid NOT NULL FK checkout_attempts`; `customer_user_id uuid NOT NULL FK users`; `business_id uuid NOT NULL FK businesses`; `mode text NOT NULL CHECK ('delivery','pickup')`; `status text NOT NULL CHECK ('placed','accepted','preparing','ready','out_for_delivery','delivered','picked_up','cancelled','refunded')`; `payment_attempt_id uuid NULL FK payment_attempts`; `items_subtotal_paise/discount_paise/delivery_fee_paise/platform_fee_paise/total_paise bigint NOT NULL CHECK >= 0`; CHECK `discount_paise <= items_subtotal_paise` and `total_paise = items_subtotal_paise - discount_paise + delivery_fee_paise + platform_fee_paise`; `business_snapshot jsonb NOT NULL`; `delivery_address_snapshot jsonb NULL`; `invoice_number text NULL UNIQUE`; `invoice_snapshot jsonb NULL`; `version int NOT NULL DEFAULT 1`; `placed_at/created_at/updated_at timestamptz NOT NULL`. GST is included in item prices; do not invent a tax split. Do not store delivery/pickup codes in this row. | `(customer_user_id,placed_at DESC,id DESC)` serves customer history; `(business_id,status,placed_at DESC,id DESC)` serves vendor/provider queues; `(status,placed_at,id)` serves scoped admin queues; unique invoice number supports lookup. |
| `order_items` | `id uuid PK`; `order_id uuid NOT NULL FK orders`; `product_id/product_variant_id uuid NULL` references Products; `product_name_en/product_name_hi text NOT NULL`; `variant_label text NULL`; `quantity int NOT NULL CHECK > 0`; `unit_price_paise/discount_paise/line_total_paise bigint NOT NULL CHECK >= 0`; CHECK `discount_paise <= quantity * unit_price_paise` and `line_total_paise = quantity * unit_price_paise - discount_paise`; `availability text NOT NULL CHECK ('ordered','unavailable')`; `created_at/updated_at timestamptz NOT NULL`. `line_total_paise` is the immutable purchase-time amount; unavailable lines remain in history but are excluded from the adjusted bill under Q-77. Snapshot names/prices survive catalog edits; product IDs may be null for retained history after listing removal. | `(order_id,id)` serves order detail and invoice; `(product_variant_id)` supports order-to-product history. |
| `order_status_history` | `id uuid PK`; `order_id uuid NOT NULL FK orders`; `from_status text NULL`; `to_status text NOT NULL`; `event_key text NOT NULL`; `actor_user_id uuid NULL FK users`; `reason_key text NULL`; `created_at timestamptz NOT NULL`. Append-only; the current order status must equal the latest history state. | `(order_id,created_at,id)` serves the customer/vendor timeline; `(actor_user_id,created_at DESC)` supports scoped audit investigation. |
| `order_cases` | `id uuid PK`; `order_id uuid NOT NULL FK orders`; `case_type text NOT NULL CHECK ('cancellation','refund','problem','failed_delivery')`; `status text NOT NULL CHECK ('open','in_review','resolved')`; `opened_by uuid NOT NULL FK users`; `assigned_admin_user_id uuid NULL FK users`; `reason_key text NOT NULL`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at timestamptz NOT NULL`. Refund state remains Payments-owned. | `(order_id,created_at DESC,id DESC)` serves order detail; `(status,created_at,id)` serves admin case queues; `(assigned_admin_user_id,status,created_at,id)` supports assigned work. |
| `order_case_events` | `id uuid PK`; `case_id uuid NOT NULL FK order_cases`; `actor_user_id uuid NOT NULL FK users`; `event_type text NOT NULL CHECK ('opened','status_changed','note_added','refund_decision_requested')`; `from_status/to_status text NULL`; `visibility text NOT NULL CHECK ('customer','internal')`; `note text NULL`; `reason_key text NULL`; `created_at timestamptz NOT NULL`. Customer projections expose status and explicitly customer-visible updates only; internal notes/evidence remain restricted under Q-78. | `(case_id,created_at,id)` serves case history; `(actor_user_id,created_at DESC)` supports audit lookup. |
| `order_case_attachments` | `id uuid PK`; `case_event_id uuid NOT NULL FK order_case_events`; `media_asset_id uuid NOT NULL FK media_assets`; `created_at timestamptz NOT NULL`; UNIQUE `(case_event_id,media_asset_id)`. Asset ownership, private visibility and content validation are checked through the Media private-asset contract; never expose storage keys. | `(media_asset_id)` supports authorized attachment resolution. |

`business_snapshot`, address snapshot, invoice fields and case attachment visibility are purpose-limited; encrypt address/contact fields at rest and restrict them by role and order ownership. Invoices are rendered from immutable snapshots; exact invoice numbering/tax fields remain Q-06/Q-07.

## Endpoints and application contracts

| Method | Path / contract | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/orders` | Authenticated customer sees own; approved vendor/provider sees own business; admin requires `orders:view` plus assigned city/area; super_admin platform scope. | Allow-listed `group=active\|completed\|cancelled`, `cursor`, `limit<=50` → compact owner-specific order cards. | `ORDERS_FILTER_INVALID` | Yes | F-OR-001, S-CUST-13, S-VEND-03, S-PROV-04 |
| GET | `/orders/{orderId}` | Customer ownership; vendor/provider business ownership; admin `orders:view` + scope. Rider projections are Delivery-owned. | → snapshot items/totals, timeline, case summary and Payments-owned payment/refund summary. Live tracking comes from Delivery's order-scoped contract; no raw code. | `ORDER_NOT_FOUND` | Yes | F-OR-001–008, S-CUST-14, S-VEND-04, S-PROV-05 |
| Internal | `createPerShopOrders` | Cart/Checkout application contract; caller is trusted module, checkout attempt is verified. | Immutable per-business quote, payment reference, idempotency key → one order per shop and order IDs. | `ORDER_CREATION_CONFLICT`, `ORDER_CHECKOUT_INVALID` | Required | F-OR-001, F-CK-002, S-CUST-12 |
| POST | `/orders/{orderId}/cancel` | Customer owns order for `event='cancel'`; approved vendor/provider owns business for `event='reject'`. | `{event:'cancel'\|'reject',reasonKey,expectedVersion}` + key → cancelled order and case; captured-payment cancellation follows the server-side Payments refund contract and Q-76/Q-79. | `ORDER_NOT_FOUND`, `ORDERS_INVALID_TRANSITION`, `ORDER_VERSION_CONFLICT` | Required | F-OR-005/006, F-VD-008, S-CUST-14/15, S-VEND-04 |
| POST | `/orders/{orderId}/refund-requests` | Customer owns order; delivered order and within configured 24-hour window. | `{reasonKey,details?,evidenceAssetIds?}` + key → requested tracker/case; amount is server-derived. | `ORDER_NOT_FOUND`, `ORDERS_REFUND_WINDOW_CLOSED`, `ORDER_REFUND_EXISTS`, `ORDER_EVIDENCE_INVALID` | Required | F-OR-005/006, S-CUST-14/15 |
| POST | `/orders/{orderId}/cases` | Customer owns order; one idempotent submission. | `{reasonKey,details?,evidenceAssetIds?}` + key → case reference and customer-visible status. | `ORDER_NOT_FOUND`, `ORDER_CASE_INVALID`, `ORDER_EVIDENCE_INVALID` | Required | F-OR-005/008, S-CUST-14 |
| PATCH | `/orders/{orderId}/items/{itemId}/availability` | Approved vendor/provider owns order's business. | `{availability:'unavailable',expectedVersion}` → updated item and server-recomputed total. | `ORDER_NOT_FOUND`, `ORDER_ITEM_NOT_FOUND`, `ORDER_ITEM_STATE_INVALID`, `ORDER_VERSION_CONFLICT` | Required | F-OR-007, F-VD-008, S-VEND-04 |
| GET | `/orders/{orderId}/reorderable-items` | Customer owns original order. | → current purchasable product/variant IDs and quantities; cart is unchanged. | `ORDER_NOT_FOUND` | Yes | F-OR-005, S-CUST-14 |
| GET | `/orders/{orderId}/invoice` | Customer owns order; vendor/provider business owner may access its order copy. | → printable invoice from frozen order snapshot; no fabricated tax fields. | `ORDER_NOT_FOUND`, `ORDER_INVOICE_UNAVAILABLE` | Yes | F-OR-005, F-X-011, S-CUST-16 |
| GET | `/orders/{orderId}/packing-slip` | Approved vendor/provider owns order. | → printable fulfilment slip with only needed customer/fulfilment data. | `ORDER_NOT_FOUND` | Yes | F-VD-008, F-PV-005, S-VEND-04 |
| GET | `/admin/orders` / `/admin/orders/{orderId}` | Admin requires `orders:view` + assigned city/area; super_admin platform scope. | Allow-listed case/status filters + keyset cursor → scoped orders/cases. | `ADMIN_SCOPE_FORBIDDEN`, `ORDERS_FILTER_INVALID` | Yes | F-AD-007, S-ADMN-07/08 |
| PATCH | `/admin/orders/{orderId}/cases/{caseId}` | Admin requires `orders:edit` + assigned city/area; super_admin platform scope; before/after audit required. | `{event:'in_review'\|'resolve'\|'approve_refund'\|'decline_refund',note?,visibility?,expectedVersion}` → case event; refund decisions are sent to Payments, which owns ST-refund and execution. | `ORDER_CASE_NOT_FOUND`, `ORDER_CASE_TRANSITION_INVALID`, `ADMIN_SCOPE_FORBIDDEN` | Required | F-OR-008, F-AD-007, S-ADMN-08 |
| Internal | Delivery lifecycle events | Delivery owns actor/OTP/rider checks; Orders consumes committed events only. | Delivery `out_for_delivery`, verified `delivered` or `picked_up` → matching order transition. | `ORDERS_INVALID_TRANSITION` | Event ID dedupe | F-OR-002–004, S-CUST-14 |

`GET /orders/{id}/reorderable-items` is intentionally not an order write: the client adds returned items through Cart/Checkout, which revalidates current prices, availability and stock. Customer code delivery and live tracking are Delivery-owned; order and vendor APIs never return OTP/pickup codes (G-15/G-16).

## Rules and use-cases

1. Preserve one order per shop (BR-03). `createPerShopOrders` accepts only a committed checkout snapshot and is idempotent; all per-shop rows are created atomically after final validation/reservation.
2. Store purchase-time product names, variant, quantities, paise prices, discount allocation, fees and business details. Later catalog/profile/address edits cannot rewrite an existing order or invoice. Money uses integer paise; times use UTC, display IST (BR-01/02).
3. Use explicit handlers keyed by `(mode,currentStatus,event)`; transition updates, history row, stock side effects, and outbox events commit in one transaction. Invalid edges throw `ORDERS_INVALID_TRANSITION`; compare `expectedVersion` to prevent concurrent overwrites (BR-04).
4. Delivery edges: `placed -> accepted|cancelled`; `accepted -> preparing|cancelled`; `preparing -> ready|cancelled`; `ready -> out_for_delivery`; `out_for_delivery -> delivered`. Pickup edges: `placed -> accepted|cancelled`; `accepted -> ready|cancelled`; `ready -> picked_up`. `refunded` follows only a verified Payments completion from an eligible `delivered`, `picked_up` or `cancelled` order. Delivery-only events cannot advance pickup orders and vice versa.
5. Customer cancellation follows the prototype: `placed`, `accepted`, or `preparing` delivery orders; pickup orders only in eligible source-defined states. Require reason and expected version. Restore reserved stock only on pre-fulfilment cancellation; if payment was captured, create a Payments refund request and keep order `cancelled` until refund completion.
6. Customer refund request is available on delivered orders within 24 hours. Do not accept client refund amounts; Payments validates remaining captured funds. Pickup refund eligibility is Q-79. Cancellation/refund requests open a case and publish notices for both vendor and admin (BR-20).
7. Case state is `open -> in_review -> resolved` (ST-case). Admin notes/status changes require `orders:edit`, city/area scope and audit before/after (BR-12). Until Q-78 is resolved, customer DTOs expose case status only; internal notes/evidence stay staff-only.
8. For unavailable items, vendor/provider may mark selected ordered lines unavailable before fulfilment; preserve their purchase-time lines, recalculate the bill from remaining ordered lines and stored discount allocations, and notify the customer. If every line becomes unavailable, cancel the shop-order and route any captured amount to Payments. Do not silently substitute or invent item/price approval behavior; see Q-76/Q-77.
9. Delivery status, rider identity/ETA, code generation/verification, rider assignment/reassignment and cash collection are Delivery/Payments-owned contracts. Orders consumes only verified events. Never place raw customer codes or rider phone numbers in vendor/admin order DTOs (BR-05).
10. Render invoices and packing slips from order-time snapshots. GST is shown as included in item prices; invoice numbering, seller tax fields and exact invoice issue policy use approved settings only (Q-06/Q-07). Reordering returns identifiers only; Cart/Checkout reprices and validates every line.
11. Order, case and invoice reads are role/ownership/scope checked on every request. Admin queries are filtered by assigned area/city before pagination; customer and business identifiers are never trusted from request bodies.
12. Refund evidence uses private Media assets only. Validate each asset belongs to the customer, order and case; reject public URLs or arbitrary storage keys. Limits/retention remain Q-80.

## Events and jobs

- Publishes: `order.created`, `order.status_changed`, `order.cancelled`, `refund.requested`, `order.items_adjusted`, `order.case_opened`, `order.case_updated`, `refund.decision_requested`; durable events use the transactional outbox.
- Consumes: `payment.succeeded/failed`, `refund.approved/declined/completed`, verified Delivery status/assignment/failure events, and Products stock-reservation results.
- Notifications consumes placed/cancelled/refund/case events; Audit consumes admin case and rider-reassignment actions. Jobs expire only configured request windows and reconcile outbox delivery; retries are bounded/idempotent.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `ORDER_NOT_FOUND` | 404 | `errors.orders.notFound` |
| `ORDER_CREATION_CONFLICT` | 409 | `errors.orders.creationConflict` |
| `ORDER_CHECKOUT_INVALID` | 422 | `errors.orders.checkoutInvalid` |
| `ORDERS_INVALID_TRANSITION` | 409 | `errors.orders.invalidTransition` |
| `ORDER_VERSION_CONFLICT` | 409 | `errors.orders.versionConflict` |
| `ORDERS_FILTER_INVALID` | 400 | `errors.orders.filterInvalid` |
| `ORDERS_REFUND_WINDOW_CLOSED` | 409 | `errors.orders.refundWindowClosed` |
| `ORDER_REFUND_EXISTS` | 409 | `errors.orders.refundExists` |
| `ORDER_ITEM_NOT_FOUND` | 404 | `errors.orders.itemNotFound` |
| `ORDER_ITEM_STATE_INVALID` | 409 | `errors.orders.itemStateInvalid` |
| `ORDER_CASE_INVALID` | 422 | `errors.orders.caseInvalid` |
| `ORDER_CASE_NOT_FOUND` | 404 | `errors.orders.caseNotFound` |
| `ORDER_CASE_TRANSITION_INVALID` | 409 | `errors.orders.caseTransitionInvalid` |
| `ORDER_EVIDENCE_INVALID` | 422 | `errors.orders.evidenceInvalid` |
| `ORDER_INVOICE_UNAVAILABLE` | 409 | `errors.orders.invoiceUnavailable` |

Reuse shared `AUTH_REQUIRED`, `FORBIDDEN` and `ADMIN_SCOPE_FORBIDDEN`; error responses use the shared API envelope.

## Acceptance criteria

1. Given a two-shop checkout, when `createPerShopOrders` commits, then exactly two independent orders and their purchase snapshots exist; replaying the same key returns the same IDs.
2. Given a transition is not allowed for the order mode/current status, when requested, then the service returns `ORDERS_INVALID_TRANSITION` and writes no history, stock or notification side effect.
3. Given two actors race to update one order version, when both submit the same expected version, then exactly one transition commits.
4. Given a customer cancels an eligible unpaid order, when they submit a reason, then it becomes cancelled, stock is restored once, and vendor/admin notifications are queued.
5. Given a captured order is cancelled or refunded, when the request is accepted, then Payments receives one server-derived refund request and the order is not marked refunded until Payments confirms completion.
6. Given a vendor/provider marks one item unavailable, when the order still has other items, then totals are recomputed from snapshots and the customer is notified; no replacement item or unapproved price is inserted.
7. Given a customer or business requests another party's order, or an admin's area is outside scope, when accessed, then the request returns 404/403 without leaking order, address or phone data.
8. Given an admin without `orders:edit` or within the wrong area attempts to update a case, when submitted, then authorization fails and no audit/state change is written.
9. Given an order is delivered, when the owner opens its invoice, then the printable document uses its immutable item and amount snapshot; no unconfigured tax amount is invented.
10. Given a customer opens an order, when it is returned, then tracking summary contains no raw OTP/pickup code; code delivery is handled only through the approved Delivery customer channel.
11. Given a case contains internal notes or evidence, when a customer reads the order, then only case status is returned until Q-78 explicitly approves customer-visible updates or attachments.

## Tests

- Unit: every delivery/pickup transition handler; wrong-mode/invalid transition; refund completion mapping; cancellation eligibility; state grouping; server recomputation for unavailable items; invoice snapshot rendering.
- Integration: per-shop creation with Products reservation and Payments references; outbox/inbox idempotency; cursor pagination by role; Delivery event processing; Refund case lifecycle; private evidence authorization.
- Authorization negatives: non-owner customer, different business owner, unapproved vendor/provider, admin without `orders:view`/`orders:edit`, admin outside assigned city/area, rider accessing order instead of Delivery projection.
- Concurrency: duplicate checkout creation, two simultaneous state transitions, duplicate refund/case submissions, and concurrent unavailable-item updates.
- Security/privacy: no OTP in API/logs/vendor/admin output; internal case notes excluded from customer DTO; addresses and attachments restricted/encrypted; injected sort/filter and unknown DTO fields rejected.
- Journey coverage: J1, J7, J8; relevant screens and role-specific variants.

## Open questions

Q-06/Q-07 invoice/tax rules; Q-17 unspecified actors/guards; Q-76 partial-refund semantics; Q-77 unavailable-item substitution/approval; Q-78 case-note visibility; Q-79 pickup refund window/eligibility; Q-80 optional refund evidence policy; G-16 customer code display conflict.
