import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { ORDER_WRITES, type OrderWriteRepository, type StoredOrder } from '../domain/order';
import { OrderLifecycle } from './order-lifecycle';
import type { FulfilmentOrder, OrdersFulfilmentPort } from './order-ports';

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

/**
 * `OrdersFulfilmentPort` (orders BE "Fulfilment outcome map"): Delivery has
 * already verified the actor, code and cash; Orders applies only the exact
 * guarded edge in the same UoW, comparing order/financial versions.
 */
@Injectable()
export class OrderFulfilmentService implements OrdersFulfilmentPort {
  constructor(
    @Inject(ORDER_WRITES) private readonly writes: OrderWriteRepository,
    private readonly lifecycle: OrderLifecycle,
  ) {}

  async read(tx: TxContext, orderId: string) {
    const order = await this.writes.lock(tx, orderId);
    return order ? project(order) : null;
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
      reasonKey: null,
      correlationId: input.correlationId,
      at: input.at,
    });
    return project(after);
  }
}
