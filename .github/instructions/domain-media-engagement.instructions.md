---
applyTo: "apps/api/src/modules/{media-videos,engagement}/**,apps/web/src/features/{reels,gallery}/**"
---

# Domain: Media and engagement

Builds on `backend.instructions.md`/`frontend.instructions.md`/
`security.instructions.md`. Invariants: `docs/PROJECT.md` (8, 9, 15).
Journeys J4, J6. Covers `media-videos`, `engagement`, and reels/gallery
frontend.

## Video link validation and server-rebuilt embeds (RL10, invariant 9)

- Accepted video sources: YouTube/Instagram links or direct uploads.
- A client-supplied link is **never embedded as-is**: the server
  validates it against an allow-list of hosts and rebuilds a safe embed
  URL; invalid/unsupported links fall back to "Open in
  YouTube/Instagram" instead of an iframe (`security.instructions.md`).

## Approval and moderation states (invariant 9)

- Video: `pending -> approved | rejected | removed`; **public only when
  `approved`** — never show a pending/rejected video outside the
  owner's own dashboard and the admin moderation queue (AD10).
- Reports route to the moderation queue, not an automatic takedown;
  removed content renders as "unavailable", not a broken player/404.

## Media-consent rule (VD13, invariant 15)

- Every product/service media upload carries a consent flag; a photo/
  video appears in the business's public **Gallery/Reels only if the
  vendor's consent toggle allows it** — default comes from the
  vendor's gallery setting (VD12) but is overridable per upload.
- Server enforces this at read time (gallery/reels queries filter on
  consent), not just at upload-time UI.

## Reels feed behaviour (RL)

- **Data-saver:** on a detected slow connection, show "Tap to play"
  instead of autoplay (RL3).
- **Frozen ranking (RL9):** the feed's ranked order is computed once
  per session and frozen; a deep link (`/videos/:id`) resolves by id
  against that frozen list (or starts a fresh one containing it), never
  a live re-ranked query that could shift items underneath the user.
- Lazy-load video sources as they approach the viewport; never preload
  the whole feed.

## Follow / like / heart / comments moderation

- Follow (PF8, EG3), like (EG4), heart (EG2) are idempotent per
  user+target; toggling is safe to retry.
- Comments (EG5) default to `pending` when they contain links/abusive
  words (shared rule with `reviews` — `backend.instructions.md` domain
  errors), shown to the author as "awaiting moderation"; `published`
  after approval or automatically if clean.
- Report flow (RL5 overflow menu, PF9) sends to the same moderation
  queue as AD9/AD10 — one moderation pipeline, not separate ones per
  content type.

## Login prompt return path (AU6, RL7)

- A guest action requiring login (like/follow/comment, or any gated
  action elsewhere) triggers the login-required prompt and, after
  successful login, **returns the user to the exact same page/video**
  (not the home screen) — preserve the return URL/video id across the
  OTP flow.
