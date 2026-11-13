# BE: auth

Features: F-AU-004, F-AU-006, F-AU-007 | Rules: BR-05, BR-21 | Depends on: `users`

Frontend counterpart: [FE auth](../fe/auth.md).

Status: backend implemented; runtime checks and security review pending.

## Responsibility

Auth handles mobile OTP login, server-side sessions, logout and the current user. Guests can browse without logging in. Returning to the original page after login is handled by the frontend.

## Tables

| Table | Key fields | Indexes |
|---|---|---|
| `otp_challenges` | `id`, encrypted phone, phone lookup hash, OTP hash, `attempt_count`, `expires_at`, `resend_after`, `verified_at`, `superseded_at`, `created_at` | `(phone_lookup_hash, created_at desc)`, `(expires_at)` |
| `sessions` | `id`, `kind` (`anonymous`/`authenticated`), `user_id`, unique token hash, CSRF token, `expires_at`, `revoked_at`, `last_seen_at`, `created_at` | `(user_id, revoked_at, expires_at)`, `(expires_at)` |

Never store plain OTPs, phone numbers, or session cookie values. Anonymous sessions have no user; authenticated sessions must have one.

## Endpoints

| Method | Path | Access | Request → response | Main errors |
|---|---|---|---|---|
| GET | `/auth/csrf` | Guest or user | → `{csrfToken}` | `COMMON_RATE_LIMITED` |
| POST | `/auth/otp/challenges` | Guest + CSRF | `{phone}` → `{challengeId,resendAfter,expiresAt}` | `VALIDATION_ERROR`, `OTP_RATE_LIMITED`, `OTP_DELIVERY_FAILED`, `CSRF_INVALID` |
| POST | `/auth/otp/challenges/{challengeId}/verify` | Guest + CSRF | `{code}` → current user; sets session cookie | `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED`, `OTP_NOT_FOUND`, `ACCOUNT_UNAVAILABLE`, `CSRF_INVALID` |
| GET | `/auth/session` | Logged-in user | → `{userId,roles,approvalStates,accountStatus,expiresAt}` | `SESSION_EXPIRED`, `ACCOUNT_UNAVAILABLE` |
| POST | `/auth/logout` | Logged-in user + CSRF | → `{loggedOut:true}`; clears cookie | `SESSION_EXPIRED`, `CSRF_INVALID` |
| POST | `/auth/demo/sessions` | Local/test only when `DEMO_LOGIN_ENABLED`; CSRF | `{persona}` → current user; sets session cookie | `DEMO_PERSONA_UNAVAILABLE`, `VALIDATION_ERROR`, `CSRF_INVALID`, `COMMON_RATE_LIMITED`; 404 when disabled |

Use the shared error format from [backend-shared.md](../../_foundation/backend-shared.md). Auth responses are `no-store`.

## Rules

1. Accept only a valid Indian mobile number and normalize it before use.
2. Generate a six-digit OTP on the server, store only its hash, and send it through the OTP adapter. Never log or return it.
3. Enforce a 30-second resend cooldown and configured expiry/attempt limits. A new OTP replaces older unused OTPs for that phone.
4. A challenge can create only one session. Wrong, expired, locked, reused, or replaced OTPs cannot log in.
5. After successful OTP verification, find or create the user through `users`, check account status, and set a new Secure, httpOnly, SameSite cookie. Never trust a user ID or role sent by the client.
6. Suspended, deleting, or deleted accounts cannot log in or use an existing session.
7. Protected requests require an active, unexpired authenticated session. Always read current account status and roles from the database.
8. Check CSRF token and request Origin on every browser request that changes data, including login and logout.
9. Logout revokes the current session and clears its cookie. Expired sessions return `SESSION_EXPIRED`.
10. Do not redirect to a URL supplied to Auth. Only the frontend may return the user to a safe internal page.
11. Demo login is never available in production. It only signs in an existing active seeded user for an allowed persona and must not create users or grant roles. Allowed personas (`DEMO_PERSONAS`, seeded by `db:seed`): `customer` (u1, 9876543210), `vendor` (b1 owner, 9876500001), `provider` (s1 owner, 9876500101), `rider` (r1 Sunil Yadav, 9876500401; approved Delivery rider profile), `admin` (ad1, 9876500501) and `super_admin` (synthetic 9876500500). The seeded user must already hold the persona role.
12. Email and Google login stay unavailable until Q-30 is decided. Phone number changes stay read-only until Q-43 is decided.

## Error codes added

| Code | Status | Message key |
|---|---:|---|
| `OTP_INVALID` | 401 | `auth.otp.invalid` |
| `OTP_NOT_FOUND` | 404 | `auth.otp.notFound` |
| `OTP_EXPIRED` | 410 | `auth.otp.expired` |
| `OTP_LOCKED` | 429 | `auth.otp.locked` |
| `OTP_RATE_LIMITED` | 429 | `auth.otp.rateLimited` |
| `OTP_DELIVERY_FAILED` | 503 | `auth.otp.deliveryFailed` |
| `SESSION_EXPIRED` | 401 | `auth.session.expired` |
| `CSRF_INVALID` | 403 | `auth.session.csrfInvalid` |
| `ACCOUNT_UNAVAILABLE` | 403 | `auth.account.unavailable` |
| `DEMO_PERSONA_UNAVAILABLE` | 404 | `auth.demo.personaUnavailable` |

## Acceptance criteria

1. A valid phone receives an OTP; the response contains only challenge ID, resend time and expiry.
2. Resending before 30 seconds is rejected.
3. A valid OTP creates a session cookie and returns the current user.
4. Wrong, expired, locked, reused, or replaced OTPs do not create a session.
5. OTPs and session tokens never appear in logs, responses, or plain-text storage.
6. Expired, revoked, or anonymous sessions cannot access protected endpoints.
7. Login and logout fail without valid CSRF and Origin checks.
8. Suspended or deleted users cannot log in or keep using an old session.
9. Auth never redirects to an external return URL.
10. Demo login returns 404 when disabled and is refused in production.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): use manual acceptance evidence and existing non-test checks only; do not add automated test files.
