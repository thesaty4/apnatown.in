# BE: media-videos

Features: F-RL-001, F-RL-002, F-RL-003, F-RL-004, F-RL-005, F-RL-006, F-RL-007, F-RL-008, F-RL-009, F-RL-010, F-PF-009, F-PF-010, F-PD-005, F-SV-004, F-VD-012, F-VD-013, F-AD-010 | Rules: BR-10, BR-16, BR-12, BR-14 | State machines: ST-video | Depends on: businesses, products, services, offers (read), geo; engagement via read port (Following feed, counters); used by orders, reviews, delivery (private assets), search, engagement.

Frontend counterpart: [FE media-videos](../fe/media-videos.md)

## Responsibility

Own all uploaded files (`media_assets`, public or private), business gallery photos, videos (YouTube/Instagram links or uploads) with moderation, video ↔ product/service links, the Reels feed and video reports. Other modules store only `media_asset_id`s issued here. Likes, comments, hearts and follows are Engagement-owned; this module keeps denormalised counters updated from Engagement events.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `media_assets` | `id uuid PK`; `owner_user_id uuid NOT NULL FK users`; `business_id uuid NULL FK businesses`; `purpose text NOT NULL CHECK ('product','service','gallery','business_profile','video_file','video_thumbnail','review_photo','case_evidence','kyc_document')`; `visibility text NOT NULL CHECK ('public','private')` (private for `case_evidence`, `kyc_document`); `storage_key text NOT NULL UNIQUE`; `mime_type text NOT NULL`; `bytes int NOT NULL CHECK > 0`; `width/height int NULL`; `duration_s int NULL`; `created_at timestamptz`; `deleted_at timestamptz NULL` | `(business_id,purpose,created_at DESC)` |
| `gallery_photos` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `media_asset_id uuid NOT NULL UNIQUE FK media_assets`; `caption text NULL CHECK <= 200`; `linked_target_type text NULL CHECK ('product','service')`; `linked_target_id uuid NULL`; `sort_order int NOT NULL DEFAULT 0`; `heart_count int NOT NULL DEFAULT 0`; `created_at/updated_at` | `(business_id,sort_order)` (gallery tab) |
| `videos` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `source text NOT NULL CHECK ('youtube','instagram','upload')`; `provider_kind text NULL CHECK ('watch','shorts','reel','p','tv')`; `provider_video_id text NULL CHECK ~ '^[A-Za-z0-9_-]{5,64}$'`; `file_asset_id uuid NULL FK media_assets`; `thumbnail_asset_id uuid NULL FK media_assets`; `caption text NULL CHECK <= 300`; `hashtags text[] NOT NULL DEFAULT '{}'` (max 10); `show_in_gallery bool NOT NULL`; `show_in_reels bool NOT NULL`; `status text NOT NULL CHECK ('pending','approved','rejected','reported','removed')`; `decision_reason text NULL`; `approved_at timestamptz NULL`; `view_count/like_count/comment_count/share_count bigint NOT NULL DEFAULT 0`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at`; CHECK `(source='upload') = (file_asset_id IS NOT NULL)`; CHECK `(source<>'upload') = (provider_video_id IS NOT NULL)` | `(status,show_in_reels,approved_at DESC,id DESC)` (feed); `(business_id,status,created_at DESC)` (manager, profile tab); `(status,created_at)` (moderation queue); GIN `(hashtags)` |
| `video_links` | `video_id uuid FK videos`; `target_type text CHECK ('product','service')`; `target_id uuid`; `sort_order int`; PK `(video_id,target_type,target_id)` | `(target_type,target_id)` (product/service "Videos & Reels" section) |
| `video_reports` | `id uuid PK`; `video_id uuid NOT NULL FK videos`; `reporter_user_id uuid NOT NULL FK users`; `reason text NOT NULL CHECK ('inappropriate','misleading','spam','copyright','other')`; `details text NULL CHECK <= 500`; `resolved_at timestamptz NULL`; `created_at`; UNIQUE `(video_id,reporter_user_id)` | `(video_id)` |

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| POST | `/media/uploads` (Businesses' logo/cover endpoint delegates to the same use-case) | Authenticated; `purpose` must match caller (owner of business for business purposes; customer for review/case; rider for KYC) | multipart `{purpose,businessId?,file}` → `{assetId,url?}` (url only for public) | `MEDIA_TYPE_NOT_ALLOWED`, `MEDIA_TOO_LARGE`, `FORBIDDEN` | Required key | all upload surfaces |
| GET | `/media/private/{assetId}` | Contract-checked: uploader, or an authorised viewer per owning module (order owner/admin scope; `approvals:view` + scope for KYC) | → 302 to short-lived signed URL (≤ 5 min) | `MEDIA_NOT_FOUND` | Yes | BR-14 |
| GET | `/businesses/{slug}/gallery?filter=all\|photos\|videos\|product\|service&cursor=` | Public; approved business | → gallery-only photos + product/service images with gallery consent + approved videos with `show_in_gallery` | — | Yes | F-PF-009, S-CUST-06, S-CUST-07 |
| GET | `/businesses/{slug}/videos?cursor=` | Public | → approved Reels-visible videos (thumbnail, view count) | — | Yes | F-PF-010 |
| GET | `/videos/feed?pill=&category=&lat=&lng=&seed=&cursor=&limit<=10` | Public; `following` requires login | `pill=for_you\|following\|nearby\|offers\|products\|services`, `category` slug; → videos with overlay DTO (owner, verified, distance, open/closed, counts, linked items, safe embed) | `VALIDATION_ERROR`, `AUTH_REQUIRED` | Yes | F-RL-002, F-RL-003, F-RL-005, F-RL-006, F-RL-009 |
| GET | `/videos/{id}` | Public | → one approved video (deep link start) | `MEDIA_VIDEO_NOT_PUBLISHED` (409 → "unavailable") | Yes | F-RL-009, F-RL-008 |
| GET | `/videos?targetType=product\|service&targetId=` | Public | → approved videos linked to that item | — | Yes | F-PD-005, F-SV-004 |
| POST | `/videos/{id}/views` | Public; per session dedupe | → 204 | — | Yes | F-RL-003 |
| POST | `/videos/{id}/reports` | Customer | `{reason,details?}` → 202; video → `reported` | `VIDEO_ALREADY_REPORTED` | Yes | F-RL-005 |
| GET/POST | `/businesses/me/videos` | Approved vendor/provider; own business | `{url? \| fileAssetId?, thumbnailAssetId?, caption, hashtags[], links[], showInGallery, showInReels}` → video `pending` | `MEDIA_EMBED_HOST_NOT_ALLOWED`, `MEDIA_EMBED_ID_INVALID`, `MEDIA_LINK_TARGET_INVALID` | Required key | F-VD-012, F-RL-010, S-VEND-11, S-PROV-12 |
| PATCH/DELETE | `/businesses/me/videos/{id}` | Owner | caption/hashtags/links/toggles; edits to source re-enter `pending` | `MEDIA_NOT_FOUND`, `MEDIA_VERSION_CONFLICT` | Yes | F-VD-012, F-VD-013 |
| GET/POST/PATCH/DELETE | `/businesses/me/gallery[/{id}]` | Owner | `{assetId,caption?,linkedTarget?}`; reorder | `MEDIA_NOT_FOUND` | Yes | F-VD-012 |
| GET | `/businesses/me/videos/analytics` | Owner | → per-video views, likes, comments, shares | — | Yes | F-VD-012 |
| GET | `/admin/videos?tab=pending\|approved\|rejected\|removed\|reported\|engagement&cursor=` | Admin `catalog:view` + business area scope | → queue / engagement report | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-010, S-ADMN-11 |
| POST | `/admin/videos/{id}/decision` | Admin `catalog:edit` + scope; audited | `{action:'approve'\|'reject'\|'remove'\|'dismiss_report',reason?,expectedVersion}` | `VIDEO_INVALID_TRANSITION` | Required key | F-AD-010, ST-video |

The gallery-consent default (`business_settings.gallery_media_default`) is read from Businesses; the manager's default-setting UI writes it through the Businesses settings endpoint.

## Rules and use-cases

1. **Uploads:** sniff content type (images: jpeg/png/webp; video: mp4; documents: jpeg/png/pdf), enforce size caps from Settings, strip EXIF/GPS from images, store via `StoragePort`, never return storage keys. Private assets resolve only through `/media/private` after the owning module's authorisation contract.
2. **Embeds (RL10):** accept only `youtube.com`, `youtu.be`, `instagram.com` (`/reel/`, `/p/`, `/tv/`); extract the ID with strict regex; store `(source, provider_kind, provider_video_id)` only. The response builds `embedUrl` server-side (`https://www.youtube-nocookie.com/embed/{id}`, `https://www.instagram.com/{kind}/{id}/embed`) plus `openUrl` for the "Open in YouTube/Instagram" fallback. Never echo the client URL.
3. **ST-video:** `pending→approved|rejected(reason)`; `approved→reported` (first report); `reported→removed|approved` (dismiss); `approved→removed`. Only `approved`/`reported` are public (BR-10). Explicit handlers; decisions audited (BR-12) and notify the owner.
4. **Consent (BR-16):** a video appears in Gallery only if `show_in_gallery`, in Reels only if `show_in_reels`; product/service images appear in Gallery only with their per-item flag. New items default from the business setting.
5. **Feed:** filters by pill (`following` via Engagement follows read port; `nearby` within 6 km of supplied point; `offers` linked to an item with an active offer; `products`/`services` with links of that type), optional category = business main category. Order by score `recency + engagement` computed **as of** the first request; the cursor carries `{asOf, seed, lastScore, lastId}` so ranking is frozen per session (RL9). Linked items include current price/stock from owning modules.
6. **Counters:** `view_count` increments once per session per video (deduped); like/comment/share counts update from Engagement events idempotently.
7. Link targets must belong to the same business and be active.
8. Admin video moderation uses the `catalog` permission (no separate video module in the matrix) — open question.

## Events and jobs

Publishes `video.submitted`, `video.approved`, `video.rejected`, `video.removed`, `video.reported`. Consumes `engagement.liked/unliked`, `engagement.comment_published`, `engagement.shared`, `business.status_changed` (hide videos of suspended businesses). Job: `media.orphan_cleanup` daily deletes unreferenced uploads older than 24 h.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `MEDIA_NOT_FOUND` | 404 | `errors.media.notFound` |
| `MEDIA_TYPE_NOT_ALLOWED` | 415 | `errors.media.typeNotAllowed` |
| `MEDIA_TOO_LARGE` | 413 | `errors.media.tooLarge` |
| `MEDIA_EMBED_HOST_NOT_ALLOWED` | 422 | `errors.media.embedHostNotAllowed` |
| `MEDIA_EMBED_ID_INVALID` | 422 | `errors.media.embedIdInvalid` |
| `MEDIA_LINK_TARGET_INVALID` | 422 | `errors.media.linkTargetInvalid` |
| `MEDIA_VERSION_CONFLICT` | 409 | `errors.media.versionConflict` |
| `VIDEO_INVALID_TRANSITION` | 409 | `errors.media.videoInvalidTransition` |
| `VIDEO_ALREADY_REPORTED` | 409 | `errors.media.videoAlreadyReported` |

`MEDIA_VIDEO_NOT_PUBLISHED` is already in the shared catalogue.

## Acceptance criteria

1. Given `https://evil.com/watch?v=x` or a YouTube URL with an invalid ID, when submitted, then 422 and nothing is stored.
2. Given a valid Instagram reel link, when approved, then feed DTOs contain a server-built embed URL and an open URL, never the submitted string.
3. Given a pending video, when its deep link is opened, then `MEDIA_VIDEO_NOT_PUBLISHED` (FE shows unavailable).
4. Given a user scrolls the For You feed while new videos are approved, when the next page loads, then order is unchanged and no duplicates appear.
5. Given `show_in_gallery=false`, then the video is absent from the business Gallery but present in Reels if approved.
6. Given an admin without `catalog:edit` or outside the business area, when approving, then 403 and no change.
7. Given a JPEG with GPS EXIF, when uploaded, then the stored file has no EXIF.
8. Given a customer requests another user's private case evidence, then 404.

## Tests

Unit: URL parser (allow-list, ID regex, all kinds); ST-video handlers; score/cursor freeze; consent filters. Integration: upload sniffing + EXIF strip with `StoragePort` fake; feed pills; counters from engagement events idempotent. Authorisation negatives: non-owner edit, unscoped admin, private asset access. Security: SSRF—server never fetches client URLs.

## Open questions

Video upload size/duration limits and whether to transcode (assumed: mp4 ≤ 50 MB, no transcoding); admin permission key for video moderation (assumed `catalog`); Instagram thumbnails (owner-uploaded thumbnail required).
