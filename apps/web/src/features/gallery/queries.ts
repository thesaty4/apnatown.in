'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  CreatePhotoReport,
  MediaLinkTarget,
} from '@apnatown/shared';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { businessProductsOptions, businessServicesOptions } from '../businesses';
import { createPhotoReport } from './api';

/**
 * One typed photo report per logical submission. Retrying the identical
 * payload reuses its idempotency key; mutations never auto-retry and the
 * transient input never enters the mutation cache.
 */
export function useReportPhoto(assetId: string) {
  const { api, lifecycle } = useSession();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: { body: CreatePhotoReport; key: string }, assertCurrent) => {
      const result = await createPhotoReport(api, assetId, input.body, {
        key: input.key,
        assertCurrent,
      });
      assertCurrent();
      return result;
    },
  );
  return {
    mutation,
    submit(body: CreatePhotoReport, onSuccess: () => void) {
      const key = keys.for(`${assetId}:${JSON.stringify(body)}`);
      void mutation.run({ body, key }, () => {
        keys.clear();
        onSuccess();
      });
    },
  };
}

/**
 * Gallery DTOs carry only `{targetType,targetId}` for a linked item. Its
 * public name/path is resolved from the owning modules' public profile list
 * (same key/options as the Products & Services tab, so the cache is shared).
 * Only already-loaded pages are searched; the read is enabled only while a
 * linked photo is on screen.
 */
type LinkedListing = {
  id: string;
  nameEn: string;
  nameHi: string | null;
  path: string;
};

export function useLinkedListing(
  slug: string,
  target: MediaLinkTarget | null,
) {
  const { api } = useSession();
  const products = useInfiniteQuery({
    ...businessProductsOptions(api, slug, undefined),
    enabled: target?.targetType === 'product',
  });
  const services = useInfiniteQuery({
    ...businessServicesOptions(api, slug, undefined, undefined),
    enabled: target?.targetType === 'service',
  });
  if (!target) return { status: 'none' as const };
  const query = target.targetType === 'product' ? products : services;
  if (query.isPending) return { status: 'pending' as const };
  const pages: ReadonlyArray<{ items: ReadonlyArray<LinkedListing> }> =
    query.data?.pages ?? [];
  const match = pages
    .flatMap((page) => page.items)
    .find((item) => item.id === target.targetId);
  return match
    ? {
        status: 'found' as const,
        item: { nameEn: match.nameEn, nameHi: match.nameHi, path: match.path },
      }
    : { status: 'unresolved' as const };
}
