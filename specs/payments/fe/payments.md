# FE: payments

Features: F-CK-006, F-CK-007, F-OR-006, F-VD-017, F-PV-008, F-AC-001 (gated integration) | Screens: S-CUST-11, S-CUST-14, S-CUST-15, S-CUST-24, S-VEND-16, S-PROV-18 | Flows: J1, J15

Backend contract: [BE payments](../be/payments.md) · [Checkout](../../cart-checkout/fe/cart-checkout.md) owns customer selection/retry; [Orders](../../orders/fe/orders.md) owns refund requests/decisions. Use flat foundation errors and safe-integer paise JSON; do not parse numeric strings/float rupees or nested error envelopes.

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/vendor/earnings` | S-VEND-16 | SSR shell and owner-scoped initial read; client island only for plan/promotion payment handoffs | Approved vendor; own business | `noindex` |
| `/provider/billing` | S-PROV-18 | SSR shell and owner-scoped initial read; reuse subscription components from S-VEND-16; client island only for plan purchase/cancellation handoffs | Approved provider; own business | `noindex` |
| `/checkout` | S-CUST-11 | Owned by Cart/Checkout; renders payment methods, pending/failure and retry from its contract | Customer | `noindex` |
| `/orders/:id` and `/orders/:id/refund` | S-CUST-14, S-CUST-15 | Owned by Orders; reflects the payment/refund status supplied by the owning APIs | Customer; order owner | `noindex` |

## Screens

### S-VEND-16 — Earnings and plan (`/vendor/earnings`)

- Screenshots: `d-vendor-vearn.jpg`, `m-vendor-vearn.jpg`.
- Layout: monthly gross, commission and next-payout summary; six-month chart; current/available subscription plans; promotion purchase rows; invoices. Desktop uses the prototype's multi-column cards; mobile stacks cards and turns invoice rows into labelled entries.
- Data: `/payments/me/earnings` (`EarningsDTO` with summary, six-month chart and paginated ledger), `/subscription`, `/promotions`, `/invoices`; create purchases, GET `/payments/me/purchases` / `/{purchaseId}`, and POST `/{purchaseId}/retry`. Observe with owner-scoped polling while pending; restore selected purchase via `?purchaseId=` on reload. No cache crosses accounts.
- Special states: available zero ledger vs policy-unavailable null amounts; absent next-payout schedule; missing price/period/activation configuration; provider verification pending; failure with permitted retry; reconciliation required; charge succeeded but placement blocked; invoice policy unavailable vs genuine empty issued list.
- Interactions: Switch/Buy uses a server-priced key and current approved-business/payment-flag eligibility. Promotion sends prepared placement ID, not arbitrary business/banner/price. Reuse the same key after a lost response; a permitted retry uses the versioned retry endpoint, never a new purchase to bypass pending capture. A changed price/period requires re-review. Polling/browser return does not prove success.
- Activation: plan changes only after verified subscription application; promotion state comes from Offers. Render paid-but-not-live distinctly with its blocked reason; never start a duration locally, create an invoice number or promise a payout. Disabled flags/approval/content/policy explain why Buy is unavailable.
- Accessibility: cards/buttons work with Enter/Space; chart has a text table, not a color-only tooltip; dialogs close on Esc and restore focus. Date ranges use server IST period boundaries.
- Rules: F-VD-017, BR-01/02/12/22 and ST-payment. The prototype's sample amounts, chart values, plan rates, promotion duration and invoice rows are not production data. Display currency/date using shared paise/IST formatters; do not fabricate a next-payout date.
- Acceptance:
  - Given a vendor owns an approved business with configured financial records, when Earnings loads, then totals and chart use only that business's server ledger and display INR values with localized labels.
  - Given plans or settlement policy are not configured, when the page loads, then it shows an explicit unavailable state rather than prototype sample prices or a fabricated payout.
  - Given the vendor starts a plan or promotion purchase, when provider verification is pending or fails, then the current plan/placement remains unchanged and the localized pending/error state is actionable.
  - Given another vendor's identifier is supplied or the signed-in role is not vendor, when the route/data loads, then no financial data is disclosed and the no-permission state is shown.
  - Given Hindi or dark theme is active, when chart labels, amounts and invoice rows render, then labels wrap, status uses icon+text+color, and token styling matches the prototype.
  - Given a pending purchase is reloaded or a provider callback arrives late, when status refreshes, then the original purchase is restored and no second charge/period is initiated.
  - Given a successful promotion charge has blocked activation, when displayed, then “paid” and placement availability are separate; the UI neither marks it live nor invents a refund.
  - Given a suspended business, disabled online flag, stale purchase version or unknown provider outcome, when Retry/Buy is attempted, then no optimistic financial/activation state appears and the server reason remains actionable.

### S-PROV-18 — Billing and Premium (`/provider/billing`)

- No dedicated prototype screen exists; reuse the subscription status, plan option, purchase handoff, invoice and confirmation components from S-VEND-16 without adding earnings or promotion-purchase content.
- Data: `/payments/me/subscription`, plan purchases/retries, and `/payments/me/invoices`; only the approved provider's own business, including plan and product-order commission documents, never vendor earnings/promotion-purchase panels.
- Special states: plan/configuration unavailable; no current plan; active with expiry date; cancellation scheduled at paid expiry; expired; purchase pending/failure/reconciliation; invoices unavailable or genuinely absent.
- Interactions: view current plan, paid-through date and at most one prepaid next period; buy/manual-renew one calendar month, with switching only next period. Cancel at final `paidThrough`, including already-paid next periods, with no refund/auto-renew. A verified renewal restores retained eligible selections. Both vendor/provider panels use this same lifecycle and confirmation.
- Rules: F-PV-008, BR-01/02/12; never show sample plan prices, an invented expiry date, or fabricated invoice/tax information. If the configured period or invoice policy is unavailable, show the explicit unavailable state.
- Acceptance:
  - Given an approved provider owns the business, when Billing loads, then only its status, configured options, periods and allowed plan/commission documents are returned.
  - Given a provider supplies another business or purchase ID, when read or changed, then the request is denied without exposing the other business's billing data.
  - Given an active finite plan and current version, when the provider cancels, then cancellation is recorded for the paid expiry, Premium remains effective until that instant, and no refund/payment operation is started.
  - Given an unverified expiry or a new cancellation request with a stale version, then no mutation occurs and an error is shown; a same-key lost-response replay returns its original authorized result instead.
  - Given a configured plan renewal is verified, when entitlement becomes active, then retained selected eligible products/services become featured without a listing edit.
  - Given plan/invoice configuration is missing, when the provider opens Billing, then unavailable is shown rather than sample values or fabricated documents.

### Checkout payment and order refund states

- All payment badges/details inspect `settlementKind`: `no_charge` renders “No payment due” / “भुगतान आवश्यक नहीं”, not Paid by gateway/Cash collected, even though its internal settled status is `paid`. Funding/refund numbers remain zero. Test all-zero/mixed checkout, failed placement, handover without cash controls, and zero-return handling.

Shared billing confirmations show server dates (including month-end clamping), tax-inclusive amount, one-month plan/seven-day promotion term, no automatic renewal and cancellation terms. Submit returned configuration/subscription versions; changed reviewed terms require re-review before payment. Never shorten already-paid time. Invoice rows distinguish preparing, issued and failed; render issued supplier snapshots only. Technical compensation for a never-activated purchase is distinct from non-refundable voluntary cancellation.

- Screens: S-CUST-11, S-CUST-14, S-CUST-15 are specified by their owning Checkout/Orders screens; Payments adds no duplicate route or form.
- Contract: reflect server-confirmed `pending`, `paid`, `failed`, `collected`, `refunded` and separate ST-refund decision/processing states. `refund.approved`/`refund.declined` are Orders decisions; `payment.refund_completed`/`payment.refund_failed` are execution outcomes. Approval is not returned money; execution failure is not a declined decision.
- Recovery: Checkout displays compensation against an attempt even without an order ID. Pending/unknown capture or incomplete compensation disables retry/COD; copy never promises “money safe” or a refund ETA for an unknown result. Orders displays ordered/fulfilled/current-payable/refunded amounts independently.
- Acceptance: Given a verified failure with no exposure, when Checkout renders allowed actions, then retry/enabled cash fallback is offered. Given unknown capture or compensation, when the same panel opens, then no unsafe retry or placed state appears. Given only refund approval, when Orders refreshes, then completion remains unconfirmed.

### Account saved methods (Users-owned S-CUST-24)

- Users calls `GET /payments/me/saved-methods`; under Q-33 its `{status:'unavailable',reasonCode:'PAYMENT_SAVED_METHODS_UNAVAILABLE'}` renders a disabled/unavailable row, **not** “No saved methods”. No save/remove/tokenization interaction is implemented until provider and policy are approved.
- Acceptance: Given Q-33 is unresolved, when Account loads, then no fake empty success, payment instrument or add-method action is shown; a failed/session-expired request remains an error rather than unavailable capability.

## Standard states, components and i18n

- Apply the shared default, skeleton, empty, error+retry, no-permission and offline components from `frontend-shared.md`.
- Feature-local: `EarningsSummary`, `EarningsChart`, `PlanCard`, `InvoiceList`; reuse shared `Button`, `Card`, `Badge`, `Table`, `Dialog`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `OfflineBanner`.
- Keys: `payments.earnings.*`, `payments.plan.*`, `payments.promotion.*`, `payments.invoice.*`, `payments.state.*`; EN/HI required. Format money from integer paise; check long Hindi labels at 360px and desktop.
- Analytics: `payments.earnings_view`, `payments.plan_purchase_start`, `payments.promotion_purchase_start`, `payments.purchase_result`; never include payment credentials, provider payloads, bank/UPI details or phone.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Manual UI: configured/unconfigured summary, ledger empty/error, pending/failed purchase without optimistic activation, invoice rows, keyboard/dialog operation, Hindi and dark mode.
- Journey: J1 payment failure then retry or enabled cash fallback; vendor owner views S-VEND-16; provider follows J15 on S-PROV-18, including cancellation-at-expiry and retained-selection reactivation after verified renewal.
- Provider component: status/expiry, plan option, cancellation confirmation, issued invoice and unavailable states reuse S-VEND-16 components; no provider prototype screenshot or vendor earnings/promotion content is assumed.
- Visual: `d-vendor-vearn.jpg` and `m-vendor-vearn.jpg`, 360px/mobile and desktop, light/dark, EN/HI. Never compare against seeded invoice amounts as live data.
- Map every acceptance bullet to component/contract/manual journey scenarios: reload/status/retry, duplicate tap, stale/new-price review, late capture, paid-but-blocked placement, null-policy vs authoritative zero, decision-vs-execution, current COD payable and Q-33 unavailable. Accessibility/keyboard chart/dialog focus, malicious labels, redacted telemetry and IST month-boundary rendering are required.

## Open questions

Q-06 fiscal documents and Q-74 lifecycle are resolved in [BE payments](../be/payments.md). Missing real price/tax/adapter configuration is setup-required, not an undecided algorithm. Gateway topology, refund operations, retention, saved methods, recovery capability, payouts and general partial-return eligibility remain separately gated; no sample fallback or implemented claim.
