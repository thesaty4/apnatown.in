import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  PaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import { DeliveryMethodSchema } from './businesses.js';
import { HandoverMetaSchema } from './delivery-handover.js';
import { OrderDeliveryBlockSchema } from './delivery-dispatch.js';

/**
 * Orders wire contracts (specs/orders/be/orders.md; F-OR-001..006, F-VD-008,
 * F-PV-005, F-AD-007; ST-order-delivery/ST-order-pickup; BR-01..05).
 * Money is safe-integer paise; instants are UTC ISO-8601. No DTO carries a
 * handover code, a raw phone or another party's address.
 */

export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'picked_up',
  'cancelled',
  'refunded',
] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const ORDER_MODES = ['delivery', 'pickup'] as const;
export const OrderModeSchema = z.enum(ORDER_MODES);
export type OrderMode = z.infer<typeof OrderModeSchema>;

/** Customer list groups: active = placed..out_for_delivery. */
export const CUSTOMER_ORDER_GROUPS = ['active', 'completed', 'cancelled'] as const;
export const CustomerOrderGroupSchema = z.enum(CUSTOMER_ORDER_GROUPS);
export type CustomerOrderGroup = z.infer<typeof CustomerOrderGroupSchema>;

/** new=placed; in_progress=accepted/preparing; ready_out=ready/out_for_delivery. */
export const BUSINESS_ORDER_TABS = ['new', 'in_progress', 'ready_out', 'completed', 'cancelled'] as const;
export const BusinessOrderTabSchema = z.enum(BUSINESS_ORDER_TABS);
export type BusinessOrderTab = z.infer<typeof BusinessOrderTabSchema>;

export const ADMIN_ORDER_FILTERS = ['all', 'active', 'disputes', 'refunds', 'failed'] as const;
export const AdminOrderFilterSchema = z.enum(ADMIN_ORDER_FILTERS);
export type AdminOrderFilter = z.infer<typeof AdminOrderFilterSchema>;

export const ORDER_TRANSITION_EVENTS = ['accept', 'start_preparing', 'mark_ready'] as const;
export const OrderTransitionEventSchema = z.enum(ORDER_TRANSITION_EVENTS);
export type OrderTransitionEvent = z.infer<typeof OrderTransitionEventSchema>;

/** Prototype CANCEL_R (customer) and vendor reject reasons, as stable keys. */
export const CUSTOMER_CANCEL_REASONS = [
  'ordered_by_mistake',
  'found_better_price',
  'delivery_taking_too_long',
  'change_items_or_address',
  'other',
] as const;
export const BUSINESS_REJECT_REASONS = ['item_out_of_stock', 'shop_closing', 'too_far_to_deliver', 'other'] as const;

export const ORDER_ALLOWED_ACTIONS = [
  'cancel',
  'reject',
  'accept',
  'start_preparing',
  'mark_ready',
  'self_dispatch',
  'self_complete',
  'verify_pickup',
  'view_code',
  /** Owner: (re)request a platform rider (auto-assign) for a ready order. */
  'request_rider',
  /** Owner: offer the ready order to a chosen rider from the candidate list. */
  'assign_rider',
] as const;
export const OrderAllowedActionSchema = z.enum(ORDER_ALLOWED_ACTIONS);
export type OrderAllowedAction = z.infer<typeof OrderAllowedActionSchema>;

export const CustomerOrdersQuerySchema = PageQuerySchema.extend({
  group: CustomerOrderGroupSchema.default('active'),
});
export type CustomerOrdersQuery = z.infer<typeof CustomerOrdersQuerySchema>;

export const BusinessOrdersQuerySchema = PageQuerySchema.extend({
  tab: BusinessOrderTabSchema.default('new'),
});
export type BusinessOrdersQuery = z.infer<typeof BusinessOrdersQuerySchema>;

export const AdminOrdersQuerySchema = PageQuerySchema.extend({
  filter: AdminOrderFilterSchema.default('all'),
});
export type AdminOrdersQuery = z.infer<typeof AdminOrdersQuerySchema>;

export const OrderParamsSchema = z.strictObject({ orderId: IdSchema });
export type OrderParams = z.infer<typeof OrderParamsSchema>;

export const OrderTransitionSchema = z.strictObject({
  event: OrderTransitionEventSchema,
  expectedVersion: VersionSchema,
});
export type OrderTransition = z.infer<typeof OrderTransitionSchema>;

/** `cancel` = customer (own order); `reject` = approved owner (placed only). */
export const OrderCancelSchema = z.discriminatedUnion('event', [
  z.strictObject({
    event: z.literal('cancel'),
    reasonKey: z.enum(CUSTOMER_CANCEL_REASONS),
    expectedVersion: VersionSchema,
  }),
  z.strictObject({
    event: z.literal('reject'),
    reasonKey: z.enum(BUSINESS_REJECT_REASONS),
    expectedVersion: VersionSchema,
  }),
]);
export type OrderCancel = z.infer<typeof OrderCancelSchema>;

/** total = itemsSubtotal − discount + deliveryFee + platformFee. */
export const OrderAmountsSchema = z.strictObject({
  itemsSubtotalPaise: PaiseSchema,
  discountPaise: PaiseSchema,
  deliveryFeePaise: PaiseSchema,
  platformFeePaise: PaiseSchema,
  totalPaise: PaiseSchema,
});
export type OrderAmounts = z.infer<typeof OrderAmountsSchema>;

export const PAYMENT_METHODS = ['upi', 'card', 'net_banking', 'wallet', 'cash'] as const;
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'collected', 'refunded'] as const;
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);

/** Payments-owned `OrderPaymentSummary` subset (cash = COD / pay at pickup). */
export const OrderPaymentSummarySchema = z.strictObject({
  paymentAttemptId: IdSchema,
  method: PaymentMethodSchema,
  settlementKind: z.enum(['provider', 'cash']),
  status: PaymentStatusSchema,
  fundingSatisfied: z.boolean(),
  orderedAmountPaise: PaiseSchema,
  currentPayablePaise: PaiseSchema,
  fundedPaise: PaiseSchema,
  refundedPaise: PaiseSchema,
  outstandingPaise: PaiseSchema,
  collectedAt: TimestampSchema.nullable(),
});
export type OrderPaymentSummary = z.infer<typeof OrderPaymentSummarySchema>;

export const OrderBusinessSchema = z.strictObject({
  id: IdSchema,
  kind: z.enum(['shop', 'provider']),
  nameEn: z.string().min(1).max(200),
  nameHi: z.string().max(200).nullable(),
  slug: z.string().max(100).nullable(),
  areaNameEn: z.string().max(120).nullable(),
  areaNameHi: z.string().max(120).nullable(),
});

export const OrderItemSchema = z.strictObject({
  id: IdSchema,
  productId: IdSchema.nullable(),
  variantId: IdSchema.nullable(),
  variantLabel: z.string().max(60).nullable(),
  nameEn: z.string().min(1).max(200),
  nameHi: z.string().max(200).nullable(),
  unitPricePaise: PaiseSchema,
  orderedQuantity: z.number().int().min(1),
  fulfilledQuantity: z.number().int().min(0),
  orderedLineTotalPaise: PaiseSchema,
  fulfilledLineTotalPaise: PaiseSchema,
  availability: z.enum(['ordered', 'unavailable']),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderTimelineEntrySchema = z.strictObject({
  status: OrderStatusSchema,
  at: TimestampSchema,
  actorKind: z.enum(['customer', 'business', 'rider', 'system']),
  reasonKey: z.string().max(60).nullable(),
});

/** Delivery address snapshot (the order's customer and owning business only). */
export const OrderDeliveryAddressSchema = z.strictObject({
  label: z.string().max(40).nullable(),
  addressText: z.string().min(1).max(500),
  landmark: z.string().max(200).nullable(),
  /** Null only for imported historical orders without a PIN. */
  pinCode: z.string().regex(/^\d{6}$/).nullable(),
});

export const OrderDetailSchema = z.strictObject({
  id: IdSchema,
  orderNumber: z.string().min(1).max(24),
  viewer: z.enum(['customer', 'business', 'admin']),
  version: VersionSchema,
  financialVersion: VersionSchema,
  status: OrderStatusSchema,
  mode: OrderModeSchema,
  deliveryMethod: DeliveryMethodSchema.nullable(),
  placedAt: TimestampSchema,
  business: OrderBusinessSchema,
  /** First name only; null for the customer's own view. */
  customer: z.strictObject({ firstName: z.string().max(60).nullable() }).nullable(),
  deliveryAddress: OrderDeliveryAddressSchema.nullable(),
  pickup: z
    .strictObject({ addressText: z.string().max(500).nullable(), instructions: z.string().max(300).nullable() })
    .nullable(),
  items: z.array(OrderItemSchema),
  orderedAmounts: OrderAmountsSchema,
  fulfilledAmounts: OrderAmountsSchema,
  currentPayablePaise: PaiseSchema,
  payment: OrderPaymentSummarySchema,
  handover: HandoverMetaSchema,
  timeline: z.array(OrderTimelineEntrySchema),
  /** Cases are not implemented yet; always empty. */
  cases: z.array(z.never()),
  allowedActions: z.array(OrderAllowedActionSchema),
  /** Platform-rider job/assignment projection; null for self/pickup or before ready. */
  delivery: OrderDeliveryBlockSchema.nullable(),
  /** Legacy notice; rider dispatch ships, so the API now always sends null. */
  fulfilmentNotice: z.enum(['rider_dispatch_unavailable']).nullable(),
});
export type OrderDetail = z.infer<typeof OrderDetailSchema>;

const itemSummary = z.strictObject({
  nameEn: z.string().min(1).max(200),
  nameHi: z.string().max(200).nullable(),
  moreCount: CountSchema,
});

export const CustomerOrderCardSchema = z.strictObject({
  id: IdSchema,
  orderNumber: z.string().min(1).max(24),
  business: OrderBusinessSchema.pick({ id: true, nameEn: true, nameHi: true }),
  itemSummary,
  itemCount: CountSchema,
  mode: OrderModeSchema,
  status: OrderStatusSchema,
  orderedTotalPaise: PaiseSchema,
  currentPayablePaise: PaiseSchema,
  placedAt: TimestampSchema,
});
export const CustomerOrderCountsSchema = z.strictObject({
  active: CountSchema,
  completed: CountSchema,
  cancelled: CountSchema,
});
export const CustomerOrderPageSchema = z.strictObject({
  items: z.array(CustomerOrderCardSchema),
  counts: CustomerOrderCountsSchema,
  nextCursor: CursorSchema.nullable(),
  asOf: TimestampSchema,
});
export type CustomerOrderPage = z.infer<typeof CustomerOrderPageSchema>;

export const BusinessOrderCountsSchema = z.strictObject({
  asOf: TimestampSchema,
  new: CountSchema,
  inProgress: CountSchema,
  readyOut: CountSchema,
  completed: CountSchema,
  cancelled: CountSchema,
});
export type BusinessOrderCounts = z.infer<typeof BusinessOrderCountsSchema>;

export const BusinessOrderCardSchema = z.strictObject({
  id: IdSchema,
  orderNumber: z.string().min(1).max(24),
  version: VersionSchema,
  customerFirstName: z.string().max(60).nullable(),
  itemSummary,
  itemCount: CountSchema,
  mode: OrderModeSchema,
  deliveryMethod: DeliveryMethodSchema.nullable(),
  status: OrderStatusSchema,
  orderedTotalPaise: PaiseSchema,
  currentPayablePaise: PaiseSchema,
  paymentMethod: PaymentMethodSchema,
  paymentStatus: PaymentStatusSchema,
  placedAt: TimestampSchema,
});
export const BusinessOrderPageSchema = z.strictObject({
  items: z.array(BusinessOrderCardSchema),
  counts: BusinessOrderCountsSchema,
  nextCursor: CursorSchema.nullable(),
  asOf: TimestampSchema,
});
export type BusinessOrderPage = z.infer<typeof BusinessOrderPageSchema>;

export const AdminOrderCardSchema = z.strictObject({
  id: IdSchema,
  orderNumber: z.string().min(1).max(24),
  business: OrderBusinessSchema.pick({ id: true, nameEn: true, nameHi: true }),
  cityId: IdSchema,
  areaId: IdSchema,
  mode: OrderModeSchema,
  deliveryMethod: DeliveryMethodSchema.nullable(),
  status: OrderStatusSchema,
  orderedTotalPaise: PaiseSchema,
  paymentMethod: PaymentMethodSchema,
  paymentStatus: PaymentStatusSchema,
  placedAt: TimestampSchema,
});
export const AdminOrderPageSchema = z.strictObject({
  items: z.array(AdminOrderCardSchema),
  nextCursor: CursorSchema.nullable(),
  asOf: TimestampSchema,
});
export type AdminOrderPage = z.infer<typeof AdminOrderPageSchema>;

export const ORDER_EVENT_TYPES = Object.freeze({
  created: 'order.created',
  statusChanged: 'order.status_changed',
  cancelled: 'order.cancelled',
} as const);

const OrderEventScopeSchema = z.strictObject({ cityId: IdSchema, areaId: IdSchema });

/** `order.created` payload (orders BE "Event contracts"); references only. */
export const OrderCreatedPayloadSchema = z.strictObject({
  orderId: IdSchema,
  checkoutAttemptId: IdSchema,
  businessId: IdSchema,
  customerUserId: IdSchema,
  scope: OrderEventScopeSchema,
  mode: OrderModeSchema,
  deliveryMethod: DeliveryMethodSchema.nullable(),
  paymentAttemptId: IdSchema,
  financialVersion: VersionSchema,
  status: z.literal('placed'),
});
export type OrderCreatedPayload = z.infer<typeof OrderCreatedPayloadSchema>;

/** `order.status_changed` payload; emitted once per transition. */
export const OrderStatusChangedPayloadSchema = z.strictObject({
  orderId: IdSchema,
  businessId: IdSchema,
  scope: OrderEventScopeSchema,
  mode: OrderModeSchema,
  deliveryMethod: DeliveryMethodSchema.nullable(),
  fromStatus: OrderStatusSchema,
  toStatus: OrderStatusSchema,
  financialVersion: VersionSchema,
  reasonKey: z.string().min(1).max(64).optional(),
});
export type OrderStatusChangedPayload = z.infer<typeof OrderStatusChangedPayloadSchema>;

/** `order.cancelled` adds the cancellation source and custody disposition. */
export const OrderCancelledPayloadSchema = OrderStatusChangedPayloadSchema.extend({
  cancellationSource: z.enum(['customer', 'business', 'delivery']),
  /** post_pickup: rider failure after collection; stock stays held (no restock). */
  custody: z.enum(['pre_pickup', 'post_pickup']),
});
export type OrderCancelledPayload = z.infer<typeof OrderCancelledPayloadSchema>;
