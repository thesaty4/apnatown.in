# BE: reviews

Features: F-RV-001, F-RV-002, F-RV-003, F-RV-004, F-RV-005, F-RV-006, F-RV-007, F-AD-009, F-PD-007, F-VD-010, F-RD-007 | Rules: BR-09, BR-12, BR-02 | State machines: ST-review | Depends on: users, orders (eligibility contract), services (enquiry eligibility), businesses, products, delivery (rider target), media-videos (photos), audit, notifications.

Frontend counterpart: [FE reviews](../fe/reviews.md)

## Responsibility

Own reviews for four target types (business, product, service/provider, rider), eligibility checks, rating aggregates, helpful votes, reports, owner replies and moderation (ST-review). Reviewed entities expose `rating_avg`/`rating_count` via this module's read contract (denormalised counters here, not in their tables).

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `reviews` | `id uuid PK`; `target_type text NOT NULL CHECK ('business','product','service','rider')`; `target_id uuid NOT NULL`; `business_id uuid NULL FK businesses` (owner for replies; null for rider); `author_user_id uuid NOT NULL FK users`; `eligibility_ref_type text NOT NULL CHECK ('order','enquiry')`; `eligibility_ref_id uuid NOT NULL`; `rating smallint NOT NULL CHECK 1–5`; `text text NULL CHECK length <= 1000`; `tags text[] NOT NULL DEFAULT '{}'`; `photo_asset_ids uuid[] NOT NULL DEFAULT '{}'` (max 5); `status text NOT NULL CHECK ('pending','published','reported','hidden','deleted')`; `moderation_reason text NULL`; `helpful_count int NOT NULL DEFAULT 0`; `owner_reply text NULL CHECK length <= 1000`; `owner_replied_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at timestamptz`; UNIQUE `(author_user_id,target_type,target_id,eligibility_ref_id)` | `(target_type,target_id,status,created_at DESC,id DESC)` (public list); `(author_user_id,created_at DESC)` (My reviews); `(business_id,status,created_at DESC)` (owner list); `(status,created_at)` (moderation queue) |
| `review_reports` | `id uuid PK`; `review_id uuid NOT NULL FK reviews`; `reporter_user_id uuid NOT NULL FK users`; `reason text NOT NULL CHECK ('abusive','spam','fake','other')`; `details text NULL CHECK <= 500`; `created_at`; UNIQUE `(review_id,reporter_user_id)` | `(review_id)` |
| `review_helpful_votes` | `review_id uuid FK`; `user_id uuid FK`; `created_at`; PK `(review_id,user_id)` | PK |
| `review_aggregates` | `target_type text`, `target_id uuid`, PK both; `rating_count int NOT NULL DEFAULT 0`; `rating_sum int NOT NULL DEFAULT 0`; `count_1..count_5 int NOT NULL DEFAULT 0`; `updated_at` | PK (rating badge, breakdown) |

Quick tags are an allow-list per target type (prototype `TAGS`): business — Fair price, Fresh, Helpful staff, On time, Clean; product — Good quality, Value for money, As described; service — Quick visit, Professional, Fair quote, Polite; rider — Polite, On time, Careful. Stored as stable keys with EN/HI labels.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/reviews?targetType=&targetId=&sort=recent\|helpful&cursor=&limit=` | Public; only `published`/`reported` | → page + aggregate breakdown | `VALIDATION_ERROR` | Yes | F-PD-007, F-RV-001, S-CUST-08 |
| GET | `/reviews/eligibility?targetType=&targetId=` | Customer | → `{eligible, refType?, refId?, reasonKey?}` | — | Yes | F-RV-002, S-CUST-18 |
| POST | `/reviews` | Customer; eligible (BR-09) | `{targetType,targetId,rating,text?,tags[],photoAssetIds[]}` → review with status | `REVIEW_NOT_ELIGIBLE`, `REVIEW_DUPLICATE`, `REVIEW_TAG_INVALID`, `VALIDATION_ERROR` | Required key | F-RV-001, F-RV-002, F-RV-003, S-CUST-18 |
| GET | `/reviews/me` | Customer; own | cursor → own reviews incl. pending/hidden status | — | Yes | F-RV-004, S-CUST-17 |
| PATCH / DELETE | `/reviews/{id}` | Author only | `{rating?,text?,tags?,photoAssetIds?,expectedVersion}` → re-moderated review / soft delete | `REVIEW_NOT_FOUND`, `REVIEW_VERSION_CONFLICT` | Yes | F-RV-004 |
| PUT / DELETE | `/reviews/{id}/helpful` | Customer, not author | → `{helpfulCount}` | `REVIEW_NOT_FOUND` | Yes | F-RV-005 |
| POST | `/reviews/{id}/reports` | Customer or owning vendor/provider | `{reason,details?}` → 202 | `REVIEW_ALREADY_REPORTED` | Yes | F-RV-005, F-RV-007 |
| GET | `/businesses/me/reviews?rating=&replied=&cursor=` | Approved vendor/provider; own business | → reviews of business + its products/services | — | Yes | F-VD-010, F-RV-007, S-VEND-09, S-PROV-10 |
| PUT / DELETE | `/businesses/me/reviews/{id}/reply` | Owning vendor/provider | `{text}` → review | `REVIEW_NOT_FOUND` | Yes | F-RV-007 |
| GET | `/reviews/riders/me` | Approved rider | → own rider reviews + aggregate | — | Yes | F-RD-007, S-RIDE-07 |
| GET | `/admin/reviews?tab=reported\|pending\|removed&cursor=` | Admin `reviews:view` + target city/area in scope | → queue items with reports | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-009, F-RV-006, S-ADMN-10 |
| POST | `/admin/reviews/{id}/decision` | Admin `reviews:edit` + scope; audited | `{action:'approve'\|'hide'\|'delete'\|'restore',reason?,expectedVersion}` → review | `REVIEW_INVALID_TRANSITION` | Required key | F-AD-009, F-RV-006 |

## Rules and use-cases

1. **Eligibility (BR-09):** business/product — customer has a `delivered` or `picked_up` order from that business (containing the product); service/provider — customer has an enquiry for that service/provider in `contacted|converted` (Services contract); rider — customer's delivered order was delivered by that rider. One review per target per eligibility reference. Otherwise return `eligible=false` with the explanatory reason key.
2. **Moderation on submit:** text containing a URL or a term from the settings-managed blocked-word list → `pending`; otherwise `published`. Editing re-runs the check.
3. **ST-review:** `pending→published|hidden`; `published→reported` (first report); `reported→hidden|published`; any → `deleted` (author or admin). Explicit handlers; invalid → `REVIEW_INVALID_TRANSITION`.
4. Aggregates update in the same transaction as any status/rating change; only `published` and `reported` reviews count.
5. Owner replies only on their business's targets; replies are plain text, shown under the review; editing a reply overwrites.
6. Photos: author-owned media assets, validated by media-videos; max 5.
7. Admin decisions require role + `reviews` permission + target business city/area scope (rider target: rider city); audited before/after (BR-12); author notified on hide/delete.
8. Public DTO shows author first name + initial only.

## Events and jobs

Publishes `review.published`, `review.reported`, `review.hidden`, `review.replied` (notifications to owner/author). Consumes `order.status_changed` (no write; eligibility is queried live). No jobs.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `REVIEW_NOT_FOUND` | 404 | `errors.reviews.notFound` |
| `REVIEW_NOT_ELIGIBLE` | 403 | `errors.reviews.notEligible` |
| `REVIEW_DUPLICATE` | 409 | `errors.reviews.duplicate` |
| `REVIEW_TAG_INVALID` | 422 | `errors.reviews.tagInvalid` |
| `REVIEW_ALREADY_REPORTED` | 409 | `errors.reviews.alreadyReported` |
| `REVIEW_INVALID_TRANSITION` | 409 | `errors.reviews.invalidTransition` |
| `REVIEW_VERSION_CONFLICT` | 409 | `errors.reviews.versionConflict` |

## Acceptance criteria

1. Given a customer without a qualifying order/enquiry, when posting a review, then `REVIEW_NOT_ELIGIBLE` and nothing is stored.
2. Given text with a link or blocked word, when submitted, then status is `pending`, it is hidden publicly and shown to the author as "awaiting moderation".
3. Given a rating of 0 or 6, or text over 1000 chars, then `VALIDATION_ERROR`.
4. Given the same idempotency key is replayed, then one review exists.
5. Given a published review is reported, then it moves to `reported`, stays visible, and appears in the admin Reported tab.
6. Given an admin hides a review, then aggregates exclude it and an audit row with before/after exists.
7. Given an admin without `reviews:edit` or outside the business's area, then 403 and no change.
8. Given a vendor replies to another business's review, then 404.

## Tests

Unit: eligibility per target type; moderation check; ST-review handlers; aggregate maths. Integration: submit → aggregate; report → queue; helpful toggle idempotency. Authorisation negatives: non-author edit, cross-business reply, unscoped admin. Concurrency: simultaneous helpful votes, duplicate submissions.

## Open questions

Blocked-word list ownership (assumed Settings review rules, F-SA-005); whether rider reviews are shown publicly (assumed rider-only + admin).
