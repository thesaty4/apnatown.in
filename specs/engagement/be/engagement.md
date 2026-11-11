# BE: engagement

Features: F-EG-001, F-EG-002, F-EG-003, F-EG-004, F-EG-005, F-EG-006, F-EG-007, F-PF-008, F-VD-015, F-NT-003 | Rules: BR-10, BR-11, BR-21 | State machines: ST-comment | Depends on: users, businesses, services, media-videos; used by media-videos (Following feed read port, counters), search, notifications.

Frontend counterpart: [FE engagement](../fe/engagement.md)

Contents: [Tables](#tables) · [Endpoints](#endpoints) · [Rules](#rules-and-use-cases) · [Events](#events-and-jobs) · [Acceptance](#acceptance-criteria)

## Responsibility

Own follow/bell, likes, media hearts, service bookmarks, moderated video comments, share counts and owner announcements. Business/provider follow and bookmark surfaces are one relationship; there is no second business bookmark record. Relationship/counter truth lives here; Media holds event-refreshed projections.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `follows` | `user_id uuid FK users`; `business_id uuid FK businesses`; `bell_on bool NOT NULL DEFAULT false`; `created_at timestamptz NOT NULL`; `last_followed_at timestamptz NOT NULL`; `unfollowed_at timestamptz NULL`; PK `(user_id,business_id)` | `(business_id,user_id) WHERE unfollowed_at IS NULL` (count/Following); `(business_id,user_id) WHERE unfollowed_at IS NULL AND bell_on` (notification fan-out); `(business_id,created_at)` growth; `(user_id) WHERE unfollowed_at IS NULL` Following |
| `follower_daily_counts` | `business_id uuid FK businesses`; `ist_date date NOT NULL`; `follow_transitions/unfollow_transitions int NOT NULL DEFAULT 0 CHECK >=0`; `closing_total int NOT NULL CHECK >=0`; PK `(business_id,ist_date)` | PK supports eight-week growth, updated in the relationship transaction |
| `likes` | `user_id uuid FK`; `video_id uuid FK videos`; `created_at`; PK `(user_id,video_id)` | PK; `(video_id)` |
| `hearts` | `user_id uuid FK`; `target_type text CHECK ('photo','video')`; `target_id uuid` (`media_assets.id` for a photo, `videos.id` for video/reel; never an array index or storage key); `created_at`; PK `(user_id,target_type,target_id)` | `(user_id,created_at DESC,target_id)` Saved media |
| `bookmarks` | `user_id uuid FK`; `target_type text CHECK ('service')`; `target_id uuid`; `created_at`; PK `(user_id,target_type,target_id)` | `(user_id,target_type,created_at DESC)` (Saved service tab) |
| `video_comments` | `id uuid PK`; `video_id uuid NOT NULL FK videos`; `author_user_id uuid NOT NULL FK users`; `text text NOT NULL CHECK trimmed length 1–500`; `status text NOT NULL CHECK ('pending','published','removed')`; `removed_reason text NULL`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at` | `(video_id,status,created_at DESC,id DESC)` list; `(status,created_at,id)` moderation |
| `video_engagement_counts` | `video_id uuid PK FK videos`; `like_count/published_comment_count/share_count bigint NOT NULL DEFAULT 0 CHECK >=0`; `version bigint NOT NULL DEFAULT 1`; `updated_at` | PK for authoritative counter projection/reconciliation |
| `follower_announcements` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `kind text NOT NULL CHECK ('product','service','offer','video')`; `target_id uuid NULL`; `source text NOT NULL CHECK ('automatic_first_publication','owner_announcement')`; `source_event_id uuid NULL UNIQUE`; `message_en text NULL CHECK length <=200`; `message_hi text NULL CHECK length <=200`; `created_at` | `(business_id,created_at DESC,id DESC)` recent three; unique source event deduplicates automatic notices |

## Endpoints

All customer writes require login; guest calls return `AUTH_REQUIRED` so the FE gate can return to the origin (BR-21).

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| PUT / DELETE | `/engagement/follows/{businessId}` | Customer; own relationship | PUT `{bellOn?}` → `{following,bellOn,followerCount}`; new/refollow defaults bell false; DELETE never needs target public | `ENGAGEMENT_TARGET_NOT_FOUND` on create | Yes | F-EG-003, F-PF-008 |
| PUT / DELETE | `/engagement/likes/{videoId}` | Customer; PUT requires approved/public video; DELETE own relationship only | → `{liked,likeCount}` | `MEDIA_VIDEO_NOT_PUBLISHED` on create | Yes | F-EG-004 |
| PUT / DELETE | `/engagement/hearts/{targetType}/{targetId}` | Customer; PUT public photo/video, DELETE own relationship even if target unavailable | → `{hearted}` | `ENGAGEMENT_TARGET_NOT_FOUND` on create | Yes | F-EG-002 |
| PUT / DELETE | `/engagement/bookmarks/{targetType}/{targetId}` | Customer; `targetType=service` only; PUT requires public target, DELETE own existing relationship | → `{bookmarked}` | `ENGAGEMENT_TARGET_NOT_FOUND` on create | Yes | F-EG-007 |
| GET | `/engagement/me/saved?tab=shops\|services\|media&mediaFilter=photos\|videos\|reels&cursor=` | Customer; own | `shops` is the Following list from active follows, including bell state; Services remains service bookmarks; media remains hearts. Unavailable targets remain removable. | `VALIDATION_ERROR` | Yes | F-EG-001, S-CUST-19 |
| GET | `/engagement/me/state?videoIds=&businessIds=&targets=` | Customer (guest → empty) | batch → liked/hearted/service-bookmarked flags and business `{following,bellOn}` (max 50 IDs); no separately stored shop/provider bookmark state | — | Yes | overlays, cards |
| GET | `/videos/{videoId}/comments?cursor=` | Public | → published comments + caller's own pending ones | — | Yes | F-EG-005 |
| POST | `/videos/{videoId}/comments` | Customer | `{text}` → comment with status | `VALIDATION_ERROR`, `RATE_LIMITED` | Required key | F-EG-005 |
| DELETE | `/videos/{videoId}/comments/{id}` | Author | → 204 | `ENGAGEMENT_TARGET_NOT_FOUND` | Yes | F-EG-005 |
| POST | `/engagement/shares` | Public | `{targetType:'video'\|'shop'\|'provider'\|'product'\|'service',targetId,channel:'whatsapp'\|'copy'\|'native'}` → 204 | — | Yes | F-EG-006 |
| GET | `/businesses/me/followers` | Approved vendor/provider; own business from session | → `{followers,gainedThisWeek,approvedVideos,growth:[{start,end,total,gained}],asOf,definitionVersion?,unavailable[],recentAnnouncements[]}`; eight weekly buckets, latest three announcements | — | Yes | F-VD-015, S-VEND-15, S-PROV-11 |
| POST | `/businesses/me/announcements` | Approved vendor/provider; own; shared abuse limiter, no product quota assumed | `{kind:'product'\|'service'\|'offer'\|'video',targetId?,messageEn,messageHi?}` → `{announcementId,status:'queued',eligibleRecipients}`; not a claim of delivery | `ENGAGEMENT_TARGET_NOT_FOUND`, `COMMON_RATE_LIMITED` | Required key | F-NT-003 |
| GET | `/admin/comments?status=pending\|published\|removed&cursor=&limit=` | Admin **`reviews:view`** + exact video's business scope; super_admin | → page `{id,videoId,businessId,authorLabel,text,status,reason?,version,allowedActions}` + scoped counts | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-EG-005, S-ADMN-11 |
| POST | `/admin/comments/{id}/decision` | Admin **`reviews:edit`** + same scope; audited | `{action:'publish'\|'remove',reason?,expectedVersion}` → comment and counters; require reason for removal | `COMMENT_INVALID_TRANSITION`, `COMMENT_VERSION_CONFLICT` | Required key | F-EG-005, S-ADMN-11 |

## Rules and use-cases

1. All toggles are idempotent upserts/deletes keyed by PK; counts never go negative.
2. New follow has an **unset/off bell** (`js24.js:4–6`); following alone does not enable follower notifications and is not marketing consent. Unfollow records the transition and clears bell; refollow does not silently re-enable it. Daily count rows update once in the same transaction, not from replayable analytics.
3. Comments: URL/blocked word → pending (author-only); clean → published. Explicit edges: pending→published/removed, published→removed (admin or author deletion), removed terminal. Rate limit 5/min/user. Admin moderation uses reviews, not catalog (`js27.js:23–27`; G-09).
4. Require public/approved/consented target only when **creating** a relationship, comment or share. DELETE addresses the caller's stored relationship and is successful/idempotent even if the target is suspended, hidden, removed or deleted; no public lookup can block Saved removal.
5. Owner announcements support product, service, offer and video kinds; message is required and a target is optional. A supplied target must belong to this business and remain publicly eligible. Without a target, destination is the public listing area for that kind (`/products`, `/services`, `/offers`, `/videos`). Notifications fans out only to current followers with bell on and eligible selected channel/preferences/consents; no unconditional delivery.
6. Saved pages preserve relationship IDs/type and return `{available:false,reasonKey}` tombstones without leaking private target content. Remove remains enabled. A retry of PUT after availability loss fails rather than recreating the relationship.
7. Follower screen fields follow final `js26`, not a 30/90-day chart. `followers` is current active follows; `approvedVideos` comes from `MediaOwnerReadPort.approvedVideoCount({businessId})`. Eight-week growth/“gained this week” must use approved Q-11 week/cohort/refollow definitions; until then their values are null with `unavailable`, not synthetic growth. Actual daily transition counts are not mislabeled unique gains.
8. Moderation scopes use [Admin's predicate](../../admin/be/admin.md#scope-and-read-context); counts filter before aggregation. S-ADMN-11 uses this queue alongside video/photo moderation, never a new moderation screen.

### Read ports and account data

- `EngagementReadPort.following({userId,cursor?,limit?}) -> Page<{businessId}>`; `followers({businessId,asOf,afterUserId?,upperUserId?,limit<=500}) -> {items:[{userId,bellOn,followedAt}],upperUserId,nextCursor}` uses stable user-ID order, captures an initial upper bound and includes only active relationships with last_followed_at≤asOf. New/refollows after fan-out start cannot enter a resumed batch. `canNotifyFollower({userId,businessId}) -> {following,bellOn,businessApproved}` is rechecked for **every** send/retry.
- `EngagementReadPort.videoCounters({videoIds[]}) -> [{videoId,likes,publishedComments,shares,version}]` provides absolute authoritative counts. `EngagementAdminReadPort.summary(ctx) -> {pendingComments,publishedComments,removedComments}` requires reviews:view and scope.
- Required hydration ports: `BusinessPublicReadPort.cards({ids[]})`, `ServicePublicReadPort.cards({ids[]})`, `MediaPublicReadPort.cards({targets:[{type:'photo'|'video',id}]})` → `{id,available,canonicalPath?,label?,thumbnailAssetId?,mediaKind?}` items. For unavailable targets return ID/false only; callers cannot expand private projections. Shop/provider IDs are Businesses IDs.
- `EngagementUserDataPort` implements Users' `UserDataPort.exportPage({userId,cursor,limit})` for own bookmarks, hearts, likes, follows/bell and authored comments, not other followers' identities. Limit ≤50, stable typed cursor; internal authorized orchestrator only.
- `erase({userId,requestId,policyVersion}) -> {receipt,status:'completed'|'blocked',reasonCode?}` requires approved Q-32 disposition, is resumable/idempotent and removes only that subject's records. Reconcile active follower, like and published-comment counts once and invalidate Saved/Following. Undecided retention of authored comments/evidence returns blocked; no guessed cascade. Terminal status polling/capabilities remain Users-owned.

## Events and jobs

Publish `engagement.followed`, `engagement.unfollowed`, `engagement.bell_changed`, `engagement.liked`, `engagement.unliked`, `engagement.comment_published`, **`engagement.comment_removed`**, `engagement.comment_pending`, `engagement.comment_moderated`, `engagement.shared`, `engagement.announcement_created`. All use transactional outbox with stable event IDs.
Comment payload `{commentId,videoId,businessId,authorUserId,scope,fromStatus,toStatus,version,publishedCountDelta}`: publish +1; removing/deleting a published comment −1; pending→removed 0. `comment_moderated` is emitted for an **admin decision** as the author-notification source; self-deletion/count companion events do not send duplicates. Pending triggers the existing admin reviews-moderation alert.
Media deduplicates events and refreshes absolute counts via `videoCounters`; monotonic versions prevent out-of-order remove/publish from losing a decrement. Share/like mutations and counters commit together.
Owner announcement event `{announcementId,businessId,kind,targetId?,source:'owner_announcement'}` and the content owners' first-publication events start Notifications' resumable `notifications.fanout_followers`. A supplied target's ownership, current publication and business visibility are checked before enqueue; an untargeted announcement links to the kind's public listing area. Automatic notices are emitted once on first eligible public publication; edits, reapproval, resume and content updates do not automatically notify again. `FollowerAnnouncementReadPort.read({announcementId}) -> {businessId,ownerRole,kind,targetId?,source,messageEn,messageHi?,linkPath}` is a bounded internal context read, not a bulk browser request.

Backfill legacy shop/provider bookmarks into `follows`: retain an existing active follow and its bell; otherwise upsert an active follow with bell off and the original bookmark creation time. An inactive follow reactivated from a bookmark remains bell-off. Delete migrated business bookmarks only after row/count reconciliation; preserve service bookmarks and media hearts. Rebuild current totals from active canonical follows; retain historical daily transitions and set only the migration-day closing total.
Consume `video.removed` and **`business.application.decision_changed`** to invalidate visibility/Following/Saved; preserve removable relationships. `user.account.status_changed`/`user.account.deleted` invalidate subject caches/fan-out eligibility immediately; actual erasure remains the Users-orchestrated policy-gated contract.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `ENGAGEMENT_TARGET_NOT_FOUND` | 404 | `errors.engagement.targetNotFound` |
| `COMMENT_INVALID_TRANSITION` | 409 | `errors.engagement.commentInvalidTransition` |
| `COMMENT_VERSION_CONFLICT` | 409 | `errors.engagement.commentVersionConflict` |

## Acceptance criteria

1. Given a guest, when Follow is attempted, then login returns to the origin and applies one follow with bell off.
2. Given the same like PUT, when sent twice, then like count increases once.
3. Given a comment containing a link, when posted, then only its author sees it with "awaiting moderation".
4. Given an authorized new-video announcement, when fan-out resumes after interruption, then each eligible follower/channel is processed once; bell/consent/preference withdrawal before send/retry suppresses it.
5. Given a saved shop/photo/service later becomes hidden/deleted, when its owner removes the saved relationship, then DELETE succeeds and subsequent Saved pages omit it.
6. Given another business's followers, when a vendor requests them, then 404.
7. Given an admin outside the video's area, when deciding a comment, then 403.
8. Given catalog-only versus reviews:edit admins, when moderating a comment, then catalog-only is denied and the scoped review moderator succeeds.
9. Given a published comment, when the author deletes it or an admin removes it, then public count drops once despite duplicate/out-of-order events; pending removal never decrements it.
10. Given a follow/unfollow/refollow sequence, when refreshed, then counts stay nonnegative and refollow's bell remains off; the screen contract still contains Followers, Gained this week, Videos and eight weeks.
11. Given kind `message` or a target that is not owned/currently public, when announcing, then validation rejects it; only a published product, service, offer or video can be announced.
12. Given a product/service/offer/video becomes public for the first time, when its outbox event is delivered more than once, then one automatic announcement is queued; edits and later re-publication do not produce another automatic notice.
13. Given a customer follows without enabling the bell, or withdraws channel consent before delivery, when fan-out runs, then no follower notification is delivered through that ineligible channel.
12. Given repeated account-erasure calls, when policy is approved, then receipts and counter changes are idempotent; without Q-32 policy they remain blocked.

## Tests

Unit: AC1/2/5/10 relationship transitions, typed target IDs, comment state/counter deltas. Integration: Saved tombstone removal, moderation queue/counts, out-of-order counter reconciliation, announcement worker restart/withdrawal, account receipts. Authorization negatives: guest writes, foreign saved relation/followers, non-author comment deletion, same-city foreign area, catalog-only moderator. Malicious text/IDs and duplicate/retried POSTs are bounded/inert.

## Open questions

Open question: Q-11 defines weekly gain/cohort/refollow attribution; do not generate a trend or invent announcement quotas. Q-32/Q-13 govern account-held comment retention. Comment moderation ownership is settled: existing S-ADMN-11, **reviews:view/edit**, not catalog.
