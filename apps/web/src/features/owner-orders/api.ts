import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  BusinessOrderCountsSchema,
  BusinessOrderPageSchema,
  OrderCancelSchema,
  OrderDetailSchema,
  OrderTransitionSchema,
  type BUSINESS_REJECT_REASONS,
  type BusinessOrderTab,
  type OrderDetail,
  type OrderTransitionEvent,
} from '@apnatown/shared/orders';
import {
  HandoverResultSchema,
  PickupVerifySchema,
  SelfCompleteSchema,
  SelfDispatchResultSchema,
  SelfDispatchSchema,
} from '@apnatown/shared/delivery';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;

/** Queue page size (API max 50). */
export const ORDER_PAGE_SIZE = 20;

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

/** Every owner call names its application kind, like the businesses owner
 * routes, so an owner of both kinds never mixes vendor/provider contexts. */
const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

export async function listOwnerOrders(
  api: Reader,
  kind: BusinessKind,
  tab: BusinessOrderTab,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/orders', {
      params: {
        header: kindHeader(kind),
        query: { tab, limit: ORDER_PAGE_SIZE, ...(cursor && { cursor }) },
      },
      ...withSignal(signal),
    }),
    BusinessOrderPageSchema,
  );
}

export async function getOwnerOrderCounts(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/orders/counts', {
      params: { header: kindHeader(kind) },
      ...withSignal(signal),
    }),
    BusinessOrderCountsSchema,
  );
}

/** Business view of one order (X-Business-Kind forces it even when the
 * caller is also the order's customer). */
export async function getOwnerOrder(
  api: Reader,
  kind: BusinessKind,
  orderId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/orders/{orderId}', {
      params: { header: kindHeader(kind), path: { orderId } },
      ...withSignal(signal),
    }),
    OrderDetailSchema,
  );
}

export type RejectReason = (typeof BUSINESS_REJECT_REASONS)[number];

export type HandoverInput = {
  code: string;
  codeVersion: number;
  cashCollected: boolean;
  expectedOrderVersion: number;
  expectedFinancialVersion: number;
};

/** One owner command; versions always come from the rendered order. */
export type OwnerOrderCommand =
  | { type: 'transition'; event: OrderTransitionEvent; expectedVersion: number }
  | { type: 'reject'; reasonKey: RejectReason; expectedVersion: number }
  | { type: 'self_dispatch'; expectedOrderVersion: number }
  | { type: 'self_complete'; input: HandoverInput }
  | { type: 'verify_pickup'; input: HandoverInput };

export type OwnerOrderCommandResult =
  { kind: 'detail'; detail: OrderDetail } | { kind: 'handover' };

/** Sends one command with CSRF + Idempotency-Key. Transition/reject return
 * the business OrderDetail; delivery handover commands return their own
 * result (`kind: 'handover'`) and the caller re-reads the order. */
export async function runOwnerOrderCommand(
  api: BrowserApi,
  kind: BusinessKind,
  orderId: string,
  command: OwnerOrderCommand,
  key: string,
  assertCurrent: () => void,
): Promise<OwnerOrderCommandResult> {
  const csrf = await api.mutationHeaders();
  assertCurrent();
  const header = { ...csrf, 'Idempotency-Key': key };
  const owner = { ...header, ...kindHeader(kind) };
  const path = { orderId };
  switch (command.type) {
    case 'transition': {
      const body = OrderTransitionSchema.parse({
        event: command.event,
        expectedVersion: command.expectedVersion,
      });
      const detail = unwrap(
        await api.POST('/orders/{orderId}/transitions', {
          params: { header, path },
          body,
        }),
        OrderDetailSchema,
      );
      return { kind: 'detail', detail };
    }
    case 'reject': {
      const body = OrderCancelSchema.parse({
        event: 'reject',
        reasonKey: command.reasonKey,
        expectedVersion: command.expectedVersion,
      });
      const detail = unwrap(
        await api.POST('/orders/{orderId}/cancel', {
          params: { header, path },
          body,
        }),
        OrderDetailSchema,
      );
      return { kind: 'detail', detail };
    }
    case 'self_dispatch': {
      const body = SelfDispatchSchema.parse({
        expectedOrderVersion: command.expectedOrderVersion,
      });
      unwrap(
        await api.POST('/delivery/orders/{orderId}/self-dispatch', {
          params: { header: owner, path },
          body,
        }),
        SelfDispatchResultSchema,
      );
      return { kind: 'handover' };
    }
    case 'self_complete': {
      // Validated; the typed input (all versions present) is what is sent.
      SelfCompleteSchema.parse(command.input);
      const body = command.input;
      unwrap(
        await api.POST('/delivery/orders/{orderId}/self-complete', {
          params: { header: owner, path },
          body,
        }),
        HandoverResultSchema,
      );
      return { kind: 'handover' };
    }
    case 'verify_pickup': {
      const body = { orderId, ...command.input };
      PickupVerifySchema.parse(body);
      unwrap(
        await api.POST('/delivery/pickup-codes/verify', {
          params: { header: owner },
          body,
        }),
        HandoverResultSchema,
      );
      return { kind: 'handover' };
    }
  }
}
