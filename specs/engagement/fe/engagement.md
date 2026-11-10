# FE: engagement

Features: F-EG-001, F-EG-002, F-EG-003, F-EG-004, F-EG-005, F-EG-006, F-EG-007, F-PF-008, F-VD-015, F-NT-003 | Screens: S-CUST-19, S-VEND-15, S-PROV-11 | Flows: J4

Backend contract: [BE engagement](../be/engagement.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/saved?tab=&media=` | S-CUST-19 | SSR private; tab state in URL | Customer (guest sees login prompt) | noindex |
| `/vendor/followers`, `/provider/followers` | S-VEND-15, S-PROV-11 | SSR private | Approved vendor / provider | noindex |

Action components (follow, like, heart, bookmark, share, comments) render inside other modules' screens and read flags via one batched `GET /engagement/me/state` per page (TanStack Query, optimistic updates, rollback on error).

## Screens

### S-CUST-19 Saved | `/saved` | `d-customer-bookmarks.jpg`, `m-customer-bookmarks.jpg`
- Layout: tabs Shops / Services / Photos & Videos; media tab filter chips Photos / Videos / Reels; cards (`ShopCard`, `ServiceCard`, media tiles) with Remove.
- Data: `GET /engagement/me/saved`.
- Special states: empty per tab (browse CTA); guest login prompt (returns to `/saved`); unavailable item ("No longer available" + Remove).
- Acceptance: Given Remove is tapped, then the card disappears with an Undo toast. Given `?tab=services` in the URL, then that tab opens. Given a guest, then the login prompt shows instead of the list.

### S-VEND-15 / S-PROV-11 Followers | `/vendor/followers`, `/provider/followers` | `d-vendor-vfollow.jpg`, `m-vendor-vfollow.jpg`, `d-provider-sfollow.jpg`, `m-provider-sfollow.jpg`
- Layout: follower count `KpiCard`, growth line chart (30/90 days, accessible table fallback), "Announce to followers" sheet (kind: offer / video / message, select target, EN message required, HI optional, preview, recipient count), past announcements list.
- Data: `GET /businesses/me/followers`, `POST /businesses/me/announcements`.
- Special states: zero followers (announce disabled with explanation); limit reached (next allowed time in IST).
- Acceptance: Given the message is empty, then Send is disabled. Given success, then a toast shows "Sent to N followers" with Indian number grouping. Given the 24 h limit, then the server message is shown.

## Feature components (used across modules)

| Component | Behaviour | Used in |
|---|---|---|
| `FollowButton` (shared) | Follow / Following + bell; unfollow confirmation dialog (PF8, EG3); login gate | profiles, Reels overlay, Videos tab |
| `HeartButton` | Heart with scale animation; reduced-motion → instant fill + text change (EG2) | gallery lightbox, Reels, media tiles |
| `LikeButton` | Toggle with count (EG4) | Reels overlay |
| `BookmarkButton` | Save/Saved for shops, providers, services (EG7) | cards, profile, service details |
| `ShareSheet` | WhatsApp (`wa.me` with encoded canonical URL), Copy link (toast), native `navigator.share` when available (EG6); posts `/engagement/shares` | Reels, profiles, products, services |
| `CommentsPanel` | List + composer (500 chars), own pending shown "Awaiting moderation"; bottom sheet on mobile, side panel on desktop (EG5) | Reels |

All buttons: 44 px targets, `aria-pressed`, labels in EN/HI, status by icon + text.

## i18n and analytics

Prefixes `engagement.*`, `saved.*`, `vendor.followers.*`. Events: `follow_toggled`, `bell_toggled`, `like_toggled`, `heart_toggled`, `bookmark_toggled`, `share_clicked` (channel), `comment_posted`, `announcement_sent`.

## Tests

Component: optimistic toggle + rollback, unfollow confirm, reduced-motion heart, share fallbacks. E2E: J4 follow/like/share from Reels; guest heart → login → returns with heart applied; Saved remove.
