import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { USER_IDENTITY, type UserIdentityPort } from '../../users/application/identity-port';
import {
  ORDER_READS,
  ORDER_WRITES,
  type OrderReadRepository,
  type OrderWriteRepository,
  type StoredOrder,
} from '../domain/order';
import { OrderAddressCipher } from './order-address-cipher';
import { OrderLifecycle } from './order-lifecycle';
import type {
  DispatchOrderSummary,
  DispatchOrderView,
  FulfilmentOrder,
  OrdersFulfilmentPort,
} from './order-ports';
import { firstName } from './order-view';

const project = (order: StoredOrder): FulfilmentOrder => ({
  id: order.id,
  status: order.status,
  mode: order.mode,
  deliveryMethod: order.deliveryMethod,
  version: order.version,
  financialVersion: order.financialVersion,
  businessId: order.businessId,
  customerUserId: order.customerUserId,
  scope: { cityId: order.cityId, areaId: order.areaId },
});

const summary = (order: StoredOrder, itemCount: number): DispatchOrderSummary => ({
  orderId: order.id,
  orderNumber: order.orderNumber,
  businessName: order.business.nameEn,
  businessAreaName: order.business.areaNameEn,
  dropAreaId: order.address?.areaId ?? null,
  dropCityId: order.address?.cityId ?? null,
  itemCount,
});

/**
 * `OrdersFulfilmentPort` (orders BE "Fulfilment outcome map"): Delivery has
 * already verified the actor, code and cash; Orders applies only the exact
 * guarded edge in the same UoW, comparing order/financial versions. Dispatch
 * views give Delivery the current items/labels and, for the assigned rider
 * or the drop point only, the decrypted delivery address.
 */
@Injectable()
export class OrderFulfilmentService implements OrdersFulfilmentPort {
  constructor(
    @Inject(ORDER_WRITES) private readonly writes: OrderWriteRepository,
    @Inject(ORDER_READS) private readonly reads: OrderReadRepository,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    private readonly addresses: OrderAddressCipher,
    private readonly lifecycle: OrderLifecycle,
  ) {}

  async read(tx: TxContext, orderId: string) {
    const order = await this.writes.lock(tx, orderId);
    return order ? project(order) : null;
  }

  async dispatchView(tx: TxContext, orderId: string): Promise<DispatchOrderView | null> {
    const order = await this.reads.find(tx, orderId);
    if (!order) return null;
    const items = (await this.reads.items(tx, orderId)).map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      variantLabel: item.variantLabel,
      quantity: item.orderedQuantity,
      availability: item.availability,
    }));
    const count = items.filter((item) => item.availability === 'ordered').reduce((n, item) => n + item.quantity, 0);
    const [customer] = await this.identity.describe(tx, [order.customerUserId]);
    return {
      ...project(order),
      ...summary(order, count),
      customerFirstName: firstName(customer?.displayName),
      address: order.address ? this.addresses.open(order.id, order.address) : null,
      items,
    };
  }

  async dispatchSummaries(tx: TxContext, orderIds: readonly string[]) {
    const result = new Map<string, DispatchOrderSummary>();
    for (const orderId of new Set(orderIds)) {
      const order = await this.reads.find(tx, orderId);
      if (!order) continue;
      const items = await this.reads.items(tx, orderId);
      const count = items.filter((item) => item.availability === 'ordered').reduce((n, item) => n + item.orderedQuantity, 0);
      result.set(orderId, summary(order, count));
    }
    return result;
  }

  async apply(tx: TxContext, input: Parameters<OrdersFulfilmentPort['apply']>[1]) {
    const order = await this.writes.lock(tx, input.orderId);
    if (!order) throw new DomainError('ORDER_NOT_FOUND');
    if (input.expectedFinancialVersion !== undefined && order.financialVersion !== input.expectedFinancialVersion)
      throw new DomainError('ORDER_VERSION_CONFLICT');
    const after = await this.lifecycle.apply(tx, {
      order,
      event: input.eventName,
      actor: { kind: 'delivery', userId: input.actorUserId },
      expectedVersion: input.expectedOrderVersion,
      reasonKey: input.reasonKey ?? null,
      correlationId: input.correlationId,
      at: input.at,
    });
    return project(after);
  }
}
