import { Inject, Injectable } from '@nestjs/common';
import { DELIVERY_EVENT_TYPES } from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import {
  DELIVERY_JOB_REPOSITORY,
  DELIVERY_OFFER_REPOSITORY,
  DELIVERY_OFFER_TTL_MS,
  type DeliveryJobRepository,
  type DeliveryOfferRepository,
  type StoredJob,
} from '../domain/delivery-job';
import type { DispatchContext } from './delivery-dispatch-port';
import { DispatchEvents } from './dispatch-events';

/**
 * Offer lifecycle (rule 2, decision D-RD-01): one live 60 s offer per job to
 * the nearest eligible approved/online/idle rider of the job's city, never
 * re-offered to a rider who already had this job's offer; none -> the job
 * stays `requested` with assignment `unassigned`. Callers hold the job row
 * lock (rider -> order -> job -> offer order); rider rows are not locked
 * here because acceptance rechecks eligibility under the rider lock.
 */
@Injectable()
export class DispatchAssignment {
  constructor(
    @Inject(DELIVERY_JOB_REPOSITORY) readonly jobs: DeliveryJobRepository,
    @Inject(DELIVERY_OFFER_REPOSITORY) readonly offers: DeliveryOfferRepository,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    readonly events: DispatchEvents,
  ) {}

  /** Auto-assign: offer the next candidate or mark the job unassigned. */
  async offerNext(tx: TxContext, job: StoredJob, ctx: DispatchContext): Promise<StoredJob> {
    if (job.status !== 'requested') return job;
    const riderUserId = await this.offers.nextCandidate(tx, { jobId: job.id, cityId: job.cityId, now: ctx.at });
    if (!riderUserId) return this.unassign(tx, job, ctx);
    return this.offerTo(tx, job, riderUserId, ctx);
  }

  /** Inserts one live offer + `delivery.offer_created` in the same UoW. */
  async offerTo(tx: TxContext, job: StoredJob, riderUserId: string, ctx: DispatchContext): Promise<StoredJob> {
    const offer = await this.offers.insert(tx, {
      id: this.ids.uuidv7(),
      jobId: job.id,
      riderUserId,
      expiresAt: new Date(ctx.at.getTime() + DELIVERY_OFFER_TTL_MS),
      at: ctx.at,
    });
    const updated = await this.jobs.setAssignmentState(tx, {
      id: job.id, expectedVersion: job.version, state: 'offered', at: ctx.at,
    });
    if (!updated) throw new DomainError('DELIVERY_VERSION_CONFLICT');
    await this.events.offerCreated(tx, offer, updated, ctx);
    return updated;
  }

  /** Closes the job's live offer (rejected/expired/revoked); returns the job. */
  async closeLive(
    tx: TxContext,
    job: StoredJob,
    status: 'rejected' | 'expired' | 'revoked',
    ctx: DispatchContext,
  ): Promise<boolean> {
    const live = await this.offers.liveForJob(tx, job.id, true);
    if (!live) return false;
    if (!(await this.offers.respond(tx, { id: live.id, expectedVersion: live.version, status, at: ctx.at })))
      throw new DomainError('DELIVERY_OFFER_TAKEN');
    await this.events.rider(tx, live.riderUserId, job.id);
    return true;
  }

  /**
   * Worker sweep / lazy expiry of one offer: lock job then offer, recheck
   * it is still live and past expiry, expire it and offer the next rider.
   */
  async expire(tx: TxContext, offerId: string, ctx: DispatchContext): Promise<boolean> {
    const peek = await this.offers.find(tx, offerId);
    if (!peek || peek.status !== 'offered' || peek.expiresAt > ctx.at) return false;
    const job = await this.jobs.find(tx, peek.jobId, true);
    const offer = await this.offers.find(tx, offerId, true);
    if (!job || !offer || offer.status !== 'offered' || offer.expiresAt > ctx.at) return false;
    await this.closeLive(tx, job, 'expired', ctx);
    await this.offerNext(tx, job, ctx);
    return true;
  }

  private async unassign(tx: TxContext, job: StoredJob, ctx: DispatchContext): Promise<StoredJob> {
    if (job.assignmentState === 'unassigned') return job;
    const updated = await this.jobs.setAssignmentState(tx, {
      id: job.id, expectedVersion: job.version, state: 'unassigned', at: ctx.at,
    });
    if (!updated) throw new DomainError('DELIVERY_VERSION_CONFLICT');
    await this.events.job(tx, DELIVERY_EVENT_TYPES.unassigned, updated, ctx, false);
    return updated;
  }
}
