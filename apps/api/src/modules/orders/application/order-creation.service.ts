import { randomInt } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import {
  ORDER_READS,
  ORDER_WRITES,
  type NewOrderLine,
  type OrderReadRepository,
  type OrderWriteRepository,
  type StoredOrder,
} from '../domain/order';
import { OrderAddressCipher } from './order-address-cipher';
import { OrderEvents } from './order-events';
import type { CheckoutShopOrder, CreatedOrder, OrdersCreationPort } from './order-ports';
import { OrderStock } from './order-stock';

const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Human-readable `AT-YYMMDD-XXXXXX` (UTC date + 6 CSPRNG symbols); UNIQUE in SQL. */
export function orderNumber(at: Date): string {
  const date = at.toISOString().slice(2, 10).replaceAll('-', '');
  let suffix = '';
  for (let i = 0; i < 6; i += 1) suffix += ALPHABET[randomInt(0, ALPHABET.length)];
  return `AT-${date}-${suffix}`;
}

const toCreated = (order: StoredOrder): CreatedOrder => ({
  id: order.id,
  orderNumber: order.orderNumber,
  businessId: order.businessId,
  business: order.business,
  mode: order.mode,
  totalPaise: order.ordered.totalPaise,
  status: order.status,
});

/**
 * One order per shop (BR-03) with immutable purchase snapshots, a single
 * durable stock reservation for the whole checkout, placed history, payment
 * links and `order.created` per shop — all in the caller's placement UoW.
 */
@Injectable()
export class OrderCreationService implements OrdersCreationPort {
  constructor(
    @Inject(ORDER_WRITES) private readonly writes: OrderWriteRepository,
    @Inject(ORDER_READS) private readonly reads: OrderReadRepository,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly stock: OrderStock,
    private readonly addresses: OrderAddressCipher,
    private readonly events: OrderEvents,
  ) {}

  async createPerShopOrders(
    tx: TxContext,
    input: Parameters<OrdersCreationPort['createPerShopOrders']>[1],
  ): Promise<CreatedOrder[]> {
    if (!input.shops.length) throw new DomainError('ORDER_CHECKOUT_INVALID');
    if (input.shops.some((shop) => shop.mode === 'delivery') && !input.address)
      throw new DomainError('ORDER_CHECKOUT_INVALID');
    const planned = input.shops.map((shop) => ({
      shop,
      orderId: this.ids.uuidv7(),
      lines: shop.lines.map((line): NewOrderLine => ({ ...line, id: this.ids.uuidv7() })),
    }));
    const stockLines = planned.flatMap((plan) =>
      plan.lines.map((line) => ({ orderItemId: line.id, productId: line.productId, quantity: line.quantity })),
    );
    if (!(await this.stock.reserve(tx, input.checkoutAttemptId, stockLines, input.at)))
      throw new DomainError('ORDER_CREATION_CONFLICT');
    const created: CreatedOrder[] = [];
    for (const plan of planned)
      created.push(await this.createOne(tx, input, plan.shop, plan.orderId, plan.lines));
    return created;
  }

  async forCheckout(tx: TxContext, checkoutAttemptId: string): Promise<CreatedOrder[]> {
    return (await this.reads.byCheckout(tx, checkoutAttemptId)).map(toCreated);
  }

  private async createOne(
    tx: TxContext,
    input: Parameters<OrdersCreationPort['createPerShopOrders']>[1],
    shop: CheckoutShopOrder,
    orderId: string,
    lines: readonly NewOrderLine[],
  ): Promise<CreatedOrder> {
    const order = {
      id: orderId,
      orderNumber: orderNumber(input.at),
      checkoutAttemptId: input.checkoutAttemptId,
      customerUserId: input.customerUserId,
      businessId: shop.businessId,
      cityId: shop.scope.cityId,
      areaId: shop.scope.areaId,
      mode: shop.mode,
      deliveryMethod: shop.mode === 'pickup' ? null : shop.deliveryMethod,
      paymentAttemptId: shop.paymentAttemptId,
      amounts: shop.amounts,
      business: shop.business,
      address: shop.mode === 'delivery' && input.address ? this.addresses.seal(orderId, input.address) : null,
      at: input.at,
    };
    await this.writes.insertOrder(tx, order);
    await this.writes.insertItems(tx, orderId, lines, input.at);
    await this.writes.insertAllocations(tx, {
      orderId,
      reservationId: input.checkoutAttemptId,
      lines,
      at: input.at,
    });
    await this.writes.insertHistory(tx, orderId, {
      id: this.ids.uuidv7(),
      fromStatus: null,
      toStatus: 'placed',
      eventKey: 'placed',
      actorUserId: input.customerUserId,
      reasonKey: null,
      at: input.at,
    });
    await this.payments.linkOrder(tx, { paymentAttemptId: shop.paymentAttemptId, orderId, at: input.at });
    const stored = await this.writes.lock(tx, orderId);
    if (!stored) throw new Error('ORDER_INSERT_MISSING');
    await this.events.created(tx, stored, input.correlationId);
    return toCreated(stored);
  }
}
