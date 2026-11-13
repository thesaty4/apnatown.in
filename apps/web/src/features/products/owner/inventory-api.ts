import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  InventoryItemSchema,
  InventoryPageSchema,
  InventoryRestockLowSchema,
  InventoryUpdateSchema,
  PRODUCT_BULK_LIMIT,
  ProductBulkResultSchema,
  type InventoryRestockLow,
  type InventoryUpdate,
} from '@apnatown/shared/products';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';
import {
  PRODUCT_PAGE_SIZE,
  defined,
  kindHeader,
  listProducts,
  withSignal,
  writeHeaders,
  type Reader,
} from './api';

export async function listInventory(
  api: Reader,
  kind: BusinessKind,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/inventory', {
      params: {
        header: kindHeader(kind),
        query: { ...(cursor && { cursor }), limit: PRODUCT_PAGE_SIZE },
      },
      ...withSignal(signal),
    }),
    InventoryPageSchema,
  );
}

export async function updateInventory(
  api: BrowserApi,
  kind: BusinessKind,
  productId: string,
  input: InventoryUpdate,
  assertCurrent: () => void,
) {
  const body = defined(InventoryUpdateSchema.parse(input));
  const header = await writeHeaders(api, kind, assertCurrent);
  return unwrap(
    await api.PATCH('/businesses/me/inventory/{productId}', {
      params: { header, path: { productId } },
      body,
    }),
    InventoryItemSchema,
  );
}

export async function restockLow(
  api: BrowserApi,
  kind: BusinessKind,
  input: InventoryRestockLow,
  key: string,
  assertCurrent: () => void,
) {
  const body = defined(InventoryRestockLowSchema.parse(input));
  const header = await writeHeaders(api, kind, assertCurrent);
  return unwrap(
    await api.POST('/businesses/me/inventory/restock-low', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body,
    }),
    ProductBulkResultSchema,
  );
}

/**
 * The server requires the versions of EXACTLY the current low set, so the
 * set is re-read fresh (every page of `?stock=low`) right before the command
 * instead of trusting whichever pages the screen happened to load. More than
 * the command limit is reported to the caller (`tooMany`) rather than sent.
 */
export async function currentLowVersions(
  api: Reader,
  kind: BusinessKind,
  assertCurrent: () => void,
) {
  const versions: { productId: string; version: number }[] = [];
  let cursor: string | undefined;
  do {
    const page = await listProducts(
      api,
      kind,
      { stock: 'low', query: '' },
      cursor,
      undefined,
      PRODUCT_BULK_LIMIT,
    );
    assertCurrent();
    for (const item of page.items)
      versions.push({ productId: item.id, version: item.inventory.version });
    cursor = page.nextCursor ?? undefined;
  } while (cursor && versions.length <= PRODUCT_BULK_LIMIT);
  return { versions, tooMany: versions.length > PRODUCT_BULK_LIMIT };
}
