'use client';

import { useEffect, useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  NotificationPage,
  NotificationUnreadCount,
} from '@apnatown/shared/notifications';
import type { BrowserApi } from '../../shared/api/browser';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../shared/api/private-query';
import type { AccountScope } from '../../shared/api/query-keys';
import { normalizeFailure, retryTransientRead } from '../../shared/api/result';
import { useRealtimeInvalidation } from '../../shared/realtime/RealtimeProvider';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './api';
import { notificationKeys, type NotificationRole } from './keys';

export type FeedContext = {
  api: BrowserApi;
  scope: AccountScope;
  lifecycle: PrivateLifecycle;
  role: NotificationRole;
};
type Feed = InfiniteData<NotificationPage, string | null>;

/** Fallback poll (60 s while visible, plus focus refetch); the realtime
 * `notification` hint refreshes the badge and feed immediately. React Query
 * pauses `refetchInterval` for hidden tabs by default. */
const POLL_MS = 60_000;

export function useUnreadCount({ api, scope, lifecycle, role }: FeedContext) {
  const client = useQueryClient();
  useRealtimeInvalidation(['notification'], [notificationKeys.role(scope, role)]);
  const query = useQuery({
    ...privateQueryOptions(
      notificationKeys.unread(scope, role),
      scope.epoch,
      lifecycle,
      (signal) => getUnreadCount(api, role, signal),
    ),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: retryTransientRead,
  });
  // A rising count means new items: refresh the (possibly mounted) feed.
  const previous = useRef<number | undefined>(undefined);
  const count = query.data?.count;
  useEffect(() => {
    if (count === undefined) return;
    if (previous.current !== undefined && count > previous.current)
      void client.invalidateQueries({
        queryKey: notificationKeys.feed(scope, role),
      });
    previous.current = count;
  }, [client, count, scope, role]);
  return query;
}

export function useNotificationFeed({
  api,
  scope,
  lifecycle,
  role,
}: FeedContext) {
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      notificationKeys.feed(scope, role),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listNotifications(api, role, cursor, signal),
    ),
    retry: retryTransientRead,
  });
}

type Snapshot = { feed: Feed | undefined; unread: unknown };

async function snapshot(
  client: QueryClient,
  scope: AccountScope,
  role: NotificationRole,
): Promise<Snapshot> {
  const feedKey = notificationKeys.feed(scope, role);
  const unreadKey = notificationKeys.unread(scope, role);
  await client.cancelQueries({ queryKey: feedKey, exact: true });
  await client.cancelQueries({ queryKey: unreadKey, exact: true });
  return {
    feed: client.getQueryData<Feed>(feedKey),
    unread: client.getQueryData(unreadKey),
  };
}

function restore(
  client: QueryClient,
  scope: AccountScope,
  role: NotificationRole,
  previous: Snapshot | undefined,
) {
  if (!previous) return;
  client.setQueryData(notificationKeys.feed(scope, role), previous.feed);
  client.setQueryData(notificationKeys.unread(scope, role), previous.unread);
}

function markInFeed(feed: Feed | undefined, match: (id: string) => boolean) {
  if (!feed) return feed;
  return {
    ...feed,
    pages: feed.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        match(item.id) && !item.read ? { ...item, read: true } : item,
      ),
    })),
  };
}

/**
 * Optimistic single mark-read. Options-level callbacks (not `mutate` ones)
 * so the rollback still runs after the click has navigated away; every
 * write is fenced by the rendered session epoch.
 */
export function useMarkRead({ api, scope, lifecycle, role }: FeedContext) {
  const client = useQueryClient();
  const assertCurrent = () => lifecycle.assert(scope.epoch);
  return useMutation({
    mutationFn: async (id: string) => {
      assertCurrent();
      try {
        await markNotificationRead(api, id, assertCurrent);
      } catch (error) {
        throw normalizeFailure(error);
      }
    },
    onMutate: async (id) => {
      assertCurrent();
      const previous = await snapshot(client, scope, role);
      const wasUnread = previous.feed?.pages.some((page) =>
        page.items.some((item) => item.id === id && !item.read),
      );
      client.setQueryData<Feed>(notificationKeys.feed(scope, role), (feed) =>
        markInFeed(feed, (itemId) => itemId === id),
      );
      if (wasUnread)
        client.setQueryData<NotificationUnreadCount>(
          notificationKeys.unread(scope, role),
          (data) => data && { count: Math.max(0, data.count - 1) },
        );
      return previous;
    },
    onError: (_error, _id, previous) => {
      if (lifecycle.snapshot() === scope.epoch)
        restore(client, scope, role, previous);
    },
    onSettled: () => {
      if (lifecycle.snapshot() !== scope.epoch) return;
      void client.invalidateQueries({
        queryKey: notificationKeys.unread(scope, role),
      });
    },
    retry: false,
    gcTime: 0,
    networkMode: 'always',
  });
}

/** Optimistic "Mark all read" for the active role only. */
export function useMarkAllRead({ api, scope, lifecycle, role }: FeedContext) {
  const client = useQueryClient();
  const assertCurrent = () => lifecycle.assert(scope.epoch);
  return useMutation({
    mutationFn: async () => {
      assertCurrent();
      try {
        await markAllNotificationsRead(api, role, assertCurrent);
      } catch (error) {
        throw normalizeFailure(error);
      }
    },
    onMutate: async () => {
      assertCurrent();
      const previous = await snapshot(client, scope, role);
      client.setQueryData<Feed>(notificationKeys.feed(scope, role), (feed) =>
        markInFeed(feed, () => true),
      );
      client.setQueryData<NotificationUnreadCount>(
        notificationKeys.unread(scope, role),
        (data) => data && { count: 0 },
      );
      return previous;
    },
    onError: (_error, _input, previous) => {
      if (lifecycle.snapshot() === scope.epoch)
        restore(client, scope, role, previous);
    },
    onSettled: () => {
      if (lifecycle.snapshot() !== scope.epoch) return;
      void client.invalidateQueries({
        queryKey: notificationKeys.role(scope, role),
      });
    },
    retry: false,
    gcTime: 0,
    networkMode: 'always',
  });
}
