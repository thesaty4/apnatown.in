# FE: media-videos

Features: F-RL-001, F-RL-002, F-RL-003, F-RL-004, F-RL-005, F-RL-006, F-RL-007, F-RL-008, F-RL-009, F-RL-010, F-PF-009, F-PF-010, F-PD-005, F-SV-004, F-VD-012, F-VD-013, F-AD-010 | Screens: S-CUST-21, S-VEND-11, S-PROV-12, S-ADMN-11 (+ gallery/videos panels inside S-CUST-06, S-CUST-07, S-CUST-08, S-CUST-09) | Flows: J4, J6

Backend contract: [BE media-videos](../be/media-videos.md)

API integration: [shared React Query contract](../../_foundation/frontend-shared.md#api-integration-with-react-query), preserving the frozen feed snapshot.

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Components](#feature-components) · [Verification](#verification)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/videos`, `/videos/:id` | S-CUST-21 | SSR first video + metadata (`VideoObject` JSON-LD on `/videos/:id`); feed is a client island (`ReelsPlayer`) | Guest or customer | `/videos/:id` index if approved; `/videos?pill=` noindex |
| `/vendor/media`, `/provider/media` | S-VEND-11, S-PROV-12 | SSR private shell + client manager | Approved vendor / provider | noindex |
| `/admin/videos?tab=&content=` | S-ADMN-11 | SSR shell + client queue | Admin **`reviews:view`** + exact area/city scope; super_admin | noindex |

## Screens

### S-CUST-21 Videos / Reels | `/videos`, `/videos/:id` | `d-customer-videos.jpg`, `d-customer-videos-m5.jpg`, `d-customer-videos-m13.jpg`, `d-customer-videos-m99.jpg` (removed)
- Entry (RL1): play icon in mobile `TopBar`, desktop nav item, bottom navigation tab.
- Layout: mobile — full-screen vertical snap feed, pills row on top (For You / Following / Nearby / Offers / Products / Services + category pills Electronics, Fashion, Food, Wedding, Mobile, Repair), overlay right rail (like, comment, share, overflow), bottom owner row + caption + hashtags + distance + open/closed, `LinkedItemsStrip` above the safe area. Desktop (≥900) — centred player, side panel with comments (Engagement) and linked items, up/down arrows.
- Data: `GET /videos/feed` returns **snapshotId, expiresAt, effectiveFilter, nextCursor** over immutable ranked IDs/scores; `GET /videos/:id` validates the deep link. POST `/videos/{id}/views` for the active ≥60%-in-view video, replay-safe per session, not a new two-second analytics rule.
- Retain opaque snapshot/cursor with Back position; never recompute sort from changing overlay counters. `MEDIA_FEED_EXPIRED` shows restart/reload, creates a new 30-minute snapshot explicitly and does not quietly splice new ranking into the old feed.
- Special states: empty Following (For You CTA), no videos nearby (“Try another area or pick another tab” / For You), failed/retry, offline, unavailable, data-saver poster. Nearby follows source **2.5 km**; no invented radius-widening control.
- Interactions: autoplay muted only when ≥ 60 % in view and not data-saver/Save-Data; tap toggles play/pause; mute toggle persists per session; progress bar; captions; ↑/↓ and j/k on desktop; Esc closes sheets; pill and video id in URL (`/videos/:id?pill=`), Back restores position. "Shop this video" opens `ShopThisVideoSheet`; items Add to cart / Enquire / View. Guest like/follow/comment opens login and returns to the same video (RL7, BR-21). Overflow → Report sheet.
- Rules: BR-10 only approved; embeds rendered from server `embedUrl` in a sandboxed iframe (`allow` minimal) else `EmbedCard` "Open in YouTube/Instagram".
- Deep link sends `startVideoId`; an out-of-filter eligible ID causes the returned `effectiveFilter=for_you` and new snapshot, as final js25 does. A removed/non-consented ID is unavailable, never force-played.
- Acceptance: Given an eligible deep link, when opened, then playback anchors by ID, not array index. Given changed likes/views/new approvals, when loading the next page, then existing order stays fixed while hidden/withdrawn items disappear. Given an expired or foreign snapshot, when used, then restart/denial is explicit. Given data-saver, when entering a video, then no autoplay occurs. Given guest Like, when login completes, then the exact video/action returns once.

### Gallery and Videos tabs (inside shop/provider profiles S-CUST-06, S-CUST-07)
- Gallery (PF9): filter chips All / Photos / Videos / By product / By service; masonry grid; `FullScreenViewer` lightbox with swipe, caption, linked-item chip, heart (Engagement), Report media.
- Report is bound for **photos as well as videos**: photo → `POST /media/photos/{assetId}/reports` with `{placementType,placementId,reason,details?}`; video → `/videos/{id}/reports`. Use canonical IDs supplied by Gallery, never title text or array index. Both allow the source's guest report flow with abuse-limit feedback.
- Success reports “Reported. Thank you.” without removing approved content locally. If moderation later removes it, show unavailable and refresh the projection; report status is not approval status.
- Videos tab (PF10): grid with view counts and `FollowButton`; tile opens `/videos/:id`.
- Data: `GET /businesses/{slug}/gallery?filter=`, `GET /businesses/{slug}/videos`. Empty: "No photos yet" / "No videos yet".
- Acceptance: Given a Gallery PHOTO, when Report is submitted/retried, then one typed report reaches the existing admin Reported queue. Given a removed asset or current consent off, when Gallery refreshes, then the asset is not displayed; heart removal still works through Engagement.

### Videos & Reels section (product S-CUST-08, service S-CUST-09)
- PD5/SV4: horizontal strip below details, hidden when empty; tile opens `/videos/:id?from=product:<id>` and the Reels linked strip returns to the product. Service page also shows previous-work gallery images. Data: `GET /videos?targetType=&targetId=`.

### S-VEND-11 / S-PROV-12 Gallery and videos manager | `/vendor/media`, `/provider/media` | `d-vendor-vmedia.jpg`, `m-vendor-vmedia.jpg`, `d-provider-smedia.jpg`, `m-provider-smedia.jpg`
- Layout matches final js26: Videos & Reels / Gallery; link/upload editor, thumbnail, caption, hashtags, linked items and separate Gallery/Reels toggles. Each video has **Move up/Move down**, status/reason, Preview, linked-item editor and Remove confirmation; Gallery photos have arrow/drag ordering.
- Display **Views, Likes, Shares, Followers gained, Taps on linked** (comments in the shared analytics table) using reporting-v1 and BE first-follow attribution. Coverage/definition metadata distinguishes missing historical evidence from zero; never estimate gains client-side.
- Data: `/businesses/me/videos`, `/businesses/me/gallery`, `/businesses/me/videos/analytics`, `/media/uploads`, Businesses settings for the default.
- Reorder GET/PUT `/businesses/me/videos/order` or `/gallery/order` uses canonical ordered IDs and `expectedOrderVersion`; keyboard arrows share the same atomic mutation as drag, rollback/reload on conflicts.
- Edit GET `/businesses/me/videos/{id}` hydrates source union, thumbnail asset ID, text, links, consent and version. PATCH sends `VideoEdit`; **Edit & resubmit** on rejected content explicitly sends `resubmit:true`. Source replacement validates/re-enters pending; a consent-only change does not pretend to resubmit. Removed owner content remains read-only.
- Upload uses purpose-specific AssetPort IDs (`video_file`, `video_thumbnail`, `gallery`). If hosting/caps are unconfigured, disable that upload with `MEDIA_UPLOAD_POLICY_REQUIRED` explanation; validated YouTube/Instagram links still work. No assumed provider/size promise.
- Special states: pending, rejected with reason, removed, order/version conflict, unavailable metrics and unconfigured upload.
- Validation: link field validates host client-side for fast feedback; server is authoritative (RL10).
- Acceptance: Given an unsupported URL or foreign/wrong-purpose asset, when submitted, then validation blocks it. Given a rejected video, when valid edit plus explicit resubmit succeeds, then the new status is Pending with the returned version. Given consent defaults off, when creating, then new controls start off without opting existing items in. Given a keyboard reorder, when reloaded, then persisted order matches and a stale version cannot overwrite it.

`MediaConsentToggle` (VD13) is also used in product/service editors (products and services FE specs).

### S-ADMN-11 Videos and moderation | `/admin/videos` | `d-admin-avideos.jpg`, `m-admin-avideos.jpg`
- Layout: Pending / Approved / Rejected / Removed / Reported / Engagement; player preview/business/links/reasons, scoped tab counts, Approve/Reject/Remove. Only **reviews:edit** enables decisions; catalog permissions are irrelevant (`js27`).
- Reported is a typed **Photo / Video** report list with Open/Resolved badges. Dismiss/Remove calls `/admin/media-reports/{id}/decision` with report and target versions; photo preview/asset ID cannot be confused with a same-title video. Dismiss never approves a rejected/removed item. Photo Remove hides that asset, not the business/product.
- Comments share this **existing** screen per G-09: `content=comments` selector within Pending/Approved/Removed; map Approved to `status=published`. GET `/admin/comments?status=&cursor=` returns rows and counts; POST `/admin/comments/{id}/decision` with action/reason/version publishes or removes. Video/author/text/status and parent preview are present; no new moderation route.
- Refresh the affected queue **and counts** after a decision. Removing a published comment also invalidates the video comment count; pending removal does not decrement. Engagement handles duplicate/versioned responses.
- Engagement table includes **Views, Likes, Shares, Taps on linked, Like rate** from final `js27.js:26`, plus supplied comments. Like rate uses server rounding; taps/gains use first-party dedup/first-follow definitions and coverage metadata.
- Special states: no permission, empty tab.
- Acceptance: Given a reason-required decision, when reason is empty, then submission is blocked. Given catalog-only permission, when opening moderation, then no access; reviews:view is read-only. Given a same-city unassigned area, when an ID is pasted, then data/action is denied. Given a published comment removal or photo report dismissal, when successful, then the correct queue/counters change without accidental video approval.

## Feature components

`ReelsFeed`, `ReelOverlay`, `FeedPills`, `GalleryGrid`, `VideoGrid`, `VideoEditorSheet`, `VideoAnalyticsTable` in `src/features/reels` and `src/features/gallery`. Shared: `ReelsPlayer`, `LinkedItemsStrip`, `ShopThisVideoSheet`, `EmbedCard`, `FullScreenViewer`, `MediaConsentToggle`, `FollowButton`, `ModerationQueueItem`, `DataTable`, `Skeleton`.

## i18n and analytics

Prefixes `reels.*`, `gallery.*`, `vendor.media.*`, `admin.videos.*`. Events: `reel_viewed`, `reel_pill_changed`, `reel_shop_opened`, `reel_linked_item_clicked`, `video_submitted`, `video_moderated`, `gallery_opened`.

## Verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

All public-image Uploaders follow [Media image policy](../be/media-videos.md#public-image-policy), display accepted format/size/dimensions, and retain the prior image on replacement failure. Consume variant dimensions/URLs for responsive images. Linked-tap POST occurs only on actual target activation. Follow includes `sourceVideoId` only with a recent same-session view; login-return following works without attribution. Prefetch/preload never creates a view.

Responsive renderers import `PublicImageVariantDTO` and use `variant.path` with its width/height; never expect a `url` alias or construct storage paths. Manually verify upload-ready without public placement, authorized public variants, invalid width/version and revoked placement including conditional/range requests.

Manual UI/accessibility: feed snap/keyboard and player lazy loading, data-saver, ID anchoring, explicit TTL restart, report/photo sheet, source edit/resubmit, reorder arrows/drag, comment queue, focus after action, Hindi/dark layouts. Manual journey J4/J6: immutable ranking despite counters/approvals, live consent removal, out-of-filter deep link, guest PHOTO report → scoped admin resolution, catalog-only denial, published-comment count decrement and private applicant upload-purpose checks. Account data export/deletion stays Users-owned; clear personal cached media/report state on invalidation.
