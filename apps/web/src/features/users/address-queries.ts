'use client';

import {
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import type { Address, AddressPage } from '@apnatown/shared/users';
import { useSession } from '../../shared/auth/SessionProvider';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { ApiFailure } from '../../shared/api/result';
import {
  createAddress,
  deleteAddress,
  updateAddress,
  type CreateAddressBody,
  type UpdateAddressBody,
} from './address-api';

type Pages = InfiniteData<AddressPage, string | null>;
export type SaveAddressInput = { key: string } & (
  | { kind: 'create'; body: CreateAddressBody }
  | { kind: 'update'; id: string; body: UpdateAddressBody }
);

/** Show the confirmed result now, then refetch: a new default demotes (and
 * re-versions) another address, and page boundaries may have moved. */
async function reconcileAddresses(
  client: QueryClient,
  queryKey: QueryKey,
  assertCurrent: () => void,
  patch: (items: Address[], page: number) => Address[],
) {
  assertCurrent();
  await client.cancelQueries({ queryKey, exact: true });
  assertCurrent();
  client.setQueryData<Pages>(
    queryKey,
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page, index) => ({
          ...page,
          items: patch(page.items, index),
        })),
      },
  );
  await client.invalidateQueries({ queryKey, exact: true });
  assertCurrent();
}

function upsert(saved: Address, created: boolean) {
  return (items: Address[], page: number) => {
    const next = items
      .filter((item) => !created || item.id !== saved.id)
      .map((item) =>
        item.id === saved.id
          ? saved
          : saved.isDefault && item.isDefault
            ? { ...item, isDefault: false }
            : item,
      );
    // Newest first: a created address belongs at the top of the first page.
    return created && page === 0 ? [saved, ...next] : next;
  };
}

function useAddressContext() {
  const { api, state, epoch, lifecycle } = useSession();
  const client = useQueryClient();
  return {
    api,
    lifecycle,
    client,
    queryKey: () => {
      if (state.kind !== 'ready') throw new ApiFailure('SESSION_EXPIRED');
      return queryKeys.addresses(accountScope(state.data, epoch));
    },
  };
}

export function useSaveAddress() {
  const { api, lifecycle, client, queryKey } = useAddressContext();
  return usePrivateMutation(
    lifecycle,
    async (input: SaveAddressInput, assertCurrent) => {
      const key = queryKey();
      const saved =
        input.kind === 'create'
          ? await createAddress(api, input.body, input.key, assertCurrent)
          : await updateAddress(
              api,
              input.id,
              input.body,
              input.key,
              assertCurrent,
            );
      await reconcileAddresses(
        client,
        key,
        assertCurrent,
        upsert(saved, input.kind === 'create'),
      );
      return saved;
    },
  );
}

export function useDeleteAddress() {
  const { api, lifecycle, client, queryKey } = useAddressContext();
  return usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; expectedVersion: number; key: string },
      assertCurrent,
    ) => {
      const key = queryKey();
      const deleted = await deleteAddress(
        api,
        input.id,
        input.expectedVersion,
        input.key,
        assertCurrent,
      );
      await reconcileAddresses(client, key, assertCurrent, (items) =>
        items.filter((item) => item.id !== deleted.id),
      );
      return deleted;
    },
  );
}
