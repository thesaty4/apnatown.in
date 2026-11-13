'use client';

import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type {
  OwnerGalleryPhoto,
  OwnerVideoDetail,
  Video,
  VideoEdit,
} from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { privateQueryOptions } from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import { retryTransientRead } from '../../../shared/api/result';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { useOwnerContext } from '../../businesses/queries';
import {
  deleteOwnerVideo,
  editOwnerVideo,
  getOwnerVideo,
  loadGalleryManager,
  loadVideoManager,
  putOrder,
  type Managed,
  type ManagerList,
} from './api';

const pending = (kind: BusinessKind, ...part: string[]) =>
  ['private', 'pending', 'media', 'manager', kind, ...part] as const;

/** Keys for one business kind under the current account scope. */
export function useManagerKeys(kind: BusinessKind) {
  const { scope } = useOwnerContext();
  return {
    videosRoot: scope ? queryKeys.mediaVideos(scope, kind) : pending(kind),
    videos: scope
      ? queryKeys.mediaVideoManager(scope, kind)
      : pending(kind, 'videos'),
    video: (id: string) =>
      scope
        ? queryKeys.mediaVideoDetail(scope, kind, id)
        : pending(kind, 'video', id),
    gallery: scope ? queryKeys.mediaGallery(scope, kind) : pending(kind, 'gallery'),
  };
}

/** Every owner video in manager order (bounded pages) plus the order version. */
export function useVideoManager(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const keys = useManagerKeys(kind);
  return useQuery({
    ...privateQueryOptions(keys.videos, scope?.epoch ?? 0, lifecycle, (signal) =>
      loadVideoManager(api, kind, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

export function useGalleryManager(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const keys = useManagerKeys(kind);
  return useQuery({
    ...privateQueryOptions(keys.gallery, scope?.epoch ?? 0, lifecycle, (signal) =>
      loadGalleryManager(api, kind, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

/**
 * Owner video detail (thumbnail, links, decision reason). `enabled: false`
 * still shows a cached detail, e.g. a thumbnail after the editor was opened.
 * The editor always re-reads so a stale version never seeds the form.
 */
export function useOwnerVideoDetail(
  kind: BusinessKind,
  id: string,
  { enabled, fresh = false }: { enabled: boolean; fresh?: boolean },
) {
  const { api, lifecycle, scope } = useOwnerContext();
  const keys = useManagerKeys(kind);
  return useQuery({
    ...privateQueryOptions(keys.video(id), scope?.epoch ?? 0, lifecycle, (signal) =>
      getOwnerVideo(api, kind, id, signal),
    ),
    enabled: enabled && scope !== null,
    staleTime: fresh ? 0 : 60_000,
    retry: retryTransientRead,
  });
}

/** Replace one row in a cached manager list without touching the order. */
function patchRow<T extends { id: string }>(
  data: Managed<T> | undefined,
  id: string,
  next: T | null,
): Managed<T> | undefined {
  if (!data) return data;
  return {
    ...data,
    items: next
      ? data.items.map((item) => (item.id === id ? next : item))
      : data.items.filter((item) => item.id !== id),
  };
}

/** Seed the confirmed result, then mark the related keys stale and refetch. */
export function useSettle() {
  const client = useQueryClient();
  return async function settle<T extends { id: string }>(
    listKey: QueryKey,
    id: string,
    row: T | null,
    assertCurrent: () => void,
    extra: readonly QueryKey[] = [],
  ) {
    assertCurrent();
    await client.cancelQueries({ queryKey: listKey, exact: true });
    client.setQueryData<Managed<T>>(listKey, (data) => patchRow(data, id, row));
    await Promise.all(
      [listKey, ...extra].map((queryKey) =>
        client.invalidateQueries({ queryKey }),
      ),
    );
  };
}

/** PATCH a video; resolves the confirmed detail through `onSuccess`. */
export function useEditVideo(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const client = useQueryClient();
  const keys = useManagerKeys(kind);
  const settle = useSettle();
  const idempotency = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; body: VideoEdit; key: string },
      assertCurrent,
    ) => {
      const detail = await editOwnerVideo(api, kind, input.id, input.body, {
        key: input.key,
        assertCurrent,
      });
      assertCurrent();
      client.setQueryData<OwnerVideoDetail>(keys.video(input.id), detail);
      await settle<Video>(keys.videos, input.id, detail.video, assertCurrent);
      return detail;
    },
  );
  return {
    mutation,
    submit(id: string, body: VideoEdit, onSuccess: (d: OwnerVideoDetail) => void) {
      const key = idempotency.for(JSON.stringify([id, body]));
      void mutation.run({ id, body, key }, (detail) => {
        idempotency.clear();
        onSuccess(detail);
      });
    },
  };
}

/** Owner-delete a video (tombstone); it leaves the manager list and order. */
export function useDeleteVideo(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const client = useQueryClient();
  const keys = useManagerKeys(kind);
  const settle = useSettle();
  const idempotency = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; version: number; key: string },
      assertCurrent,
    ) => {
      const detail = await deleteOwnerVideo(api, kind, input.id, input.version, {
        key: input.key,
        assertCurrent,
      });
      client.removeQueries({ queryKey: keys.video(input.id), exact: true });
      await settle<Video>(keys.videos, input.id, null, assertCurrent);
      return detail;
    },
  );
  return {
    mutation,
    remove(video: Pick<Video, 'id' | 'version'>, onSuccess: () => void) {
      const key = idempotency.for(`${video.id}:${video.version}`);
      void mutation.run({ id: video.id, version: video.version, key }, () => {
        idempotency.clear();
        onSuccess();
      });
    },
  };
}

/**
 * One atomic order PUT shared by Move up/down and drag. Optimistic: the new
 * order shows at once; any failure (409 stale version, 422 membership) rolls
 * back to the snapshot and reloads the authoritative order.
 */
export function useReorder(kind: BusinessKind, list: ManagerList) {
  const { api, lifecycle } = useOwnerContext();
  const client = useQueryClient();
  const keys = useManagerKeys(kind);
  const listKey = list === 'videos' ? keys.videos : keys.gallery;
  const idempotency = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { ids: string[]; version: number; key: string },
      assertCurrent,
    ) => {
      await client.cancelQueries({ queryKey: listKey, exact: true });
      assertCurrent();
      const before =
        client.getQueryData<Managed<Video | OwnerGalleryPhoto>>(listKey);
      if (!before) throw new Error('MANAGER_NOT_LOADED');
      const byId = new Map(before.items.map((item) => [item.id, item]));
      client.setQueryData(listKey, {
        ...before,
        items: input.ids.flatMap((id) => byId.get(id) ?? []),
      });
      try {
        const order = await putOrder(
          api,
          kind,
          list,
          { orderedIds: input.ids, expectedOrderVersion: input.version },
          { key: input.key, assertCurrent },
        );
        assertCurrent();
        client.setQueryData<Managed<Video | OwnerGalleryPhoto>>(
          listKey,
          (data) => data && { ...data, orderVersion: order.orderVersion },
        );
        return order;
      } catch (error) {
        client.setQueryData(listKey, before);
        void client.invalidateQueries({ queryKey: listKey, exact: true });
        throw error;
      }
    },
  );
  return {
    mutation,
    save(ids: string[], onSuccess?: () => void) {
      // The expected version is part of the command: after a conflict reload,
      // the same IDs against the new version are a new command and key.
      const version =
        client.getQueryData<Managed<{ id: string }>>(listKey)?.orderVersion;
      if (version === undefined) return;
      const key = idempotency.for(JSON.stringify([ids, version]));
      void mutation.run({ ids, version, key }, () => {
        idempotency.clear();
        onSuccess?.();
      });
    },
  };
}

/** Move one ID by `delta` positions; null when it would leave the list. */
export function moved(ids: readonly string[], id: string, delta: number) {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
