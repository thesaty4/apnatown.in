import {
  VideoModerationDecisionSchema,
  VideoModerationItemSchema,
  VideoModerationPageSchema,
  type VideoModerationDecision,
  type VideoModerationTab,
} from '@apnatown/shared';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
type Command = {
  key: string;
  assertCurrent: () => void;
};
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});
const PAGE_SIZE = 50;

export async function listVideoModeration(
  api: Reader,
  tab: VideoModerationTab,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/videos', {
      params: {
        query: {
          tab,
          limit: PAGE_SIZE,
          ...(cursor ? { cursor } : {}),
        },
      },
      ...withSignal(signal),
    }),
    VideoModerationPageSchema,
  );
}

export async function decideVideoModeration(
  api: BrowserApi,
  id: string,
  decision: VideoModerationDecision,
  { key, assertCurrent }: Command,
) {
  const parsed = VideoModerationDecisionSchema.parse(decision);
  const body = {
    action: parsed.action,
    expectedVersion: parsed.expectedVersion,
    ...(parsed.reason === undefined ? {} : { reason: parsed.reason }),
  };
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/admin/videos/{id}/decision', {
      params: {
        path: { id },
        header: { ...headers, 'Idempotency-Key': key },
      },
      body,
    }),
    VideoModerationItemSchema,
  );
}
