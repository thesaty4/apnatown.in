import { EngagementStateSchema, VideoLikeResultSchema } from '@apnatown/shared';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

export async function getEngagementState(
  api: BrowserApi,
  videoIds: readonly string[],
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/engagement/me/state', {
      params: { query: { videoIds: videoIds.join(',') } },
      signal,
    }),
    EngagementStateSchema,
  );
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
