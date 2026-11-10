# FE: engagement

Features: F-EG-001, F-EG-002, F-EG-003, F-EG-004, F-EG-005, F-EG-006, F-EG-007, F-PF-008, F-VD-015, F-NT-003 | Screens: S-CUST-19, S-VEND-15, S-PROV-11 | Flows: J4

Backend contract: [BE engagement](../be/engagement.md)

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Components](#feature-components-used-across-modules) · [Tests](#tests)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/saved?tab=&media=` | S-CUST-19 | SSR private; tab state in URL | Customer (guest sees login prompt) | noindex |
| `/vendor/followers`, `/provider/followers` | S-VEND-15, S-PROV-11 | SSR private | Approved vendor / provider | noindex |

Action components (follow, like, heart, bookmark, share, comments) render inside other modules' screens and read flags via one batched `GET /engagement/me/state` per page (TanStack Query, optimistic updates, rollback on error).
Use [frontend-shared](../../_foundation/frontend-shared.md) for standard states, tokens and EN/HI; no business/consent/eligibility logic is duplicated in components.

## Screens

### S-CUST-19 Saved | `/saved` | `d-customer-bookmarks.jpg`, `m-customer-bookmarks.jpg`
- Layout: tabs Shops / Services / Photos & Videos; media tab filter chips Photos / Videos / Reels; cards (`ShopCard`, `ServiceCard`, media tiles) with Remove.
- Data: `GET /engagement/me/saved`.
- Remove calls DELETE on the stored bookmark/heart type+ID, **not** a public-target lookup. Photo hearts use canonical Media `assetId`, videos use video ID; array positions/gallery indices never identify saved data.
- Special states: empty per tab (browse CTA); guest login prompt (returns to `/saved`); unavailable item ("No longer available" + Remove).
- Acceptance: Given a suspended/deleted/hidden target, when Remove is tapped, then the server deletes the caller's relationship and the tombstone disappears after reload. Given `?tab=services`, when opening/returning with Back, then that tab restores. Given a guest, when opening Saved, then the login prompt preserves the return URL. Do not promise Undo that recreates a now-private target.

### S-VEND-15 / S-PROV-11 Followers | `/vendor/followers`, `/provider/followers` | `d-vendor-vfollow.jpg`, `m-vendor-vfollow.jpg`, `d-provider-sfollow.jpg`, `m-provider-sfollow.jpg`
- Layout matches final `js26.js:31–35`: **Followers**, **Gained this week**, **Videos** KPI cards; **Follower growth, last 8 weeks** bar chart with accessible table; Announce to followers form with required message and **New offer / New video** radio choices, then latest three announcements. No 30/90-day selector, generic message kind, mandatory target picker or invented owner campaign wizard.
- Data: `GET /businesses/me/followers`, `POST /businesses/me/announcements`.
- Bind `{followers,gainedThisWeek,approvedVideos,growth,unavailable,asOf}`; the eight server-supplied intervals/values are not computed from fake client series. Q-11-dependent values show definition-pending copy, distinct from zero.
- Message form submits `{kind,messageEn,messageHi?}` (optional target only if provided by an existing originating offer/video action). Success uses returned queued/eligible count, never claims all followers were delivered messages; actual delivery honors bell and current preferences/consent.
- Special states: zero eligible followers, definition unavailable, rate-limited/retry and failed send preserving draft. No “next allowed in 24 h” product quota.
- Acceptance: Given empty text, when Send is pressed, then show required-field validation. Given a valid offer/video announcement, when accepted, then acknowledgement uses the server count/status and history refreshes. Given final followers data, when rendered in Hindi/dark mode, then all three KPIs/eight-week chart/table remain readable.
- Acceptance: Given disabled bell or withdrawn consent, when a queued announcement is dispatched, then the recipient is suppressed; the UI does not promise unconditional in-app delivery.

## Feature components (used across modules)

| Component | Behaviour | Used in |
|---|---|---|
| `FollowButton` (shared) | Follow / Following + separate bell; new/refollow bell **off/unset**, explicit PUT `{bellOn}` toggles it; unfollow confirmation clears bell (PF8, EG3); login gate | profiles, Reels overlay, Videos tab |
| `HeartButton` | Heart with scale animation; reduced-motion → instant fill + text change (EG2) | gallery lightbox, Reels, media tiles |
| `LikeButton` | Toggle with count (EG4) | Reels overlay |
| `BookmarkButton` | Save/Saved for shops, providers, services (EG7) | cards, profile, service details |
| `ShareSheet` | WhatsApp (`wa.me` with encoded canonical URL), Copy link (toast), native `navigator.share` when available (EG6); posts `/engagement/shares` | Reels, profiles, products, services |
| `CommentsPanel` | Public list + composer (required 1–500 trimmed chars), own pending “Awaiting moderation”, own DELETE; reconcile server count on removal, rollback failed writes | Reels |

All buttons use foundation touch-target tokens, `aria-pressed` where appropriate, EN/HI labels and icon+text status. Follow does not grant marketing consent.

### Comments moderation integration — existing S-ADMN-11
- Media FE owns `/admin/videos`; its Pending/Removed content selector includes Comments per G-09, using `GET /admin/comments` and `POST /admin/comments/{id}/decision`.
- Require **reviews:view/edit**, not catalog; render comment/video/owner/status/reason/version with Publish/Remove controls and scoped counters. Removal requires reason; stale version refreshes the item without repeating the decision.
- Acceptance: Given a reviews moderator in scope, when a published comment is removed, then the queue and Reels count decrease once. Given catalog-only permission or another same-city area, when opening/acting, then no moderation access is granted. Given own pending comment, when the author views the video, then only they see that pending text.

## i18n and analytics

Prefixes `engagement.*`, `saved.*`, `vendor.followers.*`. Events: `follow_toggled`, `bell_toggled`, `like_toggled`, `heart_toggled`, `bookmark_toggled`, `share_clicked` (channel), `comment_posted`, `announcement_sent`.

## Tests

Component/axe: off-by-default bell, optimistic rollback/retry, unfollow dialog, required comment/message text, eight-week chart table, reduced-motion heart, share fallbacks, EN/HI/dark and topmost Esc. E2E J4: return to same video, hidden-target Saved removal after reload, comment publish/remove counters and reviews-only moderation, announcement interruption/opt-out. Account export/delete remains Users-owned; clear personal Saved/follow/comment caches when the session is invalidated.
