# FE: notifications

Features: F-NT-001, F-NT-002, F-X-012 | Screens: S-CUST-22, S-CUST-23 (channel section), S-VEND-17, S-PROV-15 | Flows: J1, J7

Backend contract: [BE notifications](../be/notifications.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/notifications` | S-CUST-22 | SSR private first page; client pagination + SSE | Customer | noindex |
| `/vendor/notifications`, `/provider/notifications` | S-VEND-17, S-PROV-15 | Same `NotificationFeed` with `role` | Vendor / provider | noindex |
| `/account/preferences` (channel section) | S-CUST-23 | SSR private; page shell owned by users FE | Customer | noindex |
| `/notifications/unsubscribe?token=` | — | SSR result page | Public | noindex |

Rider and admin feeds reuse `NotificationFeed` from the bell in `DashboardShell` (no separate screen in the design).

## Screens

### S-CUST-22 / S-VEND-17 / S-PROV-15 Notifications | `d-customer-notifications.jpg`, `m-customer-notifications.jpg`, `d-vendor-vnotif.jpg`, `m-vendor-vnotif.jpg`, `d-provider-snotif.jpg`, `m-provider-snotif.jpg`
- Layout: list grouped Today / Earlier (IST); each item has category icon, title, body, relative time, unread dot + "Unread" sr-only text; "Mark all read".
- Data: `GET /notifications?role=`; `POST …/read` on open; SSE updates the bell badge in `TopBar`/`DashboardShell`.
- Special states: empty ("You're all caught up").
- Interactions: tap navigates to `link_path` (internal only) and marks read; keyboard Enter opens.
- Acceptance: Given an unread item is opened, then the badge decreases by one. Given no notifications, then the empty state shows. Given Hindi, then times show in IST 12-hour with Hindi labels.

### S-CUST-23 Notification preferences — channel section | `d-customer-prefs.jpg`, `m-customer-prefs.jpg`
- Layout: rows Orders / Offers / Enquiries × toggles Email, WhatsApp (in-app always on, shown as fixed); consent text under WhatsApp and Email explaining purpose; Unsubscribe-all link.
- Data: `GET/PUT /notifications/preferences`.
- Acceptance: Given WhatsApp for Offers is switched on, then the consent text is visible before saving and consent is recorded. Given save fails, then toggles revert with an error toast.

## Feature components

`NotificationFeed`, `NotificationItem`, `ChannelPreferences`, `BellBadge` in `src/features/notifications`. Shared: `IconButton` (bell badge), `Switch`, `Toast`, `Skeleton`, `EmptyState`.

## i18n and analytics

Prefixes `notifications.*`; template copy is rendered server-side. Events: `notification_opened`, `notifications_mark_all_read`, `notification_pref_changed`.

## Tests

Component: badge count, mark-all, preference revert. E2E: order placed → vendor bell badge increments via SSE; unsubscribe page.
