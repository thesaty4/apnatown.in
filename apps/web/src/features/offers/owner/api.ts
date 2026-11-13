import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  OwnerOfferPageSchema,
  OwnerOfferSchema,
  type OfferCreate,
  type OfferStatusCommand,
  type OwnerOfferQuery,
} from '@apnatown/shared/offers';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });
export type OfferStatusFilter = OwnerOfferQuery['status'];

export async function listOwnerOffers(
  api: Pick<BrowserApi, 'GET'>,
  kind: BusinessKind,
  status: OfferStatusFilter,
  cursor: string | undefined,
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/offers', {
      params: { header: kindHeader(kind), query: { status, ...(cursor && { cursor }) } },
      signal,
    }),
    OwnerOfferPageSchema,
  );
}

export type OfferCommand =
  | { type: 'create'; offer: OfferCreate; key: string }
  | { type: 'update'; id: string; offer: OfferCreate; expectedVersion: number }
  | { type: 'status'; id: string; command: OfferStatusCommand };

export async function runOfferCommand(
  api: BrowserApi,
  kind: BusinessKind,
  command: OfferCommand,
  assertCurrent: () => void,
) {
  const csrf = await api.mutationHeaders();
  assertCurrent();
  const header = { ...csrf, ...kindHeader(kind) };
  switch (command.type) {
    case 'create':
      return unwrap(
        await api.POST('/businesses/me/offers', {
          params: { header: { ...header, 'Idempotency-Key': command.key } },
          body: command.offer,
        }),
        OwnerOfferSchema,
      );
    case 'update':
      return unwrap(
        await api.PATCH('/businesses/me/offers/{offerId}', {
          params: { header, path: { offerId: command.id } },
          body: { ...command.offer, expectedVersion: command.expectedVersion },
        }),
        OwnerOfferSchema,
      );
    case 'status':
      return unwrap(
        await api.PATCH('/businesses/me/offers/{offerId}/status', {
          params: { header, path: { offerId: command.id } },
          body: command.command,
        }),
        OwnerOfferSchema,
      );
  }
}

/** i18n keys are camelCase; the wire discount type is snake_case. */
export const DISCOUNT_TYPE_KEY = {
  percent: 'percent',
  flat: 'flat',
  free_delivery: 'freeDelivery',
} as const;
