# BE: cart-checkout

Features: F-CK-001, F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-008, F-CK-009 | Rules: BR-01, BR-03, BR-04, BR-17, BR-19, BR-21 | State machines: ST-payment, ST-order-delivery, ST-order-pickup | Depends on: products, businesses, offers, geo, payments, orders, users, settings

Frontend counterpart: [FE cart-checkout](../fe/cart-checkout.md) · [Feature inventory](../../../docs/design-context/01-feature-inventory.md)

## Responsibility

Own customer carts, server-priced quotes and checkout orchestration. Group eligible product lines by business, validate address/mode/minimum/stock, and create one independent order per shop through the Orders contract. Address CRUD, delivery-fee policy, coupon records, payment records and order state remain owned by Users, Geo, Offers, Payments and Orders respectively.

Use [foundation](../../_foundation/backend-shared.md) flat errors `{code,message_key,status,details,correlationId}`, CSRF/session guards and allow-listed DTOs. Money is database `bigint` paise, serialized as safe-integer JSON numbers; reject overflow, never switch to strings/rupee floats.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `carts` | `id uuid PK`; `user_id uuid NULL FK users`; `guest_cart_token_hash bytea NULL`; CHECK exactly one owner is set; `version int NOT NULL DEFAULT 1`; timestamps. Never store the raw guest-cart capability. | Partial unique `(user_id) WHERE user_id IS NOT NULL` serves each user's active cart; unique `guest_cart_token_hash` serves guest lookup. |
| `cart_lines` | `id uuid PK`; `cart_id uuid NOT NULL FK carts`; `product_id uuid NOT NULL FK products`; `product_variant_id uuid NULL FK product_variants` (API `variantId`); `quantity smallint NOT NULL CHECK 1..10`; `saved_for_later boolean NOT NULL DEFAULT false`; `version int NOT NULL DEFAULT 1`; timestamps. Variant belongs to product and is active; a nonempty variant set requires selection, an empty set requires null. Price/stock are product-level. | Partial unique `(cart_id,product_id) WHERE product_variant_id IS NULL`; partial unique `(cart_id,product_id,product_variant_id) WHERE product_variant_id IS NOT NULL`; `(cart_id,saved_for_later,created_at,id)` active/saved reads. |
| `checkout_quotes` | `id uuid PK`; `cart_id uuid NOT NULL FK carts`; `user_id uuid NULL FK users` (guest quote remains cookie-bound); `cart_version int NOT NULL`; `address_id uuid NULL FK addresses`; `address_version int NULL`; CHECK address ID/version paired; `input_hash/pricing_revision text NOT NULL`; `snapshot jsonb NOT NULL` (`CheckoutQuoteDTO` server fields below); `created_at/expires_at timestamptz NOT NULL CHECK expires_at > created_at`. Immutable; no address text/codes/payment credentials. | `(cart_id,cart_version,created_at DESC,id DESC)` current quote; `(expires_at)` expiry. |
| `checkout_attempts` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `cart_id uuid NOT NULL FK carts`; `quote_id uuid NOT NULL FK checkout_quotes`; `idempotency_key/request_hash text NOT NULL`; `status text NOT NULL CHECK ('created','payment_pending','payment_failed','placed','expired','compensating','compensated','reconciliation_required')`; `payment_method text NOT NULL`; `payment_round int NOT NULL DEFAULT 1`; `failure_code text NULL`; `invalidated_at timestamptz NULL`; `expires_at timestamptz NOT NULL`; `version int NOT NULL DEFAULT 1`; timestamps. Each round is bound to an immutable quote; retry history is retained by Payments, never overwritten. | Unique `(user_id,idempotency_key)`; partial unique `(cart_id) WHERE status IN ('created','payment_pending','compensating','reconciliation_required')` fences placement; `(user_id,created_at DESC,id DESC)` reads; `(status,expires_at)` expiry. |

F-CK-004 reuses Users' `/users/me/addresses`. `UsersAddressPort.forCheckout({userId,addressId,expectedVersion?},uow?)` returns the owned live address, `version`, resolved city/area and location; Orders freezes its authorized address snapshot at creation under the same revision check. Editing/deleting an address increments its revision; a newer value must never replace a paid quote silently.
`BusinessReadPort.forCheckout({businessIds})` supplies current approval, location/hours/orderability, delivery method/radius, `deliveryFeePaise` (self-delivery flat fee), minimum, pickup and business `version`, which versions its settings too. Products' checkout projection supplies product/active variant IDs, version, inventory version, stock and product-level price; no synthetic base variant is required.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/cart` | Guest capability or authenticated customer; cart owner only | → `CartDTO`; absent cart is the explicit unpersisted empty state below | `CART_NOT_FOUND` for an invalid explicit resource reference | Yes | F-CK-001, S-CUST-10 |
| POST | `/cart/merge-guest` | Authenticated customer plus independent httpOnly guest-cart capability; no client-supplied cart ID | → account cart plus lines requiring customer review; consume guest binding only after commit | `CART_NOT_FOUND`, `CART_VERSION_CONFLICT` | Idempotency key | F-CK-001, S-CUST-10, J12 |
| POST | `/cart/lines` | Guest session/customer; product purchasable; cart owner | `{productId,variantId:null\|uuid,quantity,expectedCartVersion}` → `CartDTO` | `CART_LINE_INVALID`, `PRODUCT_NOT_AVAILABLE`, `CART_QUANTITY_INVALID`, `CART_VERSION_CONFLICT` | Key + version | F-CK-001, S-CUST-10 |
| PATCH/DELETE | `/cart/lines/{lineId}` | Guest session/customer; line's cart owner | `{quantity?,expectedVersion,expectedCartVersion}` → `CartDTO` | `CART_LINE_NOT_FOUND`, `CART_VERSION_CONFLICT`, `CART_QUANTITY_INVALID` | Key + version | F-CK-001, S-CUST-10 |
| POST | `/cart/lines/{lineId}/save-for-later` or `/cart/lines/{lineId}/restore` | Same cart-owner check | `{expectedVersion,expectedCartVersion}` → cart; restore revalidates label/stock | `CART_LINE_NOT_FOUND`, `CART_VERSION_CONFLICT`, `CART_LINE_INVALID` | Key + version | F-CK-001, S-CUST-10 |
| POST | `/cart/quote` | Guest cookie/customer owns cart; address requires authenticated ownership | `{cartVersion,addressId?,addressVersion?,deliveryModes?:[{businessId,mode}],couponCode?}` → `CheckoutQuoteDTO`; absent mode/address permits cart estimate, never placeable checkout | `CHECKOUT_ADDRESS_INVALID`, `CHECKOUT_QUOTE_STALE`, `DELIVERY_UNAVAILABLE`, `MINIMUM_ORDER_NOT_MET`, `CHECKOUT_COUPON_INVALID`, `CHECKOUT_COUPON_POLICY_UNAVAILABLE` | Read calculation; no reservation | F-CK-001, F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-009 |
| POST | `/checkout/attempts` | Authenticated customer; own cart/quote/address | `{quoteId,expectedCartVersion,expectedAddressVersion?,paymentMethod}` + key → `CheckoutAttemptDTO` | `CHECKOUT_ATTEMPT_CONFLICT`, `CHECKOUT_QUOTE_STALE`, `CHECKOUT_PAYMENT_UNAVAILABLE` | Required | F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-008, F-CK-009, S-CUST-11 |
| GET | `/checkout/attempts/{attemptId}` | Customer owns attempt | `CheckoutAttemptDTO`; compensation observable even with no order IDs | `CHECKOUT_ATTEMPT_NOT_FOUND` | Yes | F-CK-007, F-CK-008, S-CUST-11, S-CUST-12 |
| POST | `/checkout/attempts/{attemptId}/retry` | Customer owns unplaced attempt; Payments has resolved prior exposure | `{quoteId,paymentMethod,expectedVersion}` + key → same logical attempt/new fenced payment round or cash order result | `CHECKOUT_STATE_INVALID`, `CHECKOUT_ATTEMPT_CONFLICT`, `CHECKOUT_RECONCILIATION_REQUIRED`, `CHECKOUT_QUOTE_STALE` | Required | F-CK-006, F-CK-007, S-CUST-11 |

Client methods allow only `upi`, `card`, `net_banking`, `wallet`, `cash`; `paymentMethod` is optional on submit/retry **only** when the ready authoritative quote total is exactly zero. Store server-derived `no_charge` for an all-zero attempt; reject a client-supplied no-charge value. Positive allocations still require the selected method's live flags/configuration/compensation capability. No-charge bypasses only inapplicable provider/COD gates, never maintenance, authentication, stock, approval, tax, coupon or fulfilment guards.

### DTOs and orchestration ports

- `CartDTO={id,version,lines:[{id,version,productId,variantId,variantLabel?,quantity,savedForLater,product,issues}],estimatedAmounts}`. Stable identity is product + nullable variant, independent of the saved flag.
- Before a cart exists, GET returns `{id:null,version:0,lines:[],estimatedAmounts}` with an empty breakdown, not a fabricated persisted ID. Version zero is only this transient state: the first line command with `expectedCartVersion:0` atomically creates the owner's cart/line at version 1. Owner uniqueness resolves concurrent first adds; the loser refreshes on conflict. Later mutations require the persisted version.
- `CheckoutQuoteDTO={quoteId,cartVersion,addressId?,addressVersion?,pricingRevision,expiresAt,ready,groups:[{businessId,scope,mode,deliveryMethod,settingsVersion,fulfilment:{delivery:{available,reasonCode?},pickup:{available,reasonCode?}},lines:[{cartLineId,lineVersion,productId,variantId,quantity,productVersion,stockVersion,unitPricePaise,discountPaise}],itemsSubtotalPaise,couponDiscountPaise,deliveryFeePaise,deliveryFeeSource,platformFeePaise,totalPaise,issues}],couponId?,couponVersion?,totalPaise,issues}`. Mode may be null before selection; unknown fees/totals are null, **not zero**. Fee source is pickup/business_flat/geo_slab or null when unavailable. `ready=true` requires every mode/address/policy guard and every payable amount known. Pin Offers/Geo/Settings revisions in `pricingRevision`; money-bearing JSON is validated, not arbitrary JSONB.
- `CheckoutAttemptDTO={id,version,status,paymentRound,quoteId,failureCode?,payment:{status,exposure,handoff?},compensation?:{status,amountPaise,reasonCode?,rounds:[{paymentRound,quoteId,status,amountPaise}]},allowedActions,orders:[{id,businessId,mode,totalPaise,status}]}`. Compensation aggregates unresolved/completed obligations by round, including late extra capture after replacement placement. Handoff is provider-neutral/allow-listed; never codes, raw provider payloads or address text. Orders stay empty until the whole set commits; recovery alone is not success.
- Calls [Payments](../../payments/be/payments.md) `startOrderPayment`, `retryOrderPayment`, `requestCheckoutCompensation`, `closePaymentRound`; all include checkout ID, round and quote ID. Compensation is keyed to the checkout/payment round, **not an order**.
- Calls [Orders](../../orders/be/orders.md) `createPerShopOrders({checkoutAttemptId,paymentRound,quoteId,quoteSnapshot,paymentAllocations,addressRef:{id,version}?,creationKey},uow)`. Orders owns durable stock reservation/release records and invokes `ProductsStockPort`; Cart never decrements inventory.

## Rules and use-cases

1. Guest cart identity is a separate CSPRNG opaque `HttpOnly; Secure; SameSite=Lax` host-only cookie, persisted only as `guest_cart_token_hash`; it is not Auth's anonymous/login cookie and grants no authenticated access. Same-origin cart bootstrap establishes it without creating an empty cart row. Auth login rotates its own cookie/CSRF state without destroying this proof. After login, use the new CSRF token to merge only the cookie-bound guest cart by `(productId,variantId)` up to quantity 10, returning clipped/unavailable/selection-required lines for review (Q-70). Lock both carts; consume the guest binding and clear its cookie only after commit. A same-key retry reauthorizes the account-cart owner and returns the recorded result even after consumption; it cannot merge a second guest cart. Failure retains the guest cart. Login returns to `/checkout` (BR-21); all cart mutations increment revision/invalidate quotes. Cookie/row lifetime is explicit configuration, not browser storage or a guessed Q-70 retention policy.
2. No variants → `variantId:null`; a nonempty label set requires an active label belonging to the product. Never infer a base variant or per-variant stock/price. Aggregate all labels' quantities against shared product stock. Services remain enquiry-only; reject unknown DTO fields and client prices/fees/stock.
3. Reprice from Products and eligible Offers on every quote and final submission. Displayed prices include applicable configured tax; never add it again. Use [Orders' invoice/tax policy](../../orders/be/orders.md#invoice-and-tax-policy) to freeze supplier/tax and funding breakdowns. Coupon definitions and use accounting stay in Offers; sample campaigns are not production configuration.
4. Group active lines by shop. A placeable quote requires an exact delivery/pickup choice for each shop; cart estimates with missing mode/address return `ready=false`, never inferred free fulfilment. Pickup must be enabled. Delivery requires a customer-owned address, active city, Geo serviceability, shop radius/orderability and minimum. Compare minimum against shop subtotal before coupon allocation as the prototype does. Any unresolved shop issue blocks confirmation; customer may remove that shop or choose eligible pickup (J1).
   Product fulfilment applies to either approved business kind (F-PV-005). If `deliveryMethod=null` or required delivery settings are missing, delivery is unavailable; `pickupEnabled=false` forbids pickup. An unconfigured provider gets blocking mode issues, never free delivery, a default rider or automatic pickup. Provider fulfilment editor/defaults remain decision-gated in Businesses.
5. Confirmed fee precedence (`js2.js:15`, BR-01 formulas): pickup **zero**; delivery method `self` uses Business `deliveryFeePaise`; `apna_town_rider` uses `GeoDeliveryPort.quoteDeliveryFee({cityId,destination,origin})` zone/default slabs. Never add both. Delivery still needs serviceability/radius checks. Snapshot fee source/version; Q-69 no longer blocks this confirmed precedence. Platform fee is configured per shop order (`js6.js`); no production sample amount is assumed (Q-71).
6. Let S be eligible subtotal. Compute one coupon `D=min(computedDiscount,configuredCap if present,S)`, with `D=0` when S=0; never divide by zero. Allocate floors of `D*shopEligibleSubtotal/S`; remainder goes to largest eligible subtotal, business-ID tie-break, bounded by that shop's remaining subtotal capacity before proceeding to the next. Sum exactly D; each allocation ≤ eligible shop subtotal, no negative payable or dropped paise. Store deterministic per-line allocations for Orders (BR-19).
7. Confirmation claims customer + key + request hash and locks cart/attempt; same payload replays, changed payload conflicts. Both new-attempt creation and retry fence older **unplaced** attempts/rounds under that lock; a failed/expired enum alone cannot authorize a fresh charge while exposure is unresolved. Validate quote ownership/expiry, cart/line/address revisions and current price/stock/business/offer/Geo/Settings inputs before payment. A changed payable/input requires a new quote and explicit customer confirmation, never silent repricing.
8. Pin quote/round through handoff. Cart/address edits or expiry invalidate placement; callbacks cannot use newer inputs. Revalidate in the placement UoW. Positive cash allocations start pending; exact-zero allocations use [Payments' no-charge contract](../../payments/be/payments.md#zero-payable-order-settlement), never fake cash collection.
9. After verified funding of positive online allocations, authorized positive cash confirmation, or an entirely zero ready quote, lock/recheck and call Orders once. Stock, orders, coupon commitment, no-charge settlement, payment links, attempt placed, cart clearing and outbox commit atomically. Any shop failure rolls back all (Q-72). Zero allocations never create a provider request; codes remain Delivery-owned.
10. If capture is confirmed but placement fails (stock, eligibility, stale input, expiry or transaction failure), persist `compensating` and request Payments compensation for **every exposed allocation**, including zero-order attempts. The compensation record survives order rollback; a recovery worker detects verified funds without a committed order set after a crash. Unknown provider outcome → `reconciliation_required`, not “money safe” or a fresh charge.
11. Retry/cash fallback locks the attempt and closes/fences the old round through Payments before incrementing `paymentRound`. Allow only no exposure or completed compensation, never pending/unknown capture. No second active attempt may place the same cart. A late capture from any old/expired round is compensated independently; it cannot fund a newer round, mark COD paid, clear the cart or create another order set. If replacement orders already exist, keep placed status/IDs and expose the extra-charge recovery separately.
12. Clear only the pinned purchased line IDs/versions **inside the placement UoW**, increment cart version and invalidate quotes; expose the cleared cart only after commit. Never remove saved lines or later edits: a changed pinned cart blocks placement and triggers capture recovery, not partial clearing. Validation/payment/compensation failures preserve the cart. Browser return is advisory: owner-checked attempt GET is authoritative.

### Coupon policy gate

- Offers owns coupon creator/eligibility and moderation; Cart/Checkout owns quote and paise allocation. Service-enquiry coupons never enter this flow.
- Use [Offers' launch coupon policy](../../offers/be/offers.md#launch-coupon-and-offer-policy), which resolves Q-67. Coupon input requires login and one normalized code; invalid/inactive/exhausted/out-of-scope/service-only codes return `CHECKOUT_COUPON_INVALID` without existence/foreign usage details. Missing runtime configuration returns `CHECKOUT_COUPON_POLICY_UNAVAILABLE`; this is not an undecided product policy.
- Preview pricing claims no use. On attempt creation/retry, hold the cart/attempt lock, then call `OffersCouponPort.reserve` before requesting payment; on placement call `commit` in the Orders UoW. Release failed/fenced rounds via the port. `CheckoutCouponFencePort.expire({attemptId,paymentRound},uow)` is Offers' internal expiry-job entry: lock attempt, forbid that round's placement, then acquire coupon/redemption locks and release. Placed rounds are no-ops. All paths use attempt -> coupon -> redemption -> order/payment lock order; no network call occurs under locks.
- Quote expiry is 15 minutes from creation, shortened by the earliest price/offer/coupon boundary. Attempts cannot outlive their pinned quote for placement. If payment resolves after expiry, compensate; no client-controlled extension or reuse of a released coupon slot.
- Add to quote line/group snapshots `offerDiscountPaise,merchantCouponPaise,platformCouponPaise,taxSnapshot`; `discountPaise` is their sum, not an extra deduction. Group `couponDiscountPaise` is only coupon shares. Allocate coupon over post-offer eligible subtotals; allocate within a shop by line net with largest-subtotal/line-ID remainder order. Order gross minus all buyer discounts plus fees remains the sole amount charged.
- Acceptance: Given two customers race the final use/budget, when attempts reserve, then only one starts payment. Given a timeout, expiry or failed placement, when replayed, then no second claim/order is created and late funds are compensated. Given a mixed shop coupon, then quoted, charged and order shares agree to the paise.

## Events and jobs

- Consume `payment.succeeded`, `payment.failed`, `payment.late_capture_detected`, `payment.compensation_completed`, `payment.compensation_failed`. Match checkout ID **and** round/quote/allocation references; duplicate/out-of-order messages cannot regress placed/compensated state.
- Publish `checkout.orders_created {checkoutAttemptId,paymentRound,quoteId,orderIds}` only with successful placement. Emit `checkout.coupon_committed {checkoutAttemptId,paymentRound,quoteId,redemptionId,couponId,couponVersion,discountPaise,allocations:[{orderId,businessId,discountPaise}]}` in that same placement transaction, after Offers commits the usage claim. Stable source keys dedupe retries; consumers do not increment transactional usage again. Orders alone publishes **`order.created` per shop** for customer/vendor notification.
- Jobs: expire due quotes/attempts; reconcile pending payments/orphaned verified captures; retry compensation requests/outbox with bounded backoff. Expiry never discards a financial obligation. Terminal recovery failure stays visible on attempt GET for support; no fabricated order is created to obtain a refund.

## Privacy owner contract

Implement Users' `UserDataPort.exportPage({userId,cursor,limit})` for this user's cart/line and approved checkout-reference scope, never another owner's/guest's cart. `erase({userId,requestId,policyVersion}) -> {receipt,status:'completed'|'blocked',reasonCode?}` clears only that user's cart contents under approved policy; financially referenced attempts/quotes are retained/minimized only as permitted. Q-32 unknown policy or unfinished obligations returns blocked, not a successful no-op. No deletion cascade to Orders/Payments.

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
| `CHECKOUT_QUOTE_STALE` | 409 | `errors.checkout.quoteStale` |
| `CHECKOUT_COUPON_POLICY_UNAVAILABLE` | 409 | `errors.checkout.couponPolicyUnavailable` |
| `CHECKOUT_PAYMENT_UNAVAILABLE` | 409 | `errors.checkout.paymentUnavailable` |
| `CHECKOUT_RECONCILIATION_REQUIRED` | 409 | `errors.checkout.reconciliationRequired` |

Reuse `COMMON_UNAUTHENTICATED`, `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED`, `COMMON_MONEY_INVALID`, `CHECKOUT_COUPON_INVALID`. An unresolved offer-pricing policy is a blocking quote issue, not an accepted regular-price fallback.

## Acceptance criteria

1. Given lines from two shops, when checkout succeeds, then Orders creates exactly one order per shop with the selected mode and payment record (BR-03).
2. Given a line is over stock or unavailable, when quote/confirmation runs, then the server rejects it without trusting client totals or creating an order (BR-04).
3. Given delivery is out of Geo/shop range or below the delivery minimum, when confirming, then no order is created and the affected shop can be removed or switched to eligible pickup.
4. Given a valid coupon and multiple eligible shops, when quote is calculated, then per-shop discounts sum exactly to the capped checkout discount and rounding is deterministic (BR-19).
5. Given an address belongs to another user or an attempt belongs to another customer, when accessed, then the server denies it without exposing address/order data.
6. Given the same idempotency key and payload is retried, when the attempt is read, then the same payment/order result is returned once; a changed payload conflicts.
7. Given a provider reports failure, when the event is verified, then no order is created and cart is preserved; retry/enabled cash becomes available only after the prior round's exposure is resolved/fenced.
8. Given an authorized cash checkout is confirmed, when orders are created, then each payment remains `pending` until handover collection (ST-payment).
9. Given a variantless product and a labelled product, when added/merged/restored, then null identity works for the first, the second requires an active own label, and all labels contend for the same product inventory.
10. Given pickup, shop delivery and platform delivery groups, when quoted, then fees are respectively zero, the configured shop flat fee and Geo slab, with no double fee.
11. Given an oversized flat coupon, zero subtotal or equal-subtotal rounding ties, when allocated, then D ≤ S, allocations are deterministic/nonnegative and sum exactly D.
12. Given cart/address/price changes or quote expiry during payment, when capture arrives, then no order uses changed inputs and one pre-order compensation becomes observable.
13. Given one shop loses its last unit after capture or insertion crashes, when recovery runs, then no partial order set survives and all captured exposure is compensated/reconciled without an order FK.
14. Given retry, COD fallback and late success race, when the attempt lock/fence resolves them, then one placement wins, superseded capture is compensated, and COD stays pending until explicit collection.
15. Given an unapproved business, disabled payment flag or unsafe paise input, when confirmation/retry is forged, then no payment/stock/order side effect occurs.
16. Given an export/erase request with unknown policy or unfinished payment, when processed, then it returns a durable blocked receipt without deleting financial records or another cart.
17. Given an approved provider with `deliveryMethod=null,pickupEnabled=false`, when quoting or placing its products, then fulfilment is unavailable; no free/rider/pickup defaults or stock/payment side effects appear.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Given an unpersisted cart, when concurrent first adds use version 0, then one owner cart is created and the losing version conflicts; given login rotates Auth state, when guest merge succeeds or its response is lost, then the independent guest proof is consumed once and same-key retry cannot double quantities.
- Rules and manual API/DB checks map AC1–AC17 to grouping, null-variant identity, shared-stock aggregation, 1-paise/capped coupon allocation, fee precedence/unconfigured provider, revision validation, rollback, code-free projections and privacy receipts.
- Concurrency/fault injection: two checkouts/last unit across labels; duplicate callback/key; failure-before-success and success-before-failure; address deletion; mutation during payment; provider timeout/crash after capture; retry-vs-COD; recovery replay. Assert money conservation and no duplicate stock movement/order/coupon use.
- Negatives: anonymous placement; foreign line/address/quote/attempt; false flags/client totals; unknown/malicious filters/enum/oversized payload; unsafe JSON integers; foreign product variant. Verify flat error fields/redaction.

## Open questions

Q-62/Q-67 pricing/coupons are resolved in Offers. Q-01/Q-21 gateway topology, Q-70 guest retention, Q-71 configured fees and Q-73 compensation capability remain separate gates where not configured; Q-72 placement is specified above. Q-32 remains the privacy policy; no provider capability or retention period is assumed.
