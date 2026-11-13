import { Inject, Injectable } from '@nestjs/common';
import type { TxContext } from '../../../shared/persistence/ports';
import { REALTIME_SIGNAL, type RealtimeSignal } from '../../../shared/realtime/ports';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import type { StoredOrder } from '../domain/order';

/**
 * Real-time "order changed" hint to both parties (customer + current
 * business owner), enqueued in the transition's UoW so it fires only on
 * commit. Order ID only; clients refetch through authorized reads.
 */
@Injectable()
export class OrderRealtime {
  constructor(
    @Inject(REALTIME_SIGNAL) private readonly realtime: RealtimeSignal,
    private readonly owners: BusinessOwnerContext,
  ) {}

  async changed(tx: TxContext, order: StoredOrder): Promise<void> {
    const ownerUserId = await this.owners.ownerUserId(tx, order.businessId);
    await this.realtime.signal(tx, {
      kind: 'order',
      orderId: order.id,
      userIds: ownerUserId ? [order.customerUserId, ownerUserId] : [order.customerUserId],
    });
  }
}
