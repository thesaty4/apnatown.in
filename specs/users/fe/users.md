# FE: users

Features: AU5, AU8, AC1–AC5; F-AU-005, F-AU-008, F-AC-001, F-AC-002, F-AC-003, F-AC-004, F-X-008 | Screens: S-CUST-23–S-CUST-29, S-CUST-33 | Flows: J12, J13

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index |
|---|---|---|---|---|
| `/account` | S-CUST-24 | SSR guest menu or private account menu; no guest private-data fetch | Guest/customer | `noindex` |
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
- Data: authenticated `GET /users/me`; saved payment-method capability/data is owned by [Payments](../../payments/be/payments.md) under Q-33. Guest account renders only the public menu and login action.
- Special states: guest entry leads to login; do not show protected records before session validation.
- Rules: BR-14; shared baseline states in [frontend-shared.md](../../_foundation/frontend-shared.md).
- Privacy actions: `POST /users/me/data-requests`; poll its owner-scoped status. Completed export opens the prototype's Your data JSON sheet and Copy data action using the export endpoint; show preparing/blocked/failed/expired with retry, never a blank successful export. Deletion requires the prototype confirmation that profile/addresses/bookmarks are erased but order records are retained. `/goodbye` appears only after server-confirmed completion; Q-32 policy blocks are visible, with no invented completion time.
- Acceptance:
  - Given a signed-in customer, when account opens, then only their own account links and data are shown.
  - Given a guest opens account, when the page loads, then login is offered without exposing private data.
  - Given saved methods cannot load, when account renders, then an explicit error/retry state is shown.

### S-CUST-25 — Profile (`/account/profile`)

- Screenshots: `d-customer-profile.jpg`, `m-customer-profile.jpg`.
- Data: `GET/PATCH /users/me`; profile completion is the same saved profile contract. The verified login phone is read-only until Auth's number-change verification question is resolved; generic profile PATCH cannot silently change login identity.
- Special states: invalid name/email; first-login completion may be skipped as stated by F-AU-005.
- Interactions: local form state; submit explicit allow-listed values.
- Acceptance:
  - Given a valid name and optional email, when saved, then the profile refreshes with server-confirmed values.
  - Given invalid input or a failed save, when submitted, then field errors remain visible and no optimistic success is shown.

### S-CUST-26 — Addresses (`/account/addresses`)

- Screenshots: `d-customer-addresses.jpg`, `m-customer-addresses.jpg`.
- Data: address CRUD endpoints include `version`; send `expectedVersion` for edit/default/delete. `geo` resolves city/area options and map selection. A conflict preserves the draft and offers refresh/review, not an automatic overwrite; refresh checkout's address/quote after a confirmed change.
- Special states: empty address book.
- Interactions: map pin, landmark, PIN, label, default; keyboard-accessible map controls and form alternative.
- Acceptance:
  - Given no saved addresses, when opened, then the empty action leads to add-address form.
  - Given the user selects a pin and valid address fields, when saved, then the address appears in their list and is not exposed to another account.
  - Given another tab changes an address, when a stale edit/default/delete is submitted, then the conflict is visible and the latest address is not overwritten.
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
- Interactions: record only the explicit purposes supplied by the approved copy and send its current `noticeVersion` for a grant; do not add analytics/advertising choices without approval. Withdrawal remains possible when notice copy changes.
- Acceptance:
  - Given a visitor changes a consent choice, when saved, then the choice is recorded with its purpose and timestamp.
  - Given consent persistence fails, when the visitor interacts, then the UI reports the failure and does not display a success-shaped confirmation.

### S-CUST-29 — Account deleted (`/goodbye`)

- Screenshots: `d-customer-bye.jpg`, `m-customer-bye.jpg`.
- Data: reached only after the backend confirms deletion processing. Keep the deletion completion capability in the active flow's memory and use `GET /users/data-requests/{requestId}/completion` if session revocation precedes the final poll; never put it in a URL/browser storage. Clear private caches and capability after confirmed completion. Reload without proof shows no invented deletion success.
- Acceptance:
  - Given deletion has not completed, when the user requests it, then the UI does not claim that the account is already deleted.
  - Given deletion is confirmed, when the user reaches this page, then no private profile data is rendered.

## Components and i18n

- Shared: `Input`, `AddressForm`, `AddressCard`, `MapView`, `Toggle`, `Button`, `Sheet`, `StateViews`.
- Key prefixes: `account.*`, `consent.*`, `privacy.*`; use approved EN/HI catalogue; do not invent legal or consent copy.
- Payment methods, legal-page content, login and notification preferences use their owning modules' contracts; no duplicate data fetching or business rules.

## Tests

- Component: profile validation, address empty/default/delete states, consent toggles, keyboard/map alternative, long Hindi.
- E2E: J12 profile completion; J13 locale/theme preference; Your data/Copy data, owner-denied/expired export, blocked deletion, completion after session revocation and consent withdrawal. Destructive production deletion remains Q-32-gated.
- Visual: 360px and desktop, EN/HI, light/dark.
