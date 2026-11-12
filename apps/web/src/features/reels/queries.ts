'use client';

import { queryOptions, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type {
  CreateVideo,
  CreateVideoReport,
  VideoFeedQuery,
} from '@apnatown/shared';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { privateInfiniteQueryOptions } from '../../shared/api/private-query';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import {
  createOwnerVideo,
  createVideoReport,
  getPublicVideo,
  getVideoFeed,
  listOwnerVideos,
} from './api';

function useOwnerContext() {
  const { api, lifecycle, state, epoch } = useSession();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  return { api, lifecycle, scope };
}

export function useOwnerVideos(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const key = scope
    ? queryKeys.mediaVideos(scope, kind)
    : ['private', 'pending', 'media', 'videos', kind];
  const query = useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      key,
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listOwnerVideos(api, kind, cursor, signal),
    ),
    enabled: scope !== null,
  });
  return { query, api, lifecycle, scope };
}

export function useCreateOwnerVideo(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const queryKey = scope
    ? queryKeys.mediaVideos(scope, kind)
    : ['private', 'pending', 'media', 'videos', kind];
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { body: CreateVideo; key: string },
      assertCurrent,
    ) => {
      const output = await createOwnerVideo(api, kind, input.body, {
        key: input.key,
        assertCurrent,
      });
      assertCurrent();
      await client.invalidateQueries({ queryKey });
      return output;
    },
  );
  return {
    mutation,
    submit(body: CreateVideo, onSuccess: () => void) {
      const key = keys.for(JSON.stringify(body));
      void mutation.run({ body, key }, () => {
        keys.clear();
        onSuccess();
      });
    },
  };
}

export function publicVideoOptions(api: ReturnType<typeof useSession>['api'], id: string) {
  return queryOptions({
    queryKey: queryKeys.mediaVideo(id),
    queryFn: ({ signal }) => getPublicVideo(api, id, signal),
    staleTime: 30_000,
    retry: false,
  });
}

export function usePublicVideo(id: string) {
  const { api } = useSession();
  return useQuery(publicVideoOptions(api, id));
}

type FeedPageParam = { snapshotId?: string; cursor?: string };

export function useVideoFeed(
  input: Pick<VideoFeedQuery, 'pill' | 'category'>,
  startVideoId: string | undefined,
  snapshotId: string | undefined,
  location: { lat: number; lng: number } | null,
  locationRevision: number,
) {
  const { api, state, epoch } = useSession();
  const viewer =
    state.kind === 'ready'
      ? `user:${state.data.userId}:${epoch}`
      : `guest:${epoch}`;
  const key = queryKeys.videoFeed(
    viewer,
    input.pill,
    input.category,
    locationRevision,
    snapshotId ?? startVideoId,
  );
  const initialPageParam: FeedPageParam = snapshotId ? { snapshotId } : {};
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam,
    queryFn: ({ signal, pageParam }) =>
      getVideoFeed(
        api,
        {
          ...input,
          ...(input.pill === 'nearby' && location
            ? { lat: location.lat, lng: location.lng }
            : {}),
          ...(!pageParam.cursor && startVideoId ? { startVideoId } : {}),
          ...pageParam,
          limit: 10,
        },
        signal,
      ),
    getNextPageParam: (page) =>
      page.nextCursor
        ? { snapshotId: page.snapshotId, cursor: page.nextCursor }
        : undefined,
    enabled: input.pill !== 'nearby' || location !== null,
    retry: false,
    staleTime: 30_000,
  });
  return { query, key };
}

export function useReportVideo(id: string) {
  const { api, lifecycle } = useSession();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { body: CreateVideoReport; key: string },
      assertCurrent,
    ) => {
      const result = await createVideoReport(api, id, input.body, {
        key: input.key,
        assertCurrent,
      });
      assertCurrent();
      return result;
    },
  );
  return {
    mutation,
    submit(body: CreateVideoReport, onSuccess: () => void) {
      const key = keys.for(JSON.stringify(body));
      void mutation.run({ body, key }, () => {
        keys.clear();
        onSuccess();
      });
    },
  };
}
