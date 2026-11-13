import type { DeliveryMethod } from '@apnatown/shared/businesses';
import type { OrderAmounts, OrderMode, OrderStatus } from '@apnatown/shared/orders';
import type { TxContext } from '../../../shared/persistence/ports';
import type { BusinessSnapshot } from '../domain/order';

export const ORDERS_CREATION = Symbol('ORDERS_CREATION');

export interface CheckoutOrderLine {
  readonly productId: string;
  readonly variantId: string | null;
  readonly variantLabel: string | null;
  readonly nameEn: string;
  readonly nameHi: string | null;
  readonly quantity: number;
  readonly unitPricePaise: number;
  readonly discountPaise: number;
}

/** Plain address from Users' checkout port; Orders encrypts its snapshot. */
export interface CheckoutAddress {
  readonly id: string;
  readonly version: number;
  readonly cityId: string;
  readonly areaId: string | null;
  readonly pinCode: string;
  readonly addressText: string;
  readonly landmark: string | null;
  readonly location: { lat: number; lng: number } | null;
}

export interface CheckoutShopOrder {
  readonly paymentAttemptId: string;
  readonly businessId: string;
  readonly scope: { cityId: string; areaId: string };
  readonly mode: OrderMode;
  readonly deliveryMethod: DeliveryMethod | null;
  readonly business: BusinessSnapshot;
  readonly amounts: OrderAmounts;
  readonly lines: readonly CheckoutOrderLine[];
}

export interface CreatedOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly businessId: string;
  readonly business: BusinessSnapshot;
  readonly mode: OrderMode;
  readonly totalPaise: number;
  readonly status: OrderStatus;
}

/**
 * `createPerShopOrders` (orders BE "Read and stock contracts"): called once
 * by Cart/Checkout inside its placement UoW after it revalidated the pinned
 * quote/cart/address. Reserves stock through a durable operation claim and
 * creates exactly one order per shop; any failure rolls back everything.
 */
export interface OrdersCreationPort {
  createPerShopOrders(
    tx: TxContext,
    input: {
      checkoutAttemptId: string;
      customerUserId: string;
      address: CheckoutAddress | null;
      shops: readonly CheckoutShopOrder[];
      correlationId: string;
      at: Date;
    },
  ): Promise<CreatedOrder[]>;
  /** Orders of one (already owner-checked) checkout attempt, current status. */
  forCheckout(tx: TxContext, checkoutAttemptId: string): Promise<CreatedOrder[]>;
}

export const ORDERS_FULFILMENT = Symbol('ORDERS_FULFILMENT');

export type FulfilmentEvent =
  | 'delivery.self_dispatched'
  | 'delivery.self_delivered'
  | 'delivery.pickup_completed';

export interface FulfilmentOrder {
  readonly id: string;
  readonly status: OrderStatus;
  readonly mode: OrderMode;
  readonly deliveryMethod: DeliveryMethod | null;
  readonly version: number;
  readonly financialVersion: number;
  readonly businessId: string;
  readonly customerUserId: string;
  readonly scope: { cityId: string; areaId: string };
}

/** `OrdersFulfilmentPort` for Delivery's verified handover commands only. */
export interface OrdersFulfilmentPort {
  /** Row-locks the order (FOR UPDATE) for the handover transaction. */
  read(tx: TxContext, orderId: string): Promise<FulfilmentOrder | null>;
  apply(
    tx: TxContext,
    input: {
      eventName: FulfilmentEvent;
      orderId: string;
      expectedOrderVersion: number;
      expectedFinancialVersion?: number;
      actorUserId: string;
      handoverId: string | null;
      correlationId: string;
      at: Date;
    },
  ): Promise<FulfilmentOrder>;
}
