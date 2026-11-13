import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import { DELIVERY_EVENT_TYPES } from '@apnatown/shared/delivery';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';
import { REALTIME_SIGNAL, type RealtimeSignal } from '../../../shared/realtime/ports';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import { ORDER_PARTIES, type OrderPartiesPort } from '../../orders/application/order-ports';
import type { StoredJob, StoredOffer } from '../domain/delivery-job';
import type { DispatchContext } from './delivery-dispatch-port';

type JobEventType = (typeof DELIVERY_EVENT_TYPES)[Exclude<keyof typeof DELIVERY_EVENT_TYPES, 'offerCreated'>];

/**
 * Delivery dispatch outbox events + transactional real-time hints (rule 2;
 * "Events and jobs"). Payloads are references only (no address, code,
 * phone or location). Hints fire on commit: the rider gets `delivery`,
 * the order's customer/owner get `order` and refetch through REST.
 */
@Injectable()
export class DispatchEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(REALTIME_SIGNAL) private readonly realtime: RealtimeSignal,
    @Inject(ORDER_PARTIES) private readonly orders: OrderPartiesPort,
    private readonly owners: BusinessOwnerContext,
  ) {}

  async offerCreated(tx: TxContext, offer: StoredOffer, job: StoredJob, ctx: DispatchContext) {
    await this.outbox.append(
      tx,
      this.events.create(
        DELIVERY_EVENT_TYPES.offerCreated,
        { type: 'delivery_offer', id: offer.id, version: offer.version },
        { offerId: offer.id, jobId: job.id, riderUserId: offer.riderUserId, expiresAt: offer.expiresAt.toISOString() },
        ctx.correlationId,
      ),
    );
    await this.rider(tx, offer.riderUserId, job.id);
    await this.parties(tx, job, false);
  }

  /** Job projection/outcome event, then hints to rider, owner and (optionally) customer. */
  async job(
    tx: TxContext,
    type: JobEventType,
    job: StoredJob,
    ctx: DispatchContext & { reasonKey?: string; handoverId?: string },
    customer = true,
  ) {
    const order = await this.orders.parties(tx, job.orderId);
    if (!order) throw new Error('DELIVERY_ORDER_MISSING');
    // DeliveryJobEventPayloadSchema shape (references only).
    const payload: { [key: string]: JsonValue } = {
      orderId: job.orderId,
      jobId: job.id,
      scope: { cityId: job.cityId, areaId: job.areaId },
      orderVersion: order.version,
      financialVersion: order.financialVersion,
      jobVersion: job.version,
      ...(job.riderUserId ? { riderUserId: job.riderUserId } : {}),
      ...(ctx.actorUserId ? { actorUserId: ctx.actorUserId } : {}),
      ...(ctx.handoverId ? { handoverId: ctx.handoverId } : {}),
      ...(ctx.reasonKey ? { reasonKey: ctx.reasonKey } : {}),
    };
    await this.outbox.append(
      tx,
      this.events.create(type, { type: 'delivery_job', id: job.id, version: job.version }, payload, ctx.correlationId),
    );
    if (job.riderUserId) await this.rider(tx, job.riderUserId, job.id);
    await this.parties(tx, job, customer);
  }

  /** The rider's offer/job changed (e.g. offer expired or revoked). */
  rider(tx: TxContext, riderUserId: string, jobId: string) {
    return this.realtime.signal(tx, { kind: 'delivery', userIds: [riderUserId], jobId });
  }

  private async parties(tx: TxContext, job: StoredJob, customer: boolean) {
    const order = await this.orders.parties(tx, job.orderId);
    if (!order) return;
    const owner = await this.owners.ownerUserId(tx, order.businessId);
    const userIds = [...(owner ? [owner] : []), ...(customer ? [order.customerUserId] : [])];
    if (userIds.length) await this.realtime.signal(tx, { kind: 'order', orderId: job.orderId, userIds });
  }
}
