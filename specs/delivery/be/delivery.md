# BE: delivery

Features: F-RD-001, F-RD-002, F-RD-003, F-RD-004, F-RD-005, F-RD-006, F-RD-007, F-RD-008, F-AD-008, F-X-015 | Rules: BR-01, BR-02, BR-05, BR-06, BR-12, BR-14 | State machines: ST-delivery-job, ST-approval (rider) | Depends on: users, geo, settings, media-videos (private assets), payments (`recordCashCollection`); consumes Orders events; used by orders, admin, reviews.

Frontend counterpart: [FE delivery](../fe/delivery.md)

## Responsibility

Own rider profiles/approval, delivery jobs, per-rider request offers with the 60 s countdown, delivery OTP and pickup code (generate, deliver to customer, verify), rider location for live tracking, rider earnings and payout records. Orders owns order state; Delivery publishes events that Orders consumes. Rider feedback ratings are Reviews-owned (target `rider`).

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `rider_profiles` | `user_id uuid PK FK users`; `city_id uuid NOT NULL FK cities`; `full_name text NOT NULL CHECK 2–60`; `vehicle_type text NOT NULL CHECK ('bike','scooter','cycle')`; `vehicle_number text NULL`; `payout_upi_ciphertext/bank_ciphertext text NULL`; `status text NOT NULL CHECK ('draft','pending','approved','rejected','changes_requested','suspended','inactive')`; `decision_reason text NULL`; `is_online bool NOT NULL DEFAULT false`; `last_location geography(Point,4326) NULL`; `last_location_at timestamptz NULL`; `preferred_locale text NOT NULL DEFAULT 'en'`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at timestamptz` | GIST `(last_location) WHERE is_online AND status='approved'` (nearest idle rider); `(city_id,status,created_at)` (admin approval queue) |
| `rider_documents` | `id uuid PK`; `rider_user_id uuid NOT NULL FK rider_profiles`; `doc_type text NOT NULL CHECK ('selfie','licence','id_proof','rc','other')`; `media_asset_id uuid NOT NULL FK media_assets` (private); `created_at timestamptz`; UNIQUE `(rider_user_id,doc_type,media_asset_id)` | `(rider_user_id)` |
| `delivery_jobs` | `id uuid PK`; `order_id uuid NOT NULL UNIQUE FK orders`; `city_id uuid NOT NULL`; `rider_user_id uuid NULL FK rider_profiles`; `status text NOT NULL CHECK ('requested','accepted','reached_shop','picked_up','reached_drop','delivered','failed','unassigned')`; `fail_reason text NULL CHECK ('customer_unreachable','wrong_address','customer_cancelled','vehicle_problem')`; `pickup_point/drop_point geography(Point,4326) NULL`; `distance_m int NOT NULL CHECK >= 0`; `rider_earning_paise bigint NOT NULL CHECK >= 0`; `cod_amount_paise bigint NOT NULL DEFAULT 0 CHECK >= 0`; `version int NOT NULL DEFAULT 1`; `accepted_at/picked_up_at/delivered_at/failed_at timestamptz NULL`; `created_at/updated_at timestamptz`; CHECK `fail_reason IS NOT NULL = (status='failed')` | `(rider_user_id,created_at DESC,id DESC)` (history); `(city_id,status)` (live map, unassigned queue) |
| `delivery_offers` | `id uuid PK`; `job_id uuid NOT NULL FK delivery_jobs`; `rider_user_id uuid NOT NULL FK rider_profiles`; `status text NOT NULL CHECK ('offered','accepted','rejected','expired')`; `expires_at timestamptz NOT NULL`; `responded_at timestamptz NULL`; partial UNIQUE `(job_id) WHERE status='offered'`; UNIQUE `(job_id,rider_user_id)` | `(rider_user_id,status,expires_at)` (rider's current request) |
| `delivery_codes` | `id uuid PK`; `order_id uuid NOT NULL FK orders`; `kind text NOT NULL CHECK ('delivery_otp','pickup_code')`; `code_hash bytea NOT NULL`; `attempts int NOT NULL DEFAULT 0`; `max_attempts int NOT NULL DEFAULT 5`; `verified_at/locked_at timestamptz NULL`; `created_at timestamptz`; UNIQUE `(order_id,kind)` | unique key only |
| `rider_payouts` | `id uuid PK`; `rider_user_id uuid NOT NULL FK rider_profiles`; `period_start/period_end date NOT NULL`; `amount_paise bigint NOT NULL CHECK >= 0`; `status text NOT NULL CHECK ('pending','paid')`; `paid_at timestamptz NULL`; UNIQUE `(rider_user_id,period_start)` | `(rider_user_id,period_start DESC)` |

Codes are 4 digits, stored only as a keyed hash; plaintext exists only in the customer response of the owner-only code endpoint.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET/PUT | `/delivery/riders/me` | Authenticated user (rider onboarding) | Allow-listed profile fields, `documentAssetIds[]`, `submit?` → profile + status/reason | `VALIDATION_ERROR`, `RIDER_STATE_CONFLICT` | PUT yes (version) | F-RD-001, F-RD-008, S-RIDE-01, S-RIDE-08 |
| POST | `/delivery/riders/me/online` | Rider, `approved` only (BR-06) | `{online:boolean}` → state | `RIDER_NOT_APPROVED`, `RIDER_HAS_ACTIVE_JOB` (going offline) | Yes | F-RD-002, S-RIDE-02 |
| POST | `/delivery/riders/me/location` | Approved online rider | `{lat,lng}` (rate-limited 1/5 s) → 204 | `RIDER_NOT_ONLINE` | Yes | F-RD-004, F-AD-008 |
| GET | `/delivery/riders/me/summary` | Rider | → today's count and earnings (paise) | — | Yes | F-RD-002, S-RIDE-02 |
| GET | `/delivery/riders/me/offers/current` + SSE `/delivery/riders/me/stream` | Approved online rider; own offers | → pickup shop name/area, drop area (not full address until accepted), distance, earning, `expiresAt` | — | Yes | F-RD-003, S-RIDE-03 |
| POST | `/delivery/offers/{offerId}/accept` \| `/reject` | Rider who owns the offer, before `expires_at` | → job (accept) / 204 | `DELIVERY_OFFER_EXPIRED`, `DELIVERY_OFFER_TAKEN`, `FORBIDDEN` | Required key | F-RD-003, S-RIDE-03 |
| GET | `/delivery/riders/me/active` | Rider; assigned job | → steps, shop + drop address, masked-call handle, item count, COD amount | `DELIVERY_JOB_NOT_FOUND` | Yes | F-RD-004, S-RIDE-04 |
| POST | `/delivery/jobs/{jobId}/events` | Assigned rider only | `{event:'reached_shop'\|'picked_up'\|'reached_drop'\|'fail',failReason?,expectedVersion}` → job | `DELIVERY_INVALID_TRANSITION`, `DELIVERY_VERSION_CONFLICT` | Required key | F-RD-004 |
| POST | `/delivery/jobs/{jobId}/complete` | Assigned rider; job `reached_drop` | `{otp,cashCollected?:boolean}` → delivered job | `DELIVERY_CODE_INVALID`, `DELIVERY_CODE_LOCKED`, `DELIVERY_COD_NOT_CONFIRMED` | Required key | F-RD-004, BR-05 |
| POST | `/delivery/jobs/{jobId}/call` | Assigned rider or order customer | → masked call session via `MaskedCallPort` (no raw phone) | `DELIVERY_CALL_UNAVAILABLE` | Yes | F-RD-004 |
| GET | `/delivery/riders/me/history` | Rider | `range=all\|today\|week`, cursor, `limit<=50` → jobs | `VALIDATION_ERROR` | Yes | F-RD-005, S-RIDE-05 |
| GET | `/delivery/riders/me/earnings` | Rider | `range=day\|week` → per-ride earning, totals, payouts | — | Yes | F-RD-006, S-RIDE-06 |
| POST | `/delivery/riders/me/disputes` | Rider; own job | `{jobId,reasonKey,details}` → opens Orders case via contract | `DELIVERY_JOB_NOT_FOUND` | Required key | F-RD-008 |
| GET | `/delivery/orders/{orderId}/tracking` + SSE | Order's customer | → job status, rider first name, rider location (only while `picked_up`..`reached_drop`) | `ORDER_NOT_FOUND` | Yes | F-OR-002, S-CUST-14 |
| GET | `/delivery/orders/{orderId}/code` | Order's customer only | → `{kind,code}` once order is out for delivery / ready for pickup | `ORDER_NOT_FOUND`, `DELIVERY_CODE_NOT_READY` | Yes | BR-05, S-CUST-14 |
| POST | `/delivery/pickup-codes/verify` | Approved vendor/provider owning the order's business | `{orderId,code}` → order `picked_up` | `DELIVERY_CODE_INVALID`, `DELIVERY_CODE_LOCKED` | Required key | F-OR-003, S-VEND-04 |
| GET | `/delivery/admin/riders/applications` · `/{userId}/documents` | Admin `approvals:view` + rider city in scope | cursor list / short-lived document view URLs | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-002, S-ADMN-02 |
| POST | `/delivery/admin/riders/{userId}/decision` | Admin `approvals:edit` + scope; audited | `{action:'approve'\|'reject'\|'request_changes'\|'suspend'\|'restore',reason?,expectedVersion}` | `RIDER_STATE_CONFLICT` | Yes | F-AD-002, ST-approval |
| GET | `/delivery/admin/live` + SSE | Admin `orders:view` + scope; `cityId=all` limited to assigned cities | → active jobs with rider pin, clustered per city | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-008, S-ADMN-09 |
| POST | `/delivery/admin/jobs/{jobId}/assign` | Admin `orders:edit` + scope; audited | `{riderUserId,expectedVersion}` → job (re)assigned | `DELIVERY_INVALID_TRANSITION`, `RIDER_NOT_APPROVED` | Required key | F-AD-007, S-ADMN-08 |

## Rules and use-cases

1. **Job creation:** on `order.status_changed` to `accepted` with `mode=delivery` and business `delivery_method='apna_town_rider'`, create one job (unique per order), compute `distance_m` from shop to drop and `rider_earning_paise = round_to_rupee(base + perKm × km)` from the Settings rider-earning rule (sample ₹20 + ₹7/km). Pickup orders and self-delivery shops create no job; pickup orders get a `pickup_code`.
2. **Offer:** pick the nearest approved, online rider in the job's city with no active job and no prior offer for this job; insert `delivery_offers(status=offered, expires_at=now+60 s)` and schedule an expiry job. On reject/expiry offer the next rider; with no candidate set job `unassigned` and alert admins (open question: rider selection policy — assumption: nearest idle).
3. **Accept** locks the offer row and job (`SELECT … FOR UPDATE`): only an `offered`, unexpired offer for this rider may accept; job → `accepted`. Server time is authoritative for the countdown.
4. **ST-delivery-job** transitions are explicit handlers keyed `(from,event)`: `accepted→reached_shop→picked_up→reached_drop→delivered`; `fail` allowed from `accepted|reached_shop|picked_up|reached_drop` with a reason. Invalid edges → `DELIVERY_INVALID_TRANSITION`; stale version → 409.
5. **Codes (BR-05):** generated with CSPRNG when the job reaches `picked_up` (delivery OTP) or the order reaches `ready` (pickup code); only the customer code endpoint returns plaintext. Verification compares hashes in constant time; 5 wrong attempts lock the code and alert admin. Codes are never logged or returned in rider/vendor/admin DTOs.
6. **COD:** if `cod_amount_paise > 0`, completion requires `cashCollected=true`, then calls Payments `recordCashCollection` in the same unit of work as `delivered`.
7. Rider data minimisation: before acceptance the rider sees only areas; after acceptance, the drop address and first name; customer phone only via masked call. Location updates are stored only as the latest point (no trail).
8. Rider approval follows ST-approval with business-like capabilities; only `approved` riders can go online. Decisions are audited (BR-12) and notify the rider.
9. Payouts: weekly `rider_payouts` rows aggregate delivered jobs; status changes come from Payments/admin settlement (open question: payout schedule and settlement owner — assumption weekly, marked paid by finance).

## Events and jobs

- Publishes (outbox): `delivery.job_created`, `delivery.assigned`, `delivery.picked_up`, `delivery.delivered`, `delivery.failed`, `delivery.unassigned`, `delivery.code_locked`, `rider.application_decided`.
- Consumes: `order.status_changed`, `order.cancelled` (cancel open job/offers).
- Jobs (pg-boss): `delivery.offer_expire` (at `expires_at`; idempotent on offer status), `delivery.payout_rollup` (weekly). Retries: 5 with backoff; terminal failures alert.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `RIDER_NOT_APPROVED` | 403 | `errors.delivery.riderNotApproved` |
| `RIDER_NOT_ONLINE` | 409 | `errors.delivery.riderNotOnline` |
| `RIDER_HAS_ACTIVE_JOB` | 409 | `errors.delivery.riderHasActiveJob` |
| `RIDER_STATE_CONFLICT` | 409 | `errors.delivery.riderStateConflict` |
| `DELIVERY_JOB_NOT_FOUND` | 404 | `errors.delivery.jobNotFound` |
| `DELIVERY_OFFER_EXPIRED` | 409 | `errors.delivery.offerExpired` |
| `DELIVERY_OFFER_TAKEN` | 409 | `errors.delivery.offerTaken` |
| `DELIVERY_INVALID_TRANSITION` | 409 | `errors.delivery.invalidTransition` |
| `DELIVERY_VERSION_CONFLICT` | 409 | `errors.delivery.versionConflict` |
| `DELIVERY_CODE_INVALID` | 422 | `errors.delivery.codeInvalid` |
| `DELIVERY_CODE_LOCKED` | 423 | `errors.delivery.codeLocked` |
| `DELIVERY_CODE_NOT_READY` | 409 | `errors.delivery.codeNotReady` |
| `DELIVERY_COD_NOT_CONFIRMED` | 422 | `errors.delivery.codNotConfirmed` |
| `DELIVERY_CALL_UNAVAILABLE` | 503 | `errors.delivery.callUnavailable` |

## Acceptance criteria

1. Given a delivery order is accepted by an ApnaTown-rider shop, when the event is consumed twice, then exactly one job and one live offer exist.
2. Given an offer expires at 60 s, when the rider taps Accept afterwards, then `DELIVERY_OFFER_EXPIRED` is returned and the next rider is offered.
3. Given two riders race for the same job, when both accept, then only one succeeds and the other gets `DELIVERY_OFFER_TAKEN`.
4. Given a rider submits a wrong OTP 5 times, when the 6th attempt arrives, then `DELIVERY_CODE_LOCKED` is returned and admin is alerted; no response or log contains the code.
5. Given a COD job, when the rider completes without `cashCollected=true`, then completion is refused; with it, Payments records collection once.
6. Given a rider is `pending` or `suspended`, when they try to go online, then `RIDER_NOT_APPROVED`.
7. Given a rider marks `fail` without a reason or from `delivered`, then validation/transition errors are returned and no event is published.
8. Given an admin outside the rider's city or without `approvals:edit`, when deciding an application, then 403 and no audit/state change.
9. Given a vendor or rider calls the customer code endpoint, then 403/404; only the order's customer receives the plaintext code.

## Tests

- Unit: transition handlers incl. fail edges; earning formula rounding; nearest-rider selection; code hash/attempt lock.
- Integration: order event → job → offer → expiry → re-offer; accept race (row lock); COD completion with Payments fake; SSE tracking; `MaskedCallPort` fake.
- Authorisation negatives: other rider's offer/job, unapproved rider online, vendor/admin requesting code, admin out of scope for live map/decision/assign.
- Security: no code/phone in DTOs or logs; private document URLs short-lived; location visible only during active leg.

## Open questions

Rider selection policy; payout schedule/settlement owner; masked-call provider (`MaskedCallPort`); G-15/G-16 prototype shows codes on screen (spec follows BR-05).
