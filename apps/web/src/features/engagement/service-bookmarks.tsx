'use client';

import { useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  EngagementStateSchema,
  ServiceBookmarkResultSchema,
} from '@apnatown/shared';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { AccessState } from '../../shared/auth/AccessState';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { privateQueryOptions } from '../../shared/api/private-query';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { failureCode, unwrap } from '../../shared/api/result';
import type { BrowserApi } from '../../shared/api/browser';

export async function setServiceBookmark(
  api: BrowserApi,
  serviceId: string,
  bookmarked: boolean,
  assertCurrent: () => void,
) {
  const headers = await api.mutationHeaders();
  assertCurrent();
  const options = {
    params: {
      path: { targetType: 'service' as const, targetId: serviceId },
      header: headers,
    },
  };
  const result = bookmarked
    ? await api.PUT('/engagement/bookmarks/{targetType}/{targetId}', options)
    : await api.DELETE(
        '/engagement/bookmarks/{targetType}/{targetId}',
        options,
      );
  return unwrap(result, ServiceBookmarkResultSchema);
}

export function useServiceBookmarks(serviceIds: readonly string[]) {
  const { api, lifecycle, state, epoch } = useSession();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const customer =
    state.kind === 'ready' && state.data.roles.includes('customer');
  const ids = [...new Set(serviceIds)].sort();
  const batches: string[][] = [];
  for (let offset = 0; offset < ids.length; offset += 50)
    batches.push(ids.slice(offset, offset + 50));
  const queries = useQueries({
    queries: batches.map((batch) => ({
      ...privateQueryOptions(
        [
          ...queryKeys.engagementStateRoot(scope, epoch),
          'service-bookmarks',
          batch,
        ],
        epoch,
        lifecycle,
        async (signal) =>
          unwrap(
            await api.GET('/engagement/me/state', {
              params: {
                query: {
                  targets: batch.map((id) => `service:${id}`).join(','),
                },
              },
              signal,
            }),
            EngagementStateSchema,
          ),
      ),
      enabled: customer,
      staleTime: 30_000,
      retry: false,
    })),
  });
  return (serviceId: string) => {
    const query =
      queries[batches.findIndex((batch) => batch.includes(serviceId))];
    return {
      bookmarked:
        query?.data?.bookmarkedServiceIds.includes(serviceId) ?? false,
      pending: customer && (query?.isPending ?? true),
      failed: query?.isError ?? false,
      retry: () => {
        if (query) void query.refetch();
      },
    };
  };
}
type BookmarkState = ReturnType<ReturnType<typeof useServiceBookmarks>>;

export function ServiceBookmarkButton({
  serviceId,
  bookmark,
}: {
  serviceId: string;
  bookmark: BookmarkState;
}) {
  const t = useTranslations('engagement.bookmark');
  const { api, lifecycle, state, epoch } = useSession();
  const cache = useQueryClient();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const [loginPrompt, setLoginPrompt] = useState(false);
  const customer =
    state.kind === 'ready' && state.data.roles.includes('customer');
  const forbidden = state.kind === 'ready' && !customer;
  const mutation = usePrivateMutation(
    lifecycle,
    async (saved: boolean, assertCurrent) => {
      const result = await setServiceBookmark(
        api,
        serviceId,
        saved,
        assertCurrent,
      );
      assertCurrent();
      await Promise.all([
        cache.invalidateQueries({
          queryKey: queryKeys.engagementStateRoot(scope, epoch),
        }),
        ...(scope
          ? [cache.invalidateQueries({ queryKey: queryKeys.savedRoot(scope) })]
          : []),
      ]);
      assertCurrent();
      return result;
    },
  );
  return (
    <div className="grid gap-2">
      <Button
        variant={bookmark.bookmarked ? 'primary' : 'outline'}
        aria-pressed={bookmark.bookmarked}
        aria-label={t(bookmark.bookmarked ? 'saved' : 'save')}
        loading={
          mutation.isPending || bookmark.pending || state.kind === 'loading'
        }
        disabled={forbidden}
        onClick={() => {
          if (!customer) setLoginPrompt(true);
          else if (bookmark.failed) bookmark.retry();
          else void mutation.run(!bookmark.bookmarked);
        }}
      >
        <span aria-hidden="true">▣</span>
        {t(bookmark.failed ? 'retry' : bookmark.bookmarked ? 'saved' : 'save')}
      </Button>
      {forbidden && (
        <p className="text-small text-muted">{t('customerOnly')}</p>
      )}
      {bookmark.failed && (
        <p role="alert" className="text-small text-error">
          {t('readFailed')}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-small text-error">
          {t(
            failureCode(mutation.error) === 'ENGAGEMENT_TARGET_NOT_FOUND'
              ? 'unavailable'
              : 'failed',
          )}
        </p>
      )}
      {loginPrompt && !customer && !forbidden && (
        <AccessState guest guestMessage={t('loginPrompt')} />
      )}
    </div>
  );
}

export function ServiceBookmarkAction({ serviceId }: { serviceId: string }) {
  const bookmark = useServiceBookmarks([serviceId]);
  return (
    <ServiceBookmarkButton
      serviceId={serviceId}
      bookmark={bookmark(serviceId)}
    />
  );
}
