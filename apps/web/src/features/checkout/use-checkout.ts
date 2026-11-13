'use client';

import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { Cart } from '@apnatown/shared/cart';
import type { CheckoutQuote } from '@apnatown/shared/checkout';
import type { OrderMode } from '@apnatown/shared/orders';
import { privateInfiniteQueryOptions } from '../../shared/api/private-query';
import { queryKeys } from '../../shared/api/query-keys';
import { retryTransientRead } from '../../shared/api/result';
import { listAddresses } from '../users/address-api';
import type { QuoteRequest } from './api';
import type { AddressListState } from './CheckoutAddress';
import type { CashLabel } from './CheckoutSummary';
import { useCheckoutQuote, useCheckoutScope } from './queries';

/** Saved addresses (Users-owned read, shared cache key with /account/addresses). */
export function useCheckoutAddresses(): AddressListState {
  const { api, lifecycle, scope } = useCheckoutScope();
  const query = useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope ? queryKeys.addresses(scope) : ['private', 'pending', 'addresses'],
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listAddresses(api, cursor, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    pending: query.isPending,
    failed: query.isError && !query.data,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}

/** First choice when the customer has not picked a mode for a shop:
 * delivery when the quote says it is available, else pickup, else none. */
function autoMode(group: CheckoutQuote['groups'][number]): OrderMode | null {
  if (group.fulfilment.delivery.available) return 'delivery';
  if (group.fulfilment.pickup.available) return 'pickup';
  return null;
}

/**
 * Checkout selections (UI state only) and the quote they drive. Every change
 * of cart version, address or a shop's mode produces a new quote request;
 * nothing here computes a fee or total.
 */
export function useCheckoutSelections(
  cart: Cart | undefined,
  addresses: AddressListState,
  paused: boolean,
) {
  const [modes, setModes] = useState<Record<string, OrderMode>>({});
  const [chosenAddress, setChosenAddress] = useState<string>();
  const address =
    addresses.items.find((item) => item.id === chosenAddress) ??
    addresses.items.find((item) => item.isDefault) ??
    addresses.items[0];
  const businessIds = useMemo(
    () => cart?.groups.map((group) => group.businessId) ?? [],
    [cart],
  );
  const request = useMemo((): QuoteRequest | null => {
    if (!cart || cart.version < 1 || businessIds.length === 0 || paused)
      return null;
    if (addresses.pending) return null;
    const deliveryModes = businessIds.flatMap((businessId) => {
      const mode = modes[businessId];
      return mode ? [{ businessId, mode }] : [];
    });
    return {
      cartVersion: cart.version,
      ...(address && {
        addressId: address.id,
        addressVersion: address.version,
      }),
      ...(deliveryModes.length > 0 && { deliveryModes }),
    };
  }, [cart, businessIds, modes, address, addresses.pending, paused]);
  const quote = useCheckoutQuote(request);

  // Preselect once per shop from the first quote that offers a mode; the
  // customer's own choice always wins and is never overwritten.
  const latest = quote.quote;
  useEffect(() => {
    if (!latest) return;
    const picks: Record<string, OrderMode> = {};
    for (const group of latest.groups) {
      const mode = autoMode(group);
      if (mode) picks[group.businessId] = mode;
    }
    setModes((current) => {
      const missing = Object.keys(picks).filter((id) => !current[id]);
      if (missing.length === 0) return current;
      return { ...picks, ...current };
    });
  }, [latest]);

  const chosen = businessIds.map((id) => modes[id]);
  const cashLabel: CashLabel = chosen.every((mode) => mode === 'pickup')
    ? 'cashPickup'
    : chosen.some((mode) => mode === 'pickup')
      ? 'cashMixed'
      : 'cashDelivery';
  return {
    modes,
    setMode: (businessId: string, mode: OrderMode) =>
      setModes((current) => ({ ...current, [businessId]: mode })),
    address,
    setAddress: setChosenAddress,
    needsAddress: chosen.some((mode) => mode !== 'pickup'),
    cashLabel,
    quote,
  };
}
