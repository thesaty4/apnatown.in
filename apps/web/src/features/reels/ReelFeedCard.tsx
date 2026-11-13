'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { VideoFeedItem } from '@apnatown/shared';
import { EmbedCard } from './EmbedCard';
import type { ReelGate } from './ReelGateSheet';
import { ReelInfo, reelBusinessName } from './ReelInfo';
import { ReelRail } from './ReelRail';

/** Prototype `.rv`: one full-height snap slide with shade, rail and info. */
export function ReelFeedCard({
  item,
  active,
  nonce,
  scrollRoot,
  onVisible,
  onGate,
  onComments,
  onMore,
}: {
  item: VideoFeedItem;
  active: boolean;
  nonce: string;
  scrollRoot: RefObject<HTMLDivElement | null>;
  onVisible: (id: string) => void;
  onGate: (gate: ReelGate) => void;
  onComments: (item: VideoFeedItem) => void;
  onMore: (item: VideoFeedItem) => void;
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

  return (
    <article
      ref={card}
      id={`reel-${item.id}`}
      aria-label={reelBusinessName(item, locale) ?? t('businessUnavailable')}
      aria-current={active || undefined}
      className="relative h-full snap-start snap-always overflow-hidden bg-reel-surface"
    >
      <EmbedCard
        playback={item.playback}
        active={active}
        nonce={nonce}
        showTapToPlayWhenRestricted
        variant="reel"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-linear-to-b from-transparent to-reel-canvas/85"
      />
      <ReelRail
        item={item}
        onGate={onGate}
        onComments={() => onComments(item)}
        onMore={() => onMore(item)}
      />
      <ReelInfo item={item} onGate={onGate} />
    </article>
  );
}
