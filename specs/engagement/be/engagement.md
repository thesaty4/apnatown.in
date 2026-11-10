# BE: engagement

Features: F-EG-001, F-EG-002, F-EG-003, F-EG-004, F-EG-005, F-EG-006, F-EG-007, F-PF-008, F-VD-015, F-NT-003 | Rules: BR-10, BR-11, BR-21 | State machines: ST-comment | Depends on: users, businesses, services, media-videos; used by media-videos (Following feed read port, counters), search, notifications.

Frontend counterpart: [FE engagement](../fe/engagement.md)

## Responsibility

Own customer social actions: follow (+ bell), like on videos, heart on photos/videos, bookmarks of shops/providers/services, moderated video comments, share tracking, and owner announcements to followers. Counters on videos are pushed to media-videos via events; follower counts live here.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `follows` | `user_id uuid FK users`; `business_id uuid FK businesses`; `bell_on bool NOT NULL DEFAULT true`; `created_at timestamptz NOT NULL`; `unfollowed_at timestamptz NULL`; PK `(user_id,business_id)` | `(business_id) WHERE unfollowed_at IS NULL` (follower count, announcement fan-out); `(business_id,created_at)` (growth chart); `(user_id) WHERE unfollowed_at IS NULL` (Following feed) |
| `likes` | `user_id uuid FK`; `video_id uuid FK videos`; `created_at`; PK `(user_id,video_id)` | PK; `(video_id)` |
| `hearts` | `user_id uuid FK`; `target_type text CHECK ('gallery_photo','video','product_image','service_image')`; `target_id uuid`; `created_at`; PK `(user_id,target_type,target_id)` | `(user_id,created_at DESC)` (Saved Photos & Videos tab) |
| `bookmarks` | `user_id uuid FK`; `target_type text CHECK ('shop','provider','service')`; `target_id uuid`; `created_at`; PK `(user_id,target_type,target_id)` | `(user_id,target_type,created_at DESC)` (Saved tabs) |
| `video_comments` | `id uuid PK`; `video_id uuid NOT NULL FK videos`; `author_user_id uuid NOT NULL FK users`; `text text NOT NULL CHECK length 1–500`; `status text NOT NULL CHECK ('pending','published','removed')`; `removed_reason text NULL`; `created_at/updated_at` | `(video_id,status,created_at DESC,id DESC)` (comment list); `(status,created_at)` (moderation) |
| `follower_announcements` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `kind text NOT NULL CHECK ('offer','video','message')`; `target_id uuid NULL`; `message_en text NOT NULL CHECK <= 200`; `message_hi text NULL`; `recipient_count int NOT NULL DEFAULT 0`; `created_at`; | `(business_id,created_at DESC)` |

## Endpoints

All customer writes require login; guest calls return `AUTH_REQUIRED` so the FE gate can return to the origin (BR-21).

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| PUT / DELETE | `/engagement/follows/{businessId}` | Customer | PUT `{bellOn?}` → `{following,bellOn,followerCount}`; DELETE unfollows | `ENGAGEMENT_TARGET_NOT_FOUND` | Yes | F-EG-003, F-PF-008 |
| PUT / DELETE | `/engagement/likes/{videoId}` | Customer; approved video | → `{liked,likeCount}` | `MEDIA_VIDEO_NOT_PUBLISHED` | Yes | F-EG-004 |
| PUT / DELETE | `/engagement/hearts/{targetType}/{targetId}` | Customer; public target | → `{hearted}` | `ENGAGEMENT_TARGET_NOT_FOUND` | Yes | F-EG-002 |
| PUT / DELETE | `/engagement/bookmarks/{targetType}/{targetId}` | Customer | → `{bookmarked}` | `ENGAGEMENT_TARGET_NOT_FOUND` | Yes | F-EG-007 |
| GET | `/engagement/me/saved?tab=shops\|services\|media&mediaFilter=photos\|videos\|reels&cursor=` | Customer; own | → cards from owning modules; unavailable items flagged | `VALIDATION_ERROR` | Yes | F-EG-001, S-CUST-19 |
| GET | `/engagement/me/state?videoIds=&businessIds=&targets=` | Customer (guest → empty) | batch → liked/followed/hearted/bookmarked flags (max 50 ids) | — | Yes | overlays, cards |
| GET | `/videos/{videoId}/comments?cursor=` | Public | → published comments + caller's own pending ones | — | Yes | F-EG-005 |
| POST | `/videos/{videoId}/comments` | Customer | `{text}` → comment with status | `VALIDATION_ERROR`, `RATE_LIMITED` | Required key | F-EG-005 |
| DELETE | `/videos/{videoId}/comments/{id}` | Author | → 204 | `ENGAGEMENT_TARGET_NOT_FOUND` | Yes | F-EG-005 |
| POST | `/engagement/shares` | Public | `{targetType:'video'\|'shop'\|'provider'\|'product'\|'service',targetId,channel:'whatsapp'\|'copy'\|'native'}` → 204 | — | Yes | F-EG-006 |
| GET | `/businesses/me/followers?range=30d\|90d` | Approved vendor/provider; own | → count, daily growth series, recent announcements | — | Yes | F-VD-015, S-VEND-15, S-PROV-11 |
| POST | `/businesses/me/announcements` | Approved vendor/provider; own; max 1 per 24 h | `{kind,targetId?,messageEn,messageHi?}` → announcement + recipient count | `ANNOUNCEMENT_LIMIT_REACHED`, `ENGAGEMENT_TARGET_NOT_FOUND` | Required key | F-NT-003 |
| GET / POST | `/admin/comments?status=pending` · `/admin/comments/{id}/decision` | Admin `catalog:view`/`catalog:edit` + video's business area scope; audited | `{action:'publish'\|'remove',reason?}` | `COMMENT_INVALID_TRANSITION` | Yes | F-EG-005, S-ADMN-11 |

## Rules and use-cases

1. All toggles are idempotent upserts/deletes keyed by PK; counts never go negative.
2. Unfollow sets `unfollowed_at` (kept for growth chart); re-follow clears it. Bell off suppresses follower notifications only.
3. Comments: text with a URL or a blocked word → `pending` (shown only to the author as "awaiting moderation"); else `published`. ST-comment explicit handlers. Rate limit 5 comments/min/user.
4. Targets must be public (approved business, approved video, active service); otherwise `ENGAGEMENT_TARGET_NOT_FOUND`.
5. Announcements: target offer/video must belong to the business and be active/approved; fan-out goes to followers with `bell_on` via Notifications (in-app always; WhatsApp/email only with consent, BR-11). Limit assumption: 1 per business per 24 h.
6. Saved lists hydrate cards via owning module read contracts; removed/unavailable targets are shown as unavailable with a Remove action.

## Events and jobs

Publishes `engagement.followed/unfollowed`, `engagement.liked/unliked`, `engagement.comment_published`, `engagement.shared`, `engagement.announcement_created` (Notifications fans out via job `notifications.fanout_followers`). Consumes `video.removed` (hide comments), `business.status_changed`.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `ENGAGEMENT_TARGET_NOT_FOUND` | 404 | `errors.engagement.targetNotFound` |
| `ANNOUNCEMENT_LIMIT_REACHED` | 429 | `errors.engagement.announcementLimit` |
| `COMMENT_INVALID_TRANSITION` | 409 | `errors.engagement.commentInvalidTransition` |

## Acceptance criteria

1. Given a guest taps Follow, then `AUTH_REQUIRED` and, after login, the follow is applied once.
2. Given the same like PUT is sent twice, then like count increases by one.
3. Given a comment containing a link, when posted, then only its author sees it with "awaiting moderation".
4. Given a vendor announces a new approved video, then followers with bell on receive an in-app notification and recipient count is returned; a second announcement within 24 h gets `ANNOUNCEMENT_LIMIT_REACHED`.
5. Given a saved shop is later suspended, then Saved shows it as unavailable with Remove.
6. Given a vendor requests another business's followers, then 404.
7. Given an admin outside the video's area, when deciding a comment, then 403.

## Tests

Unit: toggle idempotency, comment moderation, announcement limit. Integration: follow → Following feed; like events → media counters; announcement fan-out with Notifications fake. Authorisation negatives: guest writes, cross-business followers, author-only comment delete, unscoped admin.

## Open questions

Announcement frequency limit (assumed 1/24 h); comment moderation owner (assumed admin videos queue with `catalog` permission).
