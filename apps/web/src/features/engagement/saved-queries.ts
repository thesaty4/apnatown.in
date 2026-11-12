'use client';

import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { SavedItem, SavedPage } from '@apnatown/shared';
import { queryKeys, type AccountScope } from '../../shared/api/query-keys';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { removeBusinessFollow, setVideoHeart } from './likes-api';
import { setServiceBookmark } from './service-bookmarks';

export function useRemoveSaved(scope: AccountScope) {
  const { api, lifecycle } = useSession();
  const client = useQueryClient();
  return usePrivateMutation(
    lifecycle,
    async (item: SavedItem, assertCurrent) => {
      if (item.targetType === 'business')
        await removeBusinessFollow(api, item.targetId, assertCurrent);
      else if (item.targetType === 'service')
        await setServiceBookmark(api, item.targetId, false, assertCurrent);
      else await setVideoHeart(api, item.targetId, false, assertCurrent);
      assertCurrent();
      const root = queryKeys.savedRoot(scope);
      const engagement = queryKeys.engagementStateRoot(scope, scope.epoch);
      await client.cancelQueries({ queryKey: root });
      assertCurrent();
      client.setQueriesData<InfiniteData<SavedPage>>(
        { queryKey: root },
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  items: page.items.filter(
                    (row) =>
                      row.targetType !== item.targetType ||
                      row.targetId !== item.targetId,
                  ),
                })),
              }
            : data,
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: root }),
        client.invalidateQueries({ queryKey: engagement }),
      ]);
      assertCurrent();
    },
  );
}
