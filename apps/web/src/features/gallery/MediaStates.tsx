'use client';

import { useTranslations } from 'next-intl';
import {
  ErrorState,
  NoPermissionState,
  NotFoundState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';

/** Decorative masonry/grid placeholders behind one announced status. */
export function MediaSkeleton({
  label,
  layout,
}: {
  label: string;
  layout: 'masonry' | 'grid' | 'strip';
}) {
  const heights = ['h-48', 'h-64', 'h-40', 'h-56', 'h-72', 'h-44', 'h-60', 'h-52'];
  const list =
    layout === 'masonry'
      ? 'columns-2 gap-3 tablet:columns-3 desktop:columns-4'
      : layout === 'grid'
        ? 'grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4'
        : 'flex gap-3 overflow-hidden';
  return (
    <div role="status" aria-busy="true" className="grid gap-3">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className={list}>
        {heights.slice(0, layout === 'strip' ? 4 : 8).map((height, index) => (
          <Skeleton
            key={index}
            label=""
            shape="block"
            aria-hidden="true"
            className={`rounded-md ${
              layout === 'masonry'
                ? `mb-3 break-inside-avoid ${height}`
                : layout === 'grid'
                  ? 'aspect-[4/5]'
                  : 'aspect-[4/5] w-40 shrink-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Initial-load failure for a public media read: offline, not public (404),
 * rate limited (no auto retry; the user may retry later), forbidden or a
 * generic error. Never rendered as an empty result.
 */
export function MediaLoadError({
  error,
  retrying,
  onRetry,
}: {
  error: unknown;
  retrying: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations('gallery.states');
  const online = useOnline();
  const code = failureCode(error);
  const retry = (
    <Button variant="outline" loading={retrying} onClick={onRetry}>
      {t('retry')}
    </Button>
  );
  if (!online)
    return (
      <OfflineState
        headingLevel="h2"
        icon="📡"
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={retry}
      />
    );
  if (code === 'BUSINESS_NOT_PUBLIC')
    return (
      <NotFoundState
        headingLevel="h2"
        icon="🔒"
        title={t('notPublicTitle')}
        message={t('notPublicMessage')}
        action={null}
      />
    );
  if (code === 'COMMON_FORBIDDEN')
    return (
      <NoPermissionState
        headingLevel="h2"
        icon="🔒"
        title={t('forbiddenTitle')}
        message={t('forbiddenMessage')}
        action={null}
      />
    );
  const limited = code === 'COMMON_RATE_LIMITED' || code === 'RATE_LIMITED';
  return (
    <ErrorState
      headingLevel="h2"
      icon="⚠️"
      title={t(limited ? 'rateLimitedTitle' : 'errorTitle')}
      message={t(limited ? 'rateLimitedMessage' : 'errorMessage')}
      action={retry}
    />
  );
}

/**
 * Keyset "Load more" fallback. A failed later page keeps earlier results
 * visible with an inline retry.
 */
export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
}) {
  const t = useTranslations('gallery.states');
  if (isFetchNextPageError)
    return (
      <p role="alert" className="m-0 flex flex-wrap items-center justify-center gap-3 text-small text-error">
        <span aria-hidden="true">⚠</span>
        <span className="[overflow-wrap:anywhere]">{t('moreError')}</span>
        <Button variant="outline" size="small" className="min-h-touch" onClick={onLoadMore}>
          {t('retry')}
        </Button>
      </p>
    );
  if (!hasNextPage) return null;
  return (
    <Button
      variant="outline"
      className="justify-self-center"
      loading={isFetchingNextPage}
      onClick={onLoadMore}
    >
      {t(isFetchingNextPage ? 'loadingMore' : 'loadMore')}
    </Button>
  );
}

/** Data stays visible offline; say so instead of silently going stale. */
export function OfflineNote() {
  const t = useTranslations('gallery.states');
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className="m-0 flex items-start gap-2 rounded-md border border-warning bg-warning-soft px-3 py-2 text-small text-text">
      <span aria-hidden="true">📡</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{t('offlineNote')}</span>
    </p>
  );
}
