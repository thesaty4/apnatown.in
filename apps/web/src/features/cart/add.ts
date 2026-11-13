'use client';

import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AddCartLine, Cart } from '@apnatown/shared/cart';
import { reconcilePrivate } from '../../shared/api/private-query';
import { failureCode } from '../../shared/api/result';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { addCartLine } from './api';
import { STALE_CART_CODES } from './errors';
import { markCartUsed } from './merge';
import { isTransient, useCartSource } from './queries';

export type AddInput = { quantity: number; variantId: string | null };
type Pending = AddInput & { body: AddCartLine; key: string };

/**
 * `POST /cart/lines` from the product page. The cart is read first (fresh or
 * ≤10s old) so a guest's HttpOnly cart cookie exists before the POST and the
 * expected version is current. After a lost response the next attempt with the
 * same quantity and variant resends the identical body and key, so the server replays it.
 */
export function useAddToCart(productId: string) {
  const { session, queryKey, options, ready } = useCartSource();
  const { api, lifecycle } = session;
  const client = useQueryClient();
  const pending = useRef<Pending | undefined>(undefined);
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: AddInput, assertCurrent): Promise<Cart> => {
      const { quantity, variantId } = input;
      const prior = pending.current;
      let request =
        prior?.quantity === quantity && prior.variantId === variantId
          ? prior
          : undefined;
      if (!request) {
        const cart = await client.fetchQuery({ ...options, staleTime: 10_000 });
        assertCurrent();
        request = {
          quantity,
          variantId,
          key: crypto.randomUUID(),
          body: {
            productId,
            variantId,
            quantity,
            expectedCartVersion: cart.version,
          },
        };
      }
      pending.current = request;
      try {
        const cart = await addCartLine(
          api,
          request.body,
          request.key,
          assertCurrent,
        );
        pending.current = undefined;
        markCartUsed();
        await reconcilePrivate(client, queryKey, cart, assertCurrent);
        return cart;
      } catch (error) {
        if (!isTransient(error)) pending.current = undefined;
        if (STALE_CART_CODES.has(failureCode(error)))
          void client.invalidateQueries({ queryKey, exact: true });
        throw error;
      }
    },
  );
  return { mutation, ready };
}
