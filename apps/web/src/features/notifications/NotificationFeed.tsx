'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import type { NotificationItem as Item } from '@apnatown/shared/notifications';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { NotificationItem, useNow } from './NotificationItem';
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationFeed,
  type FeedContext,
} from './queries';

const denied = new Set(['COMMON_FORBIDDEN', 'AUTH_FORBIDDEN']);

/**
 * Role-scoped notification feed (S-CUST-22 / S-VEND-17 / S-PROV-15 and the
 * admin/rider bell sheet). Keyset "Load more", optimistic read state and all
 * five UX states plus offline.
 */
export function NotificationFeed({
  context,
  headingLevel = 'h1',
  showHeading = true,
  preferencesHref,
}: {
  context: FeedContext;
  headingLevel?: 'h1' | 'h2';
  /** False inside a sheet whose title already names the feed. */
  showHeading?: boolean;
  /** Customer only: prototype "Notification preferences" shortcut. */
  preferencesHref?: string;
}) {
  const t = useTranslations('notifications.feed');
  const online = useOnline();
  const now = useNow();
  const feed = useNotificationFeed(context);
  const markRead = useMarkRead(context);
  const markAll = useMarkAllRead(context);
  const items = feed.data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnread = items.some((item) => !item.read);
  const Heading = headingLevel;
  const stateLevel = showHeading ? 'h2' : headingLevel;

  const open = (item: Item) => {
    if (!item.read) markRead.mutate(item.id);
  };

  let body;
  if (feed.isPending) {
    body =
      feed.fetchStatus === 'paused' || !online ? (
        <OfflineState
          headingLevel={stateLevel}
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={null}
        />
      ) : (
        <Skeleton label={t('loading')} className="h-48" />
      );
  } else if (feed.isError && !feed.data) {
    const code = failureCode(feed.error);
    const retry = (
      <Button disabled={feed.isFetching} onClick={() => void feed.refetch()}>
        {t('retry')}
      </Button>
    );
    body = denied.has(code) ? (
      <NoPermissionState
        headingLevel={stateLevel}
        title={t('forbiddenTitle')}
        message={t('forbiddenMessage')}
        action={null}
      />
    ) : !online ? (
      <OfflineState
        headingLevel={stateLevel}
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={retry}
      />
    ) : (
      <ErrorState
        headingLevel={stateLevel}
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={retry}
      />
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        headingLevel={stateLevel}
        icon="🔔"
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={null}
      />
    );
  } else {
    body = (
      <>
        <ul
          className="m-0 grid list-none gap-2 p-0"
          aria-busy={feed.isFetching}
        >
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <NotificationItem item={item} now={now} onOpen={open} />
            </li>
          ))}
        </ul>
        {feed.isFetchNextPageError && (
          <p role="alert" className="m-0 text-small text-error">
            {t('loadMoreError')}
          </p>
        )}
        {feed.hasNextPage && (
          <Button
            variant="outline"
            className="justify-self-center"
            loading={feed.isFetchingNextPage}
            disabled={feed.isFetchingNextPage || !online}
            onClick={() => void feed.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        )}
      </>
    );
  }

  return (
    <section
      className="grid min-w-0 gap-4"
      aria-label={showHeading ? undefined : t('title')}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        {showHeading && (
          <Heading className="m-0 text-h1 [overflow-wrap:anywhere]">
            {t('title')}
          </Heading>
        )}
        <Button
          variant="text"
          size="small"
          className="ms-auto"
          disabled={!hasUnread || markAll.isPending || !online}
          loading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          {t('markAllRead')}
        </Button>
      </div>
      {preferencesHref && (
        <Link
          href={preferencesHref}
          className={`${buttonVariantClassName('ghost', 'small')} justify-self-start`}
        >
          <NavIcon name="sliders" className="size-4" />
          {t('preferences')}
        </Link>
      )}
      <p
        role="status"
        aria-live="polite"
        className="m-0 empty:hidden text-small text-error"
      >
        {markAll.isError
          ? t('markAllError')
          : markRead.isError
            ? t('markReadError')
            : ''}
      </p>
      {body}
    </section>
  );
}
