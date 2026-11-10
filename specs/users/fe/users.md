# FE: users

Features: AU5, AU8, AC1–AC5; F-AU-005, F-AU-008, F-AC-001–F-AC-004, F-X-008 | Screens: S-CUST-23–S-CUST-29, S-CUST-33 | Flows: J12, J13

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index |
|---|---|---|---|---|
| `/account` | S-CUST-24 | SSR, private account menu | Customer session | `noindex` |
| `/account/profile` | S-CUST-25 | SSR data + client form | Customer session | `noindex` |
| `/account/addresses` | S-CUST-26 | SSR data + client map/form island | Customer session | `noindex` |
| `/account/preferences` | S-CUST-23 | SSR preferences + client toggles; notification channels owned by `notifications` | Customer session | `noindex` |
| `/login` | S-CUST-27 | Auth route; see [FE auth](../../auth/fe/auth.md) | Guest | `noindex` |
| `/session-expired` | S-CUST-28 | Auth route; see [FE auth](../../auth/fe/auth.md) | Guest | `noindex` |
| `/goodbye` | S-CUST-29 | Static confirmation after deletion request completes | Guest | `noindex` |
| `/privacy` | S-CUST-33 | Static legal copy owned by `settings`; account privacy actions link to F-AC-004 | Public | Index policy from settings |

## Screens

### S-CUST-24 — Account (`/account`)

- Screenshots: `d-customer-account.jpg`, `m-customer-account.jpg`.
- Layout: account sections for profile, addresses, payment methods, preferences, privacy, help and logout.
- Data: `GET /users/me`; saved payment-method data/API is owned by `payments` and linked when its spec is written (Q-33).
- Special states: guest entry leads to login; do not show protected records before session validation.
- Rules: BR-14; shared baseline states in [frontend-shared.md](../../_foundation/frontend-shared.md).
- Privacy actions: data export request and account deletion are explicit actions; deletion requires a confirmation step, and `/goodbye` appears only after server-confirmed completion. Processing and final copy remain Q-32.
- Acceptance:
  - Given a signed-in customer, when account opens, then only their own account links and data are shown.
  - Given a guest opens account, when the page loads, then login is offered without exposing private data.
  - Given saved methods cannot load, when account renders, then an explicit error/retry state is shown.

### S-CUST-25 — Profile (`/account/profile`)

- Screenshots: `d-customer-profile.jpg`, `m-customer-profile.jpg`.
- Data: `GET/PATCH /users/me`; profile completion is the same saved profile contract.
- Special states: invalid name/email; first-login completion may be skipped as stated by F-AU-005.
- Interactions: local form state; submit explicit allow-listed values.
- Acceptance:
  - Given a valid name and optional email, when saved, then the profile refreshes with server-confirmed values.
  - Given invalid input or a failed save, when submitted, then field errors remain visible and no optimistic success is shown.

### S-CUST-26 — Addresses (`/account/addresses`)

- Screenshots: `d-customer-addresses.jpg`, `m-customer-addresses.jpg`.
- Data: address CRUD endpoints; `geo` resolves city/area options and map selection.
- Special states: empty address book.
- Interactions: map pin, landmark, PIN, label, default; keyboard-accessible map controls and form alternative.
- Acceptance:
  - Given no saved addresses, when opened, then the empty action leads to add-address form.
  - Given the user selects a pin and valid address fields, when saved, then the address appears in their list and is not exposed to another account.
  - Given Hindi or dark theme, when editing, then fields and map controls remain readable and wrap without truncation.

### S-CUST-23 — Consent and preferences (`/account/preferences`)

- Screenshots: `d-customer-prefs.jpg`, `m-customer-prefs.jpg`.
- Data: user consent/preferences endpoints; notification delivery preferences are owned by `notifications`.
- Special states: consent save failure; explicit opt-out state.
- Interactions: explain purpose before opt-in; toggles require text labels and reflect server-confirmed state.
- Acceptance:
  - Given WhatsApp consent is off, when a customer opts in, then the purpose/channel choice and timestamp are recorded before future sends.
  - Given a customer opts out, when saved, then downstream communications stop honoring the prior grant immediately.

### Cookie consent (cross-cutting component; no own route)

- Screenshots: use the prototype's consent/banner pattern; no dedicated screenshot is listed for this feature.
- Data: anonymous or signed-in consent endpoint; anonymous identity and purpose categories remain Q-31.
- Interactions: record only the explicit purposes supplied by the approved copy; do not add analytics/advertising choices without approval.
- Acceptance:
  - Given a visitor changes a consent choice, when saved, then the choice is recorded with its purpose and timestamp.
  - Given consent persistence fails, when the visitor interacts, then the UI reports the failure and does not display a success-shaped confirmation.

### S-CUST-29 — Account deleted (`/goodbye`)

- Screenshots: `d-customer-bye.jpg`, `m-customer-bye.jpg`.
- Data: reached only after the backend confirms deletion processing; lifecycle policy remains Q-32.
- Acceptance:
  - Given deletion has not completed, when the user requests it, then the UI does not claim that the account is already deleted.
  - Given deletion is confirmed, when the user reaches this page, then no private profile data is rendered.

## Components and i18n

- Shared: `Input`, `AddressForm`, `AddressCard`, `MapView`, `Toggle`, `Button`, `Sheet`, `StateViews`.
- Key prefixes: `account.*`, `consent.*`, `privacy.*`; use approved EN/HI catalogue; do not invent legal or consent copy.
- Payment methods, legal-page content, login and notification preferences use their owning modules' contracts; no duplicate data fetching or business rules.

## Tests

- Component: profile validation, address empty/default/delete states, consent toggles, keyboard/map alternative, long Hindi.
- E2E: J12 profile completion; J13 locale/theme preference; account privacy and consent journeys when completion behavior is approved.
- Visual: 360px and desktop, EN/HI, light/dark.
