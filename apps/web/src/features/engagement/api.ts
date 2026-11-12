import {
  VideoCommentCreateSchema,
  VideoCommentPublicPageSchema,
  VideoCommentSchema,
  type VideoCommentCreate,
} from '@apnatown/shared';
import { z } from 'zod';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
type Command = { key: string; assertCurrent: () => void };
const PAGE_SIZE = 20;
const NoContentSchema = z.undefined();
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

export async function listVideoComments(
  api: Reader,
  videoId: string,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/videos/{videoId}/comments', {
      params: {
        path: { videoId },
        query: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
      },
      ...withSignal(signal),
    }),
    VideoCommentPublicPageSchema,
  );
}

export async function createVideoComment(
  api: BrowserApi,
  videoId: string,
  input: VideoCommentCreate,
  { key, assertCurrent }: Command,
) {
  const body = VideoCommentCreateSchema.parse(input);
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/videos/{videoId}/comments', {
      params: {
        path: { videoId },
        header: { ...headers, 'Idempotency-Key': key },
      },
      body,
    }),
    VideoCommentSchema,
  );
}

export async function deleteVideoComment(
  api: BrowserApi,
  videoId: string,
  id: string,
  assertCurrent: () => void,
) {
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.DELETE('/videos/{videoId}/comments/{id}', {
      params: { path: { videoId, id }, header: headers },
    }),
    NoContentSchema,
  );
}
