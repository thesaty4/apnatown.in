import {
  CustomerOrderPageSchema,
  OrderDetailSchema,
  type CustomerOrderGroup,
  type OrderCancel,
} from '@apnatown/shared/orders';
import { DeliveryCodeSchema } from '@apnatown/shared/delivery';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

async function commandHeaders(
  api: BrowserApi,
  key: string,
  assertCurrent: () => void,
) {
  const security = await api.mutationHeaders();
  assertCurrent();
  return { ...security, 'Idempotency-Key': key };
}

/** GET /orders?group=: own orders with all three authoritative counts. */
export async function listOrders(
  api: BrowserApi,
  group: CustomerOrderGroup,
  cursor: string | undefined,
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/orders', {
      params: { query: { group, ...(cursor && { cursor }) } },
      signal,
    }),
    CustomerOrderPageSchema,
  );
}

/** GET /orders/{id}: the customer view (role-minimized, never a code). */
export async function getOrder(
  api: BrowserApi,
  orderId: string,
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/orders/{orderId}', {
      params: { path: { orderId } },
      signal,
    }),
    OrderDetailSchema,
  );
}

export async function cancelOrder(
  api: BrowserApi,
  orderId: string,
  body: Extract<OrderCancel, { event: 'cancel' }>,
  key: string,
  assertCurrent: () => void,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/orders/{orderId}/cancel', {
      params: { header, path: { orderId } },
      body,
    }),
    OrderDetailSchema,
  );
}

/** Customer-only, no-store handover code channel (BR-05). */
export async function getDeliveryCode(
  api: BrowserApi,
  orderId: string,
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/delivery/orders/{orderId}/code', {
      params: { path: { orderId } },
      signal,
    }),
    DeliveryCodeSchema,
  );
}

export async function reissueDeliveryCode(
  api: BrowserApi,
  orderId: string,
  expectedCodeVersion: number,
  key: string,
  assertCurrent: () => void,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/delivery/orders/{orderId}/code/reissue', {
      params: { header, path: { orderId } },
      body: { expectedCodeVersion },
    }),
    DeliveryCodeSchema,
  );
}
