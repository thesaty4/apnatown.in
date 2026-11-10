# BE: cart-checkout

Features: F-CK-001, F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-008, F-CK-009 | Rules: BR-01, BR-03, BR-04, BR-17, BR-19, BR-21 | State machines: ST-payment, ST-order-delivery, ST-order-pickup | Depends on: products, businesses, offers, geo, payments, orders, users, settings

Frontend counterpart: [FE cart-checkout](../fe/cart-checkout.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own customer carts, server-priced quotes and checkout orchestration. Group eligible product lines by business, validate address/mode/minimum/stock, and create one independent order per shop through the Orders contract. Address CRUD, delivery-fee policy, coupon records, payment records and order state remain owned by Users, Geo, Offers, Payments and Orders respectively.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `carts` | `id uuid PK`; `user_id uuid NULL FK users`; `guest_session_hash text NULL`; CHECK exactly one owner is set; `version int NOT NULL DEFAULT 1`; timestamps. Never store the raw guest-session token. | Partial unique `(user_id) WHERE user_id IS NOT NULL` serves each user's active cart; unique `guest_session_hash` serves guest lookup. |
| `cart_lines` | `id uuid PK`; `cart_id uuid NOT NULL FK carts`; `product_variant_id uuid NOT NULL FK product_variants`; `quantity smallint NOT NULL CHECK 1..10`; `saved_for_later boolean NOT NULL DEFAULT false`; `version int NOT NULL DEFAULT 1`; timestamps. Price and stock are always read from Products, never trusted from the cart. | Unique `(cart_id,product_variant_id)`; `(cart_id,saved_for_later,created_at,id)` serves cart and saved-line reads. |
| `checkout_attempts` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `cart_id uuid NOT NULL FK carts`; `idempotency_key text NOT NULL`; `request_hash text NOT NULL`; `status text NOT NULL CHECK ('created','payment_pending','payment_failed','placed','expired')`; `payment_method text NOT NULL`; `address_id uuid NULL FK addresses`; `quote_snapshot jsonb NOT NULL` containing server-derived per-shop totals; `expires_at timestamptz NOT NULL`; `version int NOT NULL DEFAULT 1`; timestamps. No address text, payment credentials, OTP or pickup code is stored here. | Unique `(user_id,idempotency_key)`; `(user_id,created_at DESC,id DESC)` serves attempt lookup; `(status,expires_at)` serves expiry work. |

`F-CK-004` reuses Users' address table and `/users/me/addresses` contract; checkout reads through a typed `UsersAddressPort`, rechecks ownership, and passes only the selected address reference to Orders. It does not duplicate address endpoints or write an authoritative address snapshot. `settings` supplies configured checkout charges. Business-level `delivery_fee_paise` versus Geo zone slabs remains Q-69.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/cart` | Guest session or authenticated customer; cart owner only | → active/saved lines, current product prices and estimated breakdown | `CART_NOT_FOUND` | Yes | F-CK-001, S-CUST-10 |
| POST | `/cart/merge-guest` | Authenticated customer; merge only the guest cart bound to the same httpOnly session cookie | → account cart plus lines requiring customer review | `CART_NOT_FOUND`, `CART_VERSION_CONFLICT` | Idempotency key | F-CK-001, S-CUST-10, J12 |
| POST | `/cart/lines` | Guest session or authenticated customer; product must be purchasable | `{productVariantId,quantity}` → updated cart | `CART_LINE_INVALID`, `PRODUCT_NOT_AVAILABLE`, `CART_QUANTITY_INVALID` | Idempotency key | F-CK-001, S-CUST-10 |
| PATCH/DELETE | `/cart/lines/{lineId}` | Guest session or authenticated customer; line's cart owner | PATCH `{quantity,expectedVersion}` or delete → cart | `CART_LINE_NOT_FOUND`, `CART_VERSION_CONFLICT`, `CART_QUANTITY_INVALID` | PATCH: version; DELETE: yes | F-CK-001, S-CUST-10 |
| POST | `/cart/lines/{lineId}/save-for-later` or `/restore` | Same cart-owner check | → updated cart | `CART_LINE_NOT_FOUND` | Yes | F-CK-001, S-CUST-10 |
| POST | `/cart/quote` | Guest session or authenticated customer | `{addressId?,deliveryModes:[{businessId,mode}],couponCode?}` → server-priced shop groups, issues and total | `CHECKOUT_ADDRESS_INVALID`, `DELIVERY_UNAVAILABLE`, `MINIMUM_ORDER_NOT_MET`, `CHECKOUT_COUPON_INVALID` | Yes | F-CK-001–005, F-CK-009 |
| POST | `/checkout/attempts` | Authenticated customer; cart and address owned by session user | `{cartVersion,addressId?,deliveryModes,paymentMethod,couponCode?}` + `Idempotency-Key` → attempt status, payment handoff or per-shop order summaries | `AUTH_REQUIRED`, `CHECKOUT_ATTEMPT_CONFLICT`, `CART_VERSION_CONFLICT`, `DELIVERY_UNAVAILABLE`, `MINIMUM_ORDER_NOT_MET`, `CHECKOUT_COUPON_INVALID` | Required | F-CK-002–009, S-CUST-11 |
| GET | `/checkout/attempts/{attemptId}` | Authenticated customer; attempt owner | → current attempt and per-shop order summaries | `CHECKOUT_ATTEMPT_NOT_FOUND` | Yes | F-CK-007–008, S-CUST-11–12 |
| POST | `/checkout/attempts/{attemptId}/retry` | Authenticated customer; attempt owner; only failed/unplaced attempt | `{paymentMethod}` + `Idempotency-Key` → new payment handoff or placed order summaries | `CHECKOUT_ATTEMPT_NOT_FOUND`, `CHECKOUT_STATE_INVALID`, `CHECKOUT_ATTEMPT_CONFLICT` | Required | F-CK-006–007, S-CUST-11 |

The checkout attempt accepts only `upi`, `card`, `net_banking`, `wallet`, or `cash`; server settings decide which are enabled. Address CRUD remains Users-owned. `payment.succeeded` is trusted only after Payments verifies the provider callback/webhook; a browser redirect never marks payment successful.

## Rules and use-cases

1. Guest cart identity is an opaque session cookie; authenticated cart identity comes from the session. Enforce ownership on every line/attempt read and mutation. Guest checkout requires login and returns to `/checkout` (BR-21); `/cart/merge-guest` merges only the cookie-bound guest cart, combining same-variant quantities up to 10 and returning unavailable/clipped lines for customer review (Q-70).
2. Cart accepts purchasable product variants only. Quantity is 1–10 and cannot exceed current stock. Service listings remain enquiry-only. Never accept client prices, fees, discount amounts, business owner IDs or stock.
3. Reprice from Products and eligible Offers on every quote and final submission. GST is already included in item prices; do not add GST again. Coupon definitions and use accounting stay in Offers; sample coupon data is not production configuration (A-01/Q-67).
4. Group active lines by shop. Require an exact delivery/pickup choice for each shop. Pickup must be enabled. Delivery requires a customer-owned address, active city, Geo serviceability, shop radius/orderability and the shop minimum. Compare minimum against the shop subtotal before coupon allocation, as the prototype does. Any unresolved shop issue blocks confirmation; the customer may remove that shop or choose eligible pickup (J1).
5. Geo computes delivery fees from its zone/default slab in integer paise; the client never supplies a fee. Do not combine `business_settings.delivery_fee_paise` until Q-69 is resolved. Read platform fee from Settings; per-shop application remains Q-71. Keep quote totals server-derived and revalidate all inputs at confirmation.
6. Compute one coupon discount on eligible cart value, applying minimum and cap from Offers. Allocate across eligible shop subtotals proportionally; use integer paise, and assign the rounding remainder to the largest eligible subtotal with stable business-ID tie-break. Allocated discounts must sum exactly to the checkout discount (BR-19).
7. Confirmation is idempotent by customer + key + request hash. Same key/payload replays the attempt; same key/different payload conflicts. Lock/recheck cart, product availability, business settings, address, Geo fee and coupon before finalization.
8. Use one checkout payment selection; resolve `cash` per order as cash-on-delivery or pay-at-pickup according to that shop's mode. Payments owns provider attempts and ST-payment; charge/capture allocation across shop orders remains Q-21. Cash orders start `pending` and become `collected` only at handover.
9. After verified online success, call Orders' `createPerShopOrders` contract once; cash checkout calls it immediately. Orders owns state/OTP codes and Products' stock-reservation contract; never decrement stock at quote time. If any final reservation fails, create no partial set of orders (Q-72); post-payment compensation follows Q-73.
10. Clear only purchased cart lines after all per-shop orders are confirmed. Keep the cart on validation/payment failure for correction or retry. Emit an idempotent coupon-use event only after order creation; do not return OTP/pickup codes from checkout APIs.

## Events and jobs

- Consume verified `payment.succeeded` / `payment.failed` events from Payments; deduplicate by event ID and transition the attempt once.
- On successful order creation, publish `checkout.orders_created` and an idempotent committed-coupon-use event through the outbox. Orders owns order-created notifications and lifecycle events.
- Expire stale checkout attempts idempotently using their configured expiry; exact provider expiry is adapter/config owned.
- Retry transient outbox delivery with shared bounded backoff; reconciliation must not duplicate charges, orders or coupon use.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `CART_NOT_FOUND` | 404 | `errors.cart.notFound` |
| `CART_LINE_NOT_FOUND` | 404 | `errors.cart.lineNotFound` |
| `CART_LINE_INVALID` | 422 | `errors.cart.lineInvalid` |
| `CART_QUANTITY_INVALID` | 422 | `errors.cart.quantityInvalid` |
| `CART_VERSION_CONFLICT` | 409 | `errors.cart.versionConflict` |
| `CHECKOUT_ATTEMPT_NOT_FOUND` | 404 | `errors.checkout.attemptNotFound` |
| `CHECKOUT_ATTEMPT_CONFLICT` | 409 | `errors.checkout.attemptConflict` |
| `CHECKOUT_STATE_INVALID` | 409 | `errors.checkout.stateInvalid` |
| `CHECKOUT_ADDRESS_INVALID` | 422 | `errors.checkout.addressInvalid` |
| `DELIVERY_UNAVAILABLE` | 422 | `errors.checkout.deliveryUnavailable` |
| `MINIMUM_ORDER_NOT_MET` | 422 | `errors.checkout.minimumOrderNotMet` |
| `PRODUCT_NOT_AVAILABLE` | 409 | `errors.checkout.productNotAvailable` |

Reuse shared `AUTH_REQUIRED` and `CHECKOUT_COUPON_INVALID` for their documented conditions.

## Acceptance criteria

1. Given lines from two shops, when checkout succeeds, then Orders creates exactly one order per shop with the selected mode and payment record (BR-03).
2. Given a line is over stock or unavailable, when quote/confirmation runs, then the server rejects it without trusting client totals or creating an order (BR-04).
3. Given delivery is out of Geo/shop range or below the delivery minimum, when confirming, then no order is created and the affected shop can be removed or switched to eligible pickup.
4. Given a valid coupon and multiple eligible shops, when quote is calculated, then per-shop discounts sum exactly to the capped checkout discount and rounding is deterministic (BR-19).
5. Given an address belongs to another user or an attempt belongs to another customer, when accessed, then the server denies it without exposing address/order data.
6. Given the same idempotency key and payload is retried, when the attempt is read, then the same payment/order result is returned once; a changed payload conflicts.
7. Given a provider reports failure, when the event is verified, then no order is created and the cart remains available for retry or enabled cash payment.
8. Given an authorized cash checkout is confirmed, when orders are created, then each payment remains `pending` until handover collection (ST-payment).

## Tests

- Unit: shop grouping, pricing/paise rounding, proportional allocation and remainder, minimum/radius/mode validation, coupon minimum/cap.
- Integration: live quote revalidation, address ownership, Geo fee port, Products stock reservation, Orders per-shop creation, Payments success/failure, outbox deduplication and cart clearing.
- Authorization negatives: anonymous checkout; cross-user cart line/address/attempt; wrong guest-session token; same idempotency key with changed payload.
- Concurrency: last-unit race creates no oversell; duplicate payment event creates one order set; one failed shop validation creates no partial checkout (Q-72).
- Open policy questions: Q-69–Q-73; payment gateway/charge topology Q-01/Q-21; coupon lifecycle and stacking Q-62/Q-67.
