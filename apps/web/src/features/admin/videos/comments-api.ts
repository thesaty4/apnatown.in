import {
  VideoCommentAdminPageSchema,
  VideoCommentDecisionResultSchema,
  VideoCommentDecisionSchema,
  type VideoCommentDecision,
  type VideoCommentStatus,
} from '@apnatown/shared';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
type Command = { key: string; assertCurrent: () => void };
const PAGE_SIZE = 50;
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

export async function listVideoCommentsAdmin(
  api: Reader,
  status: VideoCommentStatus,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/comments', {
      params: {
        query: {
          status,
          limit: PAGE_SIZE,
          ...(cursor ? { cursor } : {}),
        },
      },
      ...withSignal(signal),
    }),
    VideoCommentAdminPageSchema,
  );
}

export async function decideVideoCommentAdmin(
  api: BrowserApi,
  id: string,
  decision: VideoCommentDecision,
  { key, assertCurrent }: Command,
) {
  const parsed = VideoCommentDecisionSchema.parse(decision);
  const body = {
    action: parsed.action,
    expectedVersion: parsed.expectedVersion,
    ...(parsed.reason === undefined ? {} : { reason: parsed.reason }),
  };
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/admin/comments/{id}/decision', {
      params: {
        path: { id },
        header: { ...headers, 'Idempotency-Key': key },
      },
      body,
    }),
    VideoCommentDecisionResultSchema,
  );
}
