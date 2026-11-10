# BE: auth

Features: F-AU-004, F-AU-006, F-AU-007 | Rules: BR-05, BR-21 | State machines: none | Depends on: `users`; used by all authenticated modules

## Responsibility

Issue and verify login challenges, create and revoke server-side sessions, and expose the authenticated principal. Guest browsing and the safe return-to-origin interaction are frontend concerns; authentication never trusts a client-side verified flag.

## Tables

| Table | Columns and constraints | Indexes |
|---|---|---|
| `otp_challenges` | `id uuid PK`, `phone_ciphertext text`, `phone_lookup_hash bytea`, `code_hash text`, `attempt_count int default 0`, `expires_at timestamptz`, `resend_after timestamptz`, `verified_at timestamptz null`, `created_at timestamptz`; encrypted phone and hash are never exposed | `(phone_lookup_hash, created_at desc)` for rate-limit lookup; `(expires_at)` for expiry cleanup |
| `sessions` | `id uuid PK`, `user_id uuid FK users`, `token_hash bytea unique`, `created_at timestamptz`, `expires_at timestamptz`, `revoked_at timestamptz null`, `last_seen_at timestamptz` | `(user_id, revoked_at, expires_at)` for active-session lookup; `(expires_at)` for cleanup |

Phone uniqueness and challenge concurrency are enforced in the repository transaction; clear OTPs and session tokens are never persisted.

## Endpoints

| Method | Path | Auth / scope | Request → response | Errors | Idempotent | Features |
|---|---|---|---|---|---|---|
| POST | `/auth/otp/challenges` | Guest; rate-limited | `{phone}` → `{challengeId,resendAfter}` | `VALIDATION_ERROR`, `OTP_RATE_LIMITED`, `OTP_DELIVERY_FAILED` | No | F-AU-004 |
| POST | `/auth/otp/challenges/{challengeId}/verify` | Guest; challenge-bound | `{code}` → principal; sets rotated httpOnly session cookie | `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED`, `OTP_NOT_FOUND` | No | F-AU-004 |
| GET | `/auth/session` | Session cookie | → `{userId,roles,approvalStates}` | `SESSION_EXPIRED` | Yes | F-AU-004, F-AU-007 |
| POST | `/auth/logout` | Authenticated session + CSRF | → `{loggedOut:true}`; revokes server session and clears cookie | `SESSION_EXPIRED`, `CSRF_INVALID` | Yes | F-AU-007 |

Use the shared error envelope and OpenAPI DTOs from [backend-shared.md](../../_foundation/backend-shared.md). OTP maximum attempts/expiry are configuration values; the resend cooldown is 30 seconds. Optional email/Google methods are not specified beyond their presence in the design; see Q-30.

## Rules and use-cases

1. Validate phone as the documented +91/10-digit number; normalize before rate limiting or challenge creation.
2. Generate a cryptographically secure six-digit code server-side, hash it, persist only the hash and send through the OTP port. Never log or return the code.
3. Enforce the 30-second resend cooldown and configured attempt limit server-side. Verify only against the challenge hash; lock or expire challenges according to configured limits.
4. On successful verification, resolve/create the user through `users`, rotate session credentials, and set a Secure, httpOnly, SameSite cookie. Never accept role or user ID from the request body.
5. Session validation checks server-side revocation and expiry. Logout revokes the current session; expired sessions are rejected and direct the frontend to `/session-expired`.
6. Preserve an origin only as a validated same-origin route in the frontend flow; do not use an arbitrary redirect supplied to these endpoints.

## Events and jobs

No domain event/job is required by the source pack. OTP delivery uses the `OtpDeliveryPort`; provider failure is explicit and must not expose whether an account exists.

## Error codes added

| Code | Status | Message key |
|---|---:|---|
| `OTP_INVALID` | 401 | `auth.otp.invalid` |
| `OTP_EXPIRED` | 410 | `auth.otp.expired` |
| `OTP_LOCKED` | 429 | `auth.otp.locked` |
| `OTP_RATE_LIMITED` | 429 | `auth.otp.rateLimited` |
| `OTP_DELIVERY_FAILED` | 503 | `auth.otp.deliveryFailed` |
| `SESSION_EXPIRED` | 401 | `auth.session.expired` |
| `CSRF_INVALID` | 403 | `auth.session.csrfInvalid` |

## Acceptance criteria

1. Given a valid phone and available OTP adapter, when a guest requests a challenge, then the server sends a six-digit OTP and returns only the challenge ID and resend time.
2. Given the resend cooldown has not elapsed, when the same challenge requests a resend, then the server rejects it without sending another code.
3. Given a valid unexpired code, when the guest verifies the matching challenge, then the server establishes a rotated session cookie and returns the authenticated principal.
4. Given an incorrect, expired, or locked challenge, when a code is submitted, then verification fails with a stable error and no session is created.
5. Given an OTP or session token, when the request is logged or serialized, then neither secret appears in logs, response bodies, or stored plaintext.
6. Given a session is expired or revoked, when it is used, then the protected request is denied and the client receives `SESSION_EXPIRED`.
7. Given a user requests logout without a valid CSRF token, when the request is processed, then it is rejected and the session is not silently treated as logged out.
8. Given an arbitrary external return URL, when login completes, then auth does not redirect to that URL.

## Tests

- Unit: phone normalization; cooldown; attempt count; expiry; session rotation and revocation.
- Integration: challenge/verify with deterministic OTP fake; logout invalidates cookie; repeated verification cannot create another session.
- Authorization negatives: expired/revoked cookie; invalid CSRF; unknown challenge; provider outage; no OTP disclosure or account-enumeration response.
