'use client';

import { useQuery } from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { BillingOverviewSchema, EarningsSchema } from '@apnatown/shared/earnings';
import type { BrowserApi } from '../../shared/api/browser';
import { privateQueryOptions } from '../../shared/api/private-query';
import { retryTransientRead, unwrap } from '../../shared/api/result';
import { businessKeys, useOwnerContext } from '../businesses/queries';

const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

async function getEarnings(api: Pick<BrowserApi, 'GET'>, kind: BusinessKind, signal: AbortSignal) {
  return unwrap(
    await api.GET('/payments/me/earnings', { params: { header: kindHeader(kind) }, signal }),
    EarningsSchema,
  );
}

async function getBilling(api: Pick<BrowserApi, 'GET'>, kind: BusinessKind, signal: AbortSignal) {
  return unwrap(
    await api.GET('/payments/me/subscription', { params: { header: kindHeader(kind) }, signal }),
    BillingOverviewSchema,
  );
}

function useOwnerRead<T>(
  kind: BusinessKind,
  part: string,
  enabled: boolean,
  read: (api: BrowserApi, signal: AbortSignal) => Promise<T>,
) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? [...businessKeys.all(scope, kind), part] : ['private', 'pending', 'business', kind, part],
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => read(api, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

export const useEarnings = (kind: BusinessKind, enabled: boolean) =>
  useOwnerRead(kind, 'earnings', enabled, (api, signal) => getEarnings(api, kind, signal));

export const useBilling = (kind: BusinessKind, enabled: boolean) =>
  useOwnerRead(kind, 'billing', enabled, (api, signal) => getBilling(api, kind, signal));
