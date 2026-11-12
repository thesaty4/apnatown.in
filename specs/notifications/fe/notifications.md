# FE: notifications

Features: F-NT-001, F-NT-002, F-X-012 | Screens: S-CUST-22, S-CUST-23 (channel section), S-VEND-17, S-PROV-15 | Flows: J1, J7

Backend contract: [BE notifications](../be/notifications.md)

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Components](#feature-components) · [Verification](#verification)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/notifications` | S-CUST-22 | SSR private first page; client pagination + SSE | Customer | noindex |
| `/vendor/notifications`, `/provider/notifications` | S-VEND-17, S-PROV-15 | Same `NotificationFeed` with `role` | Vendor / provider | noindex |
| `/account/preferences` (channel section) | S-CUST-23 | SSR private; page shell owned by users FE | Customer | noindex |
| `/notifications/unsubscribe?token=` | — | SSR confirmation/result, no-store | Public signed capability | noindex |

Rider and admin feeds reuse `NotificationFeed` from the bell in `DashboardShell` (no separate screen in the design).
Use [frontend-shared](../../_foundation/frontend-shared.md) for standard states, tokens and accessible EN/HI; feeds are private and role-keyed. Client cache keys include user/role; clear them on logout/suspension/deletion.

## Screens

### S-CUST-22 / S-VEND-17 / S-PROV-15 Notifications | `d-customer-notifications.jpg`, `m-customer-notifications.jpg`, `d-vendor-vnotif.jpg`, `m-vendor-vnotif.jpg`, `d-provider-snotif.jpg`, `m-provider-snotif.jpg`
- Layout: list grouped Today / Earlier (IST); each item has category icon, title, body, relative time, unread dot + "Unread" sr-only text; "Mark all read".
- Data: `GET /notifications?role=`; `POST …/read` on open; SSE updates the bell badge in `TopBar`/`DashboardShell`.
- Only **published in-app** delivery rows appear. Logical external-only messages, suppressed sends and a WhatsApp-only campaign must not create feed rows or unread badges. Turning inapp off stops new publication, not access to existing read history.
- Special states: empty ("You're all caught up").
- Interactions: tap navigates to `link_path` (internal only) and marks read; keyboard Enter opens.
- Links follow the BE matrix, including review replies/moderation, applicant decisions and admin support/listing reports. Scope/role is checked again at destination; unavailable/permission-changed links show shared feedback, not sensitive cached content.
- Follower updates use the same feed item/accessibility states as other notifications; none appears unless active follow, bell, in-app preference and explicit marketing consent are current. External channel preference/consent and all send-time checks follow the BE policy.
- Premium expiry uses the ordinary localized system-notice feed: the owner sees that selected listings are retained but no longer featured until a verified renewal, and scoped administrators see only the business and expiry status. Current in-app/email preferences apply; no WhatsApp or marketing opt-in is implied.
- SSE deduplicates notification IDs, reconnect refetches role count/feed, and Mark all read applies only to the current authorized role. Never merge customer and vendor deliveries because the user ID matches.
- Acceptance: Given an unread item, when opened/retried, then badge/read state changes once. Given role=vendor for a multi-role user, when loaded, then customer notices are absent. Given a WhatsApp-only or suppressed campaign, when receipts arrive, then no in-app item/badge is fabricated. Given Hindi and an empty feed, when rendered, then IST labels/empty copy use the approved catalogue.

### S-CUST-23 Notification preferences — channel section | `d-customer-prefs.jpg`, `m-customer-prefs.jpg`
- Layout matches `js7.js:30–32`, not a topic×channel grid: Channels → **In-app notifications (`inapp`)**, **Email updates (`email`)**; WhatsApp → **Order updates (`wa_orders`)**, **Offers & promotions (`wa_offers`)**, **Enquiry replies (`wa_enq`)**. All five are operative toggles; in-app is not permanently on.
- Show the source's WhatsApp purpose/STOP explanation and current consent-recorded metadata from the server, not today's invented timestamp. Enabling a consent-required option sends its explicit acknowledgement only after the notice is visible; a default checked value is never evidence of consent.
- Data: GET/PUT `/notifications/preferences`; each source-style toggle change saves the allow-listed key plus `expectedVersion`, current consent acknowledgement if required, and mutation key. Show pending state; rollback on failure and reconcile a version conflict. Reload hydrates all five saved values.
- **Unsubscribe from all marketing** calls POST `/notifications/preferences/unsubscribe-marketing` with expected version. Source behavior sets email/wa_offers off and revokes marketing grants, preserving inapp/wa_orders/wa_enq and unrelated transactional WhatsApp choices. Do not send a blanket “all preferences false” payload.
- Distinguish the marketing-only button from verified **WhatsApp STOP**, which disables all three WhatsApp choices via the BE inbound adapter. On focus/refetch, show current values changed by STOP; no fake client-side inbound webhook.
- NT-Q2 keeps any unsupported system-channel mapping/transactional email bypass unavailable. Do not add wa_system or per-topic email controls to hide that decision.
- Acceptance: Given changed inapp, when saved then reloaded, then its actual persisted value controls new in-app delivery. Given a consent-required WhatsApp toggle, when enabled, then current consent evidence is recorded, not inferred from defaults. Given marketing opt-out, when saved, then the three unrelated keys/transactional grants remain unchanged. Given save conflict/error, when returned, then current server choices are restored with accessible feedback.

### Public unsubscribe confirmation
- GET with signed token displays only the token-authorized marketing scope and Confirm unsubscribe; it changes nothing. POST `/notifications/unsubscribe` `{token}` performs the revoke, then shows a non-PII success result. Invalid/expired capability shows the shared actionable error, never account identity.
- Acceptance: Given an email link scanner opens GET, when the page loads, then consent is unchanged. Given a valid confirmation, when POST succeeds, then only its authorized marketing scope is revoked. Given a tampered/expired token, when submitted, then no preference changes.

## Feature components

`NotificationFeed`, `NotificationItem`, `ChannelPreferences`, `BellBadge` in `src/features/notifications`. Shared: `IconButton` (bell badge), `Switch`, `Toast`, `Skeleton`, `EmptyState`.

## i18n and analytics

Prefixes `notifications.*`; template copy is rendered server-side. Events: `notification_opened`, `notifications_mark_all_read`, `notification_pref_changed`.

## Verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Manual UI/accessibility: five exact toggle bindings, pending/conflict rollback, no mandatory in-app, purpose copy, role-isolated badges, keyboard focus/labels, EN/HI/dark and unsubscribe confirmation. Manual journey: order.created → correct role feed; BR-20 admin/vendor notices scoped by area; reply/moderation/support links reach existing authorized destinations; marketing opt-out preserves transactional WhatsApp choices; verified STOP refetch; external-only/suppressed campaign produces no feed row. Retry/receipt mechanics and account export/erase are BE/Users contracts, not invented frontend controls.
