'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Cart } from '@apnatown/shared/cart';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import {
  privateQueryOptions,
  reconcilePrivate,
} from '../../shared/api/private-query';
import { failureCode, retryTransientRead } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { getCart, runCartCommand, type CartCommand } from './api';
import { STALE_CART_CODES } from './errors';

/** Shared key/options for every cart consumer (page, badge, add-to-cart). */
export function useCartSource() {
  const session = useSession();
  const { api, lifecycle, state, epoch } = session;
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const queryKey = queryKeys.cart(scope, epoch);
  const options = privateQueryOptions(queryKey, epoch, lifecycle, (signal) =>
    getCart(api, signal),
  );
  // Guests (no signed-in session) have a cookie-bound cart too.
  const guest = state.kind === 'error' && state.code === 'SESSION_EXPIRED';
  const ready = state.kind === 'ready' || guest;
  return { session, queryKey, options, ready, guest };
}

/** GET /cart. `guestRead=false` lets the passive header badge skip guest reads
 * (it still shows whatever cart is already cached). */
export function useCart(guestRead = true) {
  const { options, ready, ...source } = useCartSource();
  const query = useQuery({
    ...options,
    enabled: ready && (guestRead || !source.guest),
    retry: retryTransientRead,
  });
  return { query, ready, ...source };
}

/** Transient = the server may or may not have applied it; retry with the same key. */
export function isTransient(error: unknown) {
  const code = failureCode(error);
  const status =
    error && typeof error === 'object' && 'status' in error
      ? Number(error.status)
      : 0;
  if (code === 'MAINTENANCE' || code === 'COMMON_UNAVAILABLE') return false;
  return (
    code === 'REQUEST_FAILED' || code === 'COMMON_CONFLICT' || status >= 500
  );
}

/**
 * Line commands (quantity/remove/save/restore). One serialized mutation: every
 * command bumps the cart version, so concurrent clicks are ignored while one is
 * in flight. The server Cart replaces the cache; nothing is computed locally.
 */
export function useCartCommands() {
  const { session, queryKey } = useCartSource();
  const { api, lifecycle } = session;
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (command: CartCommand, assertCurrent): Promise<Cart> => {
      // Same command + same versions ⇒ same key, so a lost response replays.
      const key = keys.for(JSON.stringify(command));
      try {
        const cart = await runCartCommand(api, command, key, assertCurrent);
        keys.clear();
        await reconcilePrivate(client, queryKey, cart, assertCurrent);
        return cart;
      } catch (error) {
        if (!isTransient(error)) keys.clear();
        if (STALE_CART_CODES.has(failureCode(error)))
          void client.invalidateQueries({ queryKey, exact: true });
        throw error;
      }
    },
  );
  return mutation;
}
