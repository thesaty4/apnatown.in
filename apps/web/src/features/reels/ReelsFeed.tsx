'use client';

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { VideoFeedPillSchema } from '@apnatown/shared';
import { useQuery } from '@tanstack/react-query';
import { publicHref } from '../../shared/i18n/preferences';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import {
  EmptyState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { categoriesOptions } from '../catalog';
import { failureCode } from '../../shared/api/result';
import { Failure } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { loginHref } from '../../shared/auth/return-to';
import {
  preciseBrowseLocation,
  useBrowseLocation,
} from '../geo/location-store';
import { useVideoFeed } from './queries';
import { ReelFeedCard } from './ReelFeedCard';

export function ReelsFeed({
  nonce,
  initialVideoId,
}: {
  nonce: string;
  initialVideoId?: string;
}) {
  const t = useTranslations('reels.feed');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { api, state } = useSession();
  const browseLocation = useBrowseLocation();
  const point = preciseBrowseLocation();
  const scrollRoot = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  const rawPill = searchParams.get('pill');
  const parsedPill = VideoFeedPillSchema.safeParse(rawPill);
  const category = searchParams.get('category') ?? undefined;
  const requestedAnchorId =
    initialVideoId ?? searchParams.get('video') ?? undefined;
  const snapshotId = searchParams.get('snapshotId') ?? undefined;
  const pill =
    parsedPill.success && (parsedPill.data !== 'category' || category)
      ? parsedPill.data
      : 'for_you';
  const categories = useQuery(categoriesOptions(api));
  const feed = useVideoFeed(
    { pill, ...(pill === 'category' && category ? { category } : {}) },
    requestedAnchorId,
    snapshotId,
    point,
    browseLocation.revision,
  );
  const items = useMemo(
    () => feed.query.data?.pages.flatMap((page) => page.items) ?? [],
    [feed.query.data],
  );
  const activeId = initialVideoId ?? searchParams.get('video');
  const firstPage = feed.query.data?.pages[0];
  const errorCode = feed.query.isError
    ? failureCode(feed.query.error)
    : undefined;

  const setVisible = useCallback(
    (id: string) => {
      if (activeRef.current === id) return;
      activeRef.current = id;
      const params = new URLSearchParams();
      params.set('pill', pill);
      if (pill === 'category' && category) params.set('category', category);
      const currentSnapshotId =
        firstPage?.snapshotId ?? searchParams.get('snapshotId');
      if (currentSnapshotId) params.set('snapshotId', currentSnapshotId);
      router.replace(
        `${publicHref(`/videos/${id}`, locale)}?${params.toString()}`,
        { scroll: false },
      );
    },
    [category, firstPage?.snapshotId, locale, pill, router, searchParams],
  );

  const selectFilter = (nextPill: string, nextCategory?: string) => {
    activeRef.current = null;
    const params = new URLSearchParams({ pill: nextPill });
    if (nextCategory) params.set('category', nextCategory);
    const currentSnapshotId =
      firstPage?.snapshotId ?? searchParams.get('snapshotId');
    if (currentSnapshotId) params.set('snapshotId', currentSnapshotId);
    router.push(`${publicHref('/videos', locale)}?${params.toString()}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (!firstPage) return;
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (params.get('snapshotId') !== firstPage.snapshotId) {
      params.set('snapshotId', firstPage.snapshotId);
      changed = true;
    }
    if (params.get('pill') !== firstPage.effectiveFilter) {
      params.set('pill', firstPage.effectiveFilter);
      changed = true;
    }
    if (firstPage.effectiveFilter !== 'category' && params.has('category')) {
      params.delete('category');
      changed = true;
    }
    if (changed) {
      const path = initialVideoId
        ? `/videos/${initialVideoId}`
        : pathname.replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/videos';
      router.replace(`${publicHref(path, locale)}?${params.toString()}`, {
        scroll: false,
      });
    }
  }, [firstPage, initialVideoId, locale, pathname, router, searchParams]);

  const restartFeed = () => {
    const params = new URLSearchParams({ pill });
    if (pill === 'category' && category) params.set('category', category);
    const anchorId = activeId ?? requestedAnchorId;
    const path = anchorId ? `/videos/${anchorId}` : '/videos';
    router.replace(`${publicHref(path, locale)}?${params.toString()}`, {
      scroll: false,
    });
  };

  const fetchNextPage = feed.query.fetchNextPage;
  const hasNextPage = feed.query.hasNextPage;
  const isFetchingNextPage = feed.query.isFetchingNextPage;
  const isFetchNextPageError = feed.query.isFetchNextPageError;
  const nextPageError = feed.query.error;

  useEffect(() => {
    if (!activeId) return;
    const target = document.getElementById(`reel-${activeId}`);
    if (target) {
      target.scrollIntoView({ block: 'start' });
      activeRef.current = activeId;
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
      return;
    }
    if (!hasNextPage && !isFetchingNextPage) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('video');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    activeId,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    items.length,
    pathname,
    router,
    searchParams,
  ]);

  const closeHref = publicHref('/', locale);
  const feedExpired = errorCode === 'MEDIA_FEED_EXPIRED';

  return (
    <section
      aria-label={t('title')}
      className="fixed inset-0 z-30 grid bg-bg text-text"
    >
      <header className="absolute inset-x-0 top-0 z-10 grid gap-2 bg-bg/95 px-page-gutter py-2 shadow-sh-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 text-h3">{t('title')}</h1>
          <Link className={buttonClassName} href={closeHref}>
            {t('close')}
          </Link>
        </div>
        <nav
          aria-label={t('category')}
          role="group"
          className="flex gap-2 overflow-x-auto py-1"
        >
          <FilterButton
            selected={pill === 'for_you'}
            onClick={() => selectFilter('for_you')}
          >
            {t('forYou')}
          </FilterButton>
          <FilterButton
            selected={pill === 'following'}
            onClick={() => selectFilter('following')}
          >
            {t('following')}
          </FilterButton>
          <FilterButton
            selected={pill === 'nearby'}
            onClick={() => selectFilter('nearby')}
          >
            {t('nearby')}
          </FilterButton>
          <Button
            type="button"
            variant="outline"
            disabled
            title={t('offersUnavailable')}
          >
            {t('offers')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            title={t('productsUnavailable')}
          >
            {t('products')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            title={t('servicesUnavailable')}
          >
            {t('services')}
          </Button>
        </nav>
        {categories.isError && (
          <p role="alert" className="m-0 text-small text-error">
            {t('categoriesUnavailable')}
          </p>
        )}
        {categories.data?.items.length ? (
          <nav
            aria-label={t('category')}
            role="group"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {categories.data.items.map((item) => (
              <FilterButton
                key={item.id}
                selected={pill === 'category' && category === item.slug}
                onClick={() => selectFilter('category', item.slug)}
              >
                {locale === 'hi' ? item.nameHi : item.nameEn}
              </FilterButton>
            ))}
          </nav>
        ) : null}
        <p id="reel-filter-availability" className="sr-only">
          {t('dependentFiltersUnavailable')}
        </p>
      </header>

      <div
        ref={scrollRoot}
        className="h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain"
      >
        {pill === 'nearby' && !point ? (
          <EmptyState
            className="mx-auto min-h-dvh max-w-prose content-center pt-32"
            title={t('emptyNearbyTitle')}
            message={t('nearbyRequiresLocation')}
            action={
              <Button onClick={() => selectFilter('for_you')}>
                {t('tryForYou')}
              </Button>
            }
          />
        ) : feed.query.isPending ? (
          <div className="grid min-h-dvh place-items-center pt-24">
            <Skeleton label={t('loading')} />
          </div>
        ) : feed.query.isError ? (
          feedExpired ? (
            <EmptyState
              className="mx-auto min-h-dvh max-w-prose content-center pt-32"
              title={t('feedExpired')}
              message={t('feedExpired')}
              action={<Button onClick={restartFeed}>{t('startFresh')}</Button>}
            />
          ) : errorCode === 'MEDIA_VIDEO_NOT_PUBLISHED' ? (
            <EmptyState
              className="mx-auto min-h-dvh max-w-prose content-center pt-32"
              title={t('videoUnavailableTitle')}
              message={t('videoUnavailableMessage')}
              action={
                <Link
                  className={buttonClassName}
                  href={publicHref('/videos', locale)}
                >
                  {t('browseVideos')}
                </Link>
              }
            />
          ) : errorCode === 'COMMON_FORBIDDEN' ? (
            <NoPermissionState
              className="mx-auto min-h-dvh max-w-prose content-center pt-32"
              title={t('title')}
              message={t('emptyMessage')}
              action={
                <Button onClick={() => void feed.query.refetch()}>
                  {t('retry')}
                </Button>
              }
            />
          ) : (
            <div className="mx-auto grid min-h-dvh max-w-prose content-center pt-32">
              <Failure
                code={errorCode ?? 'COMMON_INTERNAL_ERROR'}
                retry={() => void feed.query.refetch()}
                retryDisabled={feed.query.isFetching}
              />
            </div>
          )
        ) : items.length === 0 ? (
          <EmptyState
            className="mx-auto min-h-dvh max-w-prose content-center pt-32"
            title={
              pill === 'following'
                ? t('emptyFollowingTitle')
                : pill === 'nearby'
                  ? t('emptyNearbyTitle')
                  : t('emptyTitle')
            }
            message={
              pill === 'following'
                ? t('emptyFollowingMessage')
                : pill === 'nearby'
                  ? t('emptyNearbyMessage')
                  : t('emptyMessage')
            }
            action={
              pill === 'following' && state.kind !== 'ready' ? (
                <Link
                  className={buttonClassName}
                  href={loginHref(
                    locale,
                    `${publicHref('/videos', locale)}?pill=following`,
                  )}
                >
                  {t('signIn')}
                </Link>
              ) : pill === 'following' || pill === 'nearby' ? (
                <Button onClick={() => selectFilter('for_you')}>
                  {t('tryForYou')}
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {items.map((item, index) => (
              <ReelFeedCard
                key={item.id}
                item={item}
                active={activeId === item.id || (!activeId && index === 0)}
                nonce={nonce}
                scrollRoot={scrollRoot}
                onVisible={setVisible}
              />
            ))}
            <div className="grid min-h-24 place-items-center p-4">
              {feed.query.hasNextPage ? (
                <Button
                  loading={feed.query.isFetchingNextPage}
                  disabled={feed.query.isFetchingNextPage}
                  onClick={() => void feed.query.fetchNextPage()}
                >
                  {t('loadMore')}
                </Button>
              ) : null}
              {isFetchNextPageError && (
                <Failure
                  code={failureCode(nextPageError)}
                  retry={() => void fetchNextPage()}
                  retryDisabled={isFetchingNextPage}
                />
              )}
            </div>
          </>
        )}
      </div>
      <p className="pointer-events-none absolute bottom-0 z-10 m-0 bg-bg/95 px-page-gutter py-2 text-small text-text-2">
        {t('dependentFiltersUnavailable')}
      </p>
    </section>
  );
}

function FilterButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? 'primary' : 'outline'}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
