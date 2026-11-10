# BE: users

Features: AU5, AU8, AC1–AC5; F-AU-005, F-AU-008, F-AC-001–F-AC-004, F-X-008 | Rules: BR-02, BR-11, BR-14 | State machines: none specified | Depends on: `geo`; used by `auth`, `businesses`, `communications`, `cart-checkout`

## Responsibility

Own user profiles, roles, saved addresses, account-level preferences, consent records, and data-request records. Authentication is owned by `auth`; payment credentials and their lifecycle are not stored here.

## Tables

| Table | Columns and constraints | Indexes |
|---|---|---|
| `users` | `id uuid PK`; `phone_ciphertext text NOT NULL`; `phone_lookup_hash bytea NOT NULL UNIQUE`; `email_ciphertext text NULL`; `display_name text NULL`; `preferred_locale text NOT NULL DEFAULT 'en' CHECK en/hi`; `theme_preference text NOT NULL DEFAULT 'light' CHECK light/dark/auto`; `deleted_at timestamptz NULL`; `created_at/updated_at timestamptz NOT NULL` | unique phone lookup hash; partial active-user index on `deleted_at` |
| `user_roles` | `user_id uuid NOT NULL FK users`; `role text NOT NULL` (six platform roles); `created_at timestamptz NOT NULL`; composite PK `(user_id,role)` | `(role,user_id)` for role lookup |
| `addresses` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `label text NOT NULL`; encrypted `address_text text NOT NULL`, `landmark text NULL`; `pin_code text NOT NULL`; `city_id uuid NOT NULL FK geo.cities`; `area_id uuid NULL FK geo.areas`; `location geography(Point,4326) NULL`; `is_default bool NOT NULL DEFAULT false`; `deleted_at timestamptz NULL`; `created_at/updated_at timestamptz NOT NULL` | `(user_id,deleted_at,created_at)`; unique partial default address per user |
| `consents` | `id uuid PK`; `user_id uuid NULL FK users`; `anonymous_subject_hash bytea NULL`; `purpose text NOT NULL`; `channel text NULL`; `granted bool NOT NULL`; `recorded_at timestamptz NOT NULL`; `source text NOT NULL`; check exactly one subject reference | `(user_id,purpose,recorded_at desc)`; `(anonymous_subject_hash,purpose,recorded_at desc)` |
| `data_requests` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `request_type text NOT NULL CHECK export/delete`; `idempotency_key text NOT NULL`; `requested_at timestamptz NOT NULL`; UNIQUE `(user_id,idempotency_key)` | `(user_id,requested_at desc)` |

`data_requests.status` and export delivery/deletion completion policy require product confirmation (Q-32); do not infer retention or hard-delete shared business records. Anonymous consent identity/purpose granularity remains Q-31. Saved payment-method data is owned by the payments contract (Q-33).

## Endpoints

| Method | Path | Auth / scope | Request → response | Errors | Idempotent | Features |
|---|---|---|---|---|---|---|
| GET | `/users/me` | Authenticated; own user | → profile DTO | `SESSION_EXPIRED` | Yes | F-AU-005, F-AC-001 |
| PATCH | `/users/me` | Authenticated; own user | allow-listed `{displayName,email}` → profile DTO | `VALIDATION_ERROR`, `USER_NOT_FOUND` | No | F-AU-005, F-AC-001 |
| GET | `/users/me/addresses` | Authenticated; own user | → address DTO list | `SESSION_EXPIRED` | Yes | F-AC-001 |
| POST | `/users/me/addresses` | Authenticated; own user | `{label,addressText,landmark,pinCode,cityId,areaId,lat,lng,isDefault}` → address DTO | `VALIDATION_ERROR`, `ADDRESS_OUT_OF_SCOPE` | Yes | F-AC-001 |
| PATCH | `/users/me/addresses/{addressId}` | Authenticated; address owner | Allow-listed address fields → address DTO | `VALIDATION_ERROR`, `ADDRESS_NOT_FOUND`, `ADDRESS_OUT_OF_SCOPE` | Yes | F-AC-001 |
| DELETE | `/users/me/addresses/{addressId}` | Authenticated; address owner | → deletion acknowledgement | `ADDRESS_NOT_FOUND`, `ADDRESS_OUT_OF_SCOPE` | Yes | F-AC-001 |
| GET/PATCH | `/users/me/preferences` | Authenticated; own user | `{locale?,theme?}` → saved preference | `VALIDATION_ERROR` | PATCH: yes | F-AC-003 |
| GET | `/users/me/consents` | Authenticated; own user | → recorded purposes/current choices | `SESSION_EXPIRED` | Yes | F-X-008, F-AC-004 |
| PUT | `/users/me/consents/{purpose}` | Authenticated self | `{channel?,granted}` → recorded consent | `VALIDATION_ERROR`, `CONSENT_PURPOSE_INVALID` | Yes | F-X-008, F-AC-004 |
| GET | `/consents` | Guest; anonymous consent cookie (Q-31) | → recorded anonymous choices | — | Yes | F-X-008 |
| PUT | `/consents/{purpose}` | Guest; anonymous consent cookie | `{channel?,granted}` → recorded anonymous consent | `VALIDATION_ERROR`, `CONSENT_PURPOSE_INVALID` | Yes | F-X-008 |
| POST | `/users/me/data-requests` | Authenticated; own user + CSRF | `{type:"export"|"delete"}` → `{requestId}` | `VALIDATION_ERROR` | Yes per request key | F-AU-008, F-AC-004 |

Use the shared error envelope and OpenAPI DTOs from [backend-shared.md](../../_foundation/backend-shared.md). `payments` owns stored provider references and the saved-method API contract (Q-33); users must not store card, bank, or provider credentials.

## Rules and use-cases

1. Profile completion accepts only the fields in the request DTO; name is 2–60 characters when supplied. Email remains optional.
2. Address mutations re-check the session user owns the address; validate six-digit PIN and geographic identifiers against `geo`; store coordinates only for the selected pin/address. Never accept a client-supplied user ID.
3. Setting an address as default is transactional and leaves at most one active default per user. Deleting the default does not silently select another address unless the user chooses one.
4. Account preferences accept only the supported `en|hi` locale and `light|dark|auto` theme values. Guest preferences are handled by the shared frontend; account-level persistence is separate.
5. Consent updates are append-only evidence: a new grant/revocation records purpose, timestamp, source and channel. WhatsApp communications must check current consent at send time (BR-11).
6. Export/delete requests are owned by the authenticated user. This spec records intake only; until Q-32 is resolved, do not claim a request is complete, promise a delivery channel/SLA, or hard-delete financial/shared records.
7. Account deletion follows the explicit request flow and confirmation shown in F-AU-008; on confirmed completion publish an event for `auth` to revoke active sessions and preserve records legally required for other users or accounting (BR-14).

## Events and jobs

- Publish `user.data_request.created` through the transactional outbox for an export/delete request; consumer and completion states are pending Q-32.
- Consent changes are available to `communications` as current consent state; no campaign is sent by `users`.
- On confirmed account deletion, publish an event for `auth` to revoke that user's active sessions; lifecycle and retention remain Q-32.

## Error codes added

| Code | Status | Message key |
|---|---:|---|
| `USER_NOT_FOUND` | 404 | `users.notFound` |
| `ADDRESS_NOT_FOUND` | 404 | `users.address.notFound` |
| `ADDRESS_OUT_OF_SCOPE` | 403 | `users.address.outOfScope` |
| `CONSENT_PURPOSE_INVALID` | 422 | `users.consent.purposeInvalid` |

## Acceptance criteria

1. Given an authenticated customer, when they update their name or optional email with valid values, then only their own profile fields change.
2. Given an address ID owned by another user, when a customer reads or mutates it, then the server returns a scoped denial and makes no change.
3. Given a valid address, when it is marked default, then the transaction leaves exactly one active default for that user.
4. Given a consent is granted or revoked, when saved, then a timestamped purpose/channel record is available to consent-aware senders and opt-out takes effect immediately.
5. Given an account requests export or deletion, when the request is accepted, then it is recorded for the owner and no unconfirmed completion or unsafe cascade is reported.
6. Given a client submits unknown profile fields or a different user ID, when the request is validated, then it is rejected without mass assignment.
7. Given a customer requests payment methods, when the payments owner is unavailable, then the API returns an explicit unavailable error rather than an empty success.

## Tests

- Unit: profile/address allow-lists; default-address transaction; consent append-only behavior; request idempotency.
- Integration: owner CRUD; consent revocation visible to sender query; export/delete request persistence.
- Authorization negatives: cross-user address ID; anonymous account access; unknown fields; stale consent; attempts to read another user's payment methods.
