import { z } from 'zod';
import { VideoShareCreateSchema } from '@apnatown/shared';
import type { VideoShareCreate } from '@apnatown/shared';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

const NoContentSchema = z.undefined();

export async function createVideoShare(
  api: BrowserApi,
  input: VideoShareCreate,
  key: string,
  assertCurrent: () => void,
) {
  const body = VideoShareCreateSchema.parse(input);
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/engagement/shares', {
      params: { header: { ...headers, 'Idempotency-Key': key } },
      body,
    }),
    NoContentSchema,
  );
}
