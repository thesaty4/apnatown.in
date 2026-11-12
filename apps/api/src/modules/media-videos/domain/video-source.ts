import {
  SafeVideoPlaybackSchema,
  VideoSourceSchema,
  type VideoPlayback,
  type VideoSource,
} from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';

const youtubeId = /^[A-Za-z0-9_-]{11}$/;
const instagramCode = /^[A-Za-z0-9_-]{1,64}$/;

/** Parse provider links into storage-safe identifiers; never retain the input URL. */
export function parseVideoSource(input: string): VideoSource {
  if (input.length > 2048)
    throw new DomainError('MEDIA_VIDEO_SOURCE_INVALID', { field: 'url' });
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new DomainError('MEDIA_VIDEO_SOURCE_INVALID', { field: 'url' });
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port)
    throw new DomainError('MEDIA_VIDEO_SOURCE_INVALID', { field: 'url' });
  if (url.searchParams.has('list'))
    throw new DomainError('MEDIA_VIDEO_SOURCE_INVALID', { field: 'url' });

  const host = url.hostname.toLowerCase();
  let source: VideoSource | undefined;
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') {
      const ids = url.searchParams.getAll('v');
      if (ids.length === 1 && youtubeId.test(ids[0]!))
        source = { provider: 'youtube', kind: 'watch', providerId: ids[0]! };
    } else {
      const match = /^\/shorts\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname);
      if (match) source = { provider: 'youtube', kind: 'shorts', providerId: match[1]! };
    }
  } else if (host === 'youtu.be') {
    const match = /^\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname);
    if (match) source = { provider: 'youtube', kind: 'share', providerId: match[1]! };
  } else if (host === 'instagram.com' || host === 'www.instagram.com') {
    const match = /^\/(reel|p)\/([A-Za-z0-9_-]{1,64})\/?$/.exec(url.pathname);
    if (match && (match[1] === 'reel' || match[1] === 'p') && instagramCode.test(match[2]!))
      source = { provider: 'instagram', kind: match[1], providerId: match[2]! };
  }
  if (!source) throw new DomainError('MEDIA_VIDEO_SOURCE_INVALID', { field: 'url' });
  return VideoSourceSchema.parse(source);
}

/** Build every provider URL from validated IDs; submitted URL data is discarded. */
export function videoPlayback(source: VideoSource, enabled = true): VideoPlayback {
  const parsed = VideoSourceSchema.parse(source);
  const openUrl = parsed.provider === 'youtube'
    ? `https://www.youtube.com/watch?v=${parsed.providerId}`
    : `https://www.instagram.com/${parsed.kind}/${parsed.providerId}/`;
  if (!enabled) return SafeVideoPlaybackSchema.parse({
    provider: parsed.provider, render: 'fallback', openUrl, reason: 'disabled',
  });
  return SafeVideoPlaybackSchema.parse(parsed.provider === 'youtube'
    ? {
        provider: 'youtube', render: 'iframe',
        embedUrl: `https://www.youtube-nocookie.com/embed/${parsed.providerId}`, openUrl,
      }
    : { provider: 'instagram', render: 'instagram', permalink: openUrl, openUrl });
}
