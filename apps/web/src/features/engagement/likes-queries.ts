'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EngagementState,
  VideoHeartResult,
  VideoLikeResult,
} from '@apnatown/shared';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { privateQueryOptions } from '../../shared/api/private-query';
import { ApiFailure } from '../../shared/api/result';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { getEngagementState, setVideoHeart, setVideoLike } from './likes-api';

function withLike(
  state: EngagementState,
  videoId: string,
  result: VideoLikeResult,
): EngagementState {
  const likedVideoIds = state.likedVideoIds.filter((id) => id !== videoId);
  if (result.liked) likedVideoIds.push(videoId);
  return {
    likedVideoIds,
    videoCounts: state.videoCounts.map((count) =>
      count.videoId === videoId ? { ...count, likeCount: result.likeCount } : count,
    ),
    heartedTargets: state.heartedTargets,
  };
}

export function useVideoLikes(videoIds: readonly string[]) {
  const { api, lifecycle, state, epoch } = useSession();
  const client = useQueryClient();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const ids = [...new Set(videoIds)].sort();
  const rootKey = queryKeys.engagementStateRoot(scope, epoch);
  const queryKey = queryKeys.engagementState(scope, epoch, ids);
  const query = useQuery({
    ...privateQueryOptions(queryKey, epoch, lifecycle, (signal) =>
      getEngagementState(api, ids, signal),
    ),
    enabled: ids.length > 0 && (
      state.kind === 'ready' ||
      (state.kind === 'error' && state.code === 'SESSION_EXPIRED')
    ),
    staleTime: 30_000,
    retry: false,
  });
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: { videoId: string; liked: boolean }, assertCurrent) => {
      await client.cancelQueries({ queryKey, exact: true });
      assertCurrent();
      const previous = client.getQueryData<EngagementState>(queryKey);
      const count = previous?.videoCounts.find((item) => item.videoId === input.videoId);
      if (!previous || !count) throw new ApiFailure('MEDIA_VIDEO_NOT_PUBLISHED');
      const wasLiked = previous.likedVideoIds.includes(input.videoId);
      const delta = input.liked === wasLiked ? 0 : input.liked ? 1 : -1;
      client.setQueryData(queryKey, withLike(previous, input.videoId, {
        liked: input.liked,
        likeCount: Math.max(0, count.likeCount + delta),
      }));
      try {
        const result = await setVideoLike(api, input.videoId, input.liked, assertCurrent);
        assertCurrent();
        await client.cancelQueries({ queryKey, exact: true });
        assertCurrent();
        client.setQueryData(queryKey, withLike(previous, input.videoId, result));
        await client.invalidateQueries({ queryKey: rootKey });
        return result;
      } catch (error) {
        // An unmounted control may roll back its cache, but a former account may not.
        lifecycle.assert(epoch);
        client.setQueryData(queryKey, previous);
        void client.invalidateQueries({ queryKey: rootKey });
        throw error;
      }
    },
  );
  return { query, mutation };
}

export function useVideoHeartActions(videoId: string) {
  const { api, lifecycle, state, epoch } = useSession();
  const client = useQueryClient();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const queryKey = queryKeys.engagementState(scope, epoch, [videoId]);
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: { hearted: boolean }, assertCurrent) => {
      const result = await setVideoHeart(api, videoId, input.hearted, assertCurrent);
      assertCurrent();
      await client.cancelQueries({ queryKey, exact: true });
      assertCurrent();
      client.setQueryData<EngagementState>(queryKey, (current) =>
        current
          ? {
              ...current,
              heartedTargets: withHeart(current, videoId, result).heartedTargets,
            }
          : current,
      );
      await client.invalidateQueries({
        queryKey,
        exact: true,
        refetchType: 'none',
      });
      return result;
    },
  );
  return {
    mutation,
    toggle(hearted: boolean) {
      void mutation.run({ hearted });
    },
  };
}

function withHeart(
  state: EngagementState,
  videoId: string,
  result: VideoHeartResult,
): EngagementState {
  const heartedTargets = state.heartedTargets.filter(
    (target) => target.targetType !== 'video' || target.targetId !== videoId,
  );
  if (result.hearted) heartedTargets.push({ targetType: 'video', targetId: videoId });
  return { ...state, heartedTargets };
}
