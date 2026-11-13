import type { Video } from '@apnatown/shared';

export type SourceKind = 'youtube' | 'instagram';

const hosts: Record<SourceKind, ReadonlySet<string>> = {
  youtube: new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']),
  instagram: new Set(['instagram.com', 'www.instagram.com']),
};

/**
 * Client-side hint only: an https URL on the chosen provider's host. The
 * server parses, canonicalizes and is authoritative for every source.
 */
export function sourceHostValid(kind: SourceKind, raw: string) {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' && hosts[kind].has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Canonical link for an existing video, used to prefill the editor. */
export function canonicalSourceUrl(video: Pick<Video, 'provider' | 'kind' | 'providerId'>) {
  if (video.provider === 'instagram')
    return `https://www.instagram.com/${video.kind}/${video.providerId}/`;
  return video.kind === 'shorts'
    ? `https://www.youtube.com/shorts/${video.providerId}`
    : `https://www.youtube.com/watch?v=${video.providerId}`;
}

/** "#a, b ,#c" → ["a", "b", "c"] (deduplicated, order kept). */
export function parseHashtags(raw: string) {
  const tags = raw
    .split(/[,\s]+/)
    .map((tag) => tag.trim().replace(/^#+/, ''))
    .filter(Boolean);
  return [...new Set(tags)];
}

export const formatHashtags = (tags: readonly string[]) =>
  tags.map((tag) => `#${tag}`).join(', ');

export const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
