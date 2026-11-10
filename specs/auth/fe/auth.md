# FE: auth

Features: F-AU-004, F-AU-006, F-AU-007 | Screens: S-CUST-27, S-CUST-28 | Flows: J4, J12

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index |
|---|---|---|---|---|
| `/login` | S-CUST-27 | SSR shell; interactive OTP form is a client island | Guest; login available to all roles | `noindex` |
| `/session-expired` | S-CUST-28 | Static shell plus validated same-origin return path | Guest | `noindex` |
| Login-required sheet at the triggering route | S-CUST-11, S-CUST-21 and other gated origins | Client overlay; preserves origin route and pending action | Guest | Inherits origin |

## Screens

### S-CUST-27 — Login (`/login`)

- Screenshots: `d-customer-login.jpg`, `m-customer-login.jpg`.
- Layout: phone entry then six OTP boxes; EN/HI copy; mobile-first, matching the design tokens.
- Data: `POST /auth/otp/challenges`, `POST /auth/otp/challenges/{id}/verify`; see [BE auth](../be/auth.md).
- Special states: invalid/expired OTP, locked attempt limit, resend wait; optional email/Google methods remain unresolved (Q-30).
- Interactions: auto-advance, paste, numeric keyboard, accessible labels; resend is unavailable until 30 seconds; do not expose OTP or session token.
- Rules: BR-05; server is the sole verifier.
- Acceptance:
  - Given a valid phone, when the user requests login, then the page shows the resend countdown and OTP entry without displaying a code.
  - Given an invalid or locked code, when submitted, then a localized error appears and the six-box input remains keyboard accessible.
  - Given Hindi and dark mode, when the form renders at mobile and desktop widths, then translated text wraps and token contrast remains accessible.

### S-CUST-28 — Session expired (`/session-expired`)

- Screenshots: `d-customer-session.jpg`, `m-customer-session.jpg`.
- Layout: concise expiry message and re-login action.
- Data: re-login uses the auth endpoints; the return path is validated as same-origin.
- Special states: none beyond the shared baseline.
- Interactions: re-login returns to the original page when safe; discard an invalid/external return URL.
- Rules: BR-21.
- Acceptance:
  - Given the session expires during a protected action, when the user selects re-login and succeeds, then the app returns to the original safe route and resumes the pending action once.
  - Given a return path points off-site or contains an unsafe destination, when the session expires, then the app falls back to the product's safe origin rather than redirecting externally.

### Login-required prompt (AU6)

- Triggered by guest actions requiring authentication; preserve the current route and action context, including a Reels video ID. Do not gate public browsing or enquiry actions that the product allows to guests.
- Acceptance:
  - Given a guest invokes a login-required action, when the prompt opens, then it is shown in context and retains the origin.
  - Given login succeeds, when the origin is restored, then the pending action is completed once; a failed/cancelled login does not perform it.

## Components and i18n

- Shared: `PhoneInput`, `OtpInput`, `Input`, `Sheet`, `Button`, shared `StateViews`.
- Key prefix: `auth.login.*`, `auth.sessionExpired.*`; reuse the approved EN/HI catalogue.
- Session cookies are never read by client JavaScript or stored in browser storage.

## Tests

- Component: phone validation, OTP paste/auto-advance, cooldown, locked/error state, keyboard and screen-reader labels.
- E2E: J12 login then return to origin; J4 guest Reels action returns to same video.
- Visual: 360px and desktop, EN/HI, light/dark.
