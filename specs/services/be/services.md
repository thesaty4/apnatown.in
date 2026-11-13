# BE: services

## Contents

- [Responsibility](#responsibility)
- [Tables](#tables)
- [Endpoints](#endpoints)
- [Rules and use-cases](#rules-and-use-cases)
- [Events and jobs](#events-and-jobs)
- [Errors](#errors)
- [Acceptance criteria](#acceptance-criteria)
- [Verification](#verification)

Features: F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, F-VD-014, F-VD-016, F-PV-003, F-PV-004 | Rules: BR-02, BR-06, BR-08, BR-09, BR-10, BR-14, BR-16, BR-18 | State machines: ST-enquiry | Depends on: businesses, catalog, geo | Used by: search, businesses, offers, reviews, engagement, media-videos, notifications

Frontend counterpart: [FE services](../fe/services.md) · [Feature inventory](../../../docs/design-context/01-feature-inventory.md)

## Responsibility

Own service listings, provider expertise mappings and service enquiries. Reuse business approval/ownership, catalog taxonomy, geo, media, offer, review, engagement and notification contracts; do not duplicate their records or state. Search consumes active service data and applies the service subcategory as the filter/count source (BR-18).

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `services` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `category_id uuid NOT NULL FK categories`; `subcategory_id uuid NOT NULL FK subcategories`; `slug text NOT NULL UNIQUE`; `name_en text NOT NULL`; `name_hi text NULL`; `description text NULL`; `price_type text NOT NULL CHECK ('from','fixed','range','enquiry')`; `price_from_paise bigint NULL CHECK >= 0`; `price_to_paise bigint NULL CHECK >= price_from_paise`; `unit text NULL CHECK ('hour','day','event','sq_ft','unit','visit','plate','month')`; `included/excluded text[] NOT NULL DEFAULT '{}'`; `service_area text NULL`; `experience_years int NULL CHECK >=0` (verified value only; no generated default); `media jsonb NOT NULL DEFAULT '[]'` (ordered server-issued image asset references); `gallery_visible boolean NOT NULL` (set from `business_settings.gallery_media_default`; Q-50); `faqs jsonb NOT NULL DEFAULT '[]'` (read-only in the manager; Q-52); `featured_selected boolean NOT NULL DEFAULT false`; `status text NOT NULL DEFAULT 'active' CHECK ('active','paused')`; `version int NOT NULL DEFAULT 1`; `deleted_at timestamptz NULL`; timestamps. The write use-case verifies that the subcategory belongs to the selected category. Enquiry pricing has no amount; fixed/from require `price_from_paise`; range requires both bounds. | Unique `slug` serves detail route; `(business_id,status,created_at DESC,id DESC)` serves manager; `(category_id,subcategory_id,business_id)` serves service filter joins; partial `(category_id,featured_selected DESC,created_at DESC,id DESC) WHERE status='active' AND deleted_at IS NULL` supports default featured-first Explore. |
| `provider_expertise` | `business_id uuid NOT NULL FK businesses`; `subcategory_id uuid NOT NULL FK subcategories`; `created_at timestamptz NOT NULL`; PK `(business_id,subcategory_id)`. Provider only; multiple subcategories allowed, separate from a service's single subcategory (BR-08). | PK serves profile and expertise lookup; `(subcategory_id,business_id)` serves provider discovery. |
| `provider_expertise_versions` | `business_id uuid PK FK businesses`; `version int NOT NULL DEFAULT 1`; `updated_at timestamptz NOT NULL`. Services owns this aggregate version independently of the business profile. | PK is locked for atomic replace-all expertise saves. |
| `enquiries` | `id uuid PK`; `service_id uuid NOT NULL FK services`; `business_id uuid NOT NULL FK businesses`; `customer_user_id uuid NULL FK users`; `name text NOT NULL`; `phone_ciphertext text NOT NULL`; `message text NOT NULL`; `preferred_date date NULL`; `status text NOT NULL DEFAULT 'new' CHECK ('new','contacted','converted','closed')`; `version int NOT NULL DEFAULT 1`; `converted_at timestamptz NULL`; timestamps. Guest submissions have no user link. | `(business_id,status,created_at DESC,id DESC)` serves inbox; `(customer_user_id,business_id,created_at DESC)` supports user data requests and enquirer review eligibility. |

`services.media` stores ordered, server-issued image asset references; storage validation and resolution use the shared storage port. Videos and their moderation/consent are owned by `media-videos`. `gallery_visible` follows the service editor prototype and defaults from `business_settings.gallery_media_default`; the mismatch with BR-16 is recorded in Q-50. Do not log enquiry names, phone numbers, or message bodies. Authenticated users' data requests use the users contract; guest enquiry PII retention/deletion remains unresolved in Q-51.

Public service images use [Media's image policy](../../media-videos/be/media-videos.md#public-image-policy), including maximum five attachments and server-side size/format validation (Q-53 resolved). Enquiry reporting uses [reporting-v1](../../admin/be/admin.md#reporting-definitions): retain first `converted_at` once, never rewrite it on an idempotent transition. `ServiceOwnerReadPort.enquiryCohort({businessId,from,toExclusive,asOf})` returns `{total,converted,conversionRate,definitionVersion}` from enquiries created in that period, converted by asOf; zero total has null rate. Scope/ownership precedes aggregate reads; no guest phone/name becomes a metric key. Add `(business_id,created_at,id)` for cohorts and `(business_id,converted_at,id)` for conversion activity.

`featured_selected` records owner choice, not public eligibility. `ServiceReadPort` returns effective `featured` only for an active, public service/business with current Premium at query time. New selection requires entitlement under Payments' resolved billing policy; missing configuration fails closed. Existing services remain unselected by default.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/services/{slug}` | Public; approved business and non-deleted service | → localized service fields, ordered images, category path, pricing, service area, business hours/provider summary, approved linked videos and FAQs; offer/review summaries from owning modules | `COMMON_NOT_FOUND` | Yes | F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, S-CUST-09 |
| GET | `/services/{slug}/related?cursor=&limit=` | Public; active services of approved businesses | Same subcategory, excludes current service; stable `(createdAt,id)` keyset, default/cap 4 → `{items,nextCursor}` (`js24.js`) | `COMMON_NOT_FOUND`, `COMMON_VALIDATION_FAILED` | Yes | F-SV-006 |
| GET | `/services/{slug}/similar-providers?cursor=&limit=` | Public; approved provider businesses in the service's category | Exclude current owner; stable `(businessId)` keyset, default/cap 3 → public provider page (`js24.js`); no invented same-subcategory/expertise prerequisite | `COMMON_NOT_FOUND`, `COMMON_VALIDATION_FAILED` | Yes | F-SV-006 |
| GET | `/businesses/public/{slug}/services?category=&subcategory=&cursor=&limit=` | Public; approved business, active services | → `{items,nextCursor,categories:[{id,slug,label,count}],subcategories:[{id,categoryId,slug,label,count}]}` with preselection pill counts; limit ≤50 | `COMMON_NOT_FOUND`, `COMMON_VALIDATION_FAILED` | Yes | F-PF-004, F-SV-001 |
| GET | `/businesses/{slug}/expertise` | Public; approved provider only | → active localized subcategory list | `COMMON_NOT_FOUND` | Yes | F-PV-002, S-CUST-07 |
| GET | `/businesses/me/services?status=&cursor=&limit=` | Authenticated vendor/provider; own business from session | Allow-listed status, keyset cursor, limit ≤50 → manager page | `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-014, F-PV-003 |
| POST | `/businesses/me/services` | Authenticated approved vendor/provider; own business | `{nameEn,nameHi?,categoryId,subcategoryId,description?,priceType,priceFromPaise?,priceToPaise?,unit?,included[]?,excluded[]?,serviceArea?,media[]?,galleryVisible?,featuredSelected?,status?}` → service DTO; title 2–60 chars, subcategory active and under category; Gallery default comes from business settings, status defaults active; featuring requires active Premium entitlement | `SERVICES_INVALID`, `SERVICES_SUBCATEGORY_REQUIRED`, `FEATURED_ENTITLEMENT_UNAVAILABLE`, `USERS_APPROVAL_REQUIRED` | Idempotency key | F-VD-014, F-PV-003 |
| GET/PATCH/DELETE | `/businesses/me/services/{serviceId}` | Authenticated owner; PATCH/DELETE require approved business and listing ownership | GET DTO; PATCH same allow-list plus `featuredSelected?` with `expectedVersion`; DELETE soft-deletes with version; selection requires active Premium feature entitlement | `COMMON_NOT_FOUND`, `COMMON_FORBIDDEN`, `SERVICES_INVALID`, `FEATURED_ENTITLEMENT_UNAVAILABLE`, `SERVICES_VERSION_CONFLICT` | GET yes; writes key + version | F-VD-014, F-PV-003 |
| GET/PUT | `/businesses/me/expertise` | Authenticated provider/applicant; own editable provider business, profile capability only | GET → `{subcategoryIds,expertiseVersion}` (empty set starts at version 1); PUT `{subcategoryIds[],expectedVersion}` → same shape with incremented expertise version; IDs must be active service subcategories | `COMMON_FORBIDDEN`, `SERVICES_EXPERTISE_INVALID`, `SERVICES_VERSION_CONFLICT` | GET yes; PUT versioned | F-PV-002; S-PROV-01/09 |
| POST | `/services/{serviceId}/enquiries` | Public, optional authenticated customer; active service of approved business | `{name (2–60 chars),phone (10 digits),message (required plain text),preferredDate? (not past)}` → `{enquiryId,status:"new"}`; phone is normalized/encrypted; key required | `COMMON_NOT_FOUND`, `COMMON_VALIDATION_FAILED`, `COMMON_RATE_LIMITED` | Idempotency key | F-SV-005, J2 |
| GET | `/businesses/me/enquiries?status=&query=&cursor=&limit=` | Authenticated vendor/provider; own business only | Allow-listed ST-enquiry status, name/message query, keyset cursor, limit ≤50 → `{items,nextCursor,statusCounts}`; counts before selected status, within same owner/query | `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-016, F-PV-004 |
| GET | `/businesses/me/enquiries/{enquiryId}` | Authenticated vendor/provider; enquiry belongs to own business | → detail DTO; phone only for the owner | `COMMON_NOT_FOUND`, `COMMON_FORBIDDEN` | Yes | F-VD-016, F-PV-004 |
| PATCH | `/businesses/me/enquiries/{enquiryId}/status` | Authenticated vendor/provider; own business; expected version | `{status:"contacted"\|"converted"\|"closed",expectedVersion}` → updated status | `COMMON_NOT_FOUND`, `COMMON_FORBIDDEN`, `SERVICES_INVALID_TRANSITION`, `SERVICES_VERSION_CONFLICT` | Versioned | F-VD-016, F-PV-004, J14 |

No endpoint creates a booking or payment; those controls remain disabled under the existing booking feature flag. Direct call/WhatsApp actions are user-initiated links; no outbound campaign or message is sent by this module.

### Read and cross-module contracts

- `ServiceReadPort.publicProjection({serviceIds?,businessIds?,categoryIds?,subcategoryIds?,cursor,limit})` returns `{id,slug,businessId,nameEn,nameHi,categoryId,subcategoryId,priceType,priceFromPaise,priceToPaise,unit,media,serviceArea,status,version}` for active services of approved businesses. Search enriches with Business public contact/location/hours and owner-controlled Offers/Reviews data; provider expertise is never a substitute for service subcategory matching.
- `ServiceReadPort.ownerSummary({businessId,actor,period:"7d"|"30d"}) -> {newCount,enquiryCount,convertedCount,statusCounts,daily:[{date,count,converted}],latest,nextCursor}` derives actual enquiry rows and IST calendar buckets; no seeded extra counts, synthetic conversion or profile views.
- `EnquiryProofPort.readForUser({userId,businessId,serviceId?,proofId?,cursor?,limit?}) -> {items:[{id,businessId,serviceId,status,createdAt,convertedAt}],nextCursor}` returns only that authenticated user's proofs, stable keyset and limit ≤50. `proofId` resolves the exact submitted reference for writes, not an arbitrary latest enquiry. Reviews owns eligibility/uniqueness; never attach a guest enquiry solely by matching unverified phone text.
- `ServiceNotificationReadPort.context({enquiryId}) -> {businessId,serviceId?,ownerUserId,ownerRole,scope,customerUserId?}` supplies Notifications without enquiry text/phone. `ServiceAdminReadPort.enquiryReport` implements the scoped count/date/pagination [Admin contract](../../admin/be/admin.md#required-owning-module-ports), never a contact export.
- `EnquiryAudienceReadPort.customersOfBusiness({businessId,asOf,cursor,limit}) -> Page<{userId,enquiryId,status,createdAt}>` supplies only authenticated links to Communications, with internal batches ≤500. COMMS-Q1 decides qualifying states/inclusion; this facts port does not create that policy.
- Export the public service eligibility/price/category columns as owner-maintained read-only SQL projections for Search composition before pagination. Nullable enquiry pricing and active/published-business rules remain Services-owned.
- Implement `ServiceMediaReadPort.resolve` using [Media's bounded projection](../../media-videos/be/media-videos.md#required-discoverycommerce-read-ports), including actual asset attachment and effective `galleryAllowed`. Until Q-50 resolves ambiguous consent inheritance, deny that Gallery placement rather than treating a default as consent; no recursive URL resolution.
- Implement Users' `UserDataPort` for authenticated enquiry export and policy-approved erasure. Guest identity verification, retention and deletion remain Q-51; return a blocked receipt for unresolved retained data, not a successful no-op.
- Public service/detail media is `{assetId,path,altText}` using a root-relative same-origin Media gateway path; write media items are `{assetId,showInGallery?}`. Q-50 must reconcile the service-level default with per-item consent; a video never inherits consent silently. Experience years visible in the prototype are nullable owner-verified data, not the sample generator's random value; authoring source remains an open question and unknown experience is omitted.

## Rules and use-cases

1. Resolve business, role and owner from the authenticated session. Service category must be an active service-kind catalog category, and its one active subcategory must belong to it (BR-08); provider expertise is a separate many-to-many relation.
2. Public details can show a paused service by direct slug with a paused state; search/cards exclude paused, deleted or unapproved listings. An active flag never bypasses business approval (BR-06).
3. Validate `price_type` and amounts as specified above; amounts are integer paise. Preferred date is optional and cannot be before the current IST calendar date. Phone accepts the documented 10-digit Indian number and is normalized before encryption.
4. Public enquiry creation is rate-limited and stores only submitted fields plus an optional session-derived user ID. Owner inbox reads are scoped to that owner's business. Do not expose enquiries through public APIs or log PII (BR-14).
5. Enquiry transitions remain `new -> contacted`, then `contacted -> converted|closed` (ST-enquiry); reject other edges/stale versions until the source conflict below is resolved. Reviews, not Services, decides whether the authenticated proof is eligible (BR-09).
6. Submit video links through the media-videos contract, linked to the service after ownership validation; never accept arbitrary embed URLs. Only approved videos appear on service details (BR-10). Offers, reviews, related services, similar providers, follow/bookmark actions and service-card discovery use their owning modules; no duplicated state.
7. Service-level gallery visibility and current FAQ defaults follow the prototype until Q-50/Q-52 are resolved; do not infer consent for separately submitted video links.
8. Replacing expertise locks/upserts its version row and updates mappings/version in one transaction. Draft/pending/rejected/changes-requested applicants may edit this profile field; suspended/inactive owners cannot use it to bypass the business capability policy. Listing creation/publication remains approved-only.
9. Effective featured status is derived from `featured_selected`, active listing/business visibility and Payments' current Premium entitlement at `at`. Expiry, suspension, pausing or deletion makes it false at read time; expiry retains the owner selection. A verified Premium renewal restores effective featuring for still-selected, otherwise-eligible services without a service write; Search does not infer plans or activate paid features.

Open question: `js10.js` exposes arbitrary enquiry status buttons (and marks new enquiries contacted when Call/WhatsApp is invoked), ST-enquiry makes converted/closed terminal, while J14 describes closing after conversion. Do not copy unrestricted transitions into production. Show only the strict edges above until approved; initiating contact performs the guarded `new -> contacted` command and reports any conflict, without claiming a message was delivered. Review eligibility for contacted versus converted enquiries is the separate decision owned by Reviews.

## Events and jobs

| Event | Producer / consumer | Handling |
|---|---|---|
| `service.enquiry.created` | Services → notifications | Outbox after enquiry commit; notify the owning provider/vendor without putting phone/message in the event payload. |
| `service.enquiry.status_changed` / `service.enquiry.converted` | Services → reviews/notifications | Status-change event after each versioned transition; converted event only on conversion. Payload `{enquiryId,businessId,serviceId,customerUserId?,status,previousStatus,version}`; no phone/message. Reviews reads proof, not an unconditional eligibility grant. |
| `service.changed` | Services → search cache | Invalidate service detail and affected category/subcategory result tags after commit. |
| Payments subscription eligibility change/expiry | Payments → Services/Search cache | `business.subscription.eligibility_changed` and `business.subscription.expired` invalidate effective featured status for the affected business; no service write is required on expiry or renewal. |
| `provider.expertise.changed` | Services → public profile/search cache | `{businessId,expertiseVersion}` after replacing expertise; does not change service facet membership. |

Consumers deduplicate by event ID; retry transient failures through the shared outbox/job runner.

## Errors

| Code | HTTP | Message key |
|---|---:|---|
| `SERVICES_INVALID` | 422 | `errors.services.invalid` |
| `SERVICES_SUBCATEGORY_REQUIRED` | 422 | `errors.services.subcategoryRequired` |
| `SERVICES_EXPERTISE_INVALID` | 422 | `errors.services.expertiseInvalid` |
| `SERVICES_INVALID_TRANSITION` | 409 | `errors.services.invalidTransition` |
| `SERVICES_VERSION_CONFLICT` | 409 | `errors.services.versionConflict` |
| `FEATURED_ENTITLEMENT_UNAVAILABLE` | 409 | `errors.services.featuredEntitlementUnavailable` |

Common authentication, authorization, validation and rate-limit failures use the shared error catalogue.

## Acceptance criteria

- Given a public service belongs to an approved business, when its slug is requested, then only public fields and approved linked videos are returned.
- Given a service subcategory belongs to another category or is inactive, when its owner saves the service, then validation rejects it without changing the prior version.
- Given a provider submits several active expertise subcategories, when saved, then each mapping is persisted independently of service subcategories.
- Given a guest submits a valid enquiry for an active service, when the request succeeds, then one `new` enquiry is committed and a notification event is queued without PII.
- Given an enquiry is `new`, when its owner attempts `converted`, then the transition is rejected; a valid later conversion updates proof without bypassing Reviews' eligibility/uniqueness policy.
- Given a different business owner requests an enquiry or service ID, when the API checks ownership, then access is denied and no record is disclosed.
- Given two status updates use the same old version, when both are submitted, then only one transition succeeds.
- Given a pending applicant edits expertise, when it saves with the expertise version, then profile mappings persist without granting sale capability; service publication remains denied.
- Given two expertise replacements race or a business profile version is supplied instead, when the aggregate is checked, then only the correct current expertise version can replace the set.
- Given a paused service or suspended owner, when related/profile lists and facets are read, then it is absent; directly opened paused details retain the documented unavailable-enquiry state.
- Given an owner selects a service for featuring without active Premium entitlement, when saved, then the write is rejected and no featured status is exposed; after expiry, the effective public status is false while the selection remains stored; after verified renewal, a still-eligible selected service is featured again without altering enquiry-only pricing or requiring a service write.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Rules: price-type constraints, category/subcategory match, enquiry transition graph and version conflict.
- Manual API/DB: public active/paused/unapproved visibility, enquiry persistence/outbox, provider expertise save, and service search invalidation.
- Authorization negatives: cross-business service/enquiry IDs, vendor attempting provider expertise, and guest attempting inbox access.
- Privacy: encrypted phone at rest; no phone/message in logs, events, or public DTOs.
