import {
  CreateGalleryPhotoSchema,
  ExpectedVersionBodySchema,
  MEDIA_MANAGER_LIST_MAX,
  MediaOrderSchema,
  OwnerGalleryPageSchema,
  OwnerGalleryPhotoSchema,
  OwnerVideoDetailSchema,
  UpdateGalleryPhotoSchema,
  UpdateMediaOrderSchema,
  VideoEditSchema,
  VideoPageSchema,
  type CreateGalleryPhoto,
  type MediaOrder,
  type OwnerGalleryPhoto,
  type UpdateGalleryPhoto,
  type UpdateMediaOrder,
  type Video,
  type VideoEdit,
} from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

// Owner Gallery & Videos manager operations (S-VEND-11 / S-PROV-12). Every
// call carries the business kind; writes add CSRF and an Idempotency-Key.

type Reader = Pick<BrowserApi, 'GET'>;
export type Command = { key: string; assertCurrent: () => void };
export type ManagerList = 'videos' | 'gallery';
const PAGE = 50;
const MAX_PAGES = Math.ceil(MEDIA_MANAGER_LIST_MAX / PAGE);
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});
const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

async function writeHeader(
  api: BrowserApi,
  kind: BusinessKind,
  { key, assertCurrent }: Command,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return { ...header, ...kindHeader(kind), 'Idempotency-Key': key };
}

/** Manager rows in the persisted order plus the version a reorder must match. */
export type Managed<T> = { items: T[]; orderVersion: number };

/** Server order first; rows the order does not know yet (a race) go last, so
 * a stale membership is rejected by the PUT and reloaded, never hidden. */
function arrange<T extends { id: string }>(
  items: T[],
  order: MediaOrder,
): Managed<T> {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = order.orderedIds.flatMap((id) => {
    const item = byId.get(id);
    byId.delete(id);
    return item ? [item] : [];
  });
  return {
    items: [...ordered, ...byId.values()],
    orderVersion: order.orderVersion,
  };
}

/** Reordering needs full membership, so the manager reads every bounded page. */
async function readAll<T>(
  read: (
    cursor: string | undefined,
  ) => Promise<{ items: T[]; nextCursor: string | null }>,
  signal?: AbortSignal,
) {
  const items: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    signal?.throwIfAborted();
    const result = await read(cursor);
    items.push(...result.items);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return items;
}

const pageQuery = (cursor: string | undefined) =>
  cursor ? { cursor, limit: PAGE } : { limit: PAGE };

async function getOrder(
  api: Reader,
  kind: BusinessKind,
  list: ManagerList,
  signal?: AbortSignal,
) {
  const request = {
    params: { header: kindHeader(kind) },
    ...withSignal(signal),
  };
  return unwrap(
    list === 'videos'
      ? await api.GET('/businesses/me/videos/order', request)
      : await api.GET('/businesses/me/gallery/order', request),
    MediaOrderSchema,
  );
}

export async function loadVideoManager(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
): Promise<Managed<Video>> {
  const [order, items] = await Promise.all([
    getOrder(api, kind, 'videos', signal),
    readAll(
      async (cursor) =>
        unwrap(
          await api.GET('/businesses/me/videos', {
            params: { header: kindHeader(kind), query: pageQuery(cursor) },
            ...withSignal(signal),
          }),
          VideoPageSchema,
        ),
      signal,
    ),
  ]);
  return arrange(items, order);
}

export async function loadGalleryManager(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
): Promise<Managed<OwnerGalleryPhoto>> {
  const [order, items] = await Promise.all([
    getOrder(api, kind, 'gallery', signal),
    readAll(
      async (cursor) =>
        unwrap(
          await api.GET('/businesses/me/gallery', {
            params: { header: kindHeader(kind), query: pageQuery(cursor) },
            ...withSignal(signal),
          }),
          OwnerGalleryPageSchema,
        ),
      signal,
    ),
  ]);
  return arrange(items, order);
}

export async function putOrder(
  api: BrowserApi,
  kind: BusinessKind,
  list: ManagerList,
  input: UpdateMediaOrder,
  command: Command,
) {
  const body = UpdateMediaOrderSchema.parse(input);
  const header = await writeHeader(api, kind, command);
  const request = { params: { header }, body };
  return unwrap(
    list === 'videos'
      ? await api.PUT('/businesses/me/videos/order', request)
      : await api.PUT('/businesses/me/gallery/order', request),
    MediaOrderSchema,
  );
}

export async function getOwnerVideo(
  api: Reader,
  kind: BusinessKind,
  id: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/videos/{id}', {
      params: { header: kindHeader(kind), path: { id } },
      ...withSignal(signal),
    }),
    OwnerVideoDetailSchema,
  );
}

export async function editOwnerVideo(
  api: BrowserApi,
  kind: BusinessKind,
  id: string,
  input: VideoEdit,
  command: Command,
) {
  const body = VideoEditSchema.parse(input);
  const header = await writeHeader(api, kind, command);
  return unwrap(
    await api.PATCH('/businesses/me/videos/{id}', {
      params: { header, path: { id } },
      body,
    }),
    OwnerVideoDetailSchema,
  );
}

export async function deleteOwnerVideo(
  api: BrowserApi,
  kind: BusinessKind,
  id: string,
  expectedVersion: number,
  command: Command,
) {
  const body = ExpectedVersionBodySchema.parse({ expectedVersion });
  const header = await writeHeader(api, kind, command);
  return unwrap(
    await api.DELETE('/businesses/me/videos/{id}', {
      params: { header, path: { id } },
      body,
    }),
    OwnerVideoDetailSchema,
  );
}

export async function addGalleryPhoto(
  api: BrowserApi,
  kind: BusinessKind,
  input: CreateGalleryPhoto,
  command: Command,
) {
  const body = CreateGalleryPhotoSchema.parse(input);
  const header = await writeHeader(api, kind, command);
  return unwrap(
    await api.POST('/businesses/me/gallery', { params: { header }, body }),
    OwnerGalleryPhotoSchema,
  );
}

export async function updateGalleryPhoto(
  api: BrowserApi,
  kind: BusinessKind,
  id: string,
  input: UpdateGalleryPhoto,
  command: Command,
) {
  const body = UpdateGalleryPhotoSchema.parse(input);
  const header = await writeHeader(api, kind, command);
  return unwrap(
    await api.PATCH('/businesses/me/gallery/{id}', {
      params: { header, path: { id } },
      body,
    }),
    OwnerGalleryPhotoSchema,
  );
}

export async function deleteGalleryPhoto(
  api: BrowserApi,
  kind: BusinessKind,
  id: string,
  expectedVersion: number,
  command: Command,
) {
  const body = ExpectedVersionBodySchema.parse({ expectedVersion });
  const header = await writeHeader(api, kind, command);
  return unwrap(
    await api.DELETE('/businesses/me/gallery/{id}', {
      params: { header, path: { id } },
      body,
    }),
    OwnerGalleryPhotoSchema,
  );
}
