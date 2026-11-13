import type { DeliveryMethod } from '@apnatown/shared/businesses';
import type { OrderAmounts, OrderMode, OrderStatus } from '@apnatown/shared/orders';
import type { TxContext } from '../../../shared/persistence/ports';

/** Purchase-time business facts (immutable; later profile edits never apply). */
export interface BusinessSnapshot {
  readonly id: string;
  readonly kind: 'shop' | 'provider';
  readonly nameEn: string;
  readonly nameHi: string | null;
  readonly slug: string | null;
  readonly areaNameEn: string | null;
  readonly areaNameHi: string | null;
  readonly addressText: string | null;
  readonly pickupInstructions: string | null;
  readonly version: number;
}

/** Address snapshot: references + pin in clear, text/landmark/location AES-GCM. */
export interface AddressSnapshot {
  readonly addressId: string | null;
  readonly addressVersion: number | null;
  readonly cityId: string;
  readonly areaId: string | null;
  readonly pinCode: string | null;
  readonly ciphertext: string;
}

export interface StoredOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly checkoutAttemptId: string;
  readonly customerUserId: string;
  readonly businessId: string;
  readonly cityId: string;
  readonly areaId: string;
  readonly mode: OrderMode;
  readonly deliveryMethod: DeliveryMethod | null;
  readonly status: OrderStatus;
  readonly paymentAttemptId: string;
  readonly ordered: OrderAmounts;
  readonly fulfilled: OrderAmounts;
  readonly financialVersion: number;
  readonly version: number;
  readonly business: BusinessSnapshot;
  readonly address: AddressSnapshot | null;
  readonly readyAt: Date | null;
  readonly fulfilledAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly placedAt: Date;
}

export interface StoredOrderItem {
  readonly id: string;
  readonly productId: string | null;
  readonly variantId: string | null;
  readonly nameEn: string;
  readonly nameHi: string | null;
  readonly variantLabel: string | null;
  readonly orderedQuantity: number;
  readonly fulfilledQuantity: number;
  readonly unitPricePaise: number;
  readonly orderedLineTotalPaise: number;
  readonly fulfilledLineTotalPaise: number;
  readonly availability: 'ordered' | 'unavailable';
}

export interface StoredHistory {
  readonly fromStatus: OrderStatus | null;
  readonly toStatus: OrderStatus;
  readonly eventKey: string;
  readonly actorUserId: string | null;
  readonly reasonKey: string | null;
  readonly createdAt: Date;
}

export interface NewOrderLine {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly variantLabel: string | null;
  readonly nameEn: string;
  readonly nameHi: string | null;
  readonly quantity: number;
  readonly unitPricePaise: number;
  readonly discountPaise: number;
}

export interface NewOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly checkoutAttemptId: string;
  readonly customerUserId: string;
  readonly businessId: string;
  readonly cityId: string;
  readonly areaId: string;
  readonly mode: OrderMode;
  readonly deliveryMethod: DeliveryMethod | null;
  readonly paymentAttemptId: string;
  readonly amounts: OrderAmounts;
  readonly business: BusinessSnapshot;
  readonly address: AddressSnapshot | null;
  readonly at: Date;
}

export interface OrderListRow {
  readonly id: string;
  readonly orderNumber: string;
  readonly version: number;
  readonly businessId: string;
  readonly businessNameEn: string;
  readonly businessNameHi: string | null;
  readonly customerUserId: string;
  readonly cityId: string;
  readonly areaId: string;
  readonly mode: OrderMode;
  readonly deliveryMethod: DeliveryMethod | null;
  readonly status: OrderStatus;
  readonly orderedTotalPaise: number;
  readonly fulfilledTotalPaise: number;
  readonly placedAt: Date;
  readonly firstItemNameEn: string;
  readonly firstItemNameHi: string | null;
  readonly lineCount: number;
  readonly itemCount: number;
}

export interface Position {
  readonly placedAt: string;
  readonly id: string;
}

export interface AdminVisibility {
  readonly platformWide: boolean;
  readonly cityIds: readonly string[];
  readonly areaIds: readonly string[];
}

export type ListOwner =
  | { readonly kind: 'customer'; readonly userId: string }
  | { readonly kind: 'business'; readonly businessId: string }
  | { readonly kind: 'admin'; readonly visibility: AdminVisibility };

export interface StatusChange {
  readonly id: string;
  readonly expectedVersion: number;
  readonly status: OrderStatus;
  readonly at: Date;
}

export interface StockOperation {
  readonly id: string;
  readonly reservationId: string;
  readonly kind: 'reserve' | 'release';
  readonly sourceKey: string;
  readonly payloadHash: string;
  readonly lines: readonly { orderItemId: string; productId: string; quantity: number }[];
  readonly result: { stocks: readonly { productId: string; version: number; onHand: number }[] };
  readonly at: Date;
}

export const ORDER_WRITES = Symbol('ORDER_WRITES');
export interface OrderWriteRepository {
  insertOrder(tx: TxContext, order: NewOrder): Promise<void>;
  insertItems(tx: TxContext, orderId: string, lines: readonly NewOrderLine[], at: Date): Promise<void>;
  insertAllocations(
    tx: TxContext,
    input: { orderId: string; reservationId: string; lines: readonly NewOrderLine[]; at: Date },
  ): Promise<void>;
  insertHistory(
    tx: TxContext,
    orderId: string,
    entry: Omit<StoredHistory, 'createdAt'> & { id: string; at: Date },
  ): Promise<void>;
  /** False when the source key is already claimed (replay). */
  claimStockOperation(tx: TxContext, operation: StockOperation): Promise<boolean>;
  lock(tx: TxContext, orderId: string): Promise<StoredOrder | null>;
  updateStatus(tx: TxContext, change: StatusChange): Promise<StoredOrder | null>;
  /** Locks the order's still-reserved allocations. */
  reservedAllocations(
    tx: TxContext,
    orderId: string,
  ): Promise<{ orderItemId: string; productId: string; quantity: number }[]>;
  settleAllocations(
    tx: TxContext,
    input: { orderId: string; disposition: 'released' | 'fulfilled'; at: Date },
  ): Promise<void>;
}

export const ORDER_READS = Symbol('ORDER_READS');
export interface OrderReadRepository {
  find(tx: TxContext, orderId: string): Promise<StoredOrder | null>;
  byCheckout(tx: TxContext, checkoutAttemptId: string): Promise<StoredOrder[]>;
  items(tx: TxContext, orderId: string): Promise<StoredOrderItem[]>;
  history(tx: TxContext, orderId: string): Promise<StoredHistory[]>;
  page(
    tx: TxContext,
    input: { owner: ListOwner; statuses: readonly OrderStatus[]; after?: Position; limit: number },
  ): Promise<OrderListRow[]>;
  /** Counts per status under the same owner predicate as `page`. */
  counts(tx: TxContext, owner: ListOwner): Promise<Map<OrderStatus, number>>;
  scope(tx: TxContext, orderId: string): Promise<{ cityId: string; areaId: string } | null>;
}
