'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { MediaLinkTarget, PublicVideoCard } from '@apnatown/shared';
import { NavIcon } from '../../shared/ui/NavIcon';
import { compactViews, imageSources, videoHref } from './media';

/** Provider badge: brand glyph + localized text (never colour-only). */
export function ProviderBadge({ provider }: { provider: PublicVideoCard['provider'] }) {
  const t = useTranslations('gallery.provider');
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-pill bg-reel-canvas/80 px-2 py-0.5 text-caption font-semibold text-reel-text">
      <span aria-hidden="true" className="shrink-0">
        {provider === 'youtube' ? '▶' : '◎'}
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{t(provider)}</span>
    </span>
  );
}

/**
 * Poster tile for one public video card; opens the Reels deep link. The
 * link's text (caption, provider, views) is its accessible name; the poster
 * is decorative. Only DTO thumbnail variants are used, never provider URLs.
 */
export function VideoTile({
  video,
  from,
  layout = 'grid',
}: {
  video: PublicVideoCard;
  from?: MediaLinkTarget | undefined;
  layout?: 'grid' | 'strip' | 'masonry';
}) {
  const t = useTranslations('gallery.video');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const poster = video.thumbnail ? imageSources(video.thumbnail, 320) : null;
  const caption = video.caption.trim() || t('untitled');
  const ratio =
    layout === 'masonry' && video.thumbnail
      ? undefined
      : 'aspect-[4/5]';
  return (
    <Link
      href={videoHref(video.videoId, locale, from)}
      className="group grid min-w-0 gap-2 rounded-md text-text no-underline focus-visible:ring-focus"
    >
      <span
        className={`relative block overflow-hidden rounded-md bg-reel-surface ${ratio ?? ''}`}
      >
        {poster ? (
          <img
            src={poster.src}
            srcSet={poster.srcSet}
            sizes={layout === 'strip' ? '160px' : '(min-width: 900px) 25vw, (min-width: 600px) 33vw, 50vw'}
            alt=""
            width={video.thumbnail?.width}
            height={video.thumbnail?.height}
            loading="lazy"
            decoding="async"
            className={`block w-full object-cover transition-transform duration-3 ease-standard group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${ratio ? 'h-full' : 'h-auto'}`}
          />
        ) : (
          <span aria-hidden="true" className="block size-full min-h-40" />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-touch place-items-center rounded-pill bg-reel-canvas/70 text-reel-text shadow-2">
            <NavIcon name="play" className="size-5" filled />
          </span>
        </span>
        <span className="absolute start-2 top-2 max-w-[calc(100%-1rem)]">
          <ProviderBadge provider={video.provider} />
        </span>
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-linear-to-t from-reel-canvas/85 to-transparent px-2 pt-6 pb-1.5 text-caption font-semibold text-reel-text">
          <NavIcon name="eye" className="size-4 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {t('views', {
              count: video.viewCount,
              views: compactViews(video.viewCount, locale),
            })}
          </span>
        </span>
      </span>
      <span className="line-clamp-2 min-w-0 px-0.5 text-small font-medium [overflow-wrap:anywhere] group-hover:underline">
        {caption}
      </span>
    </Link>
  );
}
