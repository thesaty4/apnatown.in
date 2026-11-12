# FE: auth

Features: F-AU-004, F-AU-006, F-AU-007 | Screens: S-CUST-27, S-CUST-28 | Flows: J4, J12

API integration: [shared React Query contract](../../_foundation/frontend-shared.md#api-integration-with-react-query), including the transport-owned CSRF boundary.

### Implemented Auth/account query policy

| Surface | Query key / mutation hook | Policy |
|---|---|---|
| Session | `sessionOptions`, `['auth','session']` | Fresh for 30 seconds; successful sessions revalidate on focus/reconnect. Expiry, cross-tab events and BFCache restoration invalidate authority. |
| Profile/account summary | `profileOptions`, `['private',scope,'profile']`; `useSaveProfile` | Fresh for 30 seconds; confirmed saves cancel matching reads, set the authoritative result and invalidate without an immediate duplicate GET. |
| Account/global preferences | `preferencesOptions`, `['private',scope,'preferences']`; `useSavePreferences` | Same policy; global preference controls share this cache, with no separate response store. |
| OTP challenge/resend/verify and logout | `usePrivateMutation` through feature hooks | No automatic retry or offline replay; reset transient inputs/results after the flow. CSRF stays outside query data. |

Scope includes user ID, sorted roles, approval states and the in-memory auth
revision; no phone, OTP, credentials or private document data enters keys.
These responses are locale-independent, so locale is not a key dimension.
Query GC is five minutes; mutations use GC zero. Reads use `retry: false` and
`retryOnMount: false`, with explicit Retry UI. Mutations use
`networkMode: 'always'` so offline commands fail rather than resume later.
Request-local SSR caches hydrate already-read results through
`HydrationBoundary`; no server cache is shared across requests. Logout, expiry
or identity changes cancel/remove private data and fence stale callbacks.

The focused offline Auth/query suite covers hydration, deduplication, errors,
scope changes, invalidation and stale read/mutation races. Mounted browser
journeys, cross-tab/BFCache events and interactive accessibility remain unverified.

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
- Data: bootstrap `GET /auth/csrf`, then `POST /auth/otp/challenges` and `POST /auth/otp/challenges/{id}/verify` through the credentialed same-origin client; refresh CSRF binding and `GET /auth/session` after login. See [BE auth](../be/auth.md).
- Special states: invalid/expired OTP, locked attempt limit, resend wait; optional email/Google methods remain unresolved (Q-30).
- Interactions: auto-advance, paste, numeric keyboard, accessible labels; calculate resend wait from server `resendAfter`, replace `challengeId` after resend and clear old digits. Do not expose OTP or session token. Email/Google have explicit unavailable states until configured; never use the prototype demo-login handler.
- Rules: BR-05; server is the sole verifier.
- Acceptance:
  - Given a valid phone, when the user requests login, then the page shows the resend countdown and OTP entry without displaying a code.
  - Given an invalid or locked code, when submitted, then a localized error appears and the six-box input remains keyboard accessible.
  - Given Hindi and dark mode, when the form renders at mobile and desktop widths, then translated text wraps and token contrast remains accessible.
  - Given a resend supersedes the prior challenge or the account is unavailable, when verification fails, then show its localized error and do not enter a dashboard or replay a pending action.

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
- Session cookies are never read by client JavaScript or stored in browser storage. CSRF tokens stay in the shared client's memory; reload bootstraps them again. A session-invalidating response clears private query caches before a new account logs in.

## Tests

- Component: phone validation, OTP paste/auto-advance, cooldown, locked/error state, keyboard and screen-reader labels.
- E2E: J12 login then return to origin; J4 guest Reels action returns to same video.
- Visual: 360px and desktop, EN/HI, light/dark.
