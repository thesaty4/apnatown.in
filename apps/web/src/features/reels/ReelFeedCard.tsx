'use client';

import { useEffect, useRef, type RefObject } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { VideoFeedItem } from '@apnatown/shared';
import { formatDistanceKm } from '@apnatown/shared';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { publicHref } from '../../shared/i18n/preferences';
import { EmbedCard } from './EmbedCard';
import { FollowButton } from '../engagement/FollowButton';
import { HeartButton } from '../engagement/HeartButton';
import { LikeButton } from '../engagement/LikeButton';
import { ShareSheet } from '../engagement/ShareSheet';

export function ReelFeedCard({
  item,
  active,
  nonce,
  scrollRoot,
  onVisible,
}: {
  item: VideoFeedItem;
  active: boolean;
  nonce: string;
  scrollRoot: RefObject<HTMLDivElement | null>;
  onVisible: (id: string) => void;
}) {
  const t = useTranslations('reels.feed');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const card = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = card.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.intersectionRatio >= 0.6) onVisible(item.id);
      },
      { root: scrollRoot.current, threshold: [0.6] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [item.id, onVisible, scrollRoot]);

  const name =
    locale === 'hi'
      ? (item.businessNameHi ?? item.businessNameEn)
      : (item.businessNameEn ?? item.businessNameHi);

  return (
    <article
      ref={card}
      id={`reel-${item.id}`}
      className="grid min-h-dvh snap-start content-center gap-4 px-page-gutter pb-24 pt-24"
      aria-label={name ?? t('businessUnavailable')}
    >
      <div className="mx-auto grid w-full max-w-page gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-h-[55dvh] place-items-center overflow-hidden rounded-lg bg-surface-2">
          <EmbedCard
            playback={item.playback}
            active={active}
            nonce={nonce}
            showTapToPlayWhenRestricted
          />
        </div>
        <aside className="grid content-center gap-4 rounded-lg bg-surface p-4 shadow-sh-1">
          <div className="grid gap-2">
            <p className="m-0 font-semibold [overflow-wrap:anywhere]">
              {name ?? t('businessUnavailable')}
            </p>
            {item.verified && (
              <p className="m-0 flex items-center gap-2 text-small text-text-2">
                <span aria-hidden="true">✓</span>
                {t('verified')}
              </p>
            )}
            {item.isOpen !== null && (
              <p className="m-0 flex items-center gap-2 text-small text-text-2">
                <span aria-hidden="true">{item.isOpen ? '●' : '○'}</span>
                {t(item.isOpen ? 'open' : 'closed')}
              </p>
            )}
            {item.distanceKm !== null && (
              <p className="m-0 text-small text-text-2">
                {t('distance', {
                  distance: formatDistanceKm(item.distanceKm, locale),
                })}
              </p>
            )}
          </div>
          {item.caption && (
            <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
              {item.caption}
            </p>
          )}
          {item.hashtags.length > 0 && (
            <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
              {item.hashtags.map((tag) => `#${tag}`).join(' ')}
            </p>
          )}
          <p className="m-0 text-small text-text-2">
            {t('views', { count: item.viewCount })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FollowButton videoId={item.id} businessId={item.businessId} />
            <LikeButton videoId={item.id} businessId={item.businessId} />
            <HeartButton videoId={item.id} businessId={item.businessId} />
            <ShareSheet videoId={item.id} />
            <Link
              className={buttonClassName}
              href={publicHref(`/videos/${item.id}`, locale)}
              aria-label={t('comments')}
            >
              {t('comments')}
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
