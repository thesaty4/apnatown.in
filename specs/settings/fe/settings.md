# FE: settings

Features: F-SA-005, F-AC-005, F-AC-006, F-X-009 | Screens: S-SUPR-06, S-CUST-30, S-CUST-31, S-CUST-32, S-CUST-33, S-CUST-34, S-CUST-35, S-CUST-36, S-CUST-37, S-CUST-38 | Flows: J10

Backend contract: [BE settings](../be/settings.md)

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
- Delivery: slab rows "Up to (km)" / "Fee (₹)"; rider rule "Base per ride (₹)", "Per km (₹)" with live "Example: 3 km ride earns ₹41".
- Commission & plans: default commission %, platform fee ₹, plan rows (name, ₹/mo, commission %), promotion fee rows.
- Payments: toggles Online payments / Cash on delivery; gateway select; key status badge "Configured" / "Not configured" (no key input).
- Policies: refund window hours; review rule textarea; blocked words (chips).
- Notifications & WhatsApp: info "Keys are stored encrypted."; WhatsApp number, status badge, enable toggle; SMS provider; email sender.
- SEO: default title/description with search-result preview.
- Feature flags: toggles Customer reviews, Guest browsing, WhatsApp messages, Service booking (future), Donations (future), Maintenance; toggle saves immediately with toast "Updated".
- Legal pages: Terms of use, Privacy policy, Refund policy, About us → Edit `Sheet` with EN/HI tabs.
- Rupee inputs convert to paise in the form schema; save shows toast "Saved"/"Rules saved"; version conflict → reload banner.
- Acceptance: Given invalid slab order, inline error and no save; Given conflict, banner "Settings changed by someone else" + Reload; Given Hindi, all labels Hindi; Given dark mode, tokens apply.

### S-CUST-30 Help and support | `d-customer-help.jpg`, `m-customer-help.jpg`
- FAQ accordion (`details` with keyboard support); Contact support form "Your message" (required) → Send; Call (`tel:`) and WhatsApp (`wa.me`) buttons.
- Acceptance: Given empty message, inline error; Given sent, toast and form clears; Given offline, Send disabled with offline banner.

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
- `EmptyState` 🛠️ "We'll be right back" / "ApnaTown is under maintenance. Please try again in a few minutes." + Check again (calls `/health`).

### S-CUST-38 Design system and checklists | `d-customer-design.jpg`, `m-customer-design.jpg`
- Internal page listing tokens, shared components (from `frontend-shared.md`), flows and checklists; built only in non-production for design QA (F-X-001, F-X-002, F-X-003, F-X-004).

## Feature components

`SettingsSectionNav`, `DeliverySettingsForm`, `MoneySettingsForm`, `PaymentsSettings`, `PolicySettingsForm`, `IntegrationsSettings`, `SeoSettingsForm`, `FeatureFlagList`, `LegalPageEditor` in `src/features/super-admin/settings`; `FaqList`, `SupportForm`, `LegalPage` in `src/features/support`. Shared: `EmptyState`, `ErrorState`, `Toggle`, `Input`, `Sheet`, `Toast`.

## i18n and analytics

Prefixes `superAdmin.settings.*`, `help.*`, `legal.*`, `system.*`. Events: `settings_saved`, `feature_flag_toggled`, `support_message_sent`, `error_page_shown`.

## Tests

Component: paise conversion, slab validation, flag toggle, FAQ keyboard. E2E: J10 super admin changes rider earning; customer sees 404 on unknown route; maintenance flag shows maintenance page.
