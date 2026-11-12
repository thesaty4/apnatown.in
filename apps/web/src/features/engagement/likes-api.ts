import {
  EngagementStateSchema,
  VideoHeartResultSchema,
  VideoLikeResultSchema,
} from '@apnatown/shared';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

export async function getEngagementState(
  api: BrowserApi,
  videoIds: readonly string[],
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/engagement/me/state', {
      params: {
        query: {
          videoIds: videoIds.join(','),
          targets: videoIds.map((id) => `video:${id}`).join(','),
        },
      },
      signal,
    }),
    EngagementStateSchema,
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
