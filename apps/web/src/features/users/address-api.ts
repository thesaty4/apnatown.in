import {
  AddressDeletedSchema,
  AddressPageSchema,
  AddressSchema,
} from '@apnatown/shared/users';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';
import { privateInfiniteQueryOptions } from '../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../shared/api/query-keys';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';

export type CreateAddressBody = components['schemas']['CreateAddressDto'];
export type UpdateAddressBody = components['schemas']['UpdateAddressDto'];

type Reader = Pick<BrowserApi, 'GET'>;
export async function listAddresses(
  api: Reader,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/users/me/addresses', {
      params: { query: cursor ? { cursor } : {} },
      ...(signal && { signal }),
    }),
    AddressPageSchema,
  );
}

export function addressesOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
) {
  return privateInfiniteQueryOptions(
    queryKeys.addresses(scope),
    scope.epoch,
    lifecycle,
    (cursor, signal) => listAddresses(api, cursor, signal),
  );
}

/** CSRF/Origin come from the session transport; the caller owns the command key. */
async function commandHeaders(
  api: BrowserApi,
  key: string,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return { ...header, 'Idempotency-Key': key };
}

export async function createAddress(
  api: BrowserApi,
  body: CreateAddressBody,
  key: string,
  assertCurrent: () => void,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/users/me/addresses', { params: { header }, body }),
    AddressSchema,
  );
}

export async function updateAddress(
  api: BrowserApi,
  addressId: string,
  body: UpdateAddressBody,
  key: string,
  assertCurrent: () => void,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PATCH('/users/me/addresses/{addressId}', {
      params: { header, path: { addressId } },
      body,
    }),
    AddressSchema,
  );
}

export async function deleteAddress(
  api: BrowserApi,
  addressId: string,
  expectedVersion: number,
  key: string,
  assertCurrent: () => void,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.DELETE('/users/me/addresses/{addressId}', {
      params: { header, path: { addressId } },
      body: { expectedVersion },
    }),
    AddressDeletedSchema,
  );
}
