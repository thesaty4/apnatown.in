import {
  FollowerAnnouncementResultSchema,
  FollowerInsightsSchema,
  type FollowerAnnouncementCreate,
} from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

export async function getFollowerInsights(
  api: Pick<BrowserApi, 'GET'>,
  kind: BusinessKind,
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/followers', {
      params: { header: kindHeader(kind) },
      signal,
    }),
    FollowerInsightsSchema,
  );
}

export async function createAnnouncement(
  api: BrowserApi,
  kind: BusinessKind,
  body: FollowerAnnouncementCreate,
  key: string,
  assertCurrent: () => void,
) {
  const csrf = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/businesses/me/announcements', {
      params: { header: { ...csrf, ...kindHeader(kind), 'Idempotency-Key': key } },
      body: {
        kind: body.kind,
        messageEn: body.messageEn,
        ...(body.messageHi && { messageHi: body.messageHi }),
      },
    }),
    FollowerAnnouncementResultSchema,
  );
}
