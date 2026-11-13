import type { components } from '@apnatown/api-client';
import {
  CheckoutAttemptSchema,
  CheckoutQuoteSchema,
} from '@apnatown/shared/checkout';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

/** Generated request DTOs (absent optional fields are omitted, never undefined). */
export type QuoteRequest = components['schemas']['CheckoutQuoteRequestDto'];
export type AttemptRequest = components['schemas']['CheckoutAttemptCreateDto'];

/** POST /cart/quote: a preview; persisted 15 min server-side, claims no stock. */
export async function quoteCart(
  api: BrowserApi,
  body: QuoteRequest,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/cart/quote', { params: { header }, body }),
    CheckoutQuoteSchema,
  );
}

/** POST /checkout/attempts. The caller owns the per-attempt key so a lost
 * response replays the same attempt instead of placing a second one. */
export async function createCheckoutAttempt(
  api: BrowserApi,
  body: AttemptRequest,
  key: string,
  assertCurrent: () => void,
) {
  const security = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/checkout/attempts', {
      params: { header: { ...security, 'Idempotency-Key': key } },
      body,
    }),
    CheckoutAttemptSchema,
  );
}

export async function getCheckoutAttempt(
  api: BrowserApi,
  attemptId: string,
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/checkout/attempts/{attemptId}', {
      params: { path: { attemptId } },
      signal,
    }),
    CheckoutAttemptSchema,
  );
}
