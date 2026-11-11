# BE: auth

Features: F-AU-004, F-AU-006, F-AU-007 | Rules: BR-05, BR-21 | State machines: none | Depends on: `users`; used by all authenticated modules

Frontend counterpart: [FE auth](../fe/auth.md).

Implementation status: local backend slice implemented; runtime verification and
security-auditor hand-off pending. Includes the Users identity/profile/preferences
dependency, not addresses, consent, privacy processing or privileged authority.

## Responsibility

Issue and verify login challenges, create and revoke server-side sessions, and expose the authenticated principal. Guest browsing and the safe return-to-origin interaction are frontend concerns; authentication never trusts a client-side verified flag.

## Tables

| Table | Columns and constraints | Indexes |
|---|---|---|
| `otp_challenges` | `id uuid PK`, `phone_ciphertext text`, `phone_lookup_hash bytea`, `code_hash text`, `attempt_count int default 0`, `expires_at timestamptz`, `resend_after timestamptz`, `verified_at timestamptz null`, `superseded_at timestamptz null`, `created_at timestamptz`; encrypted phone and hash are never exposed | `(phone_lookup_hash, created_at desc)` for rate-limit lookup; `(expires_at)` for expiry cleanup |
| `sessions` | `id uuid PK`, `kind text CHECK anonymous/authenticated`, `user_id uuid FK users null`, `token_hash bytea unique`, `csrf_token text`, `created_at timestamptz`, `expires_at timestamptz`, `revoked_at timestamptz null`, `last_seen_at timestamptz`; CHECK anonymous has no user and authenticated has a user | `(user_id, revoked_at, expires_at)` for active-session lookup; `(expires_at)` for cleanup |

Phone uniqueness and challenge concurrency are enforced in the repository transaction; clear OTPs and bearer session-cookie values are never persisted. `csrf_token` is the synchronizer library's private server-side state, not a bearer login credential; never expose the session row, log this field or put it in audit/outbox/idempotency data.

### Persistence implementation

The Prisma `OtpChallenge`/`Session` models and additive
[`20261111173739_auth_storage`](../../../apps/api/prisma/migrations/20261111173739_auth_storage/migration.sql)
migration supply these tables after the Users identity migration. OTP challenges
remain pre-account records without a user FK. Session ownership restricts user
deletion/ID updates, never cascades or silently converts an authenticated row to
anonymous. SQL enforces the kind/user pairing, non-negative attempt counts,
expiry after creation, resend time not before creation and the shared opaque-token
helper's 32-byte session digest. It does not impose a new TTL or attempt limit.

The phone/creation B-tree supports latest-challenge/cooldown reads; expiry
B-trees support future bounded Auth cleanup; the unique token digest index
supports session resolution; and `(user_id,revoked_at,expires_at)` supports
active-session reads/revocation. Each adds insert/update/storage cost for its
query, not an index for every field. Plans and runtime-role behavior still need
verification with representative non-PII data before rollout.

The transaction-wrapped migration inserts no challenges, credentials or users.
Runtime DML grants cover only these Auth tables. A failed migration requires
inspection of its record/schema before resolution or retry; later repair is a
new migration or approved restore, not an automatic destructive down migration.
Client generation and schema validation are offline; no database application,
constraint/grant execution or session/OTP flow has been verified.

The local backend slice now supplies contextual AES-GCM encryption, separately
keyed phone/code hashes, serialized challenge/cooldown/attempt consumption,
PostgreSQL-backed csrf-sync state, rotated opaque session cookies, live identity
checks, five Auth endpoints and bounded expiry cleanup. Private local OTP delivery
is opt-in; production startup explicitly fails until a real provider/fallback and
approved policy settings are configured. Business/rider approval states remain
explicitly unavailable and grant no operational authority. Runtime/database
verification has not been performed. Four focused unit checks covering DTOs,
cryptography, CSRF and cookies pass; database integration coverage remains unrun.

- Given invalid kind/user pairing, a missing user, a wrong-length session digest
  or duplicate digest, when a session is persisted, then its constraints reject it.
- Given negative attempts or invalid creation/expiry/resend ordering, when a
  challenge is persisted, then it is rejected; no implicit account is created.
- Given this migration alone, when the application starts, then no login
  endpoint, credential seed, session authentication or expiry-cleanup job is enabled.

## Endpoints

| Method | Path | Auth / scope | Request → response | Errors | Idempotent | Features |
|---|---|---|---|---|---|---|
| GET | `/auth/csrf` | Guest or authenticated; same-origin, no-store | → `{csrfToken}` bound to the current anonymous/session context by the shared CSRF middleware | `COMMON_RATE_LIMITED` | Read | F-AU-004, F-AU-007 |
| POST | `/auth/otp/challenges` | Guest; rate-limited; CSRF + Origin check | `{phone}` → `{challengeId,resendAfter,expiresAt}` | `VALIDATION_ERROR`, `OTP_RATE_LIMITED`, `OTP_DELIVERY_FAILED`, `CSRF_INVALID` | No | F-AU-004 |
| POST | `/auth/otp/challenges/{challengeId}/verify` | Guest; challenge-bound; CSRF + Origin check | `{code}` → principal; sets rotated httpOnly session cookie | `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED`, `OTP_NOT_FOUND`, `ACCOUNT_UNAVAILABLE`, `CSRF_INVALID` | No | F-AU-004 |
| GET | `/auth/session` | Session cookie; no-store | → `{userId,roles,approvalStates,accountStatus,expiresAt}` from current owner-module state | `SESSION_EXPIRED`, `ACCOUNT_UNAVAILABLE` | Yes | F-AU-004, F-AU-007 |
| POST | `/auth/logout` | Authenticated session + CSRF | → `{loggedOut:true}`; revokes server session and clears cookie | `SESSION_EXPIRED`, `CSRF_INVALID` | Yes | F-AU-007 |

Use the shared error envelope and OpenAPI DTOs from [backend-shared.md](../../_foundation/backend-shared.md). OTP maximum attempts/expiry are configuration values; the resend cooldown is 30 seconds. Optional email/Google methods are not specified beyond their presence in the design; see Q-30.

## Rules and use-cases

1. Validate phone as the documented +91/10-digit number; normalize before rate limiting or challenge creation.
2. Generate a cryptographically secure six-digit code server-side, hash it, persist only the hash and send through the OTP port. Never log or return the code.
3. Enforce the 30-second phone-level resend cooldown and configured attempt limit server-side. Resend creates a new challenge and supersedes previous unconsumed challenges for that phone. Lock the challenge row while checking expiry, supersession, attempts and `verified_at`; increment failed attempts and consume successful verification atomically. Concurrent verification can issue at most one session; a used or superseded challenge is invalid.
4. On successful verification, resolve/create the user through `users`, check current account status, rotate session credentials, and set a Secure, httpOnly, SameSite cookie. Never accept role or user ID from the request body. A suspended/deleting/deleted identity cannot obtain a fresh session; consume the valid challenge but commit no session and return `ACCOUNT_UNAVAILABLE`.
5. Authentication requires an unrevoked, unexpired `kind=authenticated` session with a current active user; an anonymous CSRF session never authenticates `/auth/session` or a protected route. Recheck current user status, roles and business/rider approval capabilities; cookie claims are not authoritative. Logout revokes the current session; expired authenticated sessions direct the frontend to `/session-expired`. `AuthSessionPort.revokeUserSessions({userId})` serves suspension/deletion; the live-status check closes asynchronous revocation races.
6. Preserve an origin only as a validated same-origin route in the frontend flow; do not use an arbitrary redirect supplied to these endpoints.
7. Use the foundation's same-origin `/api` transport and `csrf-sync` synchronizer middleware, including anonymous login requests. Auth owns its PostgreSQL-backed state in `sessions`; no second store, Redis or process-local fallback. `/auth/csrf` creates a short-lived anonymous session when needed or returns the current session's token. It persists state before sending the cookie/token and never refreshes expired authenticated access implicitly. `ANONYMOUS_SESSION_TTL_SECONDS` is positive validated server config; local/test uses an explicit short fixture value, production requires an approved value.
8. Hydrate request-local CSRF state from the validated session before the library runs. Its `getTokenFromState`/`storeTokenInState` callbacks operate synchronously on that state; repository persistence is awaited outside those callbacks. Reuse an existing token on bootstrap, so another tab does not invalidate it. Login atomically revokes the anonymous/old session and issues a new authenticated session plus new CSRF state; logout revokes state and clears the cookie, then the client bootstraps a fresh anonymous context. Check `X-CSRF-Token` and Origin before every browser mutation; no handwritten token-generation/comparison protocol.
9. Auth/session responses are private/no-store and no service worker caches them. OTP fakes are test/local delivery adapters, never a production fixed-code bypass. Rate-limit anonymous session creation and clean up expired/revoked records in bounded batches.
10. Use the foundation's [rejected-verification transaction contract](../../_foundation/data-model.md#shared-runtime-persistence): wrong-code attempts/locks and valid-challenge consumption for `ACCOUNT_UNAVAILABLE` commit before the HTTP error is raised. No session is created on rejection. Unexpected failures roll back; a broad catch must not turn them into a committed authentication outcome.

Open question: profile phone editing in `js7.js` has no verified-number-change flow (Q-43). Login identity cannot be changed through generic profile PATCH; keep that field read-only until re-verification and account-linking behavior are approved. Email/Google controls remain explicitly unavailable under Q-30, not success-shaped demo logins.

## Events and jobs

No domain event/job is required by the source pack. OTP delivery uses the `OtpDeliveryPort`; provider failure is explicit and must not expose whether an account exists.

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

## Acceptance criteria

1. Given a valid phone and available OTP adapter, when a guest requests a challenge, then the server sends a six-digit OTP and returns only the challenge ID and resend time.
2. Given the resend cooldown has not elapsed, when the same challenge requests a resend, then the server rejects it without sending another code.
3. Given a valid unexpired code, when the guest verifies the matching challenge, then the server establishes a rotated session cookie and returns the authenticated principal.
4. Given an incorrect, expired, or locked challenge, when a code is submitted, then verification fails with a stable error and no session is created.
5. Given an OTP or session token, when the request is logged or serialized, then neither secret appears in logs, response bodies, or stored plaintext.
6. Given a session is expired or revoked, when it is used, then the protected request is denied and the client receives `SESSION_EXPIRED`.
7. Given a user requests logout without a valid CSRF token, when the request is processed, then it is rejected and the session is not silently treated as logged out.
8. Given an arbitrary external return URL, when login completes, then auth does not redirect to that URL.
9. Given two correct verifications race, when the challenge is locked and consumed, then exactly one session is issued; stale resend challenges and replayed codes cannot log in.
10. Given an account is suspended/deleted, when its OTP or existing session is used, then no protected access is granted, even before a revocation event is delivered.
11. Given a cross-site login/logout request or missing CSRF token, when the API receives it, then it is denied; same-origin anonymous CSRF bootstrap permits the legitimate login flow.
12. Given an anonymous CSRF session, when it calls `/auth/session` or a protected endpoint, then it receives 401; its cookie does not grant a customer or applicant role.
13. Given two API processes and concurrent tabs, when they bootstrap/use the same session token or an API restarts, then CSRF remains valid through PostgreSQL state; login/logout invalidates the old binding everywhere.

## Tests

- Given a wrong OTP or a valid OTP for a blocked account, when verification returns its non-2xx error, then the committed attempt/lock or challenge consumption survives a new database connection, no session exists, and unexpected transaction failure still rolls back.
- Unit: phone normalization; cooldown; attempt count; expiry; session rotation and revocation.
- Integration: challenge/verify with deterministic OTP fake; logout invalidates cookie; concurrent verification, attempt-limit and resend races; live status/role changes; anonymous-to-authenticated CSRF rotation.
- Authorization negatives: expired/revoked cookie; invalid CSRF; unknown challenge; provider outage; no OTP disclosure or account-enumeration response.
