# BE: businesses

Features: F-PF-001, F-PF-002, F-PF-003, F-PF-004, F-PF-005, F-PF-006, F-PF-007, F-PF-011, F-PF-012, F-PF-013, F-VD-001, F-VD-002, F-VD-003, F-VD-011, F-VD-018, F-PV-001, F-PV-002, F-PV-006, F-PV-007, F-X-011 | Rules: BR-01, BR-02, BR-06, BR-08, BR-12, BR-14, BR-16 | State machines: ST-approval | Depends on: users, geo, catalog | Used by: products, services, search, offers, cart-checkout, orders, reviews, engagement, media-videos, admin

Frontend counterpart: [FE businesses](../fe/businesses.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own shop/provider identity, public profile fields, location, weekly hours, delivery/pickup settings, onboarding applications and private business documents. Resolve owner and area from trusted context; never accept an owner ID or storage URL from a client. Users own account/role data; catalog owns categories; geo owns areas; products, services, orders, payments, reviews, engagement and media-videos own their respective records and actions.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `businesses` | `id uuid PK`; `owner_user_id uuid NOT NULL FK users`; `kind text NOT NULL CHECK ('shop','provider')`; `status text NOT NULL CHECK ('draft','pending','approved','rejected','changes_requested','suspended','inactive')`; `name_en text NULL`; `name_hi text NULL`; `slug text NULL UNIQUE` (generated before submit); `description text NULL`; `category_id uuid NULL FK categories`; `area_id uuid NULL FK areas`; `address_text text NULL`; `location geography(Point,4326) NULL`; `phone_e164 text NOT NULL` (business contact, initially prefilled from verified account; separate from login credential); `whatsapp_e164 text NULL`; `email text NULL`; `instagram_url/youtube_url/facebook_url text NULL`; `logo_storage_key/cover_storage_key text NULL` (private references resolved for approved public reads); `verified_at timestamptz NULL` (set only by an explicit review; see Q-41); `review_reason text NULL`; `reviewed_by uuid NULL FK users`; `reviewed_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; timestamps. Submit requires name, matching category, area and address; coordinates remain optional. `UNIQUE(owner_user_id,kind)` pending Q-42. | Unique non-null `slug` for public routes; `(owner_user_id,status)` for the authenticated business context; `(status,area_id,created_at,id)` for scoped approval queues; GiST on `location` for nearby reads. |
| `business_hours` | `business_id uuid NOT NULL FK businesses`; `day_of_week smallint NOT NULL CHECK 0..6`; `opens_at time NULL`; `closes_at time NULL`; `is_closed boolean NOT NULL DEFAULT false`; PK `(business_id,day_of_week)`; CHECK open days have both times and closed days have neither. Times are recurring local IST wall-clock values, not instants. | PK serves a business's weekly schedule lookup. |
| `business_settings` | `business_id uuid PK FK businesses`; `temporarily_closed boolean NOT NULL DEFAULT false`; `delivery_method text NULL CHECK ('self','apna_town_rider')`; `delivery_radius_km numeric(5,2) NULL CHECK >= 0`; `delivery_fee_paise bigint NULL CHECK >= 0`; `minimum_order_paise bigint NULL CHECK >= 0`; `pickup_enabled boolean NOT NULL DEFAULT false`; `service_radius_km numeric(5,2) NULL CHECK >= 0`; `created_at/updated_at timestamptz NOT NULL`. Checks keep delivery fields to shops and service radius to providers. | PK serves owner and checkout eligibility reads. |
| `business_documents` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `document_kind text NOT NULL CHECK ('owner_id','business_photo','registration_document')`; `private_storage_key text NOT NULL`; `detected_content_type text NOT NULL`; `file_size_bytes bigint NOT NULL CHECK > 0`; `uploaded_by uuid NOT NULL FK users`; `created_at timestamptz NOT NULL`. Private object only; document kinds correspond to the prototype's optional ID, business photo and GST/licence fields. File allowlist and size limit remain open (Q-40); retention is Q-05. | `(business_id,created_at DESC,id DESC)` for the owner's and scoped reviewer's document list. |

Owner and `uploaded_by` are session-derived. Category and area IDs are explicit allow-listed fields validated against `catalog` and `geo`; client IDs never grant access. Public profile image keys are private storage references resolved through `StoragePort`; KYC documents are never public. Profile edits do not create or alter records in the owning modules listed above.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| POST | `/businesses/applications` | Authenticated OTP session; applicant is owner | `{kind}` → partial draft; owner and verified phone come from session, not body | `VALIDATION_ERROR`, `BUSINESS_ALREADY_EXISTS` | `Idempotency-Key` | F-VD-001, F-PV-001 |
| GET/PATCH | `/businesses/me` | Authenticated owner; matching vendor/provider role where assigned; own business only | → application/profile DTO; PATCH `{kind? (draft only),nameEn,nameHi?,categoryId,description?,areaId,addressText,location?,businessPhoneE164,whatsappE164?,hours[],settings?,expectedVersion}` | `BUSINESS_NOT_FOUND`, `BUSINESS_NOT_OWNED`, `BUSINESS_ALREADY_EXISTS`, `BUSINESS_STATE_CONFLICT`, `BUSINESS_VERSION_CONFLICT` | GET yes; PATCH by expected version | F-VD-001–003, F-PV-001–002 |
| POST | `/businesses/me/submit` | Authenticated applicant; own business | `{expectedVersion}` → pending application | `BUSINESS_NOT_OWNED`, `BUSINESS_STATE_CONFLICT`, `BUSINESS_VERSION_CONFLICT` | `Idempotency-Key` + version | F-VD-001, F-PV-001 |
| POST | `/businesses/me/media` | Authenticated owner; own business | Multipart allow-list `{assetKind:"logo"|"cover",file}` → private media metadata | `BUSINESS_NOT_OWNED`, `BUSINESS_MEDIA_INVALID`, `BUSINESS_STATE_CONFLICT` | `Idempotency-Key` | F-VD-001, F-VD-003, F-PV-001/002 |
| POST | `/businesses/me/documents` | Authenticated owner; own draft/pending/rejected/changes-requested application | Multipart allow-list `{documentKind,file}` → private document metadata; never return a public URL | `BUSINESS_NOT_OWNED`, `BUSINESS_DOCUMENT_INVALID`, `BUSINESS_STATE_CONFLICT` | `Idempotency-Key` | F-VD-001, F-PV-001 |
| GET | `/businesses/public/{slug}` | Public; approved listing only | → public profile DTO, no owner/KYC fields | `BUSINESS_NOT_PUBLIC` | Yes | F-PF-001–007, S-CUST-06/07 |
| GET | `/businesses/admin/applications?status=&cursor=&limit=` | Admin + `approvals:view` + assigned city/area; super_admin platform-wide | Allow-listed status, keyset cursor, limit ≤50 → scoped application page | `FORBIDDEN`, `VALIDATION_ERROR` | Yes | F-VD-001, F-PV-001 |
| GET | `/businesses/admin/applications/{id}/documents` | Admin + `approvals:view` + owning area scope; super_admin platform-wide | → access-checked document metadata/view capability | `BUSINESS_NOT_FOUND`, `BUSINESS_SCOPE_DENIED`, `FORBIDDEN` | Yes | F-VD-001, F-PV-001 |
| POST | `/businesses/admin/applications/{id}/decision` | Admin + `approvals:edit` + owning area scope; super_admin platform-wide; audit required | `{action:"approve"|"reject"|"request_changes"|"suspend"|"restore"|"deactivate",reason?,expectedVersion}` → updated status; actions follow ST-approval only | `BUSINESS_NOT_FOUND`, `BUSINESS_SCOPE_DENIED`, `BUSINESS_STATE_CONFLICT`, `BUSINESS_VERSION_CONFLICT` | `Idempotency-Key` + version | F-VD-001, F-PV-001 |
| POST | `/businesses/me/reactivate` | Authenticated owner; own inactive business | `{expectedVersion}` → approved status, if ST-approval permits | `BUSINESS_NOT_OWNED`, `BUSINESS_STATE_CONFLICT`, `BUSINESS_VERSION_CONFLICT` | `Idempotency-Key` + version | F-VD-001, F-PV-001 |

The public profile DTO exposes only approved fields; `StoragePort` resolves logo/cover references for that public response and never exposes raw keys. Business overview, account, payout, analytics, services/expertise, listings, orders, follows, reviews and media are composed from their owning module contracts; this module adds no duplicate endpoint/table for them. Analytics must use the approved Q-11 measurement contract; no synthetic counts or unapproved conversion formula.

## Rules and use-cases

1. OTP verification/session creation is owned by `auth`. Create an application only for the authenticated user; `users` manages role assignment, and business ownership is always checked server-side.
2. `draft` is pre-submission and may contain only OTP-derived contact plus partial fields. `kind` may change only while draft. Submission validates name, category-kind match, area and address, generates a unique slug, then enters `pending`; preserve ST-approval edges and capability limits: pending edits only, rejected/changes_requested can resubmit, suspended cannot sell or edit, inactive may reactivate. Never accept status in generic PATCH.
3. Admin decisions require `approvals` permission and assigned city/area scope (BR-12); check expected version, record actor/reason, audit before/after, and update status transactionally.
4. Public reads include only approved businesses. A non-public slug returns `BUSINESS_NOT_PUBLIC` without disclosing owner, application or document data. Cache invalidation follows status/profile changes.
5. Delivery eligibility reads `business_settings`; store fees/minimums in paise (BR-01) and let checkout calculate totals. Store coordinates only when provided; address entry does not require device geolocation.
6. Onboarding documents are optional; validate content and size server-side, store privately through `StoragePort`, and authorize every view (BR-14). Profile logo/cover use the same validated storage adapter; only the approved public response resolves those assets. Do not log document contents, raw keys or signed access URLs.
7. `verified_at` is not inferred from approval or an uploaded document; Q-41 must define awarding rules before the badge can be set.
8. `F-PF-007` reporting uses the admin-owned report flow. `F-PF-011/012`, QR/print and public profile actions call their owning modules or browser APIs; no cart, enquiry, follow, product, service, media, invoice or order data is duplicated here. F-X-011 invoice/order-slip data and layouts remain orders-owned.

## Events and jobs

- Publish `business.application.submitted`, `business.application.decision_changed` and `business.profile.changed` through the transactional outbox.
- Decision events feed the notification contract; public profile/status changes trigger search/cache revalidation. Consumers are idempotent; retry transient failures through the shared outbox runner.
- No analytics event taxonomy, recurring business job or document-retention job is defined here; follow Q-11, Q-05 and Q-40.

## Error codes added

| Code | Status | Message key |
|---|---:|---|
| `BUSINESS_NOT_FOUND` | 404 | `business.notFound` |
| `BUSINESS_NOT_PUBLIC` | 404 | `business.notPublic` |
| `BUSINESS_NOT_OWNED` | 403 | `business.notOwned` |
| `BUSINESS_SCOPE_DENIED` | 403 | `business.scopeDenied` |
| `BUSINESS_STATE_CONFLICT` | 409 | `business.stateConflict` |
| `BUSINESS_VERSION_CONFLICT` | 409 | `business.versionConflict` |
| `BUSINESS_DOCUMENT_INVALID` | 422 | `business.documentInvalid` |
| `BUSINESS_MEDIA_INVALID` | 422 | `business.mediaInvalid` |
| `BUSINESS_ALREADY_EXISTS` | 409 | `business.alreadyExists` |

## Acceptance criteria

- Given a verified applicant, when an application is created and submitted, then the authenticated user owns the draft and submit moves it to `pending` once; a repeated idempotency key returns the same result.
- Given a client sends another owner's ID, status, or storage URL, when it creates or patches a business, then the server ignores/rejects non-allow-listed fields and makes no unauthorized write.
- Given an area admin lacks `approvals:edit` or the business is outside assigned scope, when a decision is requested, then it is denied and status/audit data remain unchanged.
- Given a document is uploaded, when the request passes the approved content/size policy, then only private metadata is returned and a public profile response never contains the document or storage key.
- Given a business is not approved, when its public slug is read, then no owner/application data is returned and the response maps to the unavailable profile state.
- Given a concurrent update uses a stale version or invalid ST-approval edge, when the write is attempted, then it returns a stable conflict without partial changes.

## Tests

Unit: state transition guards, DTO allow-list, paise/settings validation, and public-field projection. Integration: PostGIS optional point, owner/document isolation, outbox commit/retry, and version conflicts. Authorization negatives: cross-owner access, missing `approvals:view/edit`, and out-of-area admin; never use real PII or document files.
