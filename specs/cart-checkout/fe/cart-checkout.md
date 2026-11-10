# FE: cart-checkout

Features: F-CK-001, F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-008, F-CK-009 | Screens: S-CUST-10, S-CUST-11, S-CUST-12, S-CUST-26 (address owner: Users) | Flows: J1, J12

Backend contract: [BE cart-checkout](../be/cart-checkout.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/cart` | S-CUST-10 | SSR page shell; cart data/actions in a client island | Guest or customer | `noindex` |
| `/checkout` | S-CUST-11 | SSR session gate and initial quote; interactive checkout client island | Customer; guest returns through OTP login | `noindex` |
| `/checkout/success?attemptId={id}` | S-CUST-12 | SSR owner-checked attempt summary | Customer who owns the attempt | `noindex` |
| `/account/addresses` | S-CUST-26 | Owned and specified by Users; checkout links to it for add/edit | Customer | `noindex` |

Use the shared standard UX states from [frontend-shared.md](../../_foundation/frontend-shared.md); private routes never enter public caches. Price data is server-confirmed and refreshed after every cart, address, mode, coupon or payment-method change.

## Screens

### S-CUST-10 — Cart (`/cart`)

- Screenshots: `d-customer-cart.jpg`, `m-customer-cart.jpg`.
- Layout: business-grouped product lines; desktop two-column cart/summary, mobile stacked groups with a clear checkout action.
- Data: `GET /cart`; line add/update/remove/save/restore and `POST /cart/quote` from the [BE spec](../be/cart-checkout.md).
- Special states: empty cart; below delivery minimum; invalid coupon; saved-for-later list; a shop unavailable or outside delivery range.
- Interactions: quantity stepper (min 1, max 10/current stock), save for later, restore, remove, coupon apply, proceed to checkout. Enter applies the coupon; stepper buttons have accessible labels.
- Rules: F-CK-001/F-CK-009, BR-01/17/19. Show GST as included; delivery appears at checkout. Never show client-calculated totals as final.
- Acceptance:
  - Given no active lines, when the cart opens, then the localized empty state links to shopping.
  - Given a customer changes quantity or saves/removes a line, when the server confirms, then grouped totals refresh without exceeding stock or quantity limits.
  - Given a coupon is invalid or below minimum, when applied, then the cart remains unchanged and shows a localized error.
  - Given a guest proceeds to checkout, when OTP login succeeds, then the app calls `POST /cart/merge-guest`, shows any clipped/unavailable lines for review, and returns to checkout (J12/Q-70).

### S-CUST-11 — Checkout (`/checkout`)

- Screenshots: `d-customer-checkout.jpg`, `m-customer-checkout.jpg`.
- Layout: address selection, one section per shop, per-shop delivery/pickup radio controls, item/fee breakdown, payment methods and total; sticky order action on mobile and desktop summary column.
- Data: `POST /cart/quote`, Users address read contract, `POST /checkout/attempts`, `GET /checkout/attempts/{attemptId}`, retry endpoint. The browser never supplies payable totals or trusts a payment redirect as confirmation.
- Special states: login required; no saved address; out of delivery range; minimum not met; pickup unavailable; shop/stock changed; processing; payment failed with retry or enabled cash fallback.
- Interactions: choose/change saved address; add/edit opens Users' `/account/addresses`; map selection has keyboard/form alternative. Select delivery or pickup independently per shop. Select UPI/card/net banking/wallet/cash once for checkout; cash is labelled by each shop's mode. Payment failure offers retry or cash only when enabled. Prevent duplicate submit while pending; Esc/back never reports success.
- Rules: F-CK-002–007/F-CK-009; BR-01/03/04/17/19/21; ST-payment. Any shop issue blocks confirmation until corrected or removed. Geo computes fee; shop minimum/radius and pickup availability come from Businesses. Q-69/Q-71 remain open.
- Acceptance:
  - Given two eligible shops, when checkout loads, then each has its own mode choice and the total explains the number of resulting orders.
  - Given an address is outside a shop's range or a delivery minimum is unmet, when the quote refreshes, then the issue is labelled and self-pickup is offered only if enabled.
  - Given Hindi or dark theme is active, when shop names, address details and fee rows render, then long text wraps and status is conveyed by text/icon as well as color.
  - Given the customer is offline, has no permission/session, or the server rejects a stale quote, when submitting, then no success state appears and retry/correction is actionable.
  - Given a payment redirect returns, when Payments has not verified success, then checkout remains pending and does not show orders as placed.

### S-CUST-12 — Order placed (`/checkout/success`)

- Screenshots: `d-customer-done.jpg`, `m-customer-done.jpg`.
- Layout: success state and one order card per shop with shop name, order ID, mode, amount and track link.
- Data: `GET /checkout/attempts/{attemptId}`; show only orders owned by the authenticated customer. Do not expose delivery OTP or pickup code in this response/screen; Orders/Delivery deliver codes through their approved channel.
- Special states: attempt still processing; attempt not found/not owned; no recent order.
- Interactions: track each order separately; continue shopping. Back/refresh re-reads the owner-checked attempt and cannot create orders.
- Rules: F-CK-008, BR-03/05; per-shop status/transition details belong to Orders/Delivery.
- Acceptance:
  - Given a placed attempt spans multiple shops, when success renders, then each shop has its own order ID, summary and track link.
  - Given the attempt is pending or failed, when the route loads, then it never displays a success confirmation.
  - Given another customer's attempt ID is supplied, when the page loads, then no order or address details are disclosed.

## Feature components and shared components

- Feature-local: `CartGroup`, `CartLineItem`, `CheckoutShopSection`, `CouponEntry`, `CheckoutSummary`, `OrderConfirmation`.
- Shared: `Button`, `Input`, `QuantityStepper`, `Checkbox / Radio`, `AddressCard`, `Sheet`, `Toast`, `EmptyState`, `ErrorState`, `Skeleton`, `OfflineBanner`, `SuccessState`, `AppShell`.
- Address management and map picker are Users-owned; do not fork their form or address API.

## i18n and analytics

- Key prefixes: `cart.*`, `checkout.*`, `checkout.payment.*`, `checkout.validation.*`, `checkout.success.*`; provide EN/HI for fee labels, pickup/delivery, coupon results, errors and payment states. Check long Hindi in responsive cards and dialogs.
- Analytics: `cart.view`, `cart.line_update`, `cart.coupon_apply`, `checkout.start`, `checkout.mode_select`, `checkout.payment_select`, `checkout.submit`, `checkout.payment_result`, `checkout.success_view`. Never send raw address, coupon code, payment credentials, phone or OTP.

## Tests

- Component: grouped cart, quantity boundaries, coupon errors, per-shop modes, address selection, failure/retry/cash fallback, pending-vs-success guard, long Hindi, dark mode and offline state.
- Journey: J1 two-shop checkout through success/tracking; J12 login gate returning to checkout; payment failure followed by retry or enabled cash fallback.
- Visual: required desktop/mobile screenshots in light and dark, English and Hindi; compare with the named prototype screenshots.
