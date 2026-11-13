'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type {
  ProductBulkAction,
  ProductCreate,
  ProductOwner,
  ProductPillsReplace,
  ProductUpdate,
} from '@apnatown/shared/products';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
  reconcilePrivate,
} from '../../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../../shared/api/query-keys';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { businessKeys, useOwnerContext } from '../../businesses/queries';
import {
  bulkProducts,
  createProduct,
  deleteProduct,
  getProduct,
  getProductPills,
  listProducts,
  replaceProductPills,
  updateProduct,
  type ProductListFilters,
} from './api';
import { getImportPolicy, importProducts } from './import-api';

export const pending = (kind: BusinessKind, ...part: string[]) =>
  ['private', 'pending', 'business', kind, 'products', ...part] as const;

/** Everything a catalogue write can change: list pages (all filters), pills
 * (which subcategories exist), inventory and the dashboard overview counts. */
export async function invalidateCatalogue(
  client: QueryClient,
  scope: AccountScope,
  kind: BusinessKind,
  except?: string,
) {
  const root = queryKeys.productsRoot(scope, kind);
  await Promise.all([
    client.invalidateQueries({ queryKey: [...root, 'list'] }),
    client.invalidateQueries({ queryKey: queryKeys.productPills(scope, kind) }),
    client.invalidateQueries({
      queryKey: [...root, 'detail'],
      predicate: (query) => query.queryKey.at(-1) !== except,
    }),
    client.invalidateQueries({ queryKey: queryKeys.inventory(scope, kind) }),
    client.invalidateQueries({ queryKey: businessKeys.overview(scope, kind) }),
  ]);
}

/** Keyset pages; a stock/search/kind/account change is a new key. */
export function useProductList(kind: BusinessKind, filters: ProductListFilters) {
  const { api, lifecycle, scope } = useOwnerContext();
  const stock = filters.stock ?? 'all';
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope
        ? queryKeys.productList(scope, kind, stock, filters.query)
        : pending(kind, 'list', stock),
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listProducts(api, kind, filters, cursor, signal),
    ),
    enabled: scope !== null,
  });
}

/** Editor read; always fresh on mount so a stale version never seeds a form. */
export function useProduct(kind: BusinessKind, id: string | null) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope && id
        ? queryKeys.product(scope, kind, id)
        : pending(kind, 'detail', id ?? 'new'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getProduct(api, kind, id ?? '', signal),
    ),
    enabled: scope !== null && id !== null,
    staleTime: 0,
  });
}

export function useProductPills(kind: BusinessKind, enabled = true) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? queryKeys.productPills(scope, kind) : pending(kind, 'pills'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getProductPills(api, kind, signal),
    ),
    enabled: enabled && scope !== null,
  });
}

export function useImportPolicy(kind: BusinessKind, enabled: boolean) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope
        ? queryKeys.productImportPolicy(scope, kind)
        : pending(kind, 'import-policy'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getImportPolicy(api, kind, signal),
    ),
    enabled: enabled && scope !== null,
    staleTime: 0,
    retry: false,
  });
}

/** Create (Idempotency-Key per payload) or version-guarded update. The
 * authoritative product is seeded into its detail key; dependants re-read. */
export function useSaveProduct(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  return usePrivateMutation(
    lifecycle,
    async (
      input:
        | { mode: 'create'; body: ProductCreate }
        | { mode: 'update'; id: string; body: ProductUpdate },
      assertCurrent,
    ): Promise<ProductOwner> => {
      const saved =
        input.mode === 'create'
          ? await createProduct(
              api,
              kind,
              input.body,
              keys.for(JSON.stringify(input.body)),
              assertCurrent,
            )
          : await updateProduct(api, kind, input.id, input.body, assertCurrent);
      keys.clear();
      if (scope) {
        await reconcilePrivate(
          client,
          queryKeys.product(scope, kind, saved.id),
          saved,
          assertCurrent,
        );
        void invalidateCatalogue(client, scope, kind, saved.id);
      }
      return saved;
    },
  );
}

export function useDeleteProduct(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  return usePrivateMutation(
    lifecycle,
    async (input: { id: string; version: number }, assertCurrent) => {
      await deleteProduct(api, kind, input.id, input.version, assertCurrent);
      if (scope) {
        client.removeQueries({ queryKey: queryKeys.product(scope, kind, input.id) });
        void invalidateCatalogue(client, scope, kind);
      }
    },
  );
}

export type BulkInput = {
  action: ProductBulkAction;
  /** Already the right version per action (inventory vs product). */
  items: { id: string; version: number }[];
};

export function useBulkProducts(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  return usePrivateMutation(lifecycle, async (input: BulkInput, assertCurrent) => {
    const command = {
      action: input.action,
      productIds: input.items.map((item) => item.id),
      expectedVersions: input.items.map((item) => item.version),
    };
    const result = await bulkProducts(
      api,
      kind,
      command,
      keys.for(JSON.stringify(command)),
      assertCurrent,
    );
    keys.clear();
    if (scope) await invalidateCatalogue(client, scope, kind);
    return result;
    },
  );
}

export function useReplacePills(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  return usePrivateMutation(
    lifecycle,
    async (input: ProductPillsReplace, assertCurrent) => {
      const result = await replaceProductPills(api, kind, input, assertCurrent);
      if (scope)
        await reconcilePrivate(
          client,
          queryKeys.productPills(scope, kind),
          result,
          assertCurrent,
        );
      return result;
    },
  );
}

/** One Idempotency-Key per file selection: retries of the same selection
 * replay; choosing a file again (even the same name) is a new intent. */
export function useImportProducts(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  return usePrivateMutation(
    lifecycle,
    async (
      { file, selection }: { file: File; selection: number },
      assertCurrent,
    ) => {
      const key = keys.for(
        `${selection}:${file.name}:${file.size}:${file.lastModified}`,
      );
      const result = await importProducts(api, kind, file, key, assertCurrent);
      keys.clear();
      if (scope) await invalidateCatalogue(client, scope, kind);
      return result;
    },
  );
}
