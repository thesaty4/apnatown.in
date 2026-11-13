import type { OrderMode, OrderStatus } from '@apnatown/shared/orders';
import type { DeliveryMethod } from '@apnatown/shared/businesses';

/**
 * ST-order-delivery / ST-order-pickup as an explicit handler registry keyed
 * `(mode, fromStatus, event)` (solid-dry "Open/Closed"; orders BE rule 3–5).
 * Adding a transition means adding a row; delivery vs pickup differ only by
 * which rows exist. Refunded (verified full refund) is not reachable here:
 * Payments refunds are not implemented in this slice.
 */
export type OrderEvent =
  | 'accept'
  | 'start_preparing'
  | 'mark_ready'
  | 'cancel'
  | 'reject'
  | 'delivery.self_dispatched'
  | 'delivery.self_delivered'
  | 'delivery.pickup_completed';

/** Who may drive the event: customer, approved owner, or Delivery's verified command. */
export type OrderActorKind = 'customer' | 'business' | 'delivery';

export interface TransitionHandler {
  readonly mode: OrderMode;
  readonly from: OrderStatus;
  readonly event: OrderEvent;
  readonly to: OrderStatus;
  readonly actor: OrderActorKind;
  /** Delivery events also bind the configured delivery method. */
  readonly method?: DeliveryMethod;
}

const rows: readonly TransitionHandler[] = [
  // Delivery mode.
  { mode: 'delivery', from: 'placed', event: 'accept', to: 'accepted', actor: 'business' },
  { mode: 'delivery', from: 'accepted', event: 'start_preparing', to: 'preparing', actor: 'business' },
  { mode: 'delivery', from: 'preparing', event: 'mark_ready', to: 'ready', actor: 'business' },
  { mode: 'delivery', from: 'placed', event: 'reject', to: 'cancelled', actor: 'business' },
  { mode: 'delivery', from: 'placed', event: 'cancel', to: 'cancelled', actor: 'customer' },
  { mode: 'delivery', from: 'accepted', event: 'cancel', to: 'cancelled', actor: 'customer' },
  { mode: 'delivery', from: 'preparing', event: 'cancel', to: 'cancelled', actor: 'customer' },
  {
    mode: 'delivery', from: 'ready', event: 'delivery.self_dispatched',
    to: 'out_for_delivery', actor: 'delivery', method: 'self',
  },
  {
    mode: 'delivery', from: 'out_for_delivery', event: 'delivery.self_delivered',
    to: 'delivered', actor: 'delivery', method: 'self',
  },
  // Pickup mode: no preparing/out_for_delivery states.
  { mode: 'pickup', from: 'placed', event: 'accept', to: 'accepted', actor: 'business' },
  { mode: 'pickup', from: 'accepted', event: 'mark_ready', to: 'ready', actor: 'business' },
  { mode: 'pickup', from: 'placed', event: 'reject', to: 'cancelled', actor: 'business' },
  { mode: 'pickup', from: 'placed', event: 'cancel', to: 'cancelled', actor: 'customer' },
  { mode: 'pickup', from: 'accepted', event: 'cancel', to: 'cancelled', actor: 'customer' },
  { mode: 'pickup', from: 'ready', event: 'delivery.pickup_completed', to: 'picked_up', actor: 'delivery' },
];

const key = (mode: OrderMode, from: OrderStatus, event: OrderEvent) => `${mode}:${from}:${event}`;

export const TRANSITIONS: ReadonlyMap<string, TransitionHandler> = new Map(
  rows.map((row) => [key(row.mode, row.from, row.event), row]),
);

export function findTransition(
  mode: OrderMode,
  from: OrderStatus,
  event: OrderEvent,
): TransitionHandler | null {
  return TRANSITIONS.get(key(mode, from, event)) ?? null;
}

/** Events an actor could submit from the current state (for allowedActions). */
export function availableEvents(mode: OrderMode, from: OrderStatus, actor: OrderActorKind): OrderEvent[] {
  return rows.filter((row) => row.mode === mode && row.from === from && row.actor === actor).map((row) => row.event);
}

export const ACTIVE_STATUSES: readonly OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'];
export const COMPLETED_STATUSES: readonly OrderStatus[] = ['delivered', 'picked_up'];
export const CANCELLED_STATUSES: readonly OrderStatus[] = ['cancelled', 'refunded'];

/** Business tabs (orders BE rule 13). */
export const BUSINESS_TAB_STATUSES = {
  new: ['placed'],
  in_progress: ['accepted', 'preparing'],
  ready_out: ['ready', 'out_for_delivery'],
  completed: COMPLETED_STATUSES,
  cancelled: CANCELLED_STATUSES,
} as const satisfies Record<string, readonly OrderStatus[]>;

export const CUSTOMER_GROUP_STATUSES = {
  active: ACTIVE_STATUSES,
  completed: COMPLETED_STATUSES,
  cancelled: CANCELLED_STATUSES,
} as const satisfies Record<string, readonly OrderStatus[]>;

export const ORDER_STATUSES_ALL: readonly OrderStatus[] = [
  ...ACTIVE_STATUSES,
  ...COMPLETED_STATUSES,
  ...CANCELLED_STATUSES,
];
