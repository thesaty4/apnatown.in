import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  DELIVERY_EVENT_TYPES,
  RiderJobSchema,
  type DeliveryOfferRespond,
  type RiderJob,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredOffer } from '../domain/delivery-job';
import { DELIVERY_JOB_READ, type DeliveryJobReadPort } from './delivery-ports';
import type { HandoverCommand } from './handover-support';
import { RiderJobCommands } from './rider-job-commands';

/**
 * Offer accept/reject (F-RD-003, rule 3): rider -> order -> job -> offer
 * locks; rechecks live approval/role, online, same city, idle, offer
 * ownership/status/expiry/version and order readiness inside the UoW. The
 * partial unique active-rider index is the final backstop.
 */
@Injectable()
export class RiderOfferService {
  constructor(
    @Inject(DELIVERY_JOB_READ) private readonly reads: DeliveryJobReadPort,
    private readonly base: RiderJobCommands,
  ) {}

  accept(request: HandoverCommand, offerId: string, input: DeliveryOfferRespond): Promise<RiderJob> {
    return this.base.run<RiderJob & JsonValue>(
      request, 'delivery.offer_accept', `/delivery/offers/${offerId}/accept`, input,
      async (tx) => {
        const { offer, job, ctx } = await this.lock(tx, request, offerId, input);
        if (await this.reads.activeJobId(tx, offer.riderUserId)) throw new DomainError('RIDER_HAS_ACTIVE_JOB');
        const { assignment } = this.base;
        if (!(await assignment.offers.respond(tx, { id: offer.id, expectedVersion: offer.version, status: 'accepted', at: ctx.at })))
          throw new DomainError('DELIVERY_OFFER_TAKEN');
        const assigned = await assignment.jobs.assign(tx, {
          id: job.id, expectedVersion: job.version, riderUserId: offer.riderUserId, at: ctx.at,
        });
        if (!assigned) throw new DomainError('DELIVERY_OFFER_TAKEN');
        await assignment.events.job(tx, DELIVERY_EVENT_TYPES.assigned, assigned, ctx);
        return (await this.base.view.job(tx, assigned)) as RiderJob & JsonValue;
      },
      {
        store: (result) => ({ jobId: result.jobId }),
        replay: async (tx, stored) => {
          const view = await this.base.activeView(tx, request, (stored as { jobId: string }).jobId);
          if (!view) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
          return RiderJobSchema.parse(view) as RiderJob & JsonValue;
        },
      },
    );
  }

  async reject(request: HandoverCommand, offerId: string, input: DeliveryOfferRespond): Promise<void> {
    await this.base.run<{ offerId: string }>(
      request, 'delivery.offer_reject', `/delivery/offers/${offerId}/reject`, input,
      async (tx) => {
        const { offer, job, ctx } = await this.lock(tx, request, offerId, input, false);
        await this.base.assignment.closeLive(tx, job, 'rejected', ctx);
        await this.base.assignment.offerNext(tx, job, ctx);
        return { offerId: offer.id };
      },
      {
        store: (result) => result,
        replay: async (tx, stored) => {
          await this.base.access.rider(tx, request);
          return stored as { offerId: string };
        },
      },
    );
  }

  /** Lock hierarchy + offer/job/order guards shared by accept and reject. */
  private async lock(tx: TxContext, request: HandoverCommand, offerId: string, input: DeliveryOfferRespond, accepting = true) {
    const { access, assignment, support } = this.base;
    const rider = accepting ? await access.approved(tx, request, true) : await access.rider(tx, request, true);
    const peek = await assignment.offers.find(tx, offerId);
    if (!peek || peek.riderUserId !== rider.userId) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    const peekJob = await assignment.jobs.find(tx, peek.jobId);
    const order = peekJob ? await support.orders.read(tx, peekJob.orderId) : null;
    const job = await assignment.jobs.find(tx, peek.jobId, true);
    const offer = (await assignment.offers.find(tx, offerId, true)) as StoredOffer;
    const ctx = this.base.context(request);
    if (!job || !order) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    if (offer.status === 'expired' || (offer.status === 'offered' && offer.expiresAt <= ctx.at))
      throw new DomainError('DELIVERY_OFFER_EXPIRED');
    if (offer.status !== 'offered') throw new DomainError('DELIVERY_OFFER_TAKEN');
    if (offer.version !== input.expectedVersion) throw new DomainError('DELIVERY_VERSION_CONFLICT');
    if (accepting) {
      if (!rider.isOnline) throw new DomainError('RIDER_NOT_ONLINE');
      if (rider.cityId !== job.cityId) throw new DomainError('RIDER_UNAVAILABLE', { field: 'offerId' });
      if (job.status !== 'requested' || order.status !== 'ready') throw new DomainError('DELIVERY_OFFER_TAKEN');
    }
    return { rider, order, job, offer, ctx };
  }
}
