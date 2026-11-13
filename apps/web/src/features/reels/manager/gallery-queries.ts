'use client';

import { useMemo, useRef } from 'react';
import { useLocale } from 'next-intl';
import type {
  CreateGalleryPhoto,
  MediaLinkTarget,
  OwnerGalleryPhoto,
  UpdateGalleryPhoto,
} from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { useOwnerContext } from '../../businesses/queries';
import { useProductList } from '../../products/owner/queries';
import { useOwnerServices } from '../../services/owner/queries';
import {
  addGalleryPhoto,
  deleteGalleryPhoto,
  updateGalleryPhoto,
} from './api';
import { useManagerKeys, useSettle } from './queries';

/** Append an uploaded `gallery` asset to the owner Gallery. */
export function useAddGalleryPhoto(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const keys = useManagerKeys(kind);
  const settle = useSettle();
  // One key per add command; there is no automatic retry/replay of an add.
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: { body: CreateGalleryPhoto }, assertCurrent) => {
      const photo = await addGalleryPhoto(api, kind, input.body, {
        key: crypto.randomUUID(),
        assertCurrent,
      });
      await settle<OwnerGalleryPhoto>(keys.gallery, photo.id, null, assertCurrent);
      return photo;
    },
  );
  // Uploads finish independently while `run` is single-flight, so adds are
  // chained: every uploaded asset is placed, one POST at a time.
  const queue = useRef<Promise<void>>(Promise.resolve());
  return {
    mutation,
    add(body: CreateGalleryPhoto, onSuccess?: () => void) {
      queue.current = queue.current.then(() =>
        mutation.run({ body }, () => onSuccess?.()),
      );
      return queue.current;
    },
  };
}

export function useUpdateGalleryPhoto(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const keys = useManagerKeys(kind);
  const settle = useSettle();
  const idempotency = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; body: UpdateGalleryPhoto; key: string },
      assertCurrent,
    ) => {
      const photo = await updateGalleryPhoto(api, kind, input.id, input.body, {
        key: input.key,
        assertCurrent,
      });
      await settle(keys.gallery, photo.id, photo, assertCurrent);
      return photo;
    },
  );
  return {
    mutation,
    submit(id: string, body: UpdateGalleryPhoto, onSuccess: () => void) {
      const key = idempotency.for(JSON.stringify([id, body]));
      void mutation.run({ id, body, key }, () => {
        idempotency.clear();
        onSuccess();
      });
    },
  };
}

export function useDeleteGalleryPhoto(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const keys = useManagerKeys(kind);
  const settle = useSettle();
  const idempotency = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; version: number; key: string },
      assertCurrent,
    ) => {
      const photo = await deleteGalleryPhoto(
        api,
        kind,
        input.id,
        input.version,
        { key: input.key, assertCurrent },
      );
      await settle<OwnerGalleryPhoto>(keys.gallery, input.id, null, assertCurrent);
      return photo;
    },
  );
  return {
    mutation,
    remove(photo: OwnerGalleryPhoto, onSuccess: () => void) {
      const key = idempotency.for(`${photo.id}:${photo.version}`);
      void mutation.run(
        { id: photo.id, version: photo.version, key },
        () => {
          idempotency.clear();
          onSuccess();
        },
      );
    },
  };
}

export type LinkOption = MediaLinkTarget & {
  name: string;
  /** Only public (published/active) items can be newly linked. */
  linkable: boolean;
};

export const linkKey = (target: MediaLinkTarget) =>
  `${target.targetType}:${target.targetId}`;

/**
 * The owner's own products and services as link targets, read through the
 * same owner list queries (and cache) as the catalogue screens. Pages load
 * on demand with `loadMore`; the server re-validates public visibility.
 */
export function useLinkTargets(kind: BusinessKind) {
  const locale = useLocale();
  const products = useProductList(kind, { stock: undefined, query: '' });
  const services = useOwnerServices(kind, true);
  const productPages = products.data?.pages;
  const servicePages = services.data?.pages;
  const options = useMemo(() => {
    const name = (item: { nameEn: string; nameHi: string | null }) =>
      (locale === 'hi' && item.nameHi) || item.nameEn;
    const all: LinkOption[] = [
      ...(productPages ?? []).flatMap((page) =>
        page.items.map((item) => ({
          targetType: 'product' as const,
          targetId: item.id,
          name: name(item),
          linkable: item.published,
        })),
      ),
      ...(servicePages ?? []).flatMap((page) =>
        page.items.map((item) => ({
          targetType: 'service' as const,
          targetId: item.id,
          name: name(item),
          linkable: item.status === 'active',
        })),
      ),
    ];
    return new Map(all.map((option) => [linkKey(option), option]));
  }, [locale, productPages, servicePages]);
  return {
    options,
    loading: products.isPending || services.isPending,
    failed: products.isError || services.isError,
    retry() {
      if (products.isError) void products.refetch();
      if (services.isError) void services.refetch();
    },
    hasMore: Boolean(products.hasNextPage || services.hasNextPage),
    loadingMore: products.isFetchingNextPage || services.isFetchingNextPage,
    loadMore() {
      if (products.hasNextPage) void products.fetchNextPage();
      if (services.hasNextPage) void services.fetchNextPage();
    },
  };
}
