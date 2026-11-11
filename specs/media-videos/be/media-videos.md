# BE: media-videos

Features: F-RL-001, F-RL-002, F-RL-003, F-RL-004, F-RL-005, F-RL-006, F-RL-007, F-RL-008, F-RL-009, F-RL-010, F-PF-009, F-PF-010, F-PD-005, F-SV-004, F-VD-012, F-VD-013, F-AD-010 | Rules: BR-10, BR-16, BR-12, BR-14 | State machines: ST-video | Depends on: businesses, products, services, offers (read), geo; engagement via read port (Following feed, counters); used by orders, reviews, delivery (private assets), search, engagement.

Frontend counterpart: [FE media-videos](../fe/media-videos.md)

Contents: [Tables](#tables) · [Assets](#canonical-assetport-and-consumers) · [Endpoints](#endpoints) · [Rules](#rules-and-use-cases) · [Feed](#immutable-ranked-feed) · [Acceptance](#acceptance-criteria)

## Responsibility

Own canonical uploaded-file identities/storage, gallery photos, videos, safe embeds, media reports and frozen Reels ranking. Other modules reference AssetPort-issued IDs and own only placement/document-purpose metadata. Engagement owns social relationships/comments; this module holds their counter projections. Final `js24`–`js27` overrides earlier behavior.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `media_assets` | `id uuid PK`; `owner_user_id uuid NOT NULL FK users`; `business_id uuid NULL FK businesses`; `purpose text NOT NULL CHECK ('product','service','gallery','business_profile','offer_banner','catalog_taxonomy','video_file','video_thumbnail','review_photo','case_evidence','kyc_document')`; `subject_type text NULL`; `subject_id uuid NULL`; `visibility text NOT NULL CHECK ('public','private')` (server-derived; evidence/KYC always private); `moderation_state text NOT NULL DEFAULT 'allowed' CHECK ('allowed','removed')`; `storage_key text NOT NULL UNIQUE`; `mime_type text NOT NULL`; `bytes bigint NOT NULL CHECK >0`; `width/height/duration_s int NULL`; `version int NOT NULL DEFAULT 1`; `created_at timestamptz`; `deleted_at timestamptz NULL` | `(owner_user_id,created_at,id)` account export; `(business_id,purpose,created_at DESC,id DESC)` attach/manage |
| `gallery_photos` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `media_asset_id uuid NOT NULL UNIQUE FK media_assets`; `caption text NULL CHECK <=200`; `linked_target_type text NULL CHECK ('product','service')`; `linked_target_id uuid NULL`; `sort_order int NOT NULL DEFAULT 0`; `heart_count int NOT NULL DEFAULT 0`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at` | `(business_id,sort_order,id)` gallery |
| `videos` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `source text NOT NULL CHECK ('youtube','instagram','upload')`; `provider_kind text NULL CHECK ('watch','shorts','reel','p','tv')`; `provider_video_id text NULL` (provider-specific strict ID validation); `file_asset_id/thumbnail_asset_id uuid NULL FK media_assets`; `caption text NULL CHECK length <=300`; `hashtags text[] NOT NULL DEFAULT '{}'` (max 10); `show_in_gallery/show_in_reels bool NOT NULL`; `status text NOT NULL CHECK ('pending','approved','rejected','removed')`; `decision_reason text NULL`; `approved_at timestamptz NULL`; `owner_deleted_at timestamptz NULL`; `sort_order int NOT NULL DEFAULT 0`; `view_count/like_count/comment_count/share_count bigint NOT NULL DEFAULT 0 CHECK >=0`; `engagement_version bigint NOT NULL DEFAULT 0`; `version int NOT NULL DEFAULT 1`; timestamps; upload requires file only, embed requires validated provider ID only | `(status,show_in_reels,id)` candidates; `(business_id,sort_order,id)` manager/profile; `(status,created_at,id)` moderation; GIN hashtags |
| `video_links` | `video_id uuid FK videos`; `target_type text CHECK ('product','service')`; `target_id uuid`; `sort_order int`; PK `(video_id,target_type,target_id)` | `(target_type,target_id)` (product/service "Videos & Reels" section) |
| `media_reports` | `id uuid PK`; `target_kind text NOT NULL CHECK ('photo','video')`; `asset_id uuid NULL FK media_assets`; `video_id uuid NULL FK videos`; CHECK exactly the target-kind reference is set; `business_id uuid NOT NULL FK businesses`; `placement_type text NULL CHECK ('gallery_photo','product_image','service_image')`; `placement_id uuid NULL`; `reporter_user_id uuid NULL FK users`; `reporter_subject_hash bytea NOT NULL`; `reason text NOT NULL CHECK ('inappropriate','misleading','spam','copyright','other')`; `details text NULL CHECK length <=500`; `status text NOT NULL DEFAULT 'open' CHECK ('open','resolved')`; `resolution text NULL CHECK ('dismissed','removed')`; `resolved_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; `created_at`; unique open target+placement+subject | `(business_id,status,created_at,id)` scoped Reported queue; `(asset_id,status)`, `(video_id,status)` |
| `business_media_order` | `business_id uuid PK FK businesses`; `video_order_version/gallery_order_version int NOT NULL DEFAULT 1` | PK for atomic reorder |
| `reel_rank_snapshots` | `id uuid PK`; `session_subject_hash bytea NOT NULL`; `ranked_items jsonb NOT NULL` (immutable ordered `{videoId,score10,ordinal}`); `created_at/expires_at timestamptz NOT NULL` | `(session_subject_hash,expires_at)`; `(expires_at)` cleanup |
| `video_view_dedup` | `session_subject_hash bytea NOT NULL`; `video_id uuid NOT NULL FK videos`; `created_at timestamptz NOT NULL`; PK `(session_subject_hash,video_id)` | PK, no raw IP/user-agent history |

Reporting is **not** a video approval status (`js27.js:25,35`). A reported approved video remains approved/public until a separate removal decision. Photo reports use the same existing moderation destination.

## Canonical AssetPort and consumers

| Port / consumer | Contract |
|---|---|
| `AssetPort.upload(ctx,{purpose,businessId?,subject?,file,idempotencyKey})` | → `{assetId,status:'ready',purpose,visibility,mimeType,bytes,previewPath?}` only after synchronous content validation/sanitization, durable storage acknowledgement and metadata commit. Actor/owner/visibility are server-derived; enforce configured caps/MIME and strip EXIF/GPS. No raw key/client URL accepted or returned |
| `AssetPort.validateAttachment(ctx,{assetId,purpose,businessId?,subject})` | → `{assetId}` only after matching owner/delegated authority, purpose, business/resource, ready/not-deleted/not-removed state. Same-business alone cannot authorize a different user's asset. Validate inside the attaching transaction |
| `AssetPort.resolvePrivate(ctx,{assetId,consumer,resourceId})` | Calls owning `AssetAccessPort.authorize({actor,assetId,resourceId,operation:'view'})`; returns ≤5-minute signed view only on success. No generic “uploader can read all KYC/evidence” bypass; never log URLs |
| `AssetPort.resolvePublic({assetIds[],publicationContext})` | Resolves only currently authorized public placements (business approval, item/media publication, effective consent, or active taxonomy); `visibility=public` alone is not public authorization |
| Businesses | `logoAssetId/coverAssetId` use `business_profile`; `documents.assetId` uses private `kyc_document`. Businesses retains document kind/application metadata, not duplicate storage/type/size ownership. Its existing multipart endpoints delegate upload and attachment validation here |
| Delivery | Rider application docs reference `kyc_document` IDs; applicant upload is allowed through Delivery's own application context even before approval/rider role assignment. Private views delegate to Delivery approvals permission/scope |
| Products / Services | Ordered image entries use canonical asset IDs with `product`/`service` purpose and owning placement/effective consent. Public cards/Gallery recheck asset moderation and owner publication |
| Offers | `bannerAssetId` uses **`offer_banner`** with offer/business ownership or authorized scoped promos context; a product/KYC asset cannot be attached as a banner |
| Catalog | Category/subcategory `imageAssetId` uses `catalog_taxonomy`; global upload/attachment requires `super_admin`, exact category/subcategory association is checked on attach and public resolution, and inactive taxonomy is not publicly resolved |
| Reviews / Orders | `review_photo` belongs to the review author; private `case_evidence` attachment is authorized by Orders' customer/rider/scoped-admin case context. Orders, not Media, decides permitted uploaders/viewers |

`MediaPublicAssetDTO={assetId,publicUrl,mimeType,width?,height?,durationS?,altText?}` uses a same-origin content URL, not a storage key. Its `PublicationContext={placementType,placementId,surface}` has allow-listed placement types `business|product|service|offer|promotion|gallery_photo|video|review|catalog_category|catalog_subcategory` and surfaces `card|detail|gallery|reels|home`. Resolve the actual attachment and the owning module's surface policy; a supplied context is never proof of publication. Unsupported combinations fail closed.

Vendor/provider **applicants** may upload their own draft/pending/rejected/changes-requested application documents/profile assets; do not require approved seller status for onboarding. Suspended applicants cannot use a generic upload to bypass owner-state restrictions. Authorized admin uploads require the consuming module permission and scope; global uses require super_admin.
An asset row exists only after the configured synchronous upload succeeds; `ready` is not a fabricated asynchronous-processing status. Storage/validation failure returns an error with no attachable asset. A future provider needing asynchronous processing must add its real status/poll contract before enabling that path, not return ready prematurely. Idempotency stores the asset reference, not a signed preview URL; replay reauthorizes and resolves a fresh preview.
Upload hosting/type/size/duration policy must be configured for each purpose. Q-03/Q-40/Q-46/Q-80 unresolved → `MEDIA_UPLOAD_POLICY_REQUIRED` for that upload; safe validated link-based video flows remain available. No assumed 50 MB limit, vendor or transcoding deployment.
Taxonomy image upload adds `catalog_taxonomy` to the Media purpose allow-list and requires a configured image policy before enabling the form. Extract/store intrinsic width and height for attached taxonomy assets so Catalog can reserve layout space. Category/subcategory publication is checked against the exact active taxonomy attachment; removed/inactive associations do not resolve publicly. Expand the purpose constraint in the forward migration; no prior taxonomy image rows exist to backfill.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| POST | `/media/uploads` | Authenticated; AssetPort purpose/application/ownership checks above | multipart `{purpose,businessId?,subject?,file}` → AssetPort upload DTO | `MEDIA_TYPE_NOT_ALLOWED`, `MEDIA_TOO_LARGE`, `MEDIA_UPLOAD_POLICY_REQUIRED`, `FORBIDDEN` | Required key | all upload surfaces |
| GET | `/media/private/{assetId}?consumer=&resourceId=` | Owning private-view authorization, exact approval/case scope | → no-store 302 to short-lived signed URL; guessed association denied | `MEDIA_NOT_FOUND` | Yes | BR-14 |
| GET/HEAD | `/media/public/{assetId}?placementType=&placementId=&surface=` | Public only after current exact attachment/moderation/owner/consent checks | → validated media bytes/headers via StoragePort; authorize before 200/206/304; validated single-byte-range support, MIME + nosniff, `Cache-Control: private, no-cache`; no redirect to a permanent storage URL | `MEDIA_NOT_FOUND`, `COMMON_VALIDATION_FAILED`, `MEDIA_RANGE_INVALID` | Yes | public asset surfaces |
| GET | `/businesses/{slug}/gallery?filter=all\|photos\|videos\|product\|service&cursor=` | Public; approved business | → gallery-only photos + product/service images with gallery consent + approved videos with `show_in_gallery` | — | Yes | F-PF-009, S-CUST-06, S-CUST-07 |
| GET | `/businesses/{slug}/videos?cursor=` | Public | → approved Reels-visible videos (thumbnail, view count) | — | Yes | F-PF-010 |
| GET | `/videos/feed?pill=&category=&lat=&lng=&snapshotId=&startVideoId=&cursor=&limit<=10` | Public session; Following requires login | → `{snapshotId,expiresAt,effectiveFilter,items,nextCursor}`; overlay owner/verified/distance/open-state/counts/linked items/safe embed; snapshot rules below | `VALIDATION_ERROR`, `AUTH_REQUIRED`, `MEDIA_FEED_EXPIRED` | Yes within snapshot | F-RL-002, F-RL-003, F-RL-005, F-RL-006, F-RL-009 |
| GET | `/videos/{id}` | Public | → one approved video (deep link start) | `MEDIA_VIDEO_NOT_PUBLISHED` (409 → "unavailable") | Yes | F-RL-009, F-RL-008 |
| GET | `/videos?targetType=product\|service&targetId=` | Public | → approved videos linked to that item | — | Yes | F-PD-005, F-SV-004 |
| POST | `/videos/{id}/views` | Public; per session dedupe | → 204 | — | Yes | F-RL-003 |
| POST | `/videos/{id}/reports` | Public visible video, optional session; subject/abuse limits | `{reason,details?}` → `202 {reportId}` in `media_reports`; approval unchanged | `MEDIA_NOT_FOUND`, `COMMON_RATE_LIMITED` | Required key; duplicate acknowledgement | F-RL-005 |
| POST | `/media/photos/{assetId}/reports` | Public visible photo placement; optional session | `{placementType,placementId,reason,details?}` → `202 {reportId}`; asset/business/placement validated, not matched by title | `MEDIA_NOT_FOUND`, `COMMON_RATE_LIMITED` | Required key; duplicate acknowledgement | F-PF-009 |
| GET/POST | `/businesses/me/videos` | Approved vendor/provider; own business | `{url? \| fileAssetId?, thumbnailAssetId?, caption, hashtags[], links[], showInGallery, showInReels}` → video `pending` | `MEDIA_EMBED_HOST_NOT_ALLOWED`, `MEDIA_EMBED_ID_INVALID`, `MEDIA_LINK_TARGET_INVALID` | Required key | F-VD-012, F-RL-010, S-VEND-11, S-PROV-12 |
| GET/PATCH/DELETE | `/businesses/me/videos/{id}` | Approved vendor/provider; own business/video | GET edit DTO/version; PATCH `VideoEdit` below; DELETE `{expectedVersion}` → owner-removed tombstone | `MEDIA_NOT_FOUND`, `MEDIA_VERSION_CONFLICT` | Version/key | F-VD-012, F-VD-013 |
| GET/POST/PATCH/DELETE | `/businesses/me/gallery[/{id}]` | Approved owner | `{assetId,caption?,linkedTarget?,expectedVersion?}`; asset purpose gallery, links same business | `MEDIA_NOT_FOUND` | Key/version for writes | F-VD-012 |
| GET/PUT | `/businesses/me/videos/order` · `/businesses/me/gallery/order` | Approved owner; every ID belongs to own manager list | GET `{orderedIds[],orderVersion}`; PUT `{orderedIds[],expectedOrderVersion}` → order/version, all-or-nothing; exact list membership, no duplicate IDs | `MEDIA_VERSION_CONFLICT`, `MEDIA_LINK_TARGET_INVALID` | Yes | F-VD-012 |
| GET | `/businesses/me/videos/analytics` | Approved owner | → per-video `{id,views,likes,comments,shares,followersGained,tapsOnLinked,likeRatePct,unavailable[],definitionVersion?}` | — | Yes | F-VD-012 |
| GET | `/admin/videos?tab=pending\|approved\|rejected\|removed\|reported\|engagement&cursor=` | Admin **`reviews:view`** + business area predicate; super_admin | → video/report page + scoped tab counts; Reported rows typed photo/video; Engagement includes taps/like rate | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-010, S-ADMN-11 |
| POST | `/admin/videos/{id}/decision` | Admin **`reviews:edit`** + scope; audited | `{action:'approve'\|'reject'\|'remove',reason?,expectedVersion}` → video/version/counts | `VIDEO_INVALID_TRANSITION` | Required key | F-AD-010, ST-video |
| POST | `/admin/media-reports/{id}/decision` | Admin **`reviews:edit`** + target scope; audited | `{action:'dismiss'\|'remove',reason?,expectedVersion,targetVersion}` → resolved report + target result; remove reason required | `MEDIA_VERSION_CONFLICT`, `VIDEO_INVALID_TRANSITION` | Required key | F-PF-009, F-AD-010 |

The gallery-consent default (`business_settings.gallery_media_default`) is read from Businesses; the manager's default-setting UI writes it through the Businesses settings endpoint.

Gallery photo rows include `{kind:'photo',assetId,placementType,placementId,businessId,caption?,linkedTarget?,publicPath}`. `placementId` is the gallery_photos row ID, Product ID or Service ID respectively; `(placementType,placementId,assetId)` identifies an actual current attachment, never an array index. Video rows use `{kind:'video',videoId,...}`. Reported queue rows expose `{reportId,targetKind,assetId?|videoId?,placementType?,placementId?,reason,details?,status,resolution?,reportVersion,targetVersion,allowedActions}`; targetVersion is the asset/video version, distinct from the report version.

`VideoEdit={source?:{kind:'youtube'|'instagram',url}|{kind:'upload',fileAssetId},thumbnailAssetId?,caption?,hashtags?,links?:[{targetType:'product'|'service',targetId}],showInGallery?,showInReels?,resubmit?:true,expectedVersion}`. Source union replaces old source atomically; same embed/asset checks as create. Rejected→pending requires explicit `resubmit:true`; merely toggling consent is not a resubmission. Source/content replacement of approved content re-enters pending before any public read. Removed owner content cannot be resubmitted.

## Rules and use-cases

1. **Uploads:** use the canonical AssetPort contract above, configured allowlist/caps and StoragePort fake; no direct storage SDK/duplicated asset table in consumers. Client MIME/extension alone never establishes type.
2. **Embeds (RL10):** accept only `youtube.com`, `youtu.be`, `instagram.com` (`/reel/`, `/p/`, `/tv/`); extract the ID with strict regex; store `(source, provider_kind, provider_video_id)` only. The response builds `embedUrl` server-side (`https://www.youtube-nocookie.com/embed/{id}`, `https://www.instagram.com/{kind}/{id}/embed`) plus `openUrl` for the "Open in YouTube/Instagram" fallback. Never echo the client URL.
3. **ST-video:** table below; only **approved** is publicly eligible, irrespective of report state. Every public read also checks owner/placement/consent. Decisions are versioned, audited and notify the owner.
4. **Consent:** Gallery requires showInGallery; Reels/deep links require showInReels; current approved business/item and non-removed assets also required. Product/service Gallery aggregation follows final `js24.js:40–42`: current business Gallery allowance **and** per-placement consent. Defaults never silently grant consent; the default-only versus master-toggle wording conflict is called out below.
5. Reports route to existing S-ADMN-11, preserving approval. Guests are allowed (`js24.js:52`); subject nonce/hash, 5 reports/hour per subject and abuse-IP hash, length/body caps, CSRF/origin checks and open-report dedupe. No raw IP/report body in logs. Dismiss resolves report only; Remove resolves report and removes the identified video/photo, not its parent business/product.
6. **Counters:** views increment once per video/session on the active-in-view signal; Engagement absolute counters refresh idempotently/monotonically on like/unlike/comment publish/remove/share events. A pending-comment removal changes no public count. Like rate follows `js27`: `views ? round(likes / views * 100) : 0`. Followers gained/taps attribution stays Q-11-gated (null + unavailable), not fabricated.
7. Link targets must belong to the same business and be active.
8. Moderation is **reviews:view/edit** (`js27.js:23–27`), including comments via Engagement in S-ADMN-11. Scope uses Admin's exact area/city/global predicate, including counts and report resolution.

| Current | Action | Next / guard |
|---|---|---|
| pending | admin approve / reject(reason) | approved / rejected |
| rejected | owner edit + explicit resubmit | pending, source/content validated |
| approved | owner replaces source/content | pending; no public replacement before approval |
| pending/approved/rejected | admin remove(reason) | removed, publication caches invalidated |
| rejected/moderator-removed | admin approve (source `vmAp`) | approved only if resource exists, not owner-deleted; current public-read gates still apply |
| non-owner-deleted state | owner delete | removed + owner_deleted_at; never automatically restored by report dismissal |
| any video status | report / dismiss report | **status unchanged**; separate report open/resolved |
| allowed photo | admin report remove | asset moderation_state removed; all public consumers suppress that asset, no parent listing deletion |

## Immutable ranked feed

1. First request materializes **ordered IDs and scores** in `reel_rank_snapshots` for the anonymous/authenticated session; no Redis. Score from final `js25.js:6–8` is **likes + views/10** (`score10=10*likes+views` for exact integer ordering), not recency or an invented formula. Ties retain the initial stable candidate ordinal (ID final DB tie-breaker).
2. Freeze the full candidate ranking once; each pill/category filters that ordered snapshot. Following uses current followed business IDs, Nearby is **distance ≤2.5 km** from the selected point, Offers checks current active/unexpired linked offer, Products/Services require the corresponding current linked item. Category maps to the business category. Do not copy Search's 6 km radius or add a Reels radius control.
3. Cursor is signed/opaque `{snapshotId,sessionBinding,filterHash,lastOrdinal,expiresAt}`; snapshot/cursor TTL **30 minutes from creation**, non-sliding technical lifetime. Reject changed-filter/tampered/foreign-session cursors. Expiry returns `MEDIA_FEED_EXPIRED` (410); restart explicitly, never quietly rerank an existing cursor.
4. Every page and `/videos/{id}` rechecks approval, owner/city visibility, asset moderation, surface consent, current Following membership/offer and linked item validity. Skip newly ineligible IDs without reshuffling survivors; advance by scanned ordinal so removed items cannot loop. New approvals/changed likes/views do not enter/reorder the snapshot.
5. Deep link resolves by **video ID**, not index. If eligible in the session/filter, return its anchor cursor. If out of filter or absent (new approval), final `js25.js:22` switches to For You and starts a fresh snapshot seeded with that eligible ID; return `effectiveFilter` explicitly. A hidden/non-consented/removed ID is unavailable, never force-included.
6. Rankings and lightweight snapshot IDs/scores are immutable; overlay counts/prices are current DTOs. Technical snapshot cleanup deletes expired snapshots only, not media/account records; retention for those remains separately gated.

### Required discovery/commerce read ports

- `BusinessMediaReadPort.context({businessId}) -> {id,ownerUserId,kind,status,scope,categoryId,slug,name,verified,logoAssetId?,coverAssetId?,galleryMediaDefault,galleryAllowed,hours,location,version}`; internal purpose-limited data. Businesses resolves applicant upload/state and public ownership; no Media table access to Businesses or recursive resolved URLs.
- `ProductMediaReadPort.resolve({productIds[],businessId?}) -> [{id,businessId,public,slug,name,pricePaise,stock,media:[{assetId,showInGallery}],version}]`.
- `ServiceMediaReadPort.resolve({serviceIds[],businessId?}) -> [{id,businessId,public,slug,name,priceType,priceFromPaise?,priceToPaise?,media:[{assetId,galleryAllowed}],version}]`; effective Gallery consent stays with the owning service policy, not Media's guess.
- `OfferMediaReadPort.activeTargets({productIds[],serviceIds[],at}) -> [{offerId,targetType,targetId,active,expiresAt}]` supports Offers pill only; checkout/discount computation remains Commerce-owned.
- All public card hydration omits private contact/document fields; batches ≤50, absent/non-public targets return ID + availability only. Geo supplies authoritative selected location/city-enabled state; distance uses server geography, not a stored prototype distance.
- Owned `MediaPublicReadPort.cards({targets})` returns `{id,available,canonicalPath?,label?,thumbnailAssetId?,mediaKind?}`; `MediaOwnerReadPort.approvedVideoCount({businessId}) -> {count}` for authorized owner context.
- Owned `MediaAdminReadPort.summary(ctx) -> {pendingCount,openReportCount,removedCount,alerts[]}` requires reviews:view + scope; `MediaNotificationReadPort.context({videoId?,reportId?,eventVersion}) -> {businessId,ownerUserId,ownerRole,scope,label,decisionReasonKey?}` for Notifications.

## Events and jobs

Publish `video.submitted`, `video.approved`, `video.rejected`, `video.removed`, `video.reported`, `photo.reported`, `photo.removed`, `media.visibility_changed`, `media.order_changed` with stable event ID, entity/business IDs, scope and version, never file/report contents. Reports carry reportId; removal outcome includes moderator/owner origin.
Consume `engagement.liked`, `engagement.unliked`, `engagement.comment_published`, **`engagement.comment_removed`**, `engagement.shared` and **`business.application.decision_changed`**; also product publication/deletion, service change and offer lifecycle events to invalidate affected public/card caches. Business decision event replaces nonexistent `business.status_changed`.
Notifications maps media submission/report/decision events once; photo removal and visibility changes invalidate all consuming placements/Saved cards. Consent removal must beat public cache reuse; authorization cannot rely only on eventual cache invalidation. Public asset URLs use a Media-controlled content path that rechecks the exact owning placement/surface and current approval/consent before streaming cached bytes; no permanent storage/CDN URL may bypass revocation. Private/signed access remains purpose-scoped. Public full-page caches cannot contain an embed that skips current eligibility resolution.
Jobs: expire rank snapshots; upload orphan/retention deletion disabled until an approved purpose-specific retention policy exists, not an assumed 24 h purge.

## Account data contract

`MediaUserDataPort` implements Users' `UserDataPort.exportPage({userId,cursor,limit})`: own upload metadata, videos/captions/consent choices and reports; stable typed cursor, limit ≤50, internal orchestrator only. No raw storage keys, private third-party documents or reusable signed URLs. Private-file export uses the owning module's approved export capability via Users, not a public asset listing.
`erase({userId,requestId,policyVersion}) -> {receipt,status:'completed'|'blocked',reasonCode?}` is resumable/idempotent. Validate Q-32/Q-05/Q-13 retention and all owning references before deleting/anonymizing assets; financial/KYC evidence is not cascade-deleted. Unknown disposition returns blocked; approved removal invalidates surfaces/counters once. Consume `user.account.status_changed`/`user.account.deleted` to invalidate subject access immediately; no new public completion token.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `MEDIA_NOT_FOUND` | 404 | `errors.media.notFound` |
| `MEDIA_RANGE_INVALID` | 416 | `errors.media.rangeInvalid` |
| `MEDIA_TYPE_NOT_ALLOWED` | 415 | `errors.media.typeNotAllowed` |
| `MEDIA_TOO_LARGE` | 413 | `errors.media.tooLarge` |
| `MEDIA_EMBED_HOST_NOT_ALLOWED` | 422 | `errors.media.embedHostNotAllowed` |
| `MEDIA_EMBED_ID_INVALID` | 422 | `errors.media.embedIdInvalid` |
| `MEDIA_LINK_TARGET_INVALID` | 422 | `errors.media.linkTargetInvalid` |
| `MEDIA_VERSION_CONFLICT` | 409 | `errors.media.versionConflict` |
| `VIDEO_INVALID_TRANSITION` | 409 | `errors.media.videoInvalidTransition` |
| `MEDIA_UPLOAD_POLICY_REQUIRED` | 409 | `errors.media.uploadPolicyRequired` |
| `MEDIA_FEED_EXPIRED` | 410 | `errors.media.feedExpired` |

`MEDIA_VIDEO_NOT_PUBLISHED` is already in the shared catalogue.

## Acceptance criteria

1. Given `https://evil.com/watch?v=x` or a YouTube URL with an invalid ID, when submitted, then 422 and nothing is stored.
2. Given a valid Instagram reel link, when approved, then feed DTOs contain a server-built embed URL and an open URL, never the submitted string.
3. Given a pending video, when its deep link is opened, then `MEDIA_VIDEO_NOT_PUBLISHED` (FE shows unavailable).
4. Given a user scrolls the For You feed while new videos are approved, when the next page loads, then order is unchanged and no duplicates appear.
5. Given Gallery consent false, when public media is queried, then Gallery excludes it while separately approved/Reels-consented content may appear there.
6. Given catalog-only permission or another area in the same city, when approving/removing media, then 403; reviews:edit admits only authorized scope.
7. Given a JPEG with GPS EXIF, when uploaded, then the stored file has no EXIF.
8. Given another user's evidence/KYC asset or an unauthorized area, when private access/attachment is requested, then 404/denial; pending authorized applicants can upload their own configured-purpose documents.
9. Given an approved video or Gallery photo, when a guest report is accepted/replayed, then one typed report reaches S-ADMN-11 and approval is unchanged; dismissal never republishes removed content.
10. Given a rejected video, when a valid source replacement and explicit resubmit are posted with its version, then it becomes pending; stale versions/wrong-purpose assets do not change it.
11. Given likes/views/new approvals change between pages, when a snapshot cursor is reused, then IDs retain stored ranking/scores; removal/consent withdrawal skips only affected entries, expiry explicitly restarts.
12. Given an out-of-filter deep link, when eligible, then a new For You snapshot anchors that ID; an unavailable ID is never seeded. Nearby includes 2.5 km, not 6 km.
13. Given owner reorder or comment removal events, when replayed concurrently, then order/version and absolute counters converge once without negatives.
14. Given no approved upload/attribution/retention policy, when upload/analytics/erasure is requested, then the relevant gate is explicit; no guessed hosting, gains or destructive cleanup runs.
15. Given an authorized super_admin uploads a valid taxonomy image, when Catalog attaches it, then only an exact `catalog_category`/`catalog_subcategory` placement on an active record resolves publicly; an invalid purpose, foreign attachment, inactive taxonomy or removed asset is denied.
16. Given an image purpose has no configured content/size policy, when a category or homepage banner upload is attempted, then `MEDIA_UPLOAD_POLICY_REQUIRED` is returned and no attachable asset is created.

## Tests

Unit: source URL parser/host suffix attacks and provider-specific IDs; action table, source-union DTO, exact score/2.5 km boundary, immutable cursor/session/TTL. Integration: configured MIME/size sniff + EXIF, applicant/private AssetPort consumers, PHOTO report → existing queue → remove, reorder conflicts, mutable counters between pages, live consent/publication rechecks, deep-link seeding and event replay. Negatives: foreign asset/purpose/application, catalog-only moderator, same-city foreign area, signed URL leakage/SSRF. Account export/erase validates references and repeat receipts; Q-11 metrics never use invented attribution.

## Open questions

- Open question: Q-03 hosting/transcoding and purpose-specific limits (Q-40/Q-46/Q-80), thumbnail acquisition and retention remain vendor/product decisions; block unconfigured upload paths, keep validated links/fallbacks.
- Open question: Q-11 defines followers-gained and linked-tap attribution/dedup/consent. DTOs/UI include these metrics but unavailable values are not manufactured; no unapproved tracking pipeline.
- Open question: default-only Gallery wording versus final js24's current business gate needs confirmation with Businesses/Services. Until resolved, use the stricter final-source current gate plus per-placement consent; never broaden visibility on a default toggle.
- Moderation permission is resolved by final js27: **reviews:view/edit**. Reviews' eligibility policy and Users' deletion/retention gates remain owned there.
