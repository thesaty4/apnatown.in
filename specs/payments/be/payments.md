# BE: payments

Features: F-CK-006, F-CK-007, F-OR-006, F-VD-017 | Rules: BR-01, BR-02, BR-03, BR-20 | State machines: ST-payment, ST-refund | Depends on / used by: cart-checkout, orders, delivery, businesses, settings; `offers` consumes paid-promotion events. Cross-module access is through typed contracts/events only.

Frontend counterpart: [FE payments](../fe/payments.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own payment attempts, refund execution and vendor financial records. The module integrates through `PaymentProvider`; provider choice and checkout charge topology remain open. `cart-checkout` owns checkout orchestration and `orders` owns order/refund-request UI and order state.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `payment_attempts` | `id uuid PK`; `checkout_attempt_id uuid NULL FK checkout_attempts`; `order_id uuid NULL FK orders`; `business_id uuid NULL FK businesses`; `initiated_by uuid NOT NULL FK users`; `purpose text NOT NULL CHECK ('order','plan','promotion')`; `target_key text NULL` (plan or promotion key); `amount_paise bigint NOT NULL CHECK >= 0`; `method text NOT NULL CHECK ('upi','card','net_banking','wallet','cash')`; `status text NOT NULL CHECK ('pending','paid','failed','collected','refunded')`; `provider_key/provider_payment_ref text NULL`; `idempotency_key text NOT NULL`; `failure_code text NULL`; `version int NOT NULL DEFAULT 1`; timestamps. CHECK: order attempts require checkout and business IDs with null target; plan/promotion attempts require business and target keys with null checkout/order IDs; cash is order-only. UNIQUE `(initiated_by,idempotency_key,business_id)` allows one idempotent per-shop allocation in a checkout. Provider reference is not unique because Q-21 may produce one capture shared across allocations. | `(checkout_attempt_id)` joins a checkout's per-shop payment records; `(order_id,created_at DESC)` serves order payment history; `(business_id,created_at DESC)` serves business purchases; `(provider_key,provider_payment_ref)` resolves callbacks; unique initiator/key/business supports idempotent replay. |
| `refunds` | `id uuid PK`; `order_id uuid NOT NULL FK orders`; `payment_attempt_id uuid NOT NULL FK payment_attempts`; `requested_by uuid NOT NULL FK users`; `amount_paise bigint NOT NULL CHECK > 0`; `reason_key text NOT NULL`; `status text NOT NULL CHECK ('requested','approved','completed','declined','escalated')`; `approved_by uuid NULL FK users`; `provider_refund_ref text NULL`; `idempotency_key text NOT NULL`; `version int NOT NULL DEFAULT 1`; `requested_at timestamptz NOT NULL`; `processed_at timestamptz NULL`; UNIQUE `(requested_by,idempotency_key)`. Amount is server-derived from the order/refund decision, never client-supplied. | `(order_id,requested_at DESC,id DESC)` serves the order refund tracker; `(status,requested_at,id)` serves processing jobs; `(payment_attempt_id)` supports reconciliation; `(requested_by,requested_at DESC)` supports requester history. |
| `earnings` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `order_id uuid NULL FK orders`; `payment_attempt_id uuid NULL FK payment_attempts`; `entry_type text NOT NULL CHECK ('sale','commission','refund','payout','plan_purchase','promotion_purchase')`; `source_key text NULL`; `amount_paise bigint NOT NULL CHECK >= 0`; `gross_paise/commission_paise/net_paise bigint NULL CHECK >= 0`; `commission_rate_bps int NULL CHECK >= 0`; `settings_version text NULL`; `invoice_number text NULL UNIQUE`; `period_start/period_end timestamptz NULL`; `recorded_at timestamptz NOT NULL`. Immutable financial facts; don't soft-delete. | `(business_id,recorded_at DESC,id DESC)` serves the earnings ledger; `(business_id,period_start,entry_type)` serves monthly summaries; `(order_id)` and `(payment_attempt_id)` support source lookups; unique invoice number supports invoice lookup. |
| `business_subscriptions` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `plan_key text NOT NULL`; `source_payment_attempt_id uuid NULL FK payment_attempts`; `starts_at timestamptz NOT NULL`; `ends_at timestamptz NULL`; `created_at timestamptz NOT NULL`; CHECK `ends_at IS NULL OR ends_at > starts_at`; a row is inserted only when its configured effective period is known and the purchase is verified. | `(business_id,starts_at DESC,id DESC)` serves current/historical plan lookup; `(source_payment_attempt_id)` supports payment reconciliation. |

`business_subscriptions` is Payments-owned so billing state is not duplicated in `businesses`. Promotion placement is Offers-owned; Payments records the successful charge and publishes its purchase event. Order invoices remain Orders-owned.

## Endpoints and application contracts

| Method | Path / contract | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/payments/me/earnings` | Vendor; authenticated user must own the active business. No admin route. | Allow-listed `from`, `to`, `cursor`, `limit<=50` → ledger page and configured summary in paise. | `BUSINESS_NOT_FOUND`, `PAYMENT_RANGE_INVALID` | Yes | F-VD-017, S-VEND-16 |
| GET | `/payments/me/subscription` | Vendor; business ownership check. | → current plan and available configured plans; no provider credentials. | `BUSINESS_NOT_FOUND`, `PLAN_CONFIGURATION_UNAVAILABLE` | Yes | F-VD-017, S-VEND-16 |
| GET | `/payments/me/invoices` | Vendor; business ownership check. | `cursor`, `limit<=50` → invoice summaries only for this business. | `BUSINESS_NOT_FOUND` | Yes | F-VD-017, S-VEND-16 |
| POST | `/payments/me/plan-purchases` | Approved vendor; business ownership check; no city admin privilege substitutes for ownership. | `{planKey}` + `Idempotency-Key` → pending handoff; plan applies only after verified success. | `PLAN_NOT_AVAILABLE`, `PAYMENT_ATTEMPT_CONFLICT` | Required | F-VD-017 |
| POST | `/payments/me/promotion-purchases` | Approved vendor; business ownership check. | `{promotionKey}` + `Idempotency-Key` → pending handoff; successful payment emits an Offers-owned activation event. | `PROMOTION_NOT_AVAILABLE`, `PAYMENT_ATTEMPT_CONFLICT` | Required | F-VD-017 |
| POST | `/webhooks/payments/{providerKey}` | Provider adapter signature verification; no browser/session auth. | Raw provider payload → accepted event only after signature and schema checks. | `PAYMENT_PROVIDER_INVALID`, `PAYMENT_EVENT_INVALID` | Provider event ID dedupe | F-CK-006, F-CK-007 |
| Internal | `startOrderPayment`, `retryOrderPayment`, `recordCashCollection` | Typed application contract called by `cart-checkout`/`orders`/`delivery`; caller identity and source event are verified. | Checkout/order reference, method or collection event → attempt status/handoff. | `PAYMENT_ATTEMPT_CONFLICT`, `PAYMENT_STATE_INVALID` | Required | F-CK-006, F-CK-007, F-OR-006 |
| Internal | `requestRefund`, `approveRefund` events | Orders-owned refund workflow; Payments consumes signed/transactional outbox events, not direct order-table access. | Order/refund reference and server-derived amount → refund status and provider operation. | `REFUND_NOT_FOUND`, `REFUND_AMOUNT_INVALID`, `REFUND_STATE_INVALID` | Event ID + refund idempotency | F-OR-006 |

Checkout's customer routes, retries and payment selection remain in the [Cart/Checkout BE contract](../../cart-checkout/be/cart-checkout.md). Refund request and decision UI/routes remain Orders-owned; this module exposes no parallel customer refund endpoint.

## Rules and use-cases

1. Compute payable amounts from the checkout quote or configured plan/promotion price. Accept only identifiers/methods, never client prices, commission, payout or refund amounts (BR-01).
2. Keep ST-payment exact: `pending -> paid|failed`; failed retries return to pending; cash/pay-at-pickup is `pending -> collected`; `paid|collected -> refunded`. A browser redirect is not proof of payment.
3. Keep one per-shop payment record for every order (BR-03). Group attempts by checkout idempotency key; allow a shared provider reference only as required by Q-21. The payment result is applied once and checkout creates orders only after verified success.
4. Verify webhook signatures before parsing business data; deduplicate provider event IDs and validate provider/attempt/amount/currency against the stored request. Never log raw payloads, credentials or full payment details.
5. Refund transitions are exactly ST-refund: `requested -> approved -> completed` or `requested -> declined -> escalated`. Only an Orders-owned, authorized decision event may approve; provider retries remain bounded and idempotent. Reject any cumulative refund above captured/collected amount. Partial-refund payment status semantics remain Q-76; don't invent a `partially_refunded` state.
6. Emit the refund/payment events through the transactional outbox. Orders/Notifications handle the BR-20 customer/admin/vendor notices; Payments does not send duplicate notices.
7. Cash remains pending until verified handover/collection. Collection confirmation is idempotent and cannot be inferred from order placement.
8. Use only currently configured plans, promotions and rates from Settings; sample/default amounts in the prototype are not production prices. Apply a subscription only after confirmed payment and known configured period; auto-renewal, proration and promotion activation are Q-74.
9. Build vendor financial summaries only from immutable Payments ledger entries and approved settings snapshots; use shared paise rounding and UTC instants (BR-01/02). Do not synthesize next-payout dates, commission/tax invoices or settled amounts while policies are unresolved (Q-06/Q-75).
10. Resolve the vendor from the authenticated session on every read/write. A vendor cannot read another business by changing an ID. Admin financial access is not exposed here; any future admin action needs role + assigned city/area + module permission and audit logging (BR-12).

## Events and jobs

- Consumes: `refund.requested`, `refund.approved`, verified `cash.collected`, and order financial-settlement events. Checkout uses the `startOrderPayment`/`retryOrderPayment` application contract.
- Publishes: `payment.succeeded`, `payment.failed`, `refund.completed`, `business.plan.purchased`, and `business.promotion.purchased`.
- Jobs: provider payment/refund calls, webhook reconciliation and bounded retry. Use outbox/inbox idempotency; permanent failures surface for scoped support review without exposing payment secrets.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `PAYMENT_ATTEMPT_CONFLICT` | 409 | `errors.payment.attemptConflict` |
| `PAYMENT_STATE_INVALID` | 409 | `errors.payment.stateInvalid` |
| `PAYMENT_PROVIDER_INVALID` | 401 | `errors.payment.providerInvalid` |
| `PAYMENT_EVENT_INVALID` | 422 | `errors.payment.eventInvalid` |
| `REFUND_NOT_FOUND` | 404 | `errors.refund.notFound` |
| `REFUND_AMOUNT_INVALID` | 422 | `errors.refund.amountInvalid` |
| `REFUND_STATE_INVALID` | 409 | `errors.refund.stateInvalid` |
| `PLAN_NOT_AVAILABLE` | 422 | `errors.payment.planUnavailable` |
| `PROMOTION_NOT_AVAILABLE` | 422 | `errors.payment.promotionUnavailable` |
| `PAYMENT_RANGE_INVALID` | 422 | `errors.payment.rangeInvalid` |

Reuse shared `AUTH_REQUIRED`, `FORBIDDEN` and `BUSINESS_NOT_FOUND`; response envelope follows the shared backend contract.

## Acceptance criteria

1. Given a multi-shop checkout, when Payments confirms every required online allocation, then checkout receives one idempotent success result and Orders creates one payment record per shop.
2. Given the provider redirects the browser but no valid signed success event exists, when checkout refreshes, then the attempt remains pending and no order is reported as paid.
3. Given the same webhook is delivered twice, when the second delivery is processed, then payment/order events and ledger entries are not duplicated.
4. Given a webhook signature, amount, currency or attempt reference is invalid, when received, then it is rejected and no payment state changes.
5. Given an authorized cash order, when handover is confirmed, then its payment changes from pending to collected exactly once; order placement alone does not collect it.
6. Given a refund amount exceeds the remaining captured amount, when Orders requests it, then Payments rejects it without calling the provider.
7. Given a vendor requests another business's earnings or starts a purchase for it, when the business ID is altered, then the request is denied without disclosing that business's records.
8. Given an unconfigured plan, promotion, commission or settlement rule, when the vendor opens Earnings or starts a purchase, then no sample value or success-shaped fallback is shown.
9. Given an authorized, configured plan purchase and a verified successful payment, when the event is applied, then the subscription period starts only once and the effective plan is returned from the subscription record.

## Tests

- Unit: exact ST-payment/ST-refund transitions, integer-paise caps, current plan lookup, event deduplication and immutable ledger insertion.
- Integration: provider fake success/failure/timeout, signed webhook verification, checkout event replay, cash collection, refund retries and ledger queries with keyset pagination.
- Authorization negatives: wrong role, non-owner vendor, cross-business record identifier, inactive/unapproved business purchase, invalid internal event identity; assert 403/404 and no leaked records.
- Concurrency: duplicate webhook/refund event and simultaneous refund requests cannot exceed the remaining captured amount or create duplicate entries.
- Security: signatures checked before mutation; credentials/payment details excluded from logs and responses; plan/promotion keys allow-listed.

## Open questions

Q-01/Q-21: provider and multi-shop capture topology; Q-06: commission/invoice/GST rules; Q-07/Q-08: refund policy/SLA; Q-17: refund approver and guards; Q-33: saved methods; Q-74–Q-76: plan/promotion lifecycle, payout policy and partial-refund semantics.
