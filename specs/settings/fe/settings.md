# FE: settings

Features: F-SA-005, F-AC-005, F-AC-006, F-X-009 | Screens: S-SUPR-06, S-CUST-30, S-CUST-31, S-CUST-32, S-CUST-33, S-CUST-34, S-CUST-35, S-CUST-36, S-CUST-37, S-CUST-38 | Flows: J10

Backend contract: [BE settings](../be/settings.md)

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Components](#feature-components) · [Verification](#verification)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/super-admin/settings?section=` | S-SUPR-06 | SSR (private) + client forms | super_admin | noindex |
| `/help` | S-CUST-30 | SSG (FAQ from i18n) + client form | Public | index |
| `/about` | S-CUST-31 | ISR tag `legal:about` | Public | index |
| `/terms`, `/privacy`, `/refund-policy` | S-CUST-32, S-CUST-33 | ISR tags `legal:*` | Public | index |
| `not-found.tsx` (`/404`) | S-CUST-34 | Static | Public | noindex (404 status) |
| `error.tsx` / `global-error.tsx` (`/500`) | S-CUST-35 | Client error boundary | Public | noindex |
| `/offline` | S-CUST-36 | Static, precached by service worker | Public | noindex |
| `/maintenance` | S-CUST-37 | Static; shown on 503 `MAINTENANCE` | Public | noindex (503) |
| `/design-system` | S-CUST-38 | SSG, excluded from production build (internal only) | Internal | noindex |

## Screens

### S-SUPR-06 Global settings | `d-super-xsettings.jpg`, `m-super-xsettings.jpg`
- Layout: heading; section chips (URL `section`): Branding, Delivery & rider pay, Commission & plans, Payments, Policies & reviews, Notifications & WhatsApp, SEO defaults, Feature flags, Legal pages; one form card per section; link "Manage categories".
- Delivery: slab rows "Up to (km)" / "Fee (₹)"; rider rule "Base per ride (₹)", "Per km (₹)" with a live example from **configured** values; no demo ₹20/₹7 production fallback.
- Commission & plans: default commission %, platform fee ₹, plan rows (localized name, tax-inclusive ₹/calendar month, commission %, enabled and Premium entitlement), promotion fee rows (tax-inclusive ₹/7 days). Use the server's fixed term rules; no auto-renew/proration controls or sample price fallback.
- Payments: Online payments / Cash on delivery toggles; approved configured gateway choices; "Configured"/"Not configured" badge, no key input or silently selected provider. A separate versioned Tax configuration card edits verified platform supplier/classifications and displays missing readiness fields; it never infers a GST rate or claims regex validation proves registration.
- Policies: approved refund window; review rule EN/HI textarea; blocked words chips. Rule copy cannot resolve Reviews' eligibility/re-review gates. A separate Upload policies card shows Media's approved limits/hard ceilings and saves `uploads` independently, without changing `policies_reviews` group semantics.
- Upload policies also shows Cloudinary image readiness from the server,
  without credential entry or provider URLs. Link-only video, separate private
  documents and deployment-owned map/embedding configuration follow
  [media and maps](../../_foundation/media-and-maps.md); image readiness
  never enables a video-file upload control.
- Notifications & WhatsApp: configured sender/status/enable toggle, SMS adapter and email sender; **public support Call and WhatsApp E.164 destinations**. No secrets or example phone number.
- SEO: default title/description with search-result preview.
- Feature flags: Customer reviews, Guest browsing, WhatsApp, Maintenance; future Booking/Donations visible **false, disabled, unavailable** until separately implemented.
- Legal pages: Terms of use, Privacy policy, Refund policy, About us → Edit `Sheet` with EN/HI tabs.
- Each grouped form makes **one** PUT `/super-admin/settings/groups/{group}` with all values/expectedVersions: `delivery_rider_pay` = delivery+rider_earning; `commission_plans` = commission+plans+promotion_fees; `policies_reviews` = policies+reviews. No separate parallel per-key saves and no half-form success.
- Branding, gateway choice, integrations/support contacts and SEO use allowed single-key Save; legal pages save per slug. Existing online/COD/WhatsApp/feature switches are **immediate versioned flag mutations**, visually distinct from Save-bound edits. Maintenance enable describes the BE admission rules, not “all APIs stop”.
- GET `/super-admin/settings` hydrates all values/versions. Rupees submit integer paise and percentages integer bps. Missing approved config remains “Not configured”, not sample money/provider values.
- Save shows pending→success only after the whole group response. Invalid/stale group retains **all** edits, with key-specific errors and “Settings changed by someone else” + Reload. Reapply only after hydrating all fresh versions. Flag PUT sends `{enabled,expectedVersion}`; failed optimistic toggles restore server state.
- Cache invalidates coherent group values and configured contacts; `feature_flag.updated` affects feature availability and `legal.updated` its slug/locale metadata. UI never locally enables a future product.
- Acceptance: Given non-super admin, when loading/mutating, then route/API are forbidden. Given one invalid/stale group member, when Save is attempted, then no member changes and every local edit survives. Given concurrent flag writes, then version conflict restores current state.
- Acceptance: Given Hindi/dark mode, when all sections render, then labels/errors stay readable and no credentials appear. Given Booking/Donations, when toggled by forged API/UI, then they stay disabled. Given changed financial settings, then UI does not claim existing orders were repriced.
- Acceptance: Given incomplete commercial/fiscal settings, when the administrator opens the section, then exact missing fields are shown as setup tasks; enabling a plan requires explicit price, entitlement and valid tax references. Given an image limit above the hard ceiling, then no save succeeds.

### S-CUST-30 Help and support | `d-customer-help.jpg`, `m-customer-help.jpg`
- FAQ accordion (`details` keyboard support); public **message-only** form “Your message” → Send, matching final `js7.js`. No required guest phone or login field.
- Load `/settings/public.support`; Call/WA use configured `tel:`/`https://wa.me/` links with normalized numbers, not arbitrary URLs. A null contact disables that button with an accessible explanation; no hard-coded prototype phone. Link launch is user initiated, not a notification-consent change.
- POST `/support/messages` **`{message}`** + retained idempotency key; trim 1–1000. On `202`, toast “Message sent” and clear. The actual BE handoff is an authorized existing Admin overview notification/detail, not a future inbox.
- Preserve draft on validation/rate/network error; offline disables Send with banner. Do not promise reply time/channel for anonymous intake (SET-Q1).
- Acceptance: Given a guest with only a message, when Send succeeds/replays, then one intake is acknowledged without phone. Given empty message, sixth/hour or offline, then localized feedback preserves the draft. Given missing contact config, when viewing Help, then only configured actions open. Given markup, when rendered in admin detail, then it is inert text.

### S-CUST-31 About us | `d-customer-about.jpg`, `m-customer-about.jpg`
- Heading, brand paragraph, three cards (Local shops, Trusted services, Fast delivery).

### S-CUST-32 Terms | S-CUST-33 Privacy policy | `d-customer-terms.jpg`, `m-customer-terms.jpg`, `d-customer-privacy.jpg`, `m-customer-privacy.jpg`
- `LegalPage` layout: title, last updated (IST), sanitised body; Privacy links to profile data export/delete (F-AC-004). Refund policy uses the same layout.

### S-CUST-34 Not found | `d-customer-nf.jpg`, `m-customer-nf.jpg`
- `EmptyState` 🧭 "Page not found" / "The page you are looking for does not exist or has moved." + Go home (and search bar).

### S-CUST-35 Server error | `d-customer-err500.jpg`, `m-customer-err500.jpg`
- `ErrorState` "We hit a snag" + Retry (`reset()`), shows correlation ID small text for support.

### S-CUST-36 Offline | `d-customer-offline.jpg`, `m-customer-offline.jpg`
- `EmptyState` 📡 "No internet connection" / "You can still view saved pages. Reconnect to place orders." + Try again.

### S-CUST-37 Maintenance | `d-customer-maintenance.jpg`, `m-customer-maintenance.jpg`
- `EmptyState` 🛠️ "We'll be right back" / "ApnaTown is under maintenance. Please try again in a few minutes." + Check again → **no-store GET `/health`**. Preserve only a validated same-origin intended path, never a purchase POST or external redirect.
- Health HTTP 200 `maintenance` stays here; `ok` retries the intended route once. Network/error stays retryable, not falsely recovered. Blocked SSR marketplace pages use HTTP 503; health deliberately does not.
- No catch-all frontend redirect on Auth OTP/session recovery, signed callbacks, admitted existing-operation status/correctness flows or authenticated super-admin settings. An expired super session must be able to authenticate and disable maintenance; exact route admission is BE-owned.
- Acceptance: Given blocked checkout, when routed here, then its safe path survives without re-submitting a purchase. Given health maintenance/network error, when Check again is pressed, then it stays; given ok, then navigation retries once. Given an expired super session, when recovering, then Auth/settings stay reachable.

### S-CUST-38 Design system and checklists | `d-customer-design.jpg`, `m-customer-design.jpg`
- Internal page listing tokens, shared components (from `frontend-shared.md`), flows and checklists; built only in non-production for design QA (F-X-001, F-X-002, F-X-003, F-X-004).

## Feature components

`SettingsSectionNav`, `DeliverySettingsForm`, `MoneySettingsForm`, `PaymentsSettings`, `PolicySettingsForm`, `IntegrationsSettings`, `SeoSettingsForm`, `FeatureFlagList`, `LegalPageEditor` in `src/features/super-admin/settings`; `FaqList`, `SupportForm`, `LegalPage` in `src/features/support`. Shared: `EmptyState`, `ErrorState`, `Toggle`, `Input`, `Sheet`, `Toast`.

## i18n and analytics

Prefixes `superAdmin.settings.*`, `help.*`, `legal.*`, `system.*`. Events: `settings_saved`, `feature_flag_toggled`, `support_message_sent`, `error_page_shown`.

## Verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Manual UI/accessibility: atomic group payloads/versions, error focus and retained drafts, keyboard tabs/toggles/FAQ, paise/bps transforms, Hindi/dark, legal sanitisation, message-only support and null contacts. Manual journey J10: grouped Save versus stale-member rollback; future flags remain false; support→real admin alert/detail with scope denial; flag/legal cache refresh; maintenance→Auth recovery→disable→health recovery without new-charge replay. Verify signed callbacks and admitted in-flight correctness are not intercepted by the frontend redirect.
