'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VideoFeedPillSchema, type VideoFeedQuery } from '@apnatown/shared';
import { publicHref } from '../../shared/i18n/preferences';
import { useSession } from '../../shared/auth/SessionProvider';
import { categoriesOptions } from '../catalog';
import {
  preciseBrowseLocation,
  useBrowseLocation,
} from '../geo/location-store';
import { useVideoFeed } from './queries';

type Pill = VideoFeedQuery['pill'];

type FeedSession = {
  pill: Pill;
  category: string | undefined;
  snapshotId: string | undefined;
  anchorId: string | undefined;
};

function feedSearch(pill: Pill, category?: string, snapshotId?: string) {
  const params = new URLSearchParams({ pill });
  if (pill === 'category' && category) params.set('category', category);
  if (snapshotId) params.set('snapshotId', snapshotId);
  return params.toString();
}

/**
 * Feed session for S-CUST-21. The URL mirrors pill, snapshot and the active
 * video through `history.replaceState` (prototype `rtab`/`act`), so scrolling
 * and pill changes never remount the feed or refetch a frozen snapshot.
 */
export function useReelsFeed(initialVideoId: string | undefined) {
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { api } = useSession();
  const browseLocation = useBrowseLocation();
  const point = preciseBrowseLocation();
  const [session, setSession] = useState<FeedSession>(() => {
    const parsed = VideoFeedPillSchema.safeParse(searchParams.get('pill'));
    const category = searchParams.get('category') ?? undefined;
    const pill =
      parsed.success && (parsed.data !== 'category' || category)
        ? parsed.data
        : 'for_you';
    return {
      pill,
      category: pill === 'category' ? category : undefined,
      snapshotId: searchParams.get('snapshotId') ?? undefined,
      anchorId: initialVideoId ?? searchParams.get('video') ?? undefined,
    };
  });
  const [visibleId, setVisibleId] = useState<string>();
  const [anchorMissing, setAnchorMissing] = useState(false);
  const anchoredFor = useRef<FeedSession | null>(null);
  const categories = useQuery(categoriesOptions(api));
  const feed = useVideoFeed(
    {
      pill: session.pill,
      ...(session.category ? { category: session.category } : {}),
    },
    session.anchorId,
    session.snapshotId,
    point,
    browseLocation.revision,
  );
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = feed.query;
  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const firstPage = data?.pages[0];
  const pill = firstPage?.effectiveFilter ?? session.pill;
  const category = pill === 'category' ? session.category : undefined;
  const snapshotId = firstPage?.snapshotId ?? session.snapshotId;

  const activeId = useMemo(() => {
    const loaded = (id: string | undefined) =>
      id !== undefined && items.some((item) => item.id === id);
    if (loaded(visibleId)) return visibleId;
    if (loaded(session.anchorId)) return session.anchorId;
    if (session.anchorId && !anchorMissing) return undefined;
    return items[0]?.id;
  }, [anchorMissing, items, session.anchorId, visibleId]);
  const activeIndex = items.findIndex((item) => item.id === activeId);

  const writeUrl = useCallback(
    (videoId: string | undefined, search: string) => {
      const path = videoId ? `/videos/${videoId}` : '/videos';
      window.history.replaceState(
        null,
        '',
        `${publicHref(path, locale)}?${search}`,
      );
    },
    [locale],
  );

  const startSession = (next: FeedSession) => {
    anchoredFor.current = null;
    setVisibleId(undefined);
    setAnchorMissing(false);
    setSession(next);
    writeUrl(next.anchorId, feedSearch(next.pill, next.category, next.snapshotId));
  };

  const selectFilter = (nextPill: Pill, nextCategory?: string) =>
    startSession({
      pill: nextPill,
      category: nextPill === 'category' ? nextCategory : undefined,
      snapshotId,
      anchorId: undefined,
    });

  /** Explicit TTL restart: a new snapshot anchored on the current video. */
  const restartFeed = () => {
    // Drop every cached page of the expired snapshot for this viewer.
    queryClient.removeQueries({ queryKey: feed.key.slice(0, 4) });
    startSession({
      ...session,
      pill,
      category,
      snapshotId: undefined,
      anchorId: activeId ?? session.anchorId,
    });
  };

  const browseAll = () =>
    startSession({
      pill: 'for_you',
      category: undefined,
      snapshotId: undefined,
      anchorId: undefined,
    });

  // Mirror the server's snapshot and effective filter (out-of-filter deep
  // links fall back to For You) without changing the query key.
  useEffect(() => {
    if (firstPage) writeUrl(activeId, feedSearch(pill, category, snapshotId));
  }, [activeId, category, firstPage, pill, snapshotId, writeUrl]);

  useEffect(() => {
    const anchorId = session.anchorId;
    if (!anchorId || anchorMissing || anchoredFor.current === session) return;
    if (!items.length) return;
    const target = document.getElementById(`reel-${anchorId}`);
    if (target) {
      target.scrollIntoView({ block: 'start' });
      anchoredFor.current = session;
    } else if (hasNextPage) {
      if (!isFetchingNextPage) void fetchNextPage();
    } else if (!isFetchingNextPage) {
      setAnchorMissing(true);
    }
  }, [
    anchorMissing,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    items,
    session,
  ]);

  const isFetchNextPageError = feed.query.isFetchNextPageError;
  useEffect(() => {
    if (activeIndex < 0 || activeIndex < items.length - 3) return;
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError)
      void fetchNextPage();
  }, [
    activeIndex,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    items.length,
  ]);

  return {
    feed: feed.query,
    items,
    activeId,
    activeIndex,
    pill,
    category,
    point,
    categories,
    setVisible: setVisibleId,
    selectFilter,
    restartFeed,
    browseAll,
  };
}
