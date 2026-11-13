import { infiniteQueryOptions } from '@tanstack/react-query';
import {
  BusinessGalleryPageSchema,
  CreatePhotoReportSchema,
  PublicVideoCardPageSchema,
  VideoReportAcceptedSchema,
  type BusinessGalleryFilter,
  type CreatePhotoReport,
} from '@apnatown/shared';
import type { BrowserApi } from '../../shared/api/browser';
import { queryKeys } from '../../shared/api/query-keys';
import {
  normalizeFailure,
  retryTransientRead,
  unwrap,
} from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
type Command = { key: string; assertCurrent: () => void };

/** Gallery page size (API default 24, max 50). */
const GALLERY_PAGE = 24;
/** Videos tab page size (API max 50). */
const VIDEOS_PAGE = 24;
/** Linked strip page size (API max 20). */
const LINKED_PAGE = 10;

async function guarded<T>(load: () => Promise<T>, signal: AbortSignal) {
  try {
    return await load();
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

/**
 * Freshness: Media marks these `private, no-store` because consent/removal is
 * live, so only the shared 30 s client freshness applies; focus/reconnect
 * refetches the loaded pages so removed media disappears. Bounded retries
 * for transient failures only (never 4xx/429).
 */
const PUBLIC_MEDIA = { staleTime: 30_000, retry: retryTransientRead } as const;

export function businessGalleryOptions(
  api: Reader,
  slug: string,
  filter: BusinessGalleryFilter,
) {
  return infiniteQueryOptions({
    queryKey: queryKeys.publicBusinessGallery(slug, filter),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/businesses/public/{slug}/gallery', {
              params: {
                path: { slug },
                query: {
                  filter,
                  limit: GALLERY_PAGE,
                  ...(pageParam && { cursor: pageParam }),
                },
              },
              signal,
            }),
            BusinessGalleryPageSchema,
          ),
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    ...PUBLIC_MEDIA,
  });
}

export function businessVideosOptions(api: Reader, slug: string) {
  return infiniteQueryOptions({
    queryKey: queryKeys.publicBusinessVideos(slug),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/businesses/public/{slug}/videos', {
              params: {
                path: { slug },
                query: {
                  limit: VIDEOS_PAGE,
                  ...(pageParam && { cursor: pageParam }),
                },
              },
              signal,
            }),
            PublicVideoCardPageSchema,
          ),
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    ...PUBLIC_MEDIA,
  });
}

export function linkedVideosOptions(
  api: Reader,
  targetType: 'product' | 'service',
  targetId: string,
) {
  return infiniteQueryOptions({
    queryKey: queryKeys.publicLinkedVideos(targetType, targetId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/videos', {
              params: {
                query: {
                  targetType,
                  targetId,
                  limit: LINKED_PAGE,
                  ...(pageParam && { cursor: pageParam }),
                },
              },
              signal,
            }),
            PublicVideoCardPageSchema,
          ),
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    ...PUBLIC_MEDIA,
  });
}

/** Guest-or-customer photo report; CSRF + one idempotency key per payload. */
export async function createPhotoReport(
  api: BrowserApi,
  assetId: string,
  input: CreatePhotoReport,
  { key, assertCurrent }: Command,
) {
  const parsed = CreatePhotoReportSchema.parse(input);
  const body = {
    placementType: parsed.placementType,
    placementId: parsed.placementId,
    reason: parsed.reason,
    ...(parsed.details ? { details: parsed.details } : {}),
  };
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/media/photos/{assetId}/reports', {
      params: {
        path: { assetId },
        header: { ...headers, 'Idempotency-Key': key },
      },
      body,
    }),
    VideoReportAcceptedSchema,
  );
}
