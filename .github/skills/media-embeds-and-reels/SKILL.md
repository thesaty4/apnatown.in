---
name: media-embeds-and-reels
description: "Recipe for video link validation, server-rebuilt embeds, moderation states, and reels feed behaviour (data-saver, frozen ranking, deep links)."
---

# Media embeds and reels

Covers RL1-RL10, PF9-PF10 (`domain-media-engagement.instructions.md`).

## Steps

1. Accept a video link (YouTube/Instagram) or file upload; validate the
   link's host server-side against an allow-list — never trust/embed
   the raw client URL (`security.instructions.md`).
2. Rebuild a safe embed URL server-side from the validated host+id;
   store that, not the original client string, as the embeddable
   source; provide an "Open in YouTube/Instagram" fallback link for
   unsupported/invalid links.
3. Default new media to `pending`; only `approved` media is public
   (invariant 9); respect the per-upload media-consent flag before
   including it in the public Gallery/Reels (invariant 15,
   `domain-media-engagement.instructions.md`).
4. Build the reels feed ranking once per session and freeze it; a
   `/videos/:id` deep link resolves against that frozen list (or seeds
   a new one containing it) — never re-rank underneath an open feed.
5. Implement data-saver "Tap to play" instead of autoplay on detected
   slow connections; lazy-load sources near the viewport only.
6. Wire follow/like/heart/comment actions idempotently; route guest
   actions through the login-required prompt with a return path back to
   the same video (AU6, RL7).

## Skeleton

```ts
function buildEmbedUrl(rawLink: string): { embedUrl: string | null; fallbackUrl: string } {
  const host = parseAllowedHost(rawLink); // youtube.com | instagram.com, else null
  if (!host) return { embedUrl: null, fallbackUrl: rawLink };
  const id = extractVideoId(host, rawLink);
  return { embedUrl: buildAllowedEmbed(host, id), fallbackUrl: rawLink };
}
```

## Checklist

- [ ] Embed URL rebuilt server-side from an allow-list, never raw.
- [ ] New media defaults to `pending`; public only when `approved`.
- [ ] Media-consent flag checked at read time for Gallery/Reels.
- [ ] Feed ranking frozen per session; deep links resolve by id.
- [ ] Data-saver tap-to-play and lazy loading implemented.
- [ ] Guest actions return to the same video after login.
