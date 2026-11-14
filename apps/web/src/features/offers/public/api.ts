import {
  OfferPublicPageSchema,
  type OfferPublicPage,
} from '@apnatown/shared/offers';
import type { BrowserApi } from '../../../shared/api/browser';
import { normalizeFailure, unwrap } from '../../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;

/** Public, read-only Offers reads: no account or draft data is cached. */
export async function getPublicOffers(
  api: Reader,
  cursor: string | null,
  signal: AbortSignal,
  businessId?: string,
): Promise<OfferPublicPage> {
  try {
    return unwrap(
      await api.GET('/offers', {
        params: {
          query: {
            limit: 12,
            ...(businessId && { businessId }),
            ...(cursor && { cursor }),
          },
        },
        signal,
      }),
      OfferPublicPageSchema,
    );
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}
