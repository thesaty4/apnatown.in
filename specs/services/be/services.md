# BE: services

## Contents

- [Responsibility](#responsibility)
- [Tables](#tables)
- [Endpoints](#endpoints)
- [Rules and use-cases](#rules-and-use-cases)
- [Events and jobs](#events-and-jobs)
- [Errors](#errors)
- [Acceptance criteria](#acceptance-criteria)
- [Tests](#tests)

Features: F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, F-VD-014, F-VD-016, F-PV-003, F-PV-004 | Rules: BR-02, BR-06, BR-08, BR-09, BR-10, BR-14, BR-16, BR-18 | State machines: ST-enquiry | Depends on: businesses, catalog, geo | Used by: search, businesses, offers, reviews, engagement, media-videos, notifications

Frontend counterpart: [FE services](../fe/services.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own service listings, provider expertise mappings and service enquiries. Reuse business approval/ownership, catalog taxonomy, geo, media, offer, review, engagement and notification contracts; do not duplicate their records or state. Search consumes active service data and applies the service subcategory as the filter/count source (BR-18).

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `services` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `category_id uuid NOT NULL FK categories`; `subcategory_id uuid NOT NULL FK subcategories`; `slug text NOT NULL UNIQUE`; `name_en text NOT NULL`; `name_hi text NULL`; `description text NULL`; `price_type text NOT NULL CHECK ('from','fixed','range','enquiry')`; `price_from_paise bigint NULL CHECK >= 0`; `price_to_paise bigint NULL CHECK >= price_from_paise`; `unit text NULL CHECK ('hour','day','event','sq_ft','unit','visit','plate')`; `included/excluded text[] NOT NULL DEFAULT '{}'`; `service_area text NULL`; `media jsonb NOT NULL DEFAULT '[]'` (ordered server-issued image asset references); `gallery_visible boolean NOT NULL` (set from `business_settings.gallery_media_default`; Q-50); `faqs jsonb NOT NULL DEFAULT '[]'` (read-only in the manager; Q-52); `status text NOT NULL DEFAULT 'active' CHECK ('active','paused')`; `version int NOT NULL DEFAULT 1`; `deleted_at timestamptz NULL`; timestamps. The write use-case verifies that the subcategory belongs to the selected category. Enquiry pricing has no amount; fixed/from require `price_from_paise`; range requires both bounds. | Unique `slug` serves detail route; `(business_id,status,created_at DESC,id DESC)` serves manager; `(category_id,subcategory_id,business_id)` serves search/filter joins. |
| `provider_expertise` | `business_id uuid NOT NULL FK businesses`; `subcategory_id uuid NOT NULL FK subcategories`; `created_at timestamptz NOT NULL`; PK `(business_id,subcategory_id)`. Provider only; multiple subcategories allowed, separate from a service's single subcategory (BR-08). | PK serves profile and expertise lookup; `(subcategory_id,business_id)` serves provider discovery. |
| `enquiries` | `id uuid PK`; `service_id uuid NOT NULL FK services`; `business_id uuid NOT NULL FK businesses`; `customer_user_id uuid NULL FK users`; `name text NOT NULL`; `phone_ciphertext text NOT NULL`; `message text NOT NULL`; `preferred_date date NULL`; `status text NOT NULL DEFAULT 'new' CHECK ('new','contacted','converted','closed')`; `version int NOT NULL DEFAULT 1`; `converted_at timestamptz NULL`; timestamps. Guest submissions have no user link. | `(business_id,status,created_at DESC,id DESC)` serves inbox; `(customer_user_id,business_id,created_at DESC)` supports user data requests and enquirer review eligibility. |

`services.media` stores ordered, server-issued image asset references; storage validation and resolution use the shared storage port. Videos and their moderation/consent are owned by `media-videos`. `gallery_visible` follows the service editor prototype and defaults from `business_settings.gallery_media_default`; the mismatch with BR-16 is recorded in Q-50. Do not log enquiry names, phone numbers, or message bodies. Authenticated users' data requests use the users contract; guest enquiry PII retention/deletion remains unresolved in Q-51.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/services/{slug}` | Public; approved business and non-deleted service | → localized service fields, ordered images, category path, pricing, service area, business hours/provider summary, approved linked videos and FAQs; offer/review summaries from owning modules | `COMMON_NOT_FOUND` | Yes | F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, S-CUST-09 |
| GET | `/businesses/{slug}/expertise` | Public; approved provider only | → active localized subcategory list | `COMMON_NOT_FOUND` | Yes | F-PV-002, S-CUST-07 |
| GET | `/businesses/me/services?status=&cursor=&limit=` | Authenticated vendor/provider; own business from session | Allow-listed status, keyset cursor, limit ≤50 → manager page | `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-014, F-PV-003 |
| POST | `/businesses/me/services` | Authenticated vendor/provider; own business, matching kind | `{nameEn,nameHi?,categoryId,subcategoryId,description?,priceType,priceFromPaise?,priceToPaise?,unit?,included[]?,excluded[]?,serviceArea?,media[]?,galleryVisible?,status?}` → service DTO; title 2–60 chars, subcategory active and under category; Gallery default comes from business settings, status defaults active | `SERVICES_INVALID`, `SERVICES_SUBCATEGORY_REQUIRED` | Idempotency key | F-VD-014, F-PV-003 |
| GET/PATCH/DELETE | `/businesses/me/services/{serviceId}` | Authenticated owner; business and listing ownership checked | GET DTO; PATCH same allow-list with `expectedVersion`; DELETE soft-deletes | `COMMON_NOT_FOUND`, `COMMON_FORBIDDEN`, `SERVICES_INVALID`, `SERVICES_VERSION_CONFLICT` | GET/DELETE yes; PATCH versioned | F-VD-014, F-PV-003 |
| GET/PUT | `/businesses/me/expertise` | Authenticated provider; own provider business | GET → current subcategory IDs; PUT `{subcategoryIds[],expectedVersion}` → saved expertise; IDs must be active catalog subcategories | `COMMON_FORBIDDEN`, `SERVICES_EXPERTISE_INVALID`, `SERVICES_VERSION_CONFLICT` | GET yes; PUT versioned | F-PV-002; S-PROV-01/09 |
| POST | `/services/{serviceId}/enquiries` | Public, optional authenticated customer; active service of approved business | `{name (2–60 chars),phone (10 digits),message (required plain text),preferredDate? (not past)}` → `{enquiryId,status:"new"}`; phone is normalized/encrypted; key required | `COMMON_NOT_FOUND`, `COMMON_VALIDATION_FAILED`, `COMMON_RATE_LIMITED` | Idempotency key | F-SV-005, J2 |
| GET | `/businesses/me/enquiries?status=&cursor=&limit=` | Authenticated vendor/provider; own business only | Allow-listed ST-enquiry status, keyset cursor, limit ≤50 → inbox page | `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-016, F-PV-004 |
| GET | `/businesses/me/enquiries/{enquiryId}` | Authenticated vendor/provider; enquiry belongs to own business | → detail DTO; phone only for the owner | `COMMON_NOT_FOUND`, `COMMON_FORBIDDEN` | Yes | F-VD-016, F-PV-004 |
| PATCH | `/businesses/me/enquiries/{enquiryId}/status` | Authenticated vendor/provider; own business; expected version | `{status:"contacted"|"converted"|"closed",expectedVersion}` → updated status | `COMMON_NOT_FOUND`, `COMMON_FORBIDDEN`, `SERVICES_INVALID_TRANSITION`, `SERVICES_VERSION_CONFLICT` | Versioned | F-VD-016, F-PV-004, J14 |

No endpoint creates a booking or payment; those controls remain disabled under the existing booking feature flag. Direct call/WhatsApp actions are user-initiated links; no outbound campaign or message is sent by this module.

## Rules and use-cases

1. Resolve business, role and owner from the authenticated session. Service category must be an active service-kind catalog category, and its one active subcategory must belong to it (BR-08); provider expertise is a separate many-to-many relation.
2. Public details can show a paused service by direct slug with a paused state; search/cards exclude paused, deleted or unapproved listings. An active flag never bypasses business approval (BR-06).
3. Validate `price_type` and amounts as specified above; amounts are integer paise. Preferred date is optional and cannot be before the current IST calendar date. Phone accepts the documented 10-digit Indian number and is normalized before encryption.
4. Public enquiry creation is rate-limited and stores only submitted fields plus an optional session-derived user ID. Owner inbox reads are scoped to that owner's business. Do not expose enquiries through public APIs or log PII (BR-14).
5. Enquiry transitions are `new → contacted`, then either `contacted → converted` or `contacted → closed`; converted and closed are terminal (ST-enquiry). Reject every other edge and stale version. A converted enquiry becomes eligible for that provider's review through the reviews contract (BR-09/J14).
6. Submit video links through the media-videos contract, linked to the service after ownership validation; never accept arbitrary embed URLs. Only approved videos appear on service details (BR-10). Offers, reviews, related services, similar providers, follow/bookmark actions and service-card discovery use their owning modules; no duplicated state.
7. Service-level gallery visibility and current FAQ defaults follow the prototype until Q-50/Q-52 are resolved; do not infer consent for separately uploaded videos.

## Events and jobs

| Event | Producer / consumer | Handling |
|---|---|---|
| `service.enquiry.created` | Services → notifications | Outbox after enquiry commit; notify the owning provider/vendor without putting phone/message in the event payload. |
| `service.enquiry.converted` | Services → reviews | Outbox after versioned transition; reviews derives enquirer eligibility. |
| `service.changed` | Services → search cache | Invalidate service detail and affected category/subcategory result tags after commit. |

Consumers deduplicate by event ID; retry transient failures through the shared outbox/job runner.

## Errors

| Code | HTTP | Message key |
|---|---:|---|
| `SERVICES_INVALID` | 422 | `errors.services.invalid` |
| `SERVICES_SUBCATEGORY_REQUIRED` | 422 | `errors.services.subcategoryRequired` |
| `SERVICES_EXPERTISE_INVALID` | 422 | `errors.services.expertiseInvalid` |
| `SERVICES_INVALID_TRANSITION` | 409 | `errors.services.invalidTransition` |
| `SERVICES_VERSION_CONFLICT` | 409 | `errors.services.versionConflict` |

Common authentication, authorization, validation and rate-limit failures use the shared error catalogue.

## Acceptance criteria

- Given a public service belongs to an approved business, when its slug is requested, then only public fields and approved linked videos are returned.
- Given a service subcategory belongs to another category or is inactive, when its owner saves the service, then validation rejects it without changing the prior version.
- Given a provider submits several active expertise subcategories, when saved, then each mapping is persisted independently of service subcategories.
- Given a guest submits a valid enquiry for an active service, when the request succeeds, then one `new` enquiry is committed and a notification event is queued without PII.
- Given an enquiry is `new`, when its owner attempts `converted`, then the transition is rejected; after `contacted`, `converted` can enable review eligibility.
- Given a different business owner requests an enquiry or service ID, when the API checks ownership, then access is denied and no record is disclosed.
- Given two status updates use the same old version, when both are submitted, then only one transition succeeds.

## Tests

- Unit: price-type constraints, category/subcategory match, enquiry transition graph and version conflict.
- Integration: public active/paused/unapproved visibility, enquiry persistence/outbox, provider expertise save, and service search invalidation.
- Authorization negatives: cross-business service/enquiry IDs, vendor attempting provider expertise, and guest attempting inbox access.
- Privacy: encrypted phone at rest; no phone/message in logs, events, or public DTOs.
