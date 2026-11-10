# FE: orders

Features: F-OR-001, F-OR-002, F-OR-003, F-OR-004, F-OR-005, F-OR-006, F-OR-007, F-OR-008, F-VD-008, F-PV-005, F-AD-007 | Screens: S-CUST-13–16, S-VEND-03–04, S-PROV-04–05, S-ADMN-07–08 | Flows: J1, J7, J8

Backend contract: [BE orders](../be/orders.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/orders`, `/orders/:id`, `/orders/:id/refund`, `/orders/:id/invoice` | S-CUST-13–16 | SSR shell; owner-scoped order data and actions in client islands | Customer; login gate returns to requested order | `noindex` |
| `/vendor/orders`, `/vendor/orders/:id` | S-VEND-03–04 | SSR owner-scoped queue/detail; mutations use typed API client | Approved vendor; own business | `noindex` |
| `/provider/orders`, `/provider/orders/:id` | S-PROV-04–05 | Same shared order views as vendor; product orders only | Approved provider; own business | `noindex` |
| `/admin/orders`, `/admin/orders/:id` | S-ADMN-07–08 | SSR scoped queue/detail; case controls are permission-gated | Admin with `orders:view/edit` + assigned area; super_admin platform-wide | `noindex` |

## Screens

### S-CUST-13 — My orders (`/orders`)

- Screenshots: `d-customer-orders.jpg`, `m-customer-orders.jpg`.
- Layout: Active / Completed / Cancelled tabs with counts; responsive order cards show shop, item summary, status, date, total and mode.
- Data: `GET /orders?group=...`; cursor pagination; private user cache only.
- Special states: empty tab, guest login prompt, offline/error retry.
- Interactions/rules: keyboard-operable tabs; status always icon+text+color; F-OR-001, BR-03/22.
- Acceptance: Given the customer changes a tab, when results load, then the list and count match server filters. Given no orders exist in a tab, when opened, then the localized empty state links to shopping.

### S-CUST-14 — Order detail and tracking (`/orders/:id`)

- Screenshots: `d-customer-order-AT10177.jpg`, `d-customer-order-AT10198.jpg`, `d-customer-order-AT10231.jpg`, `d-customer-order-AT10232.jpg`.
- Layout: progress timeline, delivery tracking or pickup instructions, refund/case status, business/items/amount breakdown, help and eligible actions; stack on mobile.
- Data: `GET /orders/{orderId}` plus Delivery tracking/code channel and Payments refund status via owning contracts. Order DTO never contains raw codes (G-15/G-16).
- Special states: active delivery, pickup ready, cancelled/refunded, partial items unavailable, failed delivery, missing/unauthorized order, case resolved.
- Interactions/rules: Cancel opens a reason sheet only for eligible states; report problem opens a case form; reorder uses returned current item IDs then Cart/Checkout revalidates; shop contact uses business contact and rider contact uses masked Delivery contact. Delivery/pickup codes appear only through the approved Delivery customer channel. F-OR-001–008, BR-01–05/20/22.
- Acceptance: Given a delivery or pickup order changes status, when the customer refreshes, then the timeline shows persisted event times and correct mode. Given a case has internal notes, when the customer views the order, then those notes are absent. Given a code is required, when shown, then it came from the approved customer delivery channel and was never returned in the order response.

### S-CUST-15 — Cancel / refund request (`/orders/:id/refund`)

- Screenshots: `d-customer-refund.jpg`, `m-customer-refund.jpg`.
- Layout: confirmation/reason sheet; cancellation reason options and refund reason options match the prototype; optional evidence photo follows G-17/Q-80.
- Data: `POST /orders/{id}/cancel`, `POST /orders/{id}/refund-requests`; no amount input.
- Special states: cancellation not allowed, 24-hour refund window closed, request already exists, upload pending/failed.
- Interactions/rules: confirm is idempotent; Esc closes only the topmost sheet; customer sees “Admin and vendor have been notified…” for cancellation/refund request. F-OR-005/006, BR-20/21; pickup refund eligibility remains Q-79.
- Acceptance: Given an eligible order, when the customer submits a reason, then the server records one request and the app shows the localized confirmation. Given the window is closed or request is duplicate, when submitted, then no second case/refund is created and a clear retry/support action is shown.

### S-CUST-16 — Invoice (`/orders/:id/invoice`)

- Screenshots: `d-customer-invoice-AT10198.jpg`, `m-customer-invoice-AT10198.jpg`.
- Layout: printable tax invoice, business/customer details, immutable item and total rows; print/save action; hide navigation/actions in print view.
- Data: `GET /orders/{orderId}/invoice`; customer order ownership required; no public cache.
- Special states: invoice not configured, unavailable order, print failure.
- Rules/acceptance: Given an owned order and configured invoice snapshot, when printed, then item names, amounts and total match the original order; no tax field or invoice number is fabricated (Q-06/Q-07).

### S-VEND-03 / S-PROV-04 — Business orders list

- Screenshots: `d-vendor-vorders.jpg`, `m-vendor-vorders.jpg`, `d-provider-sorders.jpg`, `m-provider-sorders.jpg`.
- Layout: New, In progress, Ready/Out, Completed, Cancelled tabs; order/customer summary, item count, total, mode and status; mobile labelled cards.
- Data: `GET /orders`; business-owned cursor page. Providers see only orders for their product listings.
- Special states: empty queue, pending-order alert, not-approved limited access, no permission.
- Acceptance: Given the active business changes, when the list loads, then orders from any other business are absent. Given a filter tab changes, when the server responds, then counts and rows match that status group.

### S-VEND-04 / S-PROV-05 — Business order detail

- Screenshots: `d-vendor-vorder-AT10231.jpg`, `d-vendor-vorder-AT10236.jpg`, `d-vendor-vorder-AT10240.jpg`, `m-vendor-vorder-AT10231.jpg`, `d-provider-sorder-AT10231.jpg`, `m-provider-sorder-AT10231.jpg`.
- Layout: item and amount summary, timeline, customer fulfilment details, update-status card, rider status, print slip and refund-request alert.
- Data: `GET /orders/{id}`, transition/item-availability commands, packing slip; Delivery owns rider assignment and code verification.
- Special states: cancelled, refund requested, waiting for rider, item unavailable, cash pending.
- Interactions/rules: Accept/reject with reason; preparing/ready; request/assign delivery through Delivery; pickup handover/own delivery code checks through Delivery; never display raw code. Mark unavailable before fulfilment; don't substitute without approval. F-VD-008/F-PV-005/F-OR-007, BR-03–06.
- Acceptance: Given an unapproved business or another business's order ID, when opened/changed, then access is denied. Given cash is collected, when Delivery confirms handover, then payment displays collected rather than paid.

### S-ADMN-07 / S-ADMN-08 — Orders, disputes and case detail

- Screenshots: `d-admin-aorders.jpg`, `m-admin-aorders.jpg`, `d-admin-aorder-AT10177.jpg`, `d-admin-aorder-AT10231.jpg`, `m-admin-aorder-AT10177.jpg`, `m-admin-aorder-AT10231.jpg`.
- Layout: All/Active/Disputes/Refunds/Failed deliveries filters; scoped order table; detail shows order/timeline, case workflow and Delivery rider assignment controls.
- Data: `/admin/orders` list/detail and case update; refund decisions use the Payments contract; Delivery owns assign/reassign; Audit receives before/after events.
- Special states: no permission, empty scope, failed delivery, refund pending, case resolved.
- Interactions/rules: filter/status chips keyboard accessible; case `open -> in_review -> resolved`; refund approval is a Payments command, never manual “mark paid/refunded”; admin changes are audited. F-AD-007, BR-12/20/22.
- Acceptance: Given an admin lacks `orders:view/edit` or the order is outside assigned area, when the route/action loads, then no record or mutation is exposed. Given case resolution commits, when refreshed, then the state/note and audit-backed history persist.

## Components, i18n and analytics

- Feature-local: `OrderCard`, `OrderTimeline`, `OrderActions`, `RefundTracker`, `OrderCasePanel`, `InvoicePrintView`.
- Shared: `AppShell`, `Tabs`, `Badge`, `Card`, `Button`, `Sheet`, `Dialog`, `Toast`, `Table`, `EmptyState`, `ErrorState`, `Skeleton`, `OfflineBanner`.
- Keys: `orders.list.*`, `orders.detail.*`, `orders.cancel.*`, `orders.refund.*`, `orders.case.*`, `orders.invoice.*`, `vendor.orders.*`, `admin.orders.*`; complete EN/HI, no concatenated sentences. Test long Hindi, dark tokens, reduced motion and keyboard/Esc behavior.
- Analytics: `orders.list_view`, `orders.detail_view`, `orders.cancel_submit`, `orders.refund_submit`, `orders.case_submit`, `orders.invoice_print`, `business.orders_transition`; no address, phone, OTP, notes or payment details.

## Tests

- Component: every role-specific list/detail, tabs/filters, timeline branches, cancel/refund guards, case note visibility, printable invoice, unavailable item and cash-collected state.
- Journeys: J1 split checkout through order tracking; J7 vendor accepts through delivery; J8 cancel/refund/dispute; J13 EN/HI and dark mode.
- E2E: wrong owner/scope, empty/error/offline, duplicate submit, stale status/version, keyboard-only sheets, and order code absent from order API responses.

## Open questions

Q-06/Q-07, Q-17, Q-76–Q-80 and G-16/G-17 remain open; see [BE orders](../be/orders.md) and the open-issues register.
