# FE: media-videos

Features: F-RL-001, F-RL-002, F-RL-003, F-RL-004, F-RL-005, F-RL-006, F-RL-007, F-RL-008, F-RL-009, F-RL-010, F-PF-009, F-PF-010, F-PD-005, F-SV-004, F-VD-012, F-VD-013, F-AD-010 | Screens: S-CUST-21, S-VEND-11, S-PROV-12, S-ADMN-11 (+ gallery/videos panels inside S-CUST-06, S-CUST-07, S-CUST-08, S-CUST-09) | Flows: J4, J6

Backend contract: [BE media-videos](../be/media-videos.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/videos`, `/videos/:id` | S-CUST-21 | SSR first video + metadata (`VideoObject` JSON-LD on `/videos/:id`); feed is a client island (`ReelsPlayer`) | Guest or customer | `/videos/:id` index if approved; `/videos?pill=` noindex |
| `/vendor/media`, `/provider/media` | S-VEND-11, S-PROV-12 | SSR private shell + client manager | Approved vendor / provider | noindex |
| `/admin/videos?tab=` | S-ADMN-11 | SSR shell + client queue | Admin `catalog:view` + scope | noindex |

## Screens

### S-CUST-21 Videos / Reels | `/videos`, `/videos/:id` | `d-customer-videos.jpg`, `d-customer-videos-m5.jpg`, `d-customer-videos-m13.jpg`, `d-customer-videos-m99.jpg` (removed)
- Entry (RL1): play icon in mobile `TopBar`, desktop nav item, bottom navigation tab.
- Layout: mobile — full-screen vertical snap feed, pills row on top (For You / Following / Nearby / Offers / Products / Services + category pills Electronics, Fashion, Food, Wedding, Mobile, Repair), overlay right rail (like, comment, share, overflow), bottom owner row + caption + hashtags + distance + open/closed, `LinkedItemsStrip` above the safe area. Desktop (≥900) — centred player, side panel with comments (Engagement) and linked items, up/down arrows.
- Data: `GET /videos/feed` (cursor carries asOf/seed — never reshuffle), `GET /videos/:id` for deep-link start, `POST /videos/{id}/views` after 2 s in view.
- Special states: empty Following (CTA to For You), no videos nearby (widen radius / For You), skeleton, failed + retry, offline, removed/unavailable (for deep link to non-approved), data-saver "Tap to play" poster.
- Interactions: autoplay muted only when ≥ 60 % in view and not data-saver/Save-Data; tap toggles play/pause; mute toggle persists per session; progress bar; captions; ↑/↓ and j/k on desktop; Esc closes sheets; pill and video id in URL (`/videos/:id?pill=`), Back restores position. "Shop this video" opens `ShopThisVideoSheet`; items Add to cart / Enquire / View. Guest like/follow/comment opens login and returns to the same video (RL7, BR-21). Overflow → Report sheet.
- Rules: BR-10 only approved; embeds rendered from server `embedUrl` in a sandboxed iframe (`allow` minimal) else `EmbedCard` "Open in YouTube/Instagram".
- Acceptance: Given `/videos/abc` for an approved video, then playback starts at that video and scrolling continues the feed. Given a removed video id, then the unavailable state shows with a For You action. Given data-saver, then no video autoplays. Given the guest likes, when login completes, then they return to the same video and the like is applied. Given Hindi, then pills and overlay labels render in Hindi without clipping.

### Gallery and Videos tabs (inside shop/provider profiles S-CUST-06, S-CUST-07)
- Gallery (PF9): filter chips All / Photos / Videos / By product / By service; masonry grid; `FullScreenViewer` lightbox with swipe, caption, linked-item chip, heart (Engagement), Report media.
- Videos tab (PF10): grid with view counts and `FollowButton`; tile opens `/videos/:id`.
- Data: `GET /businesses/{slug}/gallery?filter=`, `GET /businesses/{slug}/videos`. Empty: "No photos yet" / "No videos yet".

### Videos & Reels section (product S-CUST-08, service S-CUST-09)
- PD5/SV4: horizontal strip below details, hidden when empty; tile opens `/videos/:id?from=product:<id>` and the Reels linked strip returns to the product. Service page also shows previous-work gallery images. Data: `GET /videos?targetType=&targetId=`.

### S-VEND-11 / S-PROV-12 Gallery and videos manager | `/vendor/media`, `/provider/media` | `d-vendor-vmedia.jpg`, `m-vendor-vmedia.jpg`, `d-provider-smedia.jpg`, `m-provider-smedia.jpg`
- Layout: tabs Videos & Reels / Gallery; "Add video" sheet (paste link or upload, thumbnail, caption, hashtags, link products/services, `MediaConsentToggle` Show in Gallery / Show in Reels with explanation); list with status chip (Pending / Approved / Rejected with reason / Removed) and analytics (views, likes, comments, shares); Gallery tab upload/reorder/caption/link item; default consent setting.
- Data: `/businesses/me/videos`, `/businesses/me/gallery`, `/businesses/me/videos/analytics`, `/media/uploads`, Businesses settings for the default.
- Special states: pending, rejected with reason (Edit & resubmit), removed (read-only).
- Validation: link field validates host client-side for fast feedback; server is authoritative (RL10).
- Acceptance: Given a non-YouTube/Instagram URL, then inline error "Only YouTube or Instagram links". Given a rejected video, then the reason is shown and editing resubmits to Pending. Given the default consent is off, then new items start with toggles off.

`MediaConsentToggle` (VD13) is also used in product/service editors (products and services FE specs).

### S-ADMN-11 Videos and moderation | `/admin/videos` | `d-admin-avideos.jpg`, `m-admin-avideos.jpg`
- Layout: tabs Pending / Approved / Rejected / Removed / Reported / Engagement; `ModerationQueueItem` with player preview, business, links, report reasons; actions Approve / Reject (reason) / Remove (reason) / Dismiss report; Engagement tab is a `DataTable` (views, likes, comments, shares).
- Special states: no permission, empty tab.
- Acceptance: Given a reject without reason, then the form blocks submit. Given `catalog:view` only, then actions are disabled and server rejects edits.

## Feature components

`ReelsFeed`, `ReelOverlay`, `FeedPills`, `GalleryGrid`, `VideoGrid`, `VideoEditorSheet`, `VideoAnalyticsTable` in `src/features/reels` and `src/features/gallery`. Shared: `ReelsPlayer`, `LinkedItemsStrip`, `ShopThisVideoSheet`, `EmbedCard`, `FullScreenViewer`, `MediaConsentToggle`, `FollowButton`, `ModerationQueueItem`, `DataTable`, `Skeleton`.

## i18n and analytics

Prefixes `reels.*`, `gallery.*`, `vendor.media.*`, `admin.videos.*`. Events: `reel_viewed`, `reel_pill_changed`, `reel_shop_opened`, `reel_linked_item_clicked`, `video_submitted`, `video_moderated`, `gallery_opened`.

## Tests

Component: feed snap/keyboard, data-saver poster, unavailable state, link validation, consent toggle defaults. E2E: J4 play → follow/like → linked product → add to cart; J6 vendor uploads → admin approves → appears in Reels and (if consented) Gallery.
