import {
  CartMergeResultSchema,
  CartSchema,
  type AddCartLine,
  type CartLineVersions,
  type UpdateCartLine,
} from '@apnatown/shared/cart';
import type { BrowserApi } from '../../shared/api/browser';
import { failureCode, unwrap } from '../../shared/api/result';

/** Line commands accepted by `useCartCommands`. Every one returns the full Cart. */
export type CartCommand =
  | { op: 'update'; lineId: string; body: UpdateCartLine }
  | { op: 'remove'; lineId: string; body: CartLineVersions }
  | { op: 'save'; lineId: string; body: CartLineVersions }
  | { op: 'restore'; lineId: string; body: CartLineVersions };

async function readCart(api: BrowserApi, signal: AbortSignal) {
  return unwrap(await api.GET('/cart', { signal }), CartSchema);
}

/** GET /cart. A first-time guest has no anonymous session yet; bootstrap it
 * through the same-origin CSRF endpoint once, then read again. The read also
 * issues the HttpOnly guest-cart cookie that every later mutation needs. */
export async function getCart(api: BrowserApi, signal: AbortSignal) {
  try {
    return await readCart(api, signal);
  } catch (error) {
    if (failureCode(error) !== 'CSRF_INVALID') throw error;
    await api.mutationHeaders();
    signal.throwIfAborted();
    return readCart(api, signal);
  }
}

async function headers(
  api: BrowserApi,
  key: string,
  assertCurrent: () => void,
) {
  const security = await api.mutationHeaders();
  assertCurrent();
  return { ...security, 'Idempotency-Key': key };
}

export async function addCartLine(
  api: BrowserApi,
  body: AddCartLine,
  key: string,
  assertCurrent: () => void,
) {
  const header = await headers(api, key, assertCurrent);
  return unwrap(
    await api.POST('/cart/lines', { params: { header }, body }),
    CartSchema,
  );
}

export async function runCartCommand(
  api: BrowserApi,
  command: CartCommand,
  key: string,
  assertCurrent: () => void,
) {
  const header = await headers(api, key, assertCurrent);
  const params = { header, path: { lineId: command.lineId } };
  switch (command.op) {
    case 'update':
      return unwrap(
        await api.PATCH('/cart/lines/{lineId}', { params, body: command.body }),
        CartSchema,
      );
    case 'remove':
      return unwrap(
        await api.DELETE('/cart/lines/{lineId}', {
          params,
          body: command.body,
        }),
        CartSchema,
      );
    case 'save':
      return unwrap(
        await api.POST('/cart/lines/{lineId}/save-for-later', {
          params,
          body: command.body,
        }),
        CartSchema,
      );
    case 'restore':
      return unwrap(
        await api.POST('/cart/lines/{lineId}/restore', {
          params,
          body: command.body,
        }),
        CartSchema,
      );
  }
}

export async function mergeGuestCart(
  api: BrowserApi,
  key: string,
  assertCurrent: () => void,
) {
  const header = await headers(api, key, assertCurrent);
  return unwrap(
    await api.POST('/cart/merge-guest', { params: { header }, body: {} }),
    CartMergeResultSchema,
  );
}
