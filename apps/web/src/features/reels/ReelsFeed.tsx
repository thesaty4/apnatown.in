'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { VideoFeedItem, VideoFeedQuery } from '@apnatown/shared';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { CommentsPanel } from '../engagement';
import { ReelFeedCard } from './ReelFeedCard';
import {
  ReelFeedStatus,
  ReelLoadingSlide,
  type ReelFeedProblem,
} from './ReelFeedStates';
import { ReelGateSheet, type ReelGate } from './ReelGateSheet';
import { ReelMoreSheet } from './ReelMoreSheet';
import { ReelPills, type ReelPill } from './ReelPills';
import { ReelSidePanel } from './ReelSidePanel';
import { VideoReportSheet } from './VideoReportSheet';
import { reelFocusInset, reelTopIconClassName } from './reel-styles';
import { useReelsFeed } from './use-reels-feed';

function problemFor(
  code: string,
  online: boolean,
  retrying: boolean,
): ReelFeedProblem {
  if (!online) return { kind: 'offline' };
  if (code === 'MEDIA_FEED_EXPIRED') return { kind: 'expired' };
  if (code === 'MEDIA_VIDEO_NOT_PUBLISHED') return { kind: 'unpublished' };
  if (code === 'COMMON_FORBIDDEN') return { kind: 'forbidden' };
  return { kind: 'failed', code, retrying };
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest('input, textarea, select, dialog') !== null)
  );
}

/** S-CUST-21: prototype `.reels` immersive vertical feed (js25). */
export function ReelsFeed({
  nonce,
  initialVideoId,
}: {
  nonce: string;
  initialVideoId?: string;
}) {
  const t = useTranslations('reels.feed');
  const copy = useTranslations('common.copy');
  const report = useTranslations('reels.viewer.report');
  const comments = useTranslations('engagement.comments');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const router = useRouter();
  const feedId = useId();
  const online = useOnline();
  const { state } = useSession();
  const reels = useReelsFeed(initialVideoId);
  const { feed, items, activeId, activeIndex, pill, category } = reels;
  const scrollRoot = useRef<HTMLDivElement>(null);
  const [gate, setGate] = useState<ReelGate | null>(null);
  const [commentsItem, setCommentsItem] = useState<VideoFeedItem>();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [moreItem, setMoreItem] = useState<VideoFeedItem | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!reported) return;
    const timer = window.setTimeout(() => setReported(false), 4000);
    return () => window.clearTimeout(timer);
  }, [reported]);

  const step = useCallback((direction: 1 | -1) => {
    const root = scrollRoot.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    root.scrollBy({
      top: direction * root.clientHeight,
      behavior: reduce.matches ? 'auto' : 'smooth',
    });
  }, []);

  // Prototype `rback`: leave the feed the way the user entered it.
  const close = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push(publicHref('/', locale));
  }, [locale, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey) return;
      if (event.metaKey || isTypingTarget(event.target)) return;
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'ArrowDown' || event.key === 'j') step(1);
      else if (event.key === 'ArrowUp' || event.key === 'k') step(-1);
      else if (event.key === 'Escape') close();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, step]);

  const selectFilter = (next: VideoFeedQuery['pill'], slug?: string) => {
    scrollRoot.current?.scrollTo({ top: 0 });
    reels.selectFilter(next, slug);
  };
  const openComments = useCallback((item: VideoFeedItem) => {
    setCommentsItem(item);
    setCommentsOpen(true);
  }, []);
  const openMore = useCallback((item: VideoFeedItem) => {
    setMoreItem(item);
    setMoreOpen(true);
  }, []);

  const pills: ReelPill[] = [
    ...(['for_you', 'following', 'nearby'] as const).map((key) => ({
      key,
      label: t(key === 'for_you' ? 'forYou' : key),
      selected: pill === key,
      onSelect: () => selectFilter(key),
    })),
    ...(['offers', 'products', 'services'] as const).map((key) => ({
      key,
      label: t(key),
      selected: false,
      unavailable: t(`${key}Unavailable`),
      onSelect: () => undefined,
    })),
    ...(reels.categories.data?.items ?? []).map((item) => ({
      key: `category:${item.slug}`,
      label: locale === 'hi' ? item.nameHi : item.nameEn,
      selected: pill === 'category' && category === item.slug,
      onSelect: () => selectFilter('category', item.slug),
    })),
  ];

  const statusActions = {
    onRestart: reels.restartFeed,
    onBrowse: reels.browseAll,
    onForYou: () => selectFilter('for_you'),
  };
  const firstPageProblem: ReelFeedProblem | undefined =
    pill === 'nearby' && !reels.point
      ? { kind: 'nearbyNeedsLocation' }
      : feed.isPending
        ? undefined
        : feed.isError && items.length === 0
          ? problemFor(failureCode(feed.error), online, feed.isFetching)
          : items.length === 0
            ? { kind: 'empty', pill, signedIn: state.kind === 'ready' }
            : undefined;
  const trailing =
    items.length > 0 &&
    (feed.hasNextPage || feed.isFetchingNextPage || feed.isFetchNextPageError);
  const atEnd = activeIndex >= items.length - 1 && !feed.hasNextPage;

  return (
    <section
      aria-label={t('title')}
      className="fixed inset-0 z-120 flex flex-col bg-reel-canvas pt-sat pb-sab text-reel-text"
    >
      <h1 className="sr-only">{t('title')}</h1>
      <div className="z-3 flex items-start gap-1.5 bg-linear-to-b from-reel-canvas/70 to-transparent px-2.5 py-2">
        <button
          type="button"
          aria-label={copy('back')}
          className={reelTopIconClassName}
          onClick={close}
        >
          <NavIcon name="cl" className="size-5.5" />
        </button>
        <div className="grid min-w-0 flex-1 gap-1 self-center">
          <ReelPills pills={pills} controls={feedId} />
          {reels.categories.isError && (
            <p role="alert" className="m-0 text-small text-reel-text-2">
              {t('categoriesUnavailable')}
            </p>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 justify-center gap-4">
        <div
          ref={scrollRoot}
          id={feedId}
          role="tabpanel"
          tabIndex={0}
          aria-label={t('feedLabel')}
          className={`h-full w-full max-w-reel-feed snap-y snap-mandatory overflow-y-auto overscroll-contain bg-reel-surface [scrollbar-width:none] desktop:my-3 desktop:h-[calc(100%-24px)] desktop:rounded-reel-frame [&::-webkit-scrollbar]:hidden ${reelFocusInset}`}
        >
          {firstPageProblem ? (
            <ReelFeedStatus
              problem={firstPageProblem}
              onRetry={() => void feed.refetch()}
              {...statusActions}
            />
          ) : feed.isPending ? (
            <ReelLoadingSlide />
          ) : (
            <>
              {items.map((item) => (
                <ReelFeedCard
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  nonce={nonce}
                  scrollRoot={scrollRoot}
                  onVisible={reels.setVisible}
                  onGate={setGate}
                  onComments={openComments}
                  onMore={openMore}
                />
              ))}
              {trailing && (
                <div className="h-full snap-start snap-always">
                  {feed.isFetchNextPageError ? (
                    <ReelFeedStatus
                      problem={problemFor(
                        failureCode(feed.error),
                        online,
                        feed.isFetchingNextPage,
                      )}
                      onRetry={() => void feed.fetchNextPage()}
                      {...statusActions}
                    />
                  ) : (
                    <ReelLoadingSlide />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {items.length > 1 && (
          <div className="hidden flex-col justify-center gap-3 desktop:flex">
            <button
              type="button"
              aria-label={t('previous')}
              aria-controls={feedId}
              aria-disabled={activeIndex <= 0 || undefined}
              className={reelTopIconClassName}
              onClick={() => activeIndex > 0 && step(-1)}
            >
              <NavIcon name="cu" className="size-5.5" />
            </button>
            <button
              type="button"
              aria-label={t('next')}
              aria-controls={feedId}
              aria-disabled={atEnd || undefined}
              className={reelTopIconClassName}
              onClick={() => !atEnd && step(1)}
            >
              <NavIcon name="cd" className="size-5.5" />
            </button>
          </div>
        )}

        <ReelSidePanel
          item={items.find((item) => item.id === activeId)}
          onComments={openComments}
        />
      </div>

      <p
        role="status"
        className={
          reported
            ? 'pointer-events-none absolute inset-x-3.5 bottom-[calc(var(--at-tab-h)+var(--at-sab)+16px)] z-4 mx-auto w-fit max-w-reel-feed rounded-md bg-text px-4 py-3 text-product-title text-bg shadow-3 desktop:bottom-6'
            : 'sr-only'
        }
      >
        {reported ? report('success') : ''}
      </p>

      {commentsItem && (
        <Sheet
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          title={comments('title')}
          closeLabel={copy('close')}
        >
          <CommentsPanel videoId={commentsItem.id} showHeading={false} />
        </Sheet>
      )}
      <ReelMoreSheet
        item={moreItem}
        open={moreOpen}
        onOpenChange={setMoreOpen}
        onGate={setGate}
        onReport={() => {
          setMoreOpen(false);
          setReportOpen(true);
        }}
      />
      {moreItem && (
        <VideoReportSheet
          key={moreItem.id}
          videoId={moreItem.id}
          open={reportOpen}
          onOpenChange={setReportOpen}
          onReported={() => setReported(true)}
        />
      )}
      <ReelGateSheet gate={gate} onClose={() => setGate(null)} />
    </section>
  );
}
