import { Inject, Injectable } from '@nestjs/common';
import type { OrderDetail } from '@apnatown/shared/orders';
import type { TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { DELIVERY_CODES, type DeliveryCodesPort } from '../../delivery/application/delivery-codes-port';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import { USER_IDENTITY, type UserIdentityPort } from '../../users/application/identity-port';
import { ORDER_READS, type OrderReadRepository, type StoredOrder } from '../domain/order';
import { OrderAddressCipher } from './order-address-cipher';
import { firstName, orderDetail, type Viewer } from './order-view';

/**
 * Builds the role-minimized `OrderDetailDTO` after the caller's viewer role
 * was authorized: customer/business see the delivery address; business and
 * admin see only the customer's first name; nobody sees a code here.
 */
@Injectable()
export class OrderDetailComposer {
  constructor(
    @Inject(ORDER_READS) private readonly reads: OrderReadRepository,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    @Inject(DELIVERY_CODES) private readonly codes: DeliveryCodesPort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly addresses: OrderAddressCipher,
  ) {}

  async compose(tx: TxContext, order: StoredOrder, viewer: Viewer): Promise<OrderDetail> {
    const payment = await this.payments.summary(tx, order.id);
    if (!payment) throw new Error('ORDER_PAYMENT_MISSING');
    const [items, history, handover] = [
      await this.reads.items(tx, order.id),
      await this.reads.history(tx, order.id),
      await this.codes.handoverState(tx, order.id, this.clock.now()),
    ];
    const name =
      viewer === 'customer'
        ? null
        : firstName((await this.identity.describe(tx, [order.customerUserId]))[0]?.displayName);
    const address =
      viewer !== 'admin' && order.address ? this.addresses.open(order.id, order.address) : null;
    return orderDetail({ order, items, history, payment, handover, viewer, customerFirstName: name, address });
  }
}
