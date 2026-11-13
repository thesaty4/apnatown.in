import { Inject, Injectable } from '@nestjs/common';
import type { DeliveryCodeKind, HandoverResult, SelfComplete } from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import {
  ORDERS_FULFILMENT,
  type FulfilmentEvent,
  type FulfilmentOrder,
  type OrdersFulfilmentPort,
} from '../../orders/application/order-ports';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import { codeState, type StoredDeliveryCode } from '../domain/delivery-code';
import { DeliveryCodesService } from './delivery-codes.service';

export type Rejected = { rejected: 'DELIVERY_CODE_INVALID' | 'DELIVERY_CODE_LOCKED' };

/**
 * Code verification + explicit cash confirmation (delivery BE rules 8/9).
 * Locks the live generation, compares the keyed hash in constant time and
 * only then checks cash; nothing is consumed unless every guard passes.
 */
@Injectable()
export class HandoverVerifier {
  constructor(
    @Inject(ORDERS_FULFILMENT) private readonly orders: OrdersFulfilmentPort,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly codes: DeliveryCodesService,
  ) {}

  async check(
    tx: TxContext,
    input: { order: FulfilmentOrder; kind: DeliveryCodeKind; input: SelfComplete; at: Date; correlationId: string },
  ): Promise<{ code: StoredDeliveryCode; outstandingPaise: number } | Rejected> {
    const code = await this.live(tx, input.order.id, input.kind, input.at);
    if (code.generation !== input.input.codeVersion) throw new DomainError('DELIVERY_VERSION_CONFLICT');
    if (!this.codes.cipher.verify(code, input.input.code, code.codeHash)) {
      const after = await this.codes.codes.recordFailure(tx, code.id, input.at);
      if (!after.lockedAt) return { rejected: 'DELIVERY_CODE_INVALID' };
      await this.outbox.append(
        tx,
        this.events.create(
          'delivery.code_locked',
          { type: 'order', id: input.order.id, version: input.order.version },
          { orderId: input.order.id, kind: code.kind, codeVersion: code.generation },
          input.correlationId,
        ),
      );
      return { rejected: 'DELIVERY_CODE_LOCKED' };
    }
    const payment = await this.payments.summary(tx, input.order.id, true);
    if (!payment) throw new Error('ORDER_PAYMENT_MISSING');
    if (payment.outstandingPaise > 0 && !input.input.cashCollected)
      throw new DomainError('DELIVERY_COD_NOT_CONFIRMED');
    return { code, outstandingPaise: payment.outstandingPaise };
  }

  async commit(
    tx: TxContext,
    input: {
      order: FulfilmentOrder;
      code: StoredDeliveryCode;
      event: FulfilmentEvent;
      actorUserId: string;
      outstandingPaise: number;
      correlationId: string;
      at: Date;
    },
  ): Promise<HandoverResult> {
    const handoverId = this.ids.uuidv7();
    const consumed = await this.codes.codes.consume(tx, {
      id: input.code.id, handoverId, actorUserId: input.actorUserId, at: input.at,
    });
    if (!consumed) throw new DomainError('DELIVERY_CODE_CONSUMED');
    const after = await this.orders.apply(tx, {
      eventName: input.event,
      orderId: input.order.id,
      expectedOrderVersion: input.order.version,
      expectedFinancialVersion: input.order.financialVersion,
      actorUserId: input.actorUserId,
      handoverId,
      correlationId: input.correlationId,
      at: input.at,
    });
    const payment =
      input.outstandingPaise > 0
        ? await this.payments.recordCashCollection(tx, {
            orderId: input.order.id,
            collectionKey: `handover:${handoverId}`,
            verifiedHandoverId: handoverId,
            expectedFinancialVersion: input.order.financialVersion,
            actorUserId: input.actorUserId,
            correlationId: input.correlationId,
            at: input.at,
          })
        : await this.payments.summary(tx, input.order.id);
    if (!payment) throw new Error('ORDER_PAYMENT_MISSING');
    return {
      handoverId,
      orderId: after.id,
      orderStatus: after.status as HandoverResult['orderStatus'],
      orderVersion: after.version,
      financialVersion: after.financialVersion,
      payment: {
        status: payment.status,
        collectedPaise: payment.status === 'collected' ? payment.fundedPaise : null,
        outstandingPaise: payment.outstandingPaise,
      },
      completedAt: input.at.toISOString(),
    };
  }

  /** The usable generation of `kind`, or the specific not-usable error. */
  private async live(tx: TxContext, orderId: string, kind: DeliveryCodeKind, now: Date): Promise<StoredDeliveryCode> {
    const code = await this.codes.codes.live(tx, orderId, true);
    if (!code || code.kind !== kind) {
      const latest = await this.codes.codes.latest(tx, orderId);
      throw new DomainError(latest?.consumedAt ? 'DELIVERY_CODE_CONSUMED' : 'DELIVERY_CODE_NOT_READY');
    }
    const state = codeState(code, now);
    if (state === 'locked') throw new DomainError('DELIVERY_CODE_LOCKED');
    if (state === 'expired') throw new DomainError('DELIVERY_CODE_EXPIRED');
    return code;
  }
}
