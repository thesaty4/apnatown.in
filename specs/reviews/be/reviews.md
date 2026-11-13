# BE: reviews

Features: F-RV-001, F-RV-002, F-RV-003, F-RV-004, F-RV-005, F-RV-006, F-RV-007, F-AD-009, F-PD-007, F-VD-010, F-RD-007 | Rules: BR-09, BR-12, BR-02 | State machines: ST-review | Depends on: users, orders (eligibility contract), services (enquiry eligibility), businesses, products, delivery (rider target), media-videos (photos), audit, notifications.

Frontend counterpart: [FE reviews](../fe/reviews.md)

## Implementation status

2026-11-13, public read only: **`GET /reviews` implemented; shared/API/client builds passed; migration and seed applied to the local DB on explicit request; HTTP runtime checks deferred**.

- Implemented: shared entry `@apnatown/shared/reviews` (`ReviewListQuerySchema`, `ReviewCardSchema`, `ReviewSummarySchema`, `ReviewPageSchema`, `reviewAuthorLabel`), `ReviewsModule` with public `GET /reviews` (operationId `reviewsList`, IP rate limit 120/min, `private, no-store`). Visible set = `published|reported`, not deleted, active non-deleted author, publicly visible target (`products_public_discovery` / `services_public_discovery` / `businesses_public_context`); otherwise `COMMON_NOT_FOUND`. Summary (1-decimal average, count, `[1★..5★]` breakdown) uses the same set. Sorts `recent` (created_at, id DESC) and `helpful` (helpful_count, created_at, id DESC) with a signed keyset cursor bound to target + sort; partial indexes in migration `20261113070000_reviews_public_read`. Authors are first name + last initial.
- Not yet: `rider` public listing (RV-Q3), per-subject `helpfulByMe/reportedByMe/allowedActions`, `review_aggregates`/`review_reports`/`review_helpful_votes` tables.
- Gated on Orders proof and BR-09/RV-Q1/RV-Q2: all writes (POST/PATCH/DELETE, eligibility, helpful, reports, replies, moderation, `/reviews/me`, rider/owner/admin reads).
- Known divergence: `reviews_public_aggregates` (discovery rating/count) still counts `published` only, while rule 4 and this list count `published` + `reported`; reconcile when Reviews owns aggregates.
- Seed: only sample-pack reviews whose reviewer exists in sample `users` are inserted (rv6, rv8, rv9); others are skipped with a counted reason. Sample tags are stored as labels (`TODO(verify)` tag-key catalogue).

Contents: [Tables](#tables) · [Identity and proof](#target-identity-and-proof-contracts) · [Endpoints](#endpoints) · [Rules](#rules-and-use-cases) · [Acceptance](#acceptance-criteria) · [Decisions](#open-questions)

## Responsibility

Own review identity, eligibility **policy**, rating aggregates, helpful votes, reports, owner replies and moderation. A provider profile is a Businesses entity, not a Service or Users ID. Orders/Services supply proof facts, never independently grant review eligibility. Reviewed entities consume this module's aggregates; no duplicate rating ownership.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `reviews` | `id uuid PK`; `target_type text NOT NULL CHECK ('business','product','service','rider')`; `target_id uuid NOT NULL`; `business_id uuid NULL FK businesses` (null only for rider); `author_user_id uuid NOT NULL FK users`; `eligibility_ref_type text NOT NULL CHECK ('order','enquiry')`; `eligibility_ref_id uuid NOT NULL`; `eligibility_policy_version text NULL` (required for new writes after decisions); `rating smallint NOT NULL CHECK 1–5`; `text text NOT NULL CHECK trimmed length 1–1000`; `tags text[] NOT NULL DEFAULT '{}'`; `photo_asset_ids uuid[] NOT NULL DEFAULT '{}'` (max 5); `status text NOT NULL CHECK ('pending','published','reported','hidden','deleted')`; `moderation_reason text NULL`; `helpful_count int NOT NULL DEFAULT 0 CHECK >=0`; `owner_reply text NULL CHECK length <=1000`; `owner_replied_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at timestamptz` | `(target_type,target_id,status,created_at DESC,id DESC)` public; `(author_user_id,created_at DESC,id DESC)` My reviews; `(business_id,status,created_at DESC,id DESC)` owner; `(status,created_at,id)` moderation; domain unique constraint is gated by RV-Q2 below |
| `review_reports` | `id uuid PK`; `review_id uuid NOT NULL FK reviews`; `reporter_user_id uuid NULL FK users`; `reporter_subject_hash bytea NOT NULL`; `reason text NOT NULL CHECK ('abusive','spam','fake','other')`; `details text NULL CHECK length <=500`; `status text NOT NULL DEFAULT 'open' CHECK ('open','resolved')`; `resolved_at timestamptz NULL`; `created_at`; UNIQUE `(review_id,reporter_subject_hash)` | `(review_id,status)` |
| `review_helpful_votes` | `review_id uuid FK`; `user_id uuid NULL FK users`; `subject_hash bytea NOT NULL`; `created_at`; PK `(review_id,subject_hash)` | PK |
| `review_aggregates` | `target_type text`, `target_id uuid`, PK both; `rating_count int NOT NULL DEFAULT 0`; `rating_sum int NOT NULL DEFAULT 0`; `count_1..count_5 int NOT NULL DEFAULT 0`; `updated_at` | PK (rating badge, breakdown) |

Quick tags are an allow-list per target type (prototype `TAGS`): business — Fair price, Fresh, Helpful staff, On time, Clean; product — Good quality, Value for money, As described; service — Quick visit, Professional, Fair quote, Polite; rider — Polite, On time, Careful. Stored as stable keys with EN/HI labels.

Provider-profile targets use the service/provider tags, selected by Businesses `kind`, not an ID prefix. Helpful/report guest subjects use an opaque first-party nonce stored only as a hash; do not identify guests by name or retain raw IP.

## Target identity and proof contracts

| Target sent by every caller | Trusted resolver / proof facts | Owner, scope and destination |
|---|---|---|
| `business:{businessId}` with `kind=shop` | Businesses identity; Orders proof for this business. Enquiry-based shop eligibility is RV-Q1, not presumed false or true | Same business owns reply; its city/area; shop profile review anchor |
| `business:{businessId}` with `kind=provider` | Same Businesses identity; Orders proof for its sold products or EnquiryProofPort facts for the provider | Provider profile ID is **not** `serviceId`/`ownerUserId`; same business owns reply |
| `product:{productId}` | Products resolves `businessId`; qualifying Orders proof contains this fulfilled product | That product's business/scope; product review anchor |
| `service:{serviceId}` | Services resolves `businessId`; enquiry proof must match this service, not merely another service of that provider | Service ID distinct from provider profile; that business owns reply |
| `rider:{riderUserId}` | Delivery rider identity and completed delivery relationship for the customer's order | Delivery's area if known, otherwise explicit city-only scope; rider feedback/own review, no public rider list pending RV-Q3 |

- Required `ReviewTargetReadPort.resolve({targetType,targetId}) -> {targetType,targetId,businessId?,businessKind?,ownerUserId,scope:{cityId,areaId},label,canonicalPath,public,version}`. Businesses/Products/Services/Delivery resolve only their own IDs through their public application interfaces; no cross-table repository reads.
- **Orders-owned port:** [OrderReviewProofPort.readForUser](../../orders/be/orders.md#read-and-stock-contracts) returns paginated authenticated order proof facts with exact `proofId` lookup, limit 50. Rider proof requires a delivered assigned job; product proof excludes removed/unfulfilled lines. Resolve submitted proof IDs exactly rather than treating a first page as the complete purchase history.
- **Services-owned port:** [EnquiryProofPort](../../services/be/services.md#read-and-cross-module-contracts) returns paginated authenticated proof facts, with exact `proofId` resolution for POST/PATCH. Reviews checks statuses under RV-Q1; Services' conversion event is not an eligibility grant. Never link a guest enquiry by matching name or unverified phone.
- `ReviewWriteContext={target,eligible,allowedActions,reasonKey?,decisionRequired[],proofs:[{refType,refId,status}],selectedProof?,existingReviews:[{id,rating,text,tags,photoAssetIds,status,proof,version}],policyVersion?}`. It hydrates edit forms; no client-supplied author/business/approval fields.
- **RV-Q2 gate:** prototype updates one author/target review, old spec allowed one per proof/purchase. Do not retain the old unique-per-proof rule or silently switch policy. Creation/re-review and its domain uniqueness migration stay disabled until a single approved rule covers SQL, POST/PATCH and UI. Shared idempotency is not semantic uniqueness.
- Existing review edits use explicit review ID/version and immutable target/proof. Any ambiguous eligibility, proof selection or repeat-purchase write returns `REVIEW_POLICY_UNRESOLVED`; `selectedProof` is not arbitrarily “latest order”. No new proof-picker UI is invented.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/reviews?targetType=&targetId=&sort=recent\|helpful&cursor=&limit=` | Public target; only `published`/`reported`; rider public listing gated | → page + breakdown + `{helpfulByMe,reportedByMe,allowedActions}` per subject; personalized flags no-store | `VALIDATION_ERROR` | Yes | F-PD-007, F-RV-001, S-CUST-08 |
| GET | `/reviews/eligibility?targetType=&targetId=` | Authenticated customer; own proofs/reviews | → `ReviewWriteContext` | `REVIEW_NOT_FOUND` | Yes | F-RV-002, S-CUST-18 |
| GET | `/reviews/{id}/edit` | Author only | → review, target summary, immutable proof, photos, `version`, write context | `REVIEW_NOT_FOUND` | Yes | F-RV-004 |
| POST | `/reviews` | Customer; live validated proof and approved policy (BR-09) | `{targetType,targetId,proof:{refType,refId},policyVersion,rating,text,tags[],photoAssetIds[]}` → review/status | `REVIEW_NOT_ELIGIBLE`, `REVIEW_DUPLICATE`, `REVIEW_POLICY_UNRESOLVED`, `REVIEW_TAG_INVALID`, `VALIDATION_ERROR` | Required key | F-RV-001, F-RV-002, F-RV-003, S-CUST-18 |
| GET | `/reviews/me` | Customer; own | cursor → own reviews incl. pending/hidden status | — | Yes | F-RV-004, S-CUST-17 |
| PATCH / DELETE | `/reviews/{id}` | Author only | `{rating?,text?,tags?,photoAssetIds?,expectedVersion}` → re-moderated review / soft delete | `REVIEW_NOT_FOUND`, `REVIEW_VERSION_CONFLICT` | Yes | F-RV-004 |
| PUT / DELETE | `/reviews/{id}/helpful` | Public visible review; guest subject or authenticated non-author | → `{helpfulCount,helpfulByMe}`; own vote only | `REVIEW_NOT_FOUND` | Yes | F-RV-005 |
| POST | `/reviews/{id}/reports` | Public visible review or owning vendor/provider; subject derived server-side | `{reason,details?}` → `202 {reported:true}`; same subject replay returns acknowledgement | `REVIEW_NOT_FOUND`, `COMMON_RATE_LIMITED` | Yes | F-RV-005, F-RV-007 |
| GET | `/businesses/me/reviews?filter=all\|needs_reply\|reported&rating=&cursor=` | Approved vendor/provider; own business | → business/profile + product/service reviews, counts, versions and reply/report flags; Reported includes open reports | — | Yes | F-VD-010, F-RV-007, S-VEND-09, S-PROV-10 |
| PUT / DELETE | `/businesses/me/reviews/{id}/reply` | Owning vendor/provider | `{text}` → review | `REVIEW_NOT_FOUND` | Yes | F-RV-007 |
| GET | `/reviews/riders/me` | Approved rider | → own rider reviews + aggregate | — | Yes | F-RD-007, S-RIDE-07 |
| GET | `/admin/reviews?tab=reported\|pending\|removed&cursor=` | Active admin `reviews:view` + exact target scope; super_admin | → queue page + `{reported,pending,removed}` counts after scope; items with reports/version/allowedActions | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-009, F-RV-006, S-ADMN-10 |
| POST | `/admin/reviews/{id}/decision` | Admin `reviews:edit` + scope; audited | `{action:'approve'\|'hide'\|'delete'\|'restore',reason?,expectedVersion}` → review | `REVIEW_INVALID_TRANSITION` | Required key | F-AD-009, F-RV-006 |

## Rules and use-cases

1. **Eligibility:** validate facts, current author ownership, exact normalized target and agreed policy on every POST/PATCH. Order-backed boundaries above are known; enquiry statuses, guest linkage and repeat-review semantics remain RV-Q1/RV-Q2. A false result and a decision-required result are distinct.
2. **Moderation on submit/edit:** required trimmed text 1–1000, rating 1–5, valid target tags; URL/blocked term → pending, otherwise published. Text/photo editing cannot bypass hidden/deleted decisions; re-review policy is gated, not automatic restoration by the author.
3. **ST-review action table:** below. Every transition uses expected version; reporting never silently removes public content. Reports resolve independently when dismissed or actioned.
4. Aggregates update in the same transaction as any status/rating change; only `published` and `reported` reviews count.
5. Owner replies only on their business's targets; replies are plain text, shown under the review; editing a reply overwrites.
6. Photos: author-owned `review_photo` AssetPort references only, max 5; reject another user's asset/wrong purpose, URLs and keys. Read-time public moderation/visibility checks apply; upload policy must be configured.
7. Admin decisions use the [shared scope predicate](../../admin/be/admin.md#scope-and-read-context), including city-only rider/global restrictions, and write before/after audit. Public Helpful/Report follows `js2.js:55`/`js5.js:79–80`; abuse controls use subject/IP-hash limits (5 reports/hour, 30 vote mutations/minute), CSRF and inert text.
8. Public DTO shows author first name + initial only.

| Current state | Action / actor | Next state and counters |
|---|---|---|
| pending | admin approve / hide(reason) | published / hidden; add aggregate only on publish |
| published | report | reported, remains public and counted |
| reported | admin approve (dismiss reports) / hide(reason) | published / hidden; hide removes aggregate contribution |
| hidden | admin restore or Approve on Removed | **published**, resolve reports, restore aggregate once |
| pending/published/reported/hidden | author delete or admin delete(reason) | deleted; remove any public aggregate contribution once |
| deleted | restore/edit | rejected; tombstone read-only, not an “Approve” target |

`ReviewsAdminReadPort.summary(ctx,{targetRefs?,from?,toExclusive?})` returns scoped `{pendingCount?,reportedCount?,removedCount?,ratings:[{targetType,targetId,average,count}],alerts?}`. reviews:view permits moderation counts/alerts; catalog/approvals/users/reports:view permits **only ratings** for its already-authorized target projection, with no pending/report details. Other modules never write aggregates.

## Events and jobs

Publish `review.published` (with `firstPublication`), `review.reported`, `review.hidden`, `review.deleted`, `review.restored`, `review.replied`, `review.moderation_decided` after commit. Payload `{reviewId,targetType,targetId,businessId?,authorUserId,scope,version,fromStatus,toStatus,action?}` plus shared event ID; no text/photo/contact payload. Moderation event exists only for an admin decision; Notifications must not double-notify from its cache-invalidation companion events.
`ReviewNotificationReadPort.context({reviewId,eventVersion}) -> {authorUserId,ownerUserId,ownerRole,targetLabel,scope,customerPath,ownerPath,decisionReasonKey?}` provides minimal authorized notification context; historical event outcome is not replaced by a later state. Notifications owns the event/template/destination matrix.
`ReviewsRiderReadPort.summary({riderUserId}) -> {ratingAverage:null|number,ratingCount}` supplies published-feedback aggregates to Delivery's authorized tracking/candidate projections; no author/proof/contact data or new public rider endpoint. Zero feedback has count 0 and average null.
Consume `order.status_changed`, `service.enquiry.converted`, `business.application.decision_changed` for invalidation only; eligibility is read live. Replay-safe cache invalidation includes target review/rating tags. No speculative moderation or retention jobs.

## Account data contract

Implement Users' internal `UserDataPort.exportPage({userId,cursor,limit})` as `ReviewsUserDataPort`: export the user's authored review/reply-received data, own votes/reports and authored contribution counts, not other reporters' identities or private moderation notes. Stable cursor, limit ≤50, caller is Users' authorized orchestrator.
`erase({userId,requestId,policyVersion}) -> {receipt,status:'completed'|'blocked',reasonCode?}` is replay-safe. Q-32/retention must specify erasure versus retained/anonymized evidence first; absent policy return blocked. Approved removal/anonymization reconciles rating/helpful aggregates transactionally and invalidates caches; never cascade-delete financial proof or another author's review. Completion capabilities/polling remain Users-owned, not a public review export endpoint.

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
| `REVIEW_POLICY_UNRESOLVED` | 409 | `errors.reviews.policyUnresolved` |

## Acceptance criteria

1. Given a customer without a qualifying order/enquiry, when posting a review, then `REVIEW_NOT_ELIGIBLE` and nothing is stored.
2. Given text with a link or blocked word, when submitted, then status is `pending`, it is hidden publicly and shown to the author as "awaiting moderation".
3. Given empty/whitespace text, over-1000 text, or rating 0/6, when submitting or editing, then validation fails.
4. Given an approved uniqueness policy and the same idempotency key, when replayed concurrently, then one mutation exists; a repeated purchase is governed by that same policy, not a second implicit uniqueness rule.
5. Given a published review, when a public subject reports it, then it stays visible, appears in admin/owner Reported filters and replay creates one report.
6. Given a hidden review, when an authorized admin restores it, then hidden→published and its aggregate contribution returns exactly once with audit/notification.
7. Given a missing `reviews:edit` grant or another area in the same city, when deciding a review, then 403 and no change.
8. Given another business's review, when an owner replies, then 404; an authorized reply emits `review.replied` for the author.
9. Given a provider profile versus individual service, when proof is checked, then Businesses ID and Services ID remain distinct; wrong-owner/target proof fails, and guest name/phone matching never grants access.
10. Given the unresolved enquiry/re-review policy, when an ambiguous write is attempted, then `REVIEW_POLICY_UNRESOLVED`, no invented status boundary, duplicate rule or implicit new review.
11. Given a public review card, when Helpful is retried or removed, then only that subject's vote changes and counts stay correct; hidden content cannot gain new votes.
12. Given an account-erasure request without approved Q-32 policy, when `erase` runs, then it returns a durable blocked receipt and keeps authored counts/history unchanged.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Rules: AC1/9/10 target/proof matrix, boundary statuses and decision gates; required text/tags; hidden restoration and aggregate deltas. Manual API/DB: POST/PATCH hydration consistency after policy decision, report → owner/admin queues → restoration, reply/moderation notifications, asset-purpose rejection, account receipts/counters. Negatives: non-author edit, wrong proof owner/target, service versus provider ID, same-city foreign area, city-only rider. Concurrency: duplicate votes/reports/restores and repeat purchases; malicious text/photo IDs remain inert/rejected.

## Open questions

- **RV-Q1 — Open question:** prototype accepts linked enquiries without a status boundary; prior Reviews says contacted/converted, Services/J14 says converted. Which statuses qualify for shop/provider/service, and how may a guest enquiry become verifiably account-linked? Block enquiry-dependent writes until resolved; never match names/phones.
- **RV-Q2 — Open question:** one review per user/target (prototype edit hydration) or per purchase/proof (old spec)? What selects proof across repeated purchases and permits re-review after deletion/moderation? Creation/re-review and domain uniqueness are gated; explicit existing-ID reads, reporting and moderation remain usable.
- **RV-Q3 — Open question:** public rider review visibility remains unconfirmed; only own-review, rider feedback and scoped admin projections are enabled.
- Q-32/Q-13 govern account erasure/retention; Settings owns the review-rule/blocked-word configuration, not an invented moderation service.
