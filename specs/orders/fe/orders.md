# FE: orders

Features: F-OR-001, F-OR-002, F-OR-003, F-OR-004, F-OR-005, F-OR-006, F-OR-007, F-OR-008, F-VD-008, F-PV-005, F-AD-007 | Screens: S-CUST-13, S-CUST-14, S-CUST-15, S-CUST-16, S-VEND-03, S-VEND-04, S-PROV-04, S-PROV-05, S-ADMN-07, S-ADMN-08 | Flows: J1, J7, J8

Backend contract: [BE orders](../be/orders.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/orders`, `/orders/:id`, `/orders/:id/refund`, `/orders/:id/invoice` | S-CUST-13, S-CUST-14, S-CUST-15, S-CUST-16 | SSR shell; owner-scoped client islands | Customer; login returns to requested order | `noindex` |
| `/orders/checkouts/:checkoutAttemptId/summary` | S-CUST-12 extension | SSR private summary; print view, no public cache | Customer owns checkout; scoped admin read only | `noindex` |
| `/vendor/orders`, `/vendor/orders/:id` | S-VEND-03, S-VEND-04 | SSR owner queue/detail; typed client commands | Approved vendor; own business | `noindex` |
| `/provider/orders`, `/provider/orders/:id` | S-PROV-04, S-PROV-05 | Shared business views; product orders only | Approved provider; own business | `noindex` |
| `/admin/orders`, `/admin/orders/:id` | S-ADMN-07, S-ADMN-08 | SSR scoped queue/detail; permission-gated client controls | Admin `orders:view/edit` + area; super_admin platform-wide | `noindex` |

Use [frontend-shared](../../_foundation/frontend-shared.md) states/components, private no-store caches, flat foundation errors and safe-integer paise JSON. Render server `allowedActions` and versions; the UI is not a transition/refund policy engine.

## Screens

### S-CUST-13 — My orders (`/orders`)

- Screenshots: `d-customer-orders.jpg`, `m-customer-orders.jpg`.
- Layout: Active / Completed / Cancelled tabs with counts; responsive order cards show shop, item summary, status, date, total and mode.
- Data: `GET /orders?group=active|completed|cancelled`; `OrderPageDTO` includes three authoritative counts before cursor pagination. URL `?group=` and Back retain selected tab/scroll.
- Special states: empty tab, guest login prompt, offline/error retry.
- Interactions/rules: keyboard-operable tabs; status always icon+text+color; F-OR-001, BR-03/22.
- Acceptance: Given the customer changes a tab, when results load, then the list and count match server filters. Given no orders exist in a tab, when opened, then the localized empty state links to shopping.
  Given another customer's filter/identifier is forged, when requested, then no count or card leaks; Hindi/dark tabs remain keyboard-operable and status is not color-only.

### S-CUST-14 — Order detail and tracking (`/orders/:id`)

- Screenshots: `d-customer-order-AT10177.jpg`, `d-customer-order-AT10198.jpg`, `d-customer-order-AT10231.jpg`, `d-customer-order-AT10232.jpg`.
- Layout: progress timeline, delivery tracking or pickup instructions, refund/case status, business/items/amount breakdown, help and eligible actions; stack on mobile.
- Data: `OrderDetailDTO` from `GET /orders/{orderId}` plus `/delivery/orders/{id}/tracking` and `/stream`; Payments summary is composed by Orders, not a second customer refund API. Refetch on relevant order/financial versions and after reconnect.
- Special states: active delivery, pickup ready, cancelled/refunded, partial items unavailable, failed delivery, missing/unauthorized order, case resolved.
- Interactions/rules: Cancel/report/reorder/invoice use `allowedActions`. Reorder passes product ID + nullable selected variant to Cart; an invalid/removed required label prompts correction. Rider card renders Delivery's name/rating/masked-call capability/status/ETA, with explicit stale/unavailable ETA; self-delivery has no invented rider/map.
- Amounts: show immutable ordered and revised fulfilled bill separately when adjusted; removed lines remain labelled. Current cash due, funded, refund pending and returned money are distinct server values. Never rewrite a displayed original invoice or show a requested refund as money returned.
- Code: only Delivery's dedicated customer `/code` channel may reveal the live code after G-16 enablement. Reload returns the same active generation; expired/reissued/consumed codes follow [Delivery FE](../../delivery/fe/delivery.md). No code in SSR HTML, order DTO, general SSE, logs, local/session storage or service-worker cache; hide/clear on handover, logout or expiry.
- Acceptance: Given a delivery or pickup order changes status, when the customer refreshes, then the timeline shows persisted event times and correct mode. Given a case has internal notes, when the customer views the order, then those notes are absent. Given a code is required, when shown, then it came from the approved customer delivery channel and was never returned in the order response.
  Given a partial adjustment or failed delivery, when refreshed, then original/fulfilled/payable amounts and the case state reconcile without a false refund-completed badge. Given a code expires/reissues during reconnect, when the owner rereads it, then only the current usable generation is shown and the rider never receives it.

### S-CUST-15 — Cancel / refund request (`/orders/:id/refund`)

- Screenshots: `d-customer-refund.jpg`, `m-customer-refund.jpg`.
- Layout: confirmation/reason sheet; cancellation reason options and refund reason options match the prototype; optional evidence photo follows G-17/Q-80.
- Data: `POST /orders/{id}/cancel` with event/reason/version/key, or `/refund-requests` with reason/details/private `assetId`s. No amount/status/approver input; window/eligibility comes from server, not browser time.
- Special states: cancellation not allowed, 24-hour refund window closed, request already exists, upload pending/failed.
- Interactions/rules: confirm is idempotent; Esc closes only the topmost sheet; customer sees “Admin and vendor have been notified…” for cancellation/refund request. F-OR-005, F-OR-006, BR-20/21; pickup refund eligibility remains Q-79.
- Acceptance: Given an eligible order, when the customer submits a reason, then the server records one request and the app shows the localized confirmation. Given the window is closed or request is duplicate, when submitted, then no second case/refund is created and a clear retry/support action is shown.
  Given approval but no verified return, when the tracker updates, then it says approved/pending execution, not completed; provider execution failure is not a vendor decline. Given optional evidence policy is unavailable, when the form renders, then text intake remains available without a fake upload success.

### S-CUST-16 — Invoice (`/orders/:id/invoice`)

- Order, invoice, master-summary and business handover consumers use the shared payment badge's `settlementKind`: no-charge means no customer payment due, not a cash receipt or refund. Supplier invoices may still include platform-funded consideration; show its source separately.

- Screenshots: `d-customer-invoice-AT10198.jpg`, `m-customer-invoice-AT10198.jpg`.
- Layout: supplier document list and printable immutable invoice/bill-of-supply/receipt or linked credit note, labelled with its true document type; print/save hides navigation/actions. Separate shop and platform fee documents, never a shop GST invoice containing another supplier's fees.
- Data: `GET /orders/{orderId}/invoice`; customer order ownership required; no public cache.
- Special states: preparing/signing, issued, failed with retry/support reason, legacy-unverified, unavailable order and print failure. Pending invoice is not an unpaid/failed order.
- Rules/acceptance: Given an owned issued document, then printing uses frozen supplier/tax amounts and number. Later adjustments link a credit document, never overwrite the original. An unregistered supplier shows a commercial receipt, not a GST tax invoice; an unauthorized order or unverified fiscal setup never reveals fabricated or foreign documents. Follow [BE invoice policy](../be/orders.md#invoice-and-tax-policy).

### Master checkout summary — linked from S-CUST-12
- Layout: one non-tax summary for the checkout with each shop order, ordered item/discount/fee/total breakdown, a separately labelled current cancellation/fulfilment/refund status, and a link to each shop's legal invoice when available; print/save action.
- Data: `GET /checkouts/{checkoutAttemptId}/summary`; customer order ownership is required. Each invoice link opens that shop's own `/orders/{orderId}/invoice`. No public cache.
- Rules/acceptance: Show each allocated coupon discount and fee once; original checkout totals never change. The summary is not a tax invoice, does not calculate or display a consolidated tax line, and directs customers to the linked shop invoice for tax detail. Given an invoice is not yet available, the summary still loads and labels that invoice unavailable. Given cancellation/refund/adjustment occurs, current status is separate from original totals; only verified returned money is labelled refunded. Unauthorized checkout IDs reveal no shops or amounts.
- Display `supplierDocumentTotal - platformCouponContribution = customerPayable` when platform funding applies; a larger supplier invoice is explained, not charged again. Pending refunds/credits are separate from verified returned cash. Keep the master document available while a linked supplier invoice is being prepared.

### S-VEND-03 / S-PROV-04 — Business orders list

- Screenshots: `d-vendor-vorders.jpg`, `m-vendor-vorders.jpg`, `d-provider-sorders.jpg`, `m-provider-sorders.jpg`.
- Layout: New, In progress, Ready/Out, Completed, Cancelled tabs; order/customer summary, item count, total, mode and status; mobile labelled cards.
- Data: `GET /businesses/me/orders?tab=new|in_progress|ready_out|completed|cancelled` and `/counts`; list and all five counts share the same server predicate/asOf. URL `?tab=` persists through Back/reload. Providers see only their product orders; no guessed fulfilment defaults for an unconfigured provider.
- Special states: empty queue, pending-order alert, not-approved limited access, no permission.
- Acceptance: Given the active business changes, when the list loads, then orders from any other business are absent. Given a filter tab changes, when the server responds, then counts and rows match that status group.
  Given `order.created` arrives or a transition succeeds, when the queue refreshes, then New alert/count updates once, not from an invented `order.placed` event. Given an empty/error/stale tab, when retried, then authoritative counts replace cached data without cross-business leakage.

### S-VEND-04 / S-PROV-05 — Business order detail

- Screenshots: `d-vendor-vorder-AT10231.jpg`, `d-vendor-vorder-AT10236.jpg`, `d-vendor-vorder-AT10240.jpg`, `m-vendor-vorder-AT10231.jpg`, `d-provider-sorder-AT10231.jpg`, `m-provider-sorder-AT10231.jpg`.
- Layout: item and amount summary, timeline, customer fulfilment details, update-status card, rider status, print slip and refund-request alert.
- Data: `/orders/{id}/transitions` (`accept`, `start_preparing`, `mark_ready` + expectedVersion/key); reject via `/cancel`; item availability includes order/financial versions. GET order/packing-slip remains role-minimized.
- Special states: stale/concurrent transition, approval withdrawn, waiting/unassigned rider, adjustment policy unavailable, paid-partial action disabled, refund authority unavailable, cash pending/current amount changed.
- Delivery commands: `/delivery/orders/{id}/request`, `/riders`, `/assign` for ready platform delivery; `/self-dispatch` then `/self-complete` for own delivery without a job; `/delivery/pickup-codes/verify` for ready pickup. Use [Delivery BE](../../delivery/be/delivery.md) versions/idempotency and separate explicit cash checkbox with current payable. Enter customer's code; never fetch or display it.
- Adjustment/refund: show removed ordered lines plus fulfilled bill; no substitution. Funded partial action remains disabled under Q-76/Q-77; any ambiguous coupon/fee recalculation is gated. Vendor refund decision controls call Orders' `/refund-requests/{requestId}/decision` only when Q-17 policy grants them; no Payments approval endpoint or manual “mark refunded”.
- Acceptance: Given unapproved/foreign business access, when attempted, then server rejects it. Given accept/prepare/ready and reject race, when one version wins, then refetch shows one authoritative transition. Given explicit current cash collection + verified code succeeds, when handover completes, then payment says collected, not paid.
  Given self-delivery/pickup, when completing, then no rider/job picker appears. Given cash amount changed or code expired, when submitted, then confirmation refreshes without consuming a usable code or collecting an old amount. Given paid-partial policy is missing, when unavailable-item controls render/are forged, then no optimistic removal/total/refund appears.

### S-ADMN-07 / S-ADMN-08 — Orders, disputes and case detail

- Screenshots: `d-admin-aorders.jpg`, `m-admin-aorders.jpg`, `d-admin-aorder-AT10177.jpg`, `d-admin-aorder-AT10231.jpg`, `m-admin-aorder-AT10177.jpg`, `m-admin-aorder-AT10231.jpg`.
- Layout: All/Active/Disputes/Refunds/Failed deliveries filters; scoped order table; detail shows order/timeline, case workflow and Delivery rider assignment controls.
- Data: `/admin/orders?filter=all|active|disputes|refunds|failed`, detail; POST `/{id}/cases` opens an actual case, PATCH case changes workflow, POST case `/notes` appends a note without status change. Decisions use the Orders refund-decision command; Delivery owns `/delivery/admin/jobs/{jobId}/assign`.
- Special states: no permission, empty scope, failed delivery, refund pending, case resolved.
- Interactions/rules: workflow open → in_review → resolved; case notes default internal and preserve local form input after version conflict. Check role + `orders:view/edit` + city/area for reads/actions; assignment also checks rider scope. Q-17 gates actual refund authority, even for an admin with edit permission. Never manual mark paid/refunded; execution comes from `payment.refund_completed`/`payment.refund_failed`. Mutations are audited.
- Acceptance: Given an admin lacks `orders:view/edit` or the order is outside assigned area, when the route/action loads, then no record or mutation is exposed. Given case resolution commits, when refreshed, then the state/note and audit-backed history persist.
  Given no case exists, when an authorized admin selects Open a case, then POST creates one versioned case and note-only action does not resolve it. Given same-city/wrong-area scope, unknown refund authority or post-pickup reassignment, when a control is attempted, then no unauthorized optimistic success appears.

## Components, i18n and analytics

- Feature-local: `OrderCard`, `OrderTimeline`, `OrderActions`, `RefundTracker`, `OrderCasePanel`, `InvoicePrintView`.
- Shared: `AppShell`, `Tabs`, `Badge`, `Card`, `Button`, `Sheet`, `Dialog`, `Toast`, `Table`, `EmptyState`, `ErrorState`, `Skeleton`, `OfflineBanner`.
- Keys: `orders.list.*`, `orders.detail.*`, `orders.cancel.*`, `orders.refund.*`, `orders.case.*`, `orders.invoice.*`, `vendor.orders.*`, `admin.orders.*`; complete EN/HI, no concatenated sentences. Test long Hindi, dark tokens, reduced motion and keyboard/Esc behavior.
- Analytics: `orders.list_view`, `orders.detail_view`, `orders.cancel_submit`, `orders.refund_submit`, `orders.case_submit`, `orders.invoice_print`, `business.orders_transition`; no address, phone, OTP, notes or payment details.

## Tests

- Component: every role-specific list/detail, tabs/filters, timeline branches, cancel/refund guards, case note visibility, printable invoice, unavailable item and cash-collected state.
- Journeys: J1 split checkout through order tracking; J7 vendor accepts through delivery; J8 cancel/refund/dispute; J13 EN/HI and dark mode.
- E2E: wrong owner/scope, empty/error/offline, duplicate submit, stale status/version, keyboard-only sheets, and order code absent from order API responses.
- Map every acceptance bullet to scenarios: five-tab/count API, explicit vendor transitions, self/pickup cash with no job, unchanged ordered vs adjusted fulfilled/current amounts, paid-partial gate, failed-delivery exception, concrete case/note intake, decision-vs-execution event order, refund-window/IST boundary and secure code reload/expiry. Axe, malicious note/label text, long Hindi, dark/reduced-motion and topmost Esc/focus apply to all actions.

## Open questions

Q-06 invoice/tax rules are resolved in [BE orders](../be/orders.md#invoice-and-tax-policy). Q-07/Q-17, Q-76/Q-77 general return eligibility, Q-78/Q-79/Q-80 and G-16/G-17 remain separate. Defined coupon/tax allocations do not silently authorize a refund, retention change or substitution.
