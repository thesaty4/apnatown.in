'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FollowerAnnouncementCreate } from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { AccountScope } from '../../../shared/api/query-keys';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { privateQueryOptions } from '../../../shared/api/private-query';
import { retryTransientRead } from '../../../shared/api/result';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { businessKeys, useOwnerContext } from '../../businesses/queries';
import { createAnnouncement, getFollowerInsights } from './api';

export const followerKeys = {
  insights: (scope: AccountScope, kind: BusinessKind) =>
    [...businessKeys.all(scope, kind), 'followers'] as const,
};

export function useFollowerInsights(kind: BusinessKind, enabled: boolean) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope
        ? followerKeys.insights(scope, kind)
        : ['private', 'pending', 'business', kind, 'followers'],
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getFollowerInsights(api, kind, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

/** One Idempotency-Key per identical draft; history refreshes on success. */
export function useAnnounce(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (body: FollowerAnnouncementCreate, assertCurrent) => {
      const result = await createAnnouncement(
        api,
        kind,
        body,
        keys.for(JSON.stringify(body)),
        assertCurrent,
      );
      keys.clear();
      if (scope)
        await client.invalidateQueries({ queryKey: followerKeys.insights(scope, kind) });
      return result;
    },
  );
  return mutation;
}
