import type { HandoverMeta, OrderDeliveryBlock } from '@apnatown/shared/delivery';
import {
  OrderDetailSchema,
  type OrderAllowedAction,
  type OrderDetail,
  type OrderPaymentSummary,
} from '@apnatown/shared/orders';
import type { StoredHistory, StoredOrder, StoredOrderItem } from '../domain/order';
import { availableEvents } from '../domain/order-state-machine';
import type { PlainAddress } from './order-address-cipher';

export type Viewer = 'customer' | 'business' | 'admin';

export interface DetailParts {
  readonly order: StoredOrder;
  readonly items: readonly StoredOrderItem[];
  readonly history: readonly StoredHistory[];
  readonly payment: OrderPaymentSummary;
  readonly handover: HandoverMeta;
  readonly delivery: OrderDeliveryBlock | null;
  readonly viewer: Viewer;
  readonly customerFirstName: string | null;
  readonly address: PlainAddress | null;
}

/** First token of the display name only (role minimization). */
export function firstName(displayName: string | null | undefined): string | null {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? first.slice(0, 60) : null;
}

const RIDER_EVENTS = /^delivery\.(picked_up|delivered|failed):/;
const actorKind = (entry: StoredHistory, order: StoredOrder) =>
  entry.actorUserId === null
    ? ('system' as const)
    : entry.actorUserId === order.customerUserId
      ? ('customer' as const)
      : RIDER_EVENTS.test(entry.eventKey)
        ? ('rider' as const)
        : ('business' as const);

/** Owner may (re)request or pick a rider until one accepts (before pickup). */
function riderActions(order: StoredOrder, delivery: OrderDeliveryBlock | null): OrderAllowedAction[] {
  if (order.deliveryMethod !== 'apna_town_rider' || order.status !== 'ready') return [];
  if (delivery && (delivery.jobStatus !== 'requested' || delivery.assignmentState === 'assigned')) return [];
  const live = delivery?.assignmentState === 'offered' && delivery.offerExpiresAt !== null;
  return live ? ['assign_rider'] : ['request_rider', 'assign_rider'];
}

/** Server-derived actions; codes and policy gates, not just status guesses. */
export function allowedActions(
  order: StoredOrder,
  viewer: Viewer,
  handover: HandoverMeta,
  delivery: OrderDeliveryBlock | null = null,
): OrderAllowedAction[] {
  if (viewer === 'admin') return [];
  if (viewer === 'customer') {
    const actions: OrderAllowedAction[] = [];
    if (availableEvents(order.mode, order.status, 'customer').includes('cancel')) actions.push('cancel');
    if (handover.state === 'active') actions.push('view_code');
    return actions;
  }
  const actions = availableEvents(order.mode, order.status, 'business') as OrderAllowedAction[];
  if (order.deliveryMethod === 'self' && order.status === 'ready') actions.push('self_dispatch');
  if (order.deliveryMethod === 'self' && order.status === 'out_for_delivery') actions.push('self_complete');
  if (order.mode === 'pickup' && order.status === 'ready') actions.push('verify_pickup');
  actions.push(...riderActions(order, delivery));
  return actions;
}

export function orderDetail(parts: DetailParts): OrderDetail {
  const { order, viewer } = parts;
  const showAddress = viewer !== 'admin' && order.mode === 'delivery' && parts.address;
  return OrderDetailSchema.parse({
    id: order.id,
    orderNumber: order.orderNumber,
    viewer,
    version: order.version,
    financialVersion: order.financialVersion,
    status: order.status,
    mode: order.mode,
    deliveryMethod: order.deliveryMethod,
    placedAt: order.placedAt.toISOString(),
    business: {
      id: order.business.id,
      kind: order.business.kind,
      nameEn: order.business.nameEn,
      nameHi: order.business.nameHi,
      slug: order.business.slug,
      areaNameEn: order.business.areaNameEn,
      areaNameHi: order.business.areaNameHi,
    },
    customer: viewer === 'customer' ? null : { firstName: parts.customerFirstName },
    deliveryAddress:
      showAddress && parts.address && order.address
        ? {
            label: null,
            addressText: parts.address.addressText,
            landmark: parts.address.landmark,
            pinCode: order.address.pinCode,
          }
        : null,
    pickup:
      order.mode === 'pickup'
        ? { addressText: order.business.addressText, instructions: order.business.pickupInstructions }
        : null,
    items: parts.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      nameEn: item.nameEn,
      nameHi: item.nameHi,
      unitPricePaise: item.unitPricePaise,
      orderedQuantity: item.orderedQuantity,
      fulfilledQuantity: item.fulfilledQuantity,
      orderedLineTotalPaise: item.orderedLineTotalPaise,
      fulfilledLineTotalPaise: item.fulfilledLineTotalPaise,
      availability: item.availability,
    })),
    orderedAmounts: order.ordered,
    fulfilledAmounts: order.fulfilled,
    currentPayablePaise: parts.payment.currentPayablePaise,
    payment: parts.payment,
    handover: parts.handover,
    timeline: parts.history.map((entry) => ({
      status: entry.toStatus,
      at: entry.createdAt.toISOString(),
      actorKind: actorKind(entry, order),
      reasonKey: entry.reasonKey,
    })),
    cases: [],
    allowedActions: allowedActions(order, viewer, parts.handover, parts.delivery),
    delivery: parts.delivery,
    fulfilmentNotice: null,
  });
}
