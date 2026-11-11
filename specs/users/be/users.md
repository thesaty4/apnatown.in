# BE: users

Features: AU5, AU8, AC1–AC5; F-AU-005, F-AU-008, F-AC-001, F-AC-002, F-AC-003, F-AC-004, F-X-008 | Rules: BR-02, BR-11, BR-14 | State machines: data-request processing below | Depends on: `geo`; used by `auth`, `businesses`, `communications`, `cart-checkout`

Frontend counterpart: [FE users](../fe/users.md).

## Responsibility

Own user profiles, roles, saved addresses, account-level preferences, consent records, and data-request records. Authentication is owned by `auth`; payment credentials and their lifecycle are not stored here.

## Tables

| Table | Columns and constraints | Indexes |
|---|---|---|
| `users` | `id uuid PK`; `phone_ciphertext text NULL`; `phone_lookup_hash bytea NULL UNIQUE`; `email_ciphertext text NULL`; `display_name text NULL`; `preferred_locale text NOT NULL DEFAULT 'en' CHECK en/hi`; `theme_preference text NOT NULL DEFAULT 'light' CHECK light/dark/auto`; `account_status text NOT NULL DEFAULT 'active' CHECK active/suspended/deleting`; `version int NOT NULL DEFAULT 1`; `deleted_at timestamptz NULL`; CHECK non-deleted identities retain both phone fields; approved erasure may null them on the tombstone; `created_at/updated_at timestamptz NOT NULL` | unique non-null phone lookup hash; partial active-user index on `deleted_at` |
| `user_roles` | `user_id uuid NOT NULL FK users`; `role text NOT NULL` (six platform roles); `created_at timestamptz NOT NULL`; composite PK `(user_id,role)` | `(role,user_id)` for role lookup |
| `addresses` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `label text NOT NULL`; encrypted `address_text text NOT NULL`, `landmark text NULL`; `pin_code text NOT NULL`; `city_id uuid NOT NULL FK geo.cities`; `area_id uuid NULL FK geo.areas`; `location geography(Point,4326) NULL`; `is_default bool NOT NULL DEFAULT false`; `version int NOT NULL DEFAULT 1`; `deleted_at timestamptz NULL`; `created_at/updated_at timestamptz NOT NULL` | `(user_id,deleted_at,created_at)`; unique partial default address per user |
| `consents` | `id uuid PK`; `user_id uuid NULL FK users`; `anonymous_subject_hash bytea NULL`; `purpose text NOT NULL`; `channel text NULL`; `granted bool NOT NULL`; `notice_version text NULL` (required for grants); `recorded_at timestamptz NOT NULL`; `source text NOT NULL`; check exactly one subject reference | `(user_id,purpose,channel,recorded_at desc,id)`; `(anonymous_subject_hash,purpose,channel,recorded_at desc,id)` |
| `data_requests` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `request_type text NOT NULL CHECK export/delete`; `status text NOT NULL DEFAULT 'queued' CHECK queued/processing/blocked/completed/failed`; `idempotency_key text NOT NULL`; `policy_version text NULL`; `completed_steps jsonb NOT NULL DEFAULT '{}'` (owner-module receipts, no personal data); `artifact_storage_key text NULL` (private generated export, never a client input); `artifact_expires_at timestamptz NULL`; `completion_token_hash bytea NULL`; `completion_token_expires_at timestamptz NULL` (delete-status capability only); `failure_code text NULL`; `requested_at/updated_at timestamptz NOT NULL`; `completed_at timestamptz NULL`; UNIQUE `(user_id,idempotency_key)` | `(user_id,requested_at desc,id)`; partial `(status,requested_at,id)` for queued/retry work |

Q-32 still gates approved retention, export expiry, deletion boundaries and re-registration policy, not the processing/status contract below. Anonymous consent identity/purpose granularity remains Q-31. Saved payment-method data is owned by [Payments](../../payments/be/payments.md) (Q-33); disabled/unconfigured methods return an explicit unavailable state.

### Identity persistence implementation

The Prisma `User`/`UserRole` models and additive
[`20261111172454_users_identity`](../../../apps/api/prisma/migrations/20261111172454_users_identity/migration.sql)
migration cover only `users` and `user_roles`, the identity prerequisites for
Auth. No accounts or privileged memberships are seeded. Identity resolution,
live-principal lookup, encrypted profile fields and own profile/preferences
endpoints are implemented for local use. Privileged approval integrations and
role-grant use-cases remain unavailable; addresses, consent and data-request
persistence remain separate slices.

SQL CHECK constraints enforce locale/theme/status/role values, positive version,
optional 2-60-character display names and paired phone fields. Non-deleted rows
require both phone fields; only a tombstone may hold both as NULL. This storage
capability does not approve Q-32 erasure or re-registration. The nullable unique
B-tree on `phone_lookup_hash` reserves every retained non-null identity, not only
active accounts, while allowing multiple NULL tombstones. The partial B-tree on
`deleted_at WHERE deleted_at IS NULL` serves live-identity filtering; the
`user_roles(role,user_id)` B-tree serves role-first lookups, complementing the
user-first composite primary key. These add write/storage cost on their indexed
fields; representative query plans remain required before rollout.

The membership FK restricts physical user deletion and ID updates. Runtime
privileges are Users `SELECT/INSERT/UPDATE` (no hard delete), memberships
`SELECT/INSERT/DELETE` (grant/revoke, not in-place identity rewriting).
Owning application authorization/audit is still required; table privileges
alone never authorize a role grant.

The migration is transactional and forward-only, without data backfill. On
failure, inspect the migration record and actual schema before resolving or
retrying; never mark an unconfirmed migration applied. Once data exists,
preserve it and repair through a new migration or an approved restore, not by
dropping identity tables. SQL was generated offline then supplemented with
CHECK constraints and grants. Database application, permission/constraint
execution and runtime queries have not been verified; no database was started.

## Endpoints

| Method | Path | Auth / scope | Request → response | Errors | Idempotent | Features |
|---|---|---|---|---|---|---|
| GET | `/users/me` | Authenticated; own user | → profile DTO | `SESSION_EXPIRED` | Yes | F-AU-005, F-AC-001 |
| PATCH | `/users/me` | Authenticated; own user | allow-listed `{displayName,email}` → profile DTO | `VALIDATION_ERROR`, `USER_NOT_FOUND` | No | F-AU-005, F-AC-001 |
| GET | `/users/me/addresses` | Authenticated; own user | → address DTO list | `SESSION_EXPIRED` | Yes | F-AC-001 |
| POST | `/users/me/addresses` | Authenticated; own user | `{label,addressText,landmark,pinCode,cityId,areaId,lat,lng,isDefault}` → address DTO | `VALIDATION_ERROR`, `ADDRESS_OUT_OF_SCOPE` | Yes | F-AC-001 |
| PATCH | `/users/me/addresses/{addressId}` | Authenticated; address owner | Allow-listed address fields + `expectedVersion` → address DTO with new version | `VALIDATION_ERROR`, `ADDRESS_NOT_FOUND`, `ADDRESS_OUT_OF_SCOPE`, `ADDRESS_VERSION_CONFLICT` | Key + version | F-AC-001 |
| DELETE | `/users/me/addresses/{addressId}` | Authenticated; address owner | `{expectedVersion}` → deletion acknowledgement | `ADDRESS_NOT_FOUND`, `ADDRESS_OUT_OF_SCOPE`, `ADDRESS_VERSION_CONFLICT` | Key + version | F-AC-001 |
| GET/PATCH | `/users/me/preferences` | Authenticated; own user | `{locale?,theme?}` → saved preference | `VALIDATION_ERROR` | PATCH: yes | F-AC-003 |
| GET | `/users/me/consents` | Authenticated; own user | → recorded purposes/current choices | `SESSION_EXPIRED` | Yes | F-X-008, F-AC-004 |
| PUT | `/users/me/consents/{purpose}` | Authenticated self | `{channel?,granted,noticeVersion?}` → recorded consent; explicit grant requires the displayed current notice version | `VALIDATION_ERROR`, `CONSENT_PURPOSE_INVALID`, `CONSENT_NOTICE_INVALID` | Yes | F-X-008, F-AC-004 |
| GET | `/consents` | Guest; anonymous consent cookie (Q-31) | → recorded anonymous choices | — | Yes | F-X-008 |
| PUT | `/consents/{purpose}` | Guest; anonymous consent cookie | `{channel?,granted,noticeVersion?}` → recorded anonymous consent under approved Q-31 registry | `VALIDATION_ERROR`, `CONSENT_PURPOSE_INVALID`, `CONSENT_NOTICE_INVALID` | Yes | F-X-008 |
| Internal | `setAccountStatus` | Called only by `admin` after `users:edit` + scope check | `{userId,status,reasonKey,expectedVersion}` → status; suspended users' sessions are revoked via `auth` and audit before/after is written | `USER_NOT_FOUND`, `USER_VERSION_CONFLICT` | Yes | F-AD-004 |
| POST | `/users/me/data-requests` | Authenticated; own user + CSRF | `{type:"export"\|"delete",confirmed?:true}`; delete requires explicit confirmation → `{requestId,type,status,failureCode?,requestedAt,completionToken?,completionTokenExpiresAt?}`; token only for confirmed deletion | `VALIDATION_ERROR`, `DATA_REQUEST_CONFLICT` | Yes per request key | F-AU-008, F-AC-004 |
| GET | `/users/me/data-requests/{requestId}` | Authenticated; own request, no-store | → `{requestId,type,status,failureCode?,requestedAt,completedAt?,downloadAvailable}` | `DATA_REQUEST_NOT_FOUND` | Yes | F-AU-008, F-AC-004 |
| GET | `/users/me/data-requests/{requestId}/export` | Authenticated; own completed, unexpired export; no-store | → JSON export; `Content-Disposition: attachment`, same payload available for the Your data/Copy data sheet | `DATA_REQUEST_NOT_FOUND`, `DATA_REQUEST_NOT_READY`, `DATA_EXPORT_EXPIRED` | Yes | F-AC-004 |

Use the shared error envelope and OpenAPI DTOs from [backend-shared.md](../../_foundation/backend-shared.md). `payments` owns stored provider references and the saved-method API contract (Q-33); users must not store card, bank, or provider credentials.

## Rules and use-cases

1. Profile completion accepts only the fields in the request DTO; name is 2–60 characters when supplied. Email remains optional.
2. Address mutations re-check the session user owns the address; validate six-digit PIN and geographic identifiers against `geo`; store coordinates only for the selected pin/address. Never accept a client-supplied user ID. Address DTOs expose their optimistic version; edit and soft-delete compare/increment it atomically, retaining references used by historical quotes/orders.
3. Setting an address as default is transactional and leaves at most one active default per user. Serialize default changes per user and increment every changed address's version. Deleting the default does not silently select another address unless the user chooses one.
4. Account preferences accept only the supported `en|hi` locale and `light|dark|auto` theme values. Guest preferences are handled by the shared frontend; account-level persistence is separate.
5. Consent updates are append-only evidence: a new grant/revocation records purpose, timestamp, source and channel. WhatsApp communications must check current consent at send time (BR-11).
6. Export/delete requests are owned by the authenticated user and follow `queued -> processing -> completed|failed|blocked`; retries resume failed work using recorded owner-module receipts, never repeat destructive steps blindly. Concurrent active deletion requests collapse to one request. A missing approved policy produces `blocked` with `POLICY_PENDING`, not completion or a guessed SLA.
7. Account deletion follows the explicit confirmation in F-AU-008. After policy/preflight approval, mark the account `deleting` before processing so new sessions/profile/cart writes cannot recreate already-erased data. The processor removes personal profile/address/bookmark/cart data and invalidates sessions; order/accounting rows remain under their owners' lawful-retention policy (BR-14). A stable anonymized user identity may remain for foreign keys; do not cascade-delete business, other users' or financial records. Q-32 must resolve phone lookup tombstones/re-registration, authored reviews/enquiries, owned businesses and unfinished obligations before destructive execution. Admin suspension/restoration cannot reset a deleting/deleted identity to active.

## Data processing and read ports

- `UsersAddressPort.forCheckout({userId,addressId,expectedVersion?},uow?) -> {id,version,cityId,areaId,location,addressText,landmark,pinCode}` returns only that user's live address. Checkout/Orders call it with the quote's expected version inside placement's UoW and lock the row through commit; stale/deleted/wrong-owner records cannot silently supply a new destination. Only Orders' protected snapshot may retain the required address text; quotes/events/logs must not.
- `UserDataPort.exportPage({userId,cursor,limit})` is an internal owner-scoped port, not arbitrary table access. Initial prototype payload is `{profile,addresses,orders:[orderId],bookmarks,reviews:count}` from Users, Orders, Engagement and Reviews; export also includes other account-held personal data under the approved DPDP inventory. Workers traverse owner pagination and stream a private JSON artifact through `StoragePort`; no public object URL, PII in jobs, or fixed sample values.
- `UserDataPort.erase({userId,requestId,policyVersion}) -> {receipt,status:"completed"|"blocked",reasonCode?}` is implemented by each affected owner. Users orchestrates a resumable pg-boss job and stores receipts; adapters must be idempotent on `requestId`. Review/enquiry/media/notification/consent retention is a policy decision, not an instruction to erase accounting evidence.
- The worker marks an export completed only after the complete artifact is stored; failed/partial artifacts are not downloadable. Check current ownership/account authorization and artifact expiry on every download; expiry cleanup deletes only that generated object.
- The deletion worker marks completed only after every required owner receipt and `AuthSessionPort.revokeUserSessions` succeed. The last authenticated poll may observe `completed`; if session invalidation wins, a short-lived request-bound completion capability issued at confirmation can reveal only this deletion's processing/terminal status, never user data or authorize another operation. Use the shared cryptographic token helper, persist only its hash/expiry in the request row, and expire it with the approved Q-32 policy; a lost/expired capability cannot be used to claim completion.
- The completion token is returned only to the confirming session, redacted from logs and excluded from plaintext idempotency response storage. An authenticated retry returns the same request and may rotate the completion capability; it never creates another erasure job. Capability rotation and its hash change are atomic.
- `GET /users/data-requests/{requestId}/completion` requires that completion capability in an authorization header, is rate-limited/no-store and returns only `{status}` for a delete request; no token in URLs/logs/storage. It allows truthful navigation to `/goodbye` after session revocation, not an unauthenticated status lookup.
- `ConsentReadPort.current({userId,purpose,channel}) -> {granted,consentId?,recordedAt?}` reads the latest committed evidence; absence is not consent. `UserIdentityPort.resolveVerifiedPhone` and `readPrincipal` expose live account status/roles to Auth without leaking encrypted phone data to other modules.
- `ConsentWritePort.record(tx,{userId,purpose,channel,granted,source,noticeVersion?}) -> {consentId,recordedAt}` is Users-owned; Notifications uses it in the same preference transaction. Serialize changes for one subject/purpose/channel, preserve append-only evidence and publish the exact consent event once on an effective choice change. Grants require explicit acknowledgement of the configured current notice; withdrawals/verified STOP cannot be blocked by missing or changed notice copy.
- Authenticated notification purpose registry: `marketing` with `in_app|email|whatsapp`; `order_updates` and `enquiry_updates` with `whatsapp` only. These map existing choices, not new checkboxes. Reject unknown pairs; never infer a grant from prototype defaults. GET consent/preferences exposes current notice version and evidence metadata. Cookie categories/anonymous identity and unapproved legal copy remain Q-31-gated.
- `UserRolePort.assignApprovedRole({userId,role,sourceId,transaction})` is an internal, idempotent application port: Businesses/Delivery may assign only their approved vendor/provider/rider role; Admin alone manages admin/super-admin grants. The owning approval use-case validates its source decision; Users enforces the caller-module/role allow-list and keeps the grant in that transaction, without querying another module's tables. No public profile/OTP DTO accepts roles; pending applicants use owned-application capabilities, not self-assigned privileged roles.
- Implement `UserAdminReadPort.list/detail/adminContacts` with the exact minimized [Admin contracts](../../admin/be/admin.md#required-owning-module-ports), rechecking current grants and authoritative subject scope. Business/rider tabs delegate status/version to their owners. Unknown customer geography is ADM-Q3, never a guessed last-order/default-address authority; regular admins cannot read or suspend an unresolved subject.
- `CampaignRecipientReadPort.read({userIds[]}) -> [{userId,accountStatus,roles,scope,scopeRevision}]` is a purpose-limited Users port for Communications, at most 500 IDs, no contacts. Approved geographic membership is required under COMMS-Q1/ADM-Q3; missing policy is explicit, never a whole-city fallback.

Open question: Q-32 must also approve a verified request channel for suspended users who cannot obtain a normal session, and expiry/recovery of long-running deletion confirmations. Do not bypass Auth or grant access from an unverified support message.

## Events and jobs

- Publish `user.data_request.created` with `{requestId,userId,type}` through the transactional outbox; Users' processor consumes it and emits `user.data_request.completed` or `.failed` after durable terminal writes.
- Publish exactly `consent.granted` or `consent.withdrawn` on an effective choice change with `{userId?,anonymousSubjectId?,purpose,channel,consentId,recordedAt}`; downstream queues suppress unauthorized sends, but always query current consent rather than trusting a historical grant.
- Publish `user.account.deleted` after confirmed completion and `user.account.status_changed` after admin suspension/restoration, with `{userId,status,version}`. Auth invalidates sessions; its synchronous live-status check remains authoritative while outbox delivery is pending.

## Error codes added

| Code | Status | Message key |
|---|---:|---|
| `USER_NOT_FOUND` | 404 | `users.notFound` |
| `USER_VERSION_CONFLICT` | 409 | `users.versionConflict` |
| `ADDRESS_NOT_FOUND` | 404 | `users.address.notFound` |
| `ADDRESS_OUT_OF_SCOPE` | 403 | `users.address.outOfScope` |
| `ADDRESS_VERSION_CONFLICT` | 409 | `users.address.versionConflict` |
| `CONSENT_PURPOSE_INVALID` | 422 | `users.consent.purposeInvalid` |
| `CONSENT_NOTICE_INVALID` | 422 | `users.consent.noticeInvalid` |
| `DATA_REQUEST_NOT_FOUND` | 404 | `users.data.notFound` |
| `DATA_REQUEST_CONFLICT` | 409 | `users.data.conflict` |
| `DATA_REQUEST_NOT_READY` | 409 | `users.data.notReady` |
| `DATA_EXPORT_EXPIRED` | 410 | `users.data.expired` |

## Acceptance criteria

1. Given an authenticated customer, when they update their name or optional email with valid values, then only their own profile fields change.
2. Given an address ID owned by another user, when a customer reads or mutates it, then the server returns a scoped denial and makes no change.
3. Given a valid address, when it is marked default, then the transaction leaves exactly one active default for that user.
   Given a quoted address changes or is deleted before placement, when its pinned version is read, then checkout rejects the stale destination without substituting the latest address; concurrent stale edits return `ADDRESS_VERSION_CONFLICT`.
4. Given a consent is granted or revoked, when saved, then a timestamped purpose/channel record is available to consent-aware senders and opt-out takes effect immediately.
5. Given an account requests export, when processing completes, then status and the authenticated JSON/Copy data payload include the owner's complete records, not another user's or a partially written artifact.
6. Given a client submits unknown profile fields or a different user ID, when the request is validated, then it is rejected without mass assignment.
7. Given a customer requests payment methods, when the payments owner is unavailable, then the API returns an explicit unavailable error rather than an empty success.
8. Given a deletion has an unapproved retention policy or a blocked owner receipt, when processed, then it stays explicitly blocked and neither sessions nor financial records are silently destroyed.
9. Given approved deletion processing completes, when sessions are revoked, then only the request-bound completion capability can confirm the terminal result, `/goodbye` becomes truthful, and a replay cannot expose personal data.
10. Given a processing crash or expired export, when retried/downloaded, then receipts prevent duplicate erasure and expired/private artifacts cannot be fetched through another user's session.
11. Given identity rows, when invalid locale/theme/status/role values, non-positive versions, invalid display-name lengths or an incomplete phone pair are written, then the database rejects them; a live identity cannot lose its phone fields.
12. Given a retained phone hash or membership, when a duplicate is inserted, then its unique key rejects it; unrelated NULL tombstones remain possible, and a membership cannot reference a missing user.
13. Given the runtime role, when physical user deletion or in-place membership rewriting is attempted, then database privileges deny it; adding the schema itself creates no users or role grants.

## Tests

- Unit: profile/address allow-lists; default-address transaction; consent append-only behavior; request idempotency.
- Integration: owner CRUD; consent revocation visible to sender query; paginated export completeness, artifact expiry, policy-blocked deletion, interrupted/retried owner erasure and session-revocation completion race.
- Authorization negatives: cross-user address ID; anonymous account access; unknown fields; stale consent; attempts to read another user's payment methods.
