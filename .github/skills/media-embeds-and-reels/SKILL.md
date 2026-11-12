---
name: media-embeds-and-reels
description: "Recipe for Cloudinary public-image uploads, safe YouTube/Instagram embeds, moderation and reels feed behaviour; no direct video uploads."
---

# Media embeds and reels

Covers RL1-RL10, PF9-PF10 (`domain-media-engagement.instructions.md`).
Canonical provider/configuration contract:
[media and maps](../../../specs/_foundation/media-and-maps.md).

## Steps

1. For images, reuse Media's AssetPort, exact image policy and server-side
   multipart upload. Sanitize before Cloudinary; store authenticated
   variants and serve only through the same-origin authorization gateway.
   Never send KYC, case evidence or exports to Cloudinary.
2. Accept only YouTube watch/Shorts or Instagram Reel/public-post links.
   Reject direct video files, invalid exact host/path/ID combinations and
   arbitrary URLs. Store validated provider/kind/ID, not input HTML/URL.
3. Build `VideoPlaybackDTO` server-side: YouTube iframe, safe Instagram
   permalink renderer, or canonical Open fallback. Never inject raw
   oEmbed HTML or return an invalid link as a fallback. Use the trusted
   provider loader once and clean up off-screen playback/listeners.
4. Default new videos to `pending`; only `approved` videos are public
   (BR-10); respect the per-placement media-consent flag before
   including it in the public Gallery/Reels (BR-16,
   `domain-media-engagement.instructions.md`).
5. Build the reels feed ranking once per session and freeze it; a
   `/videos/:id` deep link resolves against that frozen list (or seeds
   a new one containing it) — never re-rank underneath an open feed.
6. Preserve data-saver tap-to-play and provider limitations: Instagram
   native controls are not a custom autoplay/mute/progress API.
   Load only the active authorized source; maintain safe fallback.
7. Wire follow/like/heart/comment actions idempotently; route guest
   actions through the login-required prompt with a return path back to
   the same video (AU6, RL7).

8. Use React Query hooks for API reads/uploads/mutations; verify the
   [manual acceptance cases](../../../specs/_foundation/media-and-maps.md#manual-acceptance)
   without creating automated test files, then obtain security review.

## Checklist

- [ ] Cloudinary contains sanitized public-purpose images only; no provider URL bypass.
- [ ] Typed playback and Open URL rebuilt server-side; invalid input rejected.
- [ ] Direct video uploads disabled in UI and API.
- [ ] New videos default to `pending`; public only when `approved`.
- [ ] Media-consent flag checked at read time for Gallery/Reels.
- [ ] Feed ranking frozen per session; deep links resolve by id.
- [ ] Data-saver tap-to-play and lazy loading implemented.
- [ ] Guest actions return to the same video after login.
