'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { InventoryUpdate } from '@apnatown/shared/products';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { privateInfiniteQueryOptions } from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import { ApiFailure } from '../../../shared/api/result';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { useOwnerContext } from '../../businesses/queries';
import {
  currentLowVersions,
  listInventory,
  restockLow,
  updateInventory,
} from './inventory-api';
import { invalidateCatalogue, pending } from './queries';

export function useInventory(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope ? queryKeys.inventory(scope, kind) : pending(kind, 'inventory'),
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listInventory(api, kind, cursor, signal),
    ),
    enabled: scope !== null,
  });
}

/** Single-row stock/threshold/availability change with the inventory version. */
export function useInventoryUpdate(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  return usePrivateMutation(
    lifecycle,
    async (input: { id: string; body: InventoryUpdate }, assertCurrent) => {
      const result = await updateInventory(
        api,
        kind,
        input.id,
        input.body,
        assertCurrent,
      );
      if (scope) await invalidateCatalogue(client, scope, kind);
      return result;
    },
  );
}

/** Restock every low row to 20 with the freshly read exact low set. */
export function useRestockLow(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  return usePrivateMutation(lifecycle, async (_: void, assertCurrent) => {
    const { versions, tooMany } = await currentLowVersions(
      api,
      kind,
      assertCurrent,
    );
    if (tooMany) throw new ApiFailure('PRODUCT_RESTOCK_TOO_MANY');
    if (versions.length === 0) return { changedIds: [] };
    const body = { targetOnHand: 20 as const, expectedVersions: versions };
    const result = await restockLow(
      api,
      kind,
      body,
      keys.for(JSON.stringify(body)),
      assertCurrent,
    );
    keys.clear();
    if (scope) await invalidateCatalogue(client, scope, kind);
    return result;
    },
  );
}
