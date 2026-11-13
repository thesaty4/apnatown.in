import { z } from 'zod';
import {
  ProductBulkCommandSchema,
  ProductBulkResultSchema,
  ProductCreateSchema,
  ProductOwnerPageSchema,
  ProductOwnerSchema,
  ProductPillsReplaceSchema,
  ProductPillsSchema,
  ProductUpdateSchema,
  type ProductBulkCommand,
  type ProductCreate,
  type ProductPillsReplace,
  type ProductStockFilter,
  type ProductUpdate,
} from '@apnatown/shared/products';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

export type Reader = Pick<BrowserApi, 'GET'>;

/** Owner list/inventory page size (API max 50). */
export const PRODUCT_PAGE_SIZE = 20;

export type ProductListFilters = {
  stock: ProductStockFilter | undefined;
  query: string;
};

export const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

type Defined<T> = T extends (infer U)[]
  ? Defined<U>[]
  : T extends object
    ? { [K in keyof T]: Defined<Exclude<T[K], undefined>> }
    : T;

/** Deeply drops `undefined` members so optional wire fields are omitted, not
 * sent (`exactOptionalPropertyTypes` in the generated client); `null` stays an
 * explicit clear. */
export function defined<T>(value: T): Defined<T> {
  if (Array.isArray(value)) return value.map(defined) as Defined<T>;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, member]) => member !== undefined)
        .map(([key, member]) => [key, defined(member)]),
    ) as Defined<T>;
  return value as Defined<T>;
}

/** Every owner call names its application kind explicitly (vendor vs provider
 * contexts of one account never mix), exactly like the enquiries feature. */
export const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

export async function writeHeaders(
  api: BrowserApi,
  kind: BusinessKind,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return { ...header, ...kindHeader(kind) };
}

export async function listProducts(
  api: Reader,
  kind: BusinessKind,
  { stock, query }: ProductListFilters,
  cursor: string | undefined,
  signal?: AbortSignal,
  limit = PRODUCT_PAGE_SIZE,
) {
  return unwrap(
    await api.GET('/businesses/me/products', {
      params: {
        header: kindHeader(kind),
        query: {
          ...(stock && { stock }),
          ...(query && { query }),
          ...(cursor && { cursor }),
          limit,
        },
      },
      ...withSignal(signal),
    }),
    ProductOwnerPageSchema,
  );
}

export async function getProduct(
  api: Reader,
  kind: BusinessKind,
  productId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/products/{productId}', {
      params: { header: kindHeader(kind), path: { productId } },
      ...withSignal(signal),
    }),
    ProductOwnerSchema,
  );
}

export async function createProduct(
  api: BrowserApi,
  kind: BusinessKind,
  input: ProductCreate,
  key: string,
  assertCurrent: () => void,
) {
  const body = defined(ProductCreateSchema.parse(input));
  const header = await writeHeaders(api, kind, assertCurrent);
  return unwrap(
    await api.POST('/businesses/me/products', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body,
    }),
    ProductOwnerSchema,
  );
}

export async function updateProduct(
  api: BrowserApi,
  kind: BusinessKind,
  productId: string,
  input: ProductUpdate,
  assertCurrent: () => void,
) {
  const body = defined(ProductUpdateSchema.parse(input));
  const header = await writeHeaders(api, kind, assertCurrent);
  return unwrap(
    await api.PATCH('/businesses/me/products/{productId}', {
      params: { header, path: { productId } },
      body,
    }),
    ProductOwnerSchema,
  );
}

/** 204 on success; any failure surfaces as the normalized ApiFailure. */
export async function deleteProduct(
  api: BrowserApi,
  kind: BusinessKind,
  productId: string,
  expectedVersion: number,
  assertCurrent: () => void,
) {
  const header = await writeHeaders(api, kind, assertCurrent);
  unwrap(
    await api.DELETE('/businesses/me/products/{productId}', {
      params: { header, path: { productId }, query: { expectedVersion } },
    }),
    z.unknown(),
  );
}

/** `expectedVersions[i]` guards `productIds[i]`: the INVENTORY version for the
 * stock actions, the PRODUCT version for delete (the caller picks the right one). */
export async function bulkProducts(
  api: BrowserApi,
  kind: BusinessKind,
  command: ProductBulkCommand,
  key: string,
  assertCurrent: () => void,
) {
  const body = ProductBulkCommandSchema.parse(command);
  const header = await writeHeaders(api, kind, assertCurrent);
  return unwrap(
    await api.PATCH('/businesses/me/products/bulk', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body,
    }),
    ProductBulkResultSchema,
  );
}

export async function getProductPills(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/product-pills', {
      params: { header: kindHeader(kind) },
      ...withSignal(signal),
    }),
    ProductPillsSchema,
  );
}

/** PUT replaces the whole configured list. */
export async function replaceProductPills(
  api: BrowserApi,
  kind: BusinessKind,
  input: ProductPillsReplace,
  assertCurrent: () => void,
) {
  const body = defined(ProductPillsReplaceSchema.parse(input));
  const header = await writeHeaders(api, kind, assertCurrent);
  return unwrap(
    await api.PUT('/businesses/me/product-pills', {
      params: { header },
      body,
    }),
    ProductPillsSchema,
  );
}
