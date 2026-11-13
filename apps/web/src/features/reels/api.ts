import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  CreateVideoReportSchema,
  CreateVideoSchema,
  VideoReportAcceptedSchema,
  VideoPageSchema,
  VideoSchema,
  VideoFeedPageSchema,
  VideoFeedQuerySchema,
  type CreateVideoReport,
  type CreateVideo,
  type VideoFeedQuery,
} from '@apnatown/shared';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
type Command = { key: string; assertCurrent: () => void };
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

export async function listOwnerVideos(
  api: Reader,
  kind: BusinessKind,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/videos', {
      params: {
        header: { 'X-Business-Kind': kind },
        query: cursor ? { cursor, limit: 50 } : { limit: 50 },
      },
      ...withSignal(signal),
    }),
    VideoPageSchema,
  );
}

export async function createOwnerVideo(
  api: BrowserApi,
  kind: BusinessKind,
  input: CreateVideo,
  { key, assertCurrent }: Command,
) {
  const body = CreateVideoSchema.parse(input);
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/businesses/me/videos', {
      params: {
        header: {
          ...header,
          'Idempotency-Key': key,
          'X-Business-Kind': kind,
        },
      },
      body,
    }),
    VideoSchema,
  );
}

export async function getPublicVideo(
  api: Reader,
  id: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/videos/{id}', {
      params: { path: { id } },
      ...withSignal(signal),
    }),
    VideoSchema,
  );
}

export async function getVideoFeed(
  api: BrowserApi,
  input: VideoFeedQuery,
  signal?: AbortSignal,
) {
  const query = VideoFeedQuerySchema.parse(input);
  await api.mutationHeaders();
  signal?.throwIfAborted();
  return unwrap(
    await api.GET('/videos/feed', {
      params: {
        query: {
          ...(query.category !== undefined && { category: query.category }),
          ...(query.cursor !== undefined && { cursor: query.cursor }),
          ...(query.lat !== undefined && { lat: query.lat }),
          ...(query.limit !== undefined && { limit: query.limit }),
          ...(query.lng !== undefined && { lng: query.lng }),
          ...(query.pill !== undefined && { pill: query.pill }),
          ...(query.startVideoId !== undefined && {
            startVideoId: query.startVideoId,
          }),
          ...(query.snapshotId !== undefined && {
            snapshotId: query.snapshotId,
          }),
        },
      },
      ...withSignal(signal),
    }),
    VideoFeedPageSchema,
  );
}

export async function createVideoReport(
  api: BrowserApi,
  id: string,
  input: CreateVideoReport,
  { key, assertCurrent }: Command,
) {
  const parsed = CreateVideoReportSchema.parse(input);
  const body = {
    reason: parsed.reason,
    ...(parsed.details !== undefined && { details: parsed.details }),
  };
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/videos/{id}/reports', {
      params: {
        path: { id },
        header: { ...headers, 'Idempotency-Key': key },
      },
      body,
    }),
    VideoReportAcceptedSchema,
  );
}
