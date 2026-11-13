import {
  EngagementStateSchema,
  FollowResultSchema,
  VideoHeartResultSchema,
  VideoLikeResultSchema,
} from '@apnatown/shared';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

export async function getEngagementState(
  api: BrowserApi,
  videoIds: readonly string[],
  businessIds: readonly string[],
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/engagement/me/state', {
      params: {
        query: {
          ...(videoIds.length > 0 && {
            videoIds: videoIds.join(','),
            targets: videoIds.map((id) => `video:${id}`).join(','),
          }),
          ...(businessIds.length > 0 && { businessIds: businessIds.join(',') }),
        },
      },
      signal,
    }),
    EngagementStateSchema,
  );
}

export async function setBusinessFollow(
  api: BrowserApi,
  businessId: string,
  sourceVideoId: string | null,
  input: { following: boolean; bellOn: boolean },
  assertCurrent: () => void,
) {
  if (!input.following)
    return removeBusinessFollow(api, businessId, assertCurrent);
  const headers = await api.mutationHeaders();
  assertCurrent();
  const options = {
    params: {
      path: { businessId },
      header: headers,
    },
  };
  const result = await api.PUT('/engagement/follows/{businessId}', {
    ...options,
    body: {
      ...(sourceVideoId !== null && { sourceVideoId }),
      bellOn: input.bellOn,
    },
  });
  return unwrap(result, FollowResultSchema);
}

export async function removeBusinessFollow(
  api: BrowserApi,
  businessId: string,
  assertCurrent: () => void,
) {
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.DELETE('/engagement/follows/{businessId}', {
      params: { path: { businessId }, header: headers },
    }),
    FollowResultSchema,
  );
}

export async function setVideoHeart(
  api: BrowserApi,
  videoId: string,
  hearted: boolean,
  assertCurrent: () => void,
) {
  const headers = await api.mutationHeaders();
  assertCurrent();
  const options = {
    params: {
      path: { targetType: 'video' as const, targetId: videoId },
      header: headers,
    },
  };
  const result = hearted
    ? await api.PUT('/engagement/hearts/{targetType}/{targetId}', options)
    : await api.DELETE('/engagement/hearts/{targetType}/{targetId}', options);
  return unwrap(result, VideoHeartResultSchema);
}

export async function setVideoLike(
  api: BrowserApi,
  videoId: string,
  liked: boolean,
  assertCurrent: () => void,
) {
  const headers = await api.mutationHeaders();
  assertCurrent();
  const options = { params: { path: { videoId }, header: headers } };
  const result = liked
    ? await api.PUT('/engagement/likes/{videoId}', options)
    : await api.DELETE('/engagement/likes/{videoId}', options);
  return unwrap(result, VideoLikeResultSchema);
}
