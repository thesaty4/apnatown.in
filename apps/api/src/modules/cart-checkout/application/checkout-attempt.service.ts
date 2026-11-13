import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  CHECKOUT_EVENT_TYPES,
  CheckoutAttemptSchema,
  type CheckoutAttempt,
  type CheckoutAttemptCreate,
} from '@apnatown/shared/checkout';
import { Money } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import { COMMAND_CONTEXT_FACTORY, HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import { ORDERS_CREATION, type CreatedOrder, type OrdersCreationPort } from '../../orders/application/order-ports';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import { CartSupport, type CartActor } from './cart-support';
import { CHECKOUT_REPOSITORY, type CheckoutRepository, type StoredAttempt } from './checkout-ports';
import { CheckoutPlacement } from './checkout-placement';

/**
 * `POST /checkout/attempts` + `GET /checkout/attempts/{id}` (F-CK-002/006,
 * BR-03/04). Cash (COD / pay at pickup) only: online methods need a payment
 * provider and are rejected. Placement re-verifies the pinned quote, then
 * stock, orders, payment allocations, cart clearing and outbox commit in one
 * idempotent UoW; any failure leaves no order and the cart intact.
 */
@Injectable()
export class CheckoutAttemptService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(CHECKOUT_REPOSITORY) private readonly checkout: CheckoutRepository,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    @Inject(ORDERS_CREATION) private readonly orders: OrdersCreationPort,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly support: CartSupport,
    private readonly placement: CheckoutPlacement,
  ) {}

  create(actor: CartActor, input: CheckoutAttemptCreate): Promise<CheckoutAttempt> {
    const userId = actor.principalId;
    if (!userId) throw new DomainError('SESSION_EXPIRED');
    const now = this.support.clock.now();
    const command = this.contexts.create(
      { name: 'checkout.attempts.create', method: 'POST', scope: 'principal', successStatus: 201 },
      {
        actorId: userId,
        correlationId: actor.correlationId,
        resource: '/checkout/attempts',
        business: null,
        expiresAt: new Date(now.getTime() + RECEIPT_TTL_MS),
      },
      { key: actor.key, payload: input as JsonValue },
    );
    return this.commands.run(
      command,
      async (tx) => {
        await this.support.verifyActor(tx, actor);
        if (input.paymentMethod !== 'cash') throw new DomainError('CHECKOUT_PAYMENT_UNAVAILABLE');
        const at = this.support.clock.now();
        const pinned = await this.placement.verify(tx, userId, input, at);
        const attemptId = this.ids.uuidv7();
        await this.checkout.insertAttempt(tx, {
          id: attemptId, userId, cartId: pinned.cart.id, quoteId: input.quoteId,
          keyHash: Buffer.from(command.keyHash).toString('hex'),
          requestHash: Buffer.from(command.requestHash).toString('hex'),
          paymentMethod: 'cash', expiresAt: pinned.expiresAt, at,
        });
        const shops = this.placement.shops(pinned.quote, pinned.businesses);
        const allocations = shops.map((shop) => ({ id: this.ids.uuidv7(), businessId: shop.businessId, amountPaise: shop.amounts.totalPaise }));
        await this.payments.createCashAllocations(tx, {
          checkoutAttemptId: attemptId, quoteId: input.quoteId, paymentRound: 1, initiatedBy: userId,
          idempotencyKey: Buffer.from(command.keyHash).toString('hex'),
          requestHash: Buffer.from(command.requestHash).toString('hex'), at, allocations,
        });
        const created = await this.orders.createPerShopOrders(tx, {
          checkoutAttemptId: attemptId, customerUserId: userId, address: pinned.address,
          shops: shops.map((shop, i) => ({ ...shop, paymentAttemptId: allocations[i]!.id })),
          correlationId: actor.correlationId, at,
        });
        await this.placement.clearPurchasedLines(tx, pinned.cart.id, pinned.quote, at);
        await this.outbox.append(tx, this.events.create(
          CHECKOUT_EVENT_TYPES.ordersCreated,
          { type: 'checkout_attempt', id: attemptId, version: 1 },
          { checkoutAttemptId: attemptId, paymentRound: 1, quoteId: input.quoteId, orderIds: created.map((o) => o.id) },
          actor.correlationId,
        ));
        return this.dto(
          { id: attemptId, quoteId: input.quoteId, status: 'placed', paymentMethod: 'cash', paymentRound: 1, version: 1, createdAt: at },
          created,
        ) as CheckoutAttempt & JsonValue;
      },
      {
        store: (result) => result,
        replay: async (tx, stored) => {
          await this.support.verifyActor(tx, actor);
          return CheckoutAttemptSchema.parse(stored) as CheckoutAttempt & JsonValue;
        },
      },
    );
  }

  read(actor: CartActor, attemptId: string): Promise<CheckoutAttempt> {
    const userId = actor.principalId;
    if (!userId) throw new DomainError('SESSION_EXPIRED');
    return this.uow.run(async (tx) => {
      await this.support.verifyActor(tx, actor);
      const attempt = await this.checkout.findAttempt(tx, attemptId, userId);
      if (!attempt) throw new DomainError('CHECKOUT_ATTEMPT_NOT_FOUND');
      return this.dto(attempt, await this.orders.forCheckout(tx, attempt.id));
    });
  }

  private dto(attempt: StoredAttempt, orders: readonly CreatedOrder[]): CheckoutAttempt {
    return CheckoutAttemptSchema.parse({
      id: attempt.id,
      version: attempt.version,
      status: attempt.status,
      paymentRound: attempt.paymentRound,
      quoteId: attempt.quoteId,
      paymentMethod: attempt.paymentMethod,
      failureCode: null,
      payment: { method: attempt.paymentMethod, status: 'pending' },
      allowedActions: [],
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        businessId: order.businessId,
        businessNameEn: order.business.nameEn,
        businessNameHi: order.business.nameHi,
        mode: order.mode,
        totalPaise: order.totalPaise,
        status: order.status,
      })),
      totalPaise: orders
        .reduce((sum, order) => sum.add(Money.fromPaise(order.totalPaise)), Money.fromPaise(0))
        .toPaiseNumber(),
      createdAt: attempt.createdAt.toISOString(),
    });
  }
}
