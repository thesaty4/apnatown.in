import type { BadgeTone } from '@apnatown/ui/primitives/Badge';
import type { OrderMode, OrderStatus } from '@apnatown/shared/orders';

/** Status → `orders.status.*` key, token tone and icon (prototype `OST`).
 * Status is always icon + text; the tone only reinforces it. */
export const statusView: Record<
  OrderStatus,
  { key: string; tone: BadgeTone; icon: string }
> = {
  placed: { key: 'placed', tone: 'st-placed', icon: '◔' },
  accepted: { key: 'accepted', tone: 'st-accepted', icon: '✓' },
  preparing: { key: 'preparing', tone: 'st-preparing', icon: '◐' },
  ready: { key: 'ready', tone: 'st-ready', icon: '▣' },
  out_for_delivery: { key: 'outForDelivery', tone: 'st-out', icon: '➜' },
  delivered: { key: 'delivered', tone: 'st-delivered', icon: '✔' },
  picked_up: { key: 'pickedUp', tone: 'st-delivered', icon: '✔' },
  cancelled: { key: 'cancelled', tone: 'st-cancelled', icon: '✕' },
  refunded: { key: 'refunded', tone: 'st-refunded', icon: '↺' },
};

/** Pickup's `ready` reads "Ready for pickup". */
export const statusKey = (status: OrderStatus, mode: OrderMode) =>
  status === 'ready' && mode === 'pickup'
    ? 'readyPickup'
    : statusView[status].key;

/** ST-order-delivery / ST-order-pickup happy paths for the timeline. */
export const statusFlow: Record<OrderMode, readonly OrderStatus[]> = {
  delivery: [
    'placed',
    'accepted',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
  ],
  pickup: ['placed', 'accepted', 'ready', 'picked_up'],
};

export const isTerminal = (status: OrderStatus) =>
  ['delivered', 'picked_up', 'cancelled', 'refunded'].includes(status);

/** Payment method → camelCase `*.method.*` key (semantic keys are camelCase). */
export const paymentMethodKey = {
  upi: 'upi',
  card: 'card',
  net_banking: 'netBanking',
  wallet: 'wallet',
  cash: 'cash',
} as const;
