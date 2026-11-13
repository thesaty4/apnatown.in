# FE: cart-checkout

Features: F-CK-001, F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-008, F-CK-009 | Screens: S-CUST-10, S-CUST-11, S-CUST-12, S-CUST-26 (address owner: Users) | Flows: J1, J12

Backend contract: [BE cart-checkout](../be/cart-checkout.md) · [Feature inventory](../../../docs/design-context/01-feature-inventory.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/cart` | S-CUST-10 | SSR page shell; cart data/actions in a client island | Guest or customer | `noindex` |
| `/checkout` | S-CUST-11 | SSR session gate and initial quote; interactive checkout client island | Customer; guest returns through OTP login | `noindex` |
| `/checkout/success?attemptId={id}` | S-CUST-12 | SSR owner-checked attempt summary | Customer who owns the attempt | `noindex` |
| `/account/addresses` | S-CUST-26 | Owned and specified by Users; checkout links to it for add/edit | Customer | `noindex` |

Use [frontend-shared.md](../../_foundation/frontend-shared.md) states; private routes never enter public/service-worker caches. Flat errors are read as `code/message_key/status/details/correlationId`. Money is safe-integer paise JSON, not numeric strings or rupee floats. Refresh server quotes after input changes; never reuse an old quote ID with changed cart/address inputs.

## Screens

### S-CUST-10 — Cart (`/cart`)

- Screenshots: `d-customer-cart.jpg`, `m-customer-cart.jpg`.
- Layout: business-grouped product lines; desktop two-column cart/summary, mobile stacked groups with a clear checkout action.
- Data: `CartDTO` from `GET /cart`; mutations send cart/line versions. Add uses `{productId,variantId:null|uuid,quantity,expectedCartVersion}`; no synthetic base-variant ID. Catalog actions/reorder use this same contract.
- Special states: empty cart; unconfigured pricing; coupon unavailable/exhausted or quote expired; saved lines; unavailable shop; label removed/selection required; shared product stock exhausted.
- Interactions: quantity stepper (1–10/current stock), save/restore/remove, coupon Apply and proceed. Variant labels share product stock; a product without labels has no empty selector, while a nonempty label set requires an active selection. Enter applies coupon; local input retains focus on validation/refetch.
- Rules: F-CK-001/F-CK-009, BR-01/17/19. Show GST as included; delivery appears at checkout. Never show client-calculated totals as final.
- Acceptance:
  - Given no active lines, when the cart opens, then the localized empty state links to shopping.
  - Given a customer changes quantity or saves/removes a line, when the server confirms, then grouped totals refresh without exceeding stock or quantity limits.
  - Given a logged-in customer enters a coupon, when quote refreshes, then one code's server-computed eligible shares are shown after item offers. Invalid/inactive/exhausted/service-only codes use the same unavailable message without foreign details; a guest first receives the login/return gate.
  - Given a guest proceeds to checkout, when OTP login rotates Auth's cookie, then the independent HttpOnly guest-cart proof survives; the app refreshes CSRF, calls `POST /cart/merge-guest`, shows clipped/unavailable lines for review, and returns to checkout (J12/Q-70). Failed/lost merge responses retry the same key without discarding the guest cart or duplicating quantities.
  - Given a variantless product and two labels of another product, when added/saved/restored, then line keys remain product + nullable variant and server stock conflicts do not create phantom base variants or label-specific stock.
  - Given a coupon exceeds its cap or some shops are ineligible, then UI renders capped server shares only and never reallocates discounts locally. Applying another code replaces, never stacks with, the existing coupon; removal requests a new quote.

### S-CUST-11 — Checkout (`/checkout`)

- Screenshots: `d-customer-checkout.jpg`, `m-customer-checkout.jpg`.
- Layout: address selection, one section per shop, per-shop delivery/pickup radio controls, item/fee breakdown, payment methods and total; sticky order action on mobile and desktop summary column.
- Data: `CheckoutQuoteDTO` from `/cart/quote` + Users address/version; submit `{quoteId,expectedCartVersion,expectedAddressVersion?,paymentMethod}`. Observe `CheckoutAttemptDTO` with owner GET polling after browser return/reconnect; retry sends `{quoteId,paymentMethod,expectedVersion}` and a new operation key only when allowed.
- Special states: login/no address/range/minimum/pickup issues; stale quote/cart/address; disabled method; verified failure; pending/unknown result; captured-but-unplaced `compensating`, `compensated`, `reconciliation_required`.
- Render `ready=false`, per-mode availability/reasons and unknown null fees/totals explicitly; no confirmation CTA or ₹0 “free delivery” placeholder until the server supplies a fully executable quote.
- Interactions: address management remains Users-owned; map has keyboard/form alternative. Choose mode per shop and payment once. Preserve attempt ID through navigation/reload, not credentials. While processing, show the pinned quote; editing inputs requires explicit re-review and cannot amend that attempt's charged inputs. Lost responses retry the same key/payload or read status, not create another attempt.
- Rules: F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-009; BR-01, BR-03, BR-04, BR-17, BR-19, BR-21; ST-payment. Explain fee source: shop flat delivery / ApnaTown slab / zero pickup. Read available methods and `allowedActions` from server; approval and payment flags are rechecked there.
- Financial recovery: Retry/cash fallback is disabled during pending/unknown capture or compensation. New quote/amount requires confirmation; no silent changed-address retry. Captured/unplaced shows recovery status and support, not “No money was taken”, placed orders or an invented refund ETA. Esc/back never confirms/cancels a provider charge.
- An exact-zero ready quote shows “No payment due” and Place order, omits payment-method selection/submission and never opens a gateway. Unknown totals are not zero. Mixed checkouts show no-charge shops separately and select a method only for positive allocations. Server zero settlement and the entire order set must commit before success; retry cannot consume a coupon twice.
- Coupon reservation occurs only on submission, not typing/preview. Show server quote expiry and require re-review after expiry/price changes. Explain that cancelled/refunded placed orders do not restore the coupon use. Show platform-funded discount separately from merchant discount while charging only server customer-payable total; missing supplier tax setup is an unavailable-item reason, never guessed zero GST.
- Acceptance:
  - Given two eligible shops, when checkout loads, then each has its own mode choice and the total explains the number of resulting orders.
  - Given an address is outside a shop's range or a delivery minimum is unmet, when the quote refreshes, then the issue is labelled and self-pickup is offered only if enabled.
  - Given a provider's product fulfilment is unconfigured, when its quote loads, then neither free delivery/default rider nor disabled pickup is preselected; the blocking mode issue offers correction/removal, not a payment CTA.
  - Given Hindi or dark theme is active, when shop names, address details and fee rows render, then long text wraps and status is conveyed by text/icon as well as color.
  - Given the customer is offline, has no permission/session, or the server rejects a stale quote, when submitting, then no success state appears and retry/correction is actionable.
  - Given a payment redirect returns, when Payments has not verified success, then checkout remains pending and does not show orders as placed.
  - Given cart/address edits, expiry or stock loss during payment, when capture is confirmed, then the app shows compensation/reconciliation without a fabricated order ID and keeps the cart for correction.
  - Given retry and cash fallback are tapped in two tabs, when only one server round wins, then both converge on its authoritative result and late old success never changes cash to paid.
  - Given the result is unknown or a payment flag is disabled, when the failure panel renders, then disallowed actions stay disabled with EN/HI explanation; refreshing cannot bypass the gate.

### S-CUST-12 — Order placed (`/checkout/success`)

- Screenshots: `d-customer-done.jpg`, `m-customer-done.jpg`.
- Layout: success state and one order card per shop with shop name, order ID, mode, amount and track link; a link opens the single non-tax checkout summary for the placed attempt.
- Data: `GET /checkout/attempts/{attemptId}`; show only orders owned by the authenticated customer. Do not expose delivery OTP or pickup code in this response/screen; Orders/Delivery deliver codes through their approved channel.
- Special states: pending/failed/expired/compensating/reconciliation attempt; not found/not owned; no recent order. Only `status='placed'` with committed per-shop IDs renders success.
- If an old-round late charge needs recovery after the replacement placed, show its separate compensation state alongside the real order cards; do not erase those orders or label the extra charge as their payment.
- Interactions: track each order separately; continue shopping. Back/refresh re-reads the owner-checked attempt and cannot create orders.
- Rules: F-CK-008, BR-03/05; per-shop status/transition details belong to Orders/Delivery.
- Acceptance:
  - Given a placed attempt spans multiple shops, when success renders, then each shop has its own order ID, summary and track link, plus one customer-owned master checkout-summary link; the summary links each shop's own legal invoice when available.
  - Given the attempt is pending or failed, when the route loads, then it never displays a success confirmation.
  - Given another customer's attempt ID is supplied, when the page loads, then no order or address details are disclosed.

## Feature components and shared components

- Feature-local: `CartGroup`, `CartLineItem`, `CheckoutShopSection`, `CouponEntry`, `CheckoutSummary`, `OrderConfirmation`.
- Shared: `Button`, `Input`, `QuantityStepper`, `Checkbox / Radio`, `AddressCard`, `Sheet`, `Toast`, `EmptyState`, `ErrorState`, `Skeleton`, `OfflineBanner`, `SuccessState`, `AppShell`.
- Address management and map picker are Users-owned; do not fork their form or address API.

## i18n and analytics

- Key prefixes: `cart.*`, `checkout.*`, `checkout.payment.*`, `checkout.validation.*`, `checkout.success.*`; provide EN/HI for fee labels, pickup/delivery, coupon results, errors and payment states. Check long Hindi in responsive cards and dialogs.
- Analytics: `cart.view`, `cart.line_update`, `cart.coupon_apply`, `checkout.start`, `checkout.mode_select`, `checkout.payment_select`, `checkout.submit`, `checkout.payment_result`, `checkout.success_view`. Never send raw address, coupon code, payment credentials, phone or OTP.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Manual UI: grouped cart, quantity boundaries, coupon policy-unavailable state, per-shop modes, address selection, failure/retry/cash fallback, pending-vs-success guard, long Hindi, dark mode and offline state.
- Journey: J1 two-shop checkout through success/tracking; J12 login gate returning to checkout; payment failure followed by retry or enabled cash fallback.
- Visual: required desktop/mobile screenshots in light and dark, English and Hindi; compare with the named prototype screenshots.
- Map all acceptance bullets to scenarios: null/required variant identity, shared stock errors, fee-source labels, finite/capped coupon shares, no code enumeration, reservation expiry, stale quote/address during provider handoff, timeout/reload/late success, blocked COD race and compensation without an order.
- Negatives/a11y: foreign attempt/address, expired session, malicious product/coupon text rendered safely, offline submit, duplicate submit, accessibility inspection, keyboard payment radios/stepper/dialog focus, Hindi at 360px, dark/reduced-motion states. Never cache or log addresses, codes, handoff secrets or raw provider payloads.
