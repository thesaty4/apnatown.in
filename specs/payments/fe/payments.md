# FE: payments

Features: F-CK-006, F-CK-007, F-OR-006, F-VD-017 | Screens: S-CUST-11, S-CUST-14, S-CUST-15, S-VEND-16 | Flows: J1

Backend contract: [BE payments](../be/payments.md) · Checkout selection/retry stays in the Cart/Checkout screen; order/refund request UI stays in Orders.

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/vendor/earnings` | S-VEND-16 | SSR shell and owner-scoped initial read; client island only for plan/promotion payment handoffs | Approved vendor; own business | `noindex` |
| `/checkout` | S-CUST-11 | Owned by Cart/Checkout; renders payment methods, pending/failure and retry from its contract | Customer | `noindex` |
| `/orders/:id` and `/orders/:id/refund` | S-CUST-14, S-CUST-15 | Owned by Orders; reflects the payment/refund status supplied by the owning APIs | Customer; order owner | `noindex` |

## Screens

### S-VEND-16 — Earnings and plan (`/vendor/earnings`)

- Screenshots: `d-vendor-vearn.jpg`, `m-vendor-vearn.jpg`.
- Layout: monthly gross, commission and next-payout summary; six-month chart; current/available subscription plans; promotion purchase rows; invoices. Desktop uses the prototype's multi-column cards; mobile stacks cards and turns invoice rows into labelled entries.
- Data: `GET /payments/me/earnings`, `GET /payments/me/subscription`, `GET /payments/me/invoices`; `POST /payments/me/plan-purchases` and `/payments/me/promotion-purchases` from [BE payments](../be/payments.md). No client cache may cross business accounts.
- Special states: no posted ledger entries; unavailable/unconfigured plan or payout policy; purchase pending verification; failed payment with retry; invoices empty; business no-permission.
- Interactions: switch plan / buy promotion starts a server-priced, idempotent payment; keep the current plan/placement until verified success. Do not optimistically mark a plan active, promotion live, invoice paid or payout scheduled. Keyboard users can activate cards/buttons with Enter/Space; dialogs/sheets close on Esc and restore focus.
- Rules: F-VD-017, BR-01/02/12/22 and ST-payment. The prototype's sample amounts, chart values, plan rates, promotion duration and invoice rows are not production data. Display currency/date using shared paise/IST formatters; do not fabricate a next-payout date.
- Acceptance:
  - Given a vendor owns an approved business with configured financial records, when Earnings loads, then totals and chart use only that business's server ledger and display INR values with localized labels.
  - Given plans or settlement policy are not configured, when the page loads, then it shows an explicit unavailable state rather than prototype sample prices or a fabricated payout.
  - Given the vendor starts a plan or promotion purchase, when provider verification is pending or fails, then the current plan/placement remains unchanged and the localized pending/error state is actionable.
  - Given another vendor's identifier is supplied or the signed-in role is not vendor, when the route/data loads, then no financial data is disclosed and the no-permission state is shown.
  - Given Hindi or dark theme is active, when chart labels, amounts and invoice rows render, then labels wrap, status uses icon+text+color, and token styling matches the prototype.

### Checkout payment and order refund states

- Screens: S-CUST-11, S-CUST-14, S-CUST-15 are specified by their owning Checkout/Orders screens; Payments adds no duplicate route or form.
- Contract: reflect server-confirmed `pending`, `paid`, `failed`, `collected`, `refunded` and ST-refund states. Browser return from a gateway is never success. Preserve the existing failure copy from `09-content-and-i18n.md`; the Orders screen owns refund request reason, window and notification copy.
- Acceptance: failure offers retry or enabled cash fallback; pending never appears as placed/paid; refund tracker reflects the server state and never claims provider completion before confirmation.

## Standard states, components and i18n

- Apply the shared default, skeleton, empty, error+retry, no-permission and offline components from `frontend-shared.md`.
- Feature-local: `EarningsSummary`, `EarningsChart`, `PlanCard`, `InvoiceList`; reuse shared `Button`, `Card`, `Badge`, `Table`, `Dialog`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `OfflineBanner`.
- Keys: `payments.earnings.*`, `payments.plan.*`, `payments.promotion.*`, `payments.invoice.*`, `payments.state.*`; EN/HI required. Format money from integer paise; check long Hindi labels at 360px and desktop.
- Analytics: `payments.earnings_view`, `payments.plan_purchase_start`, `payments.promotion_purchase_start`, `payments.purchase_result`; never include payment credentials, provider payloads, bank/UPI details or phone.

## Tests

- Component: configured/unconfigured summary, ledger empty/error, pending/failed purchase without optimistic activation, invoice rows, keyboard/dialog operation, Hindi and dark mode.
- Journey: J1 payment failure then retry or enabled cash fallback; vendor owner views S-VEND-16 and completes a configured purchase only after the verified-success response.
- Visual: `d-vendor-vearn.jpg` and `m-vendor-vearn.jpg`, 360px/mobile and desktop, light/dark, EN/HI. Never compare against seeded invoice amounts as live data.

## Open questions

Q-01/Q-21, Q-06–Q-08, Q-17, Q-33 and Q-74–Q-76 remain open; see [BE payments](../be/payments.md) and the open-issues register.
