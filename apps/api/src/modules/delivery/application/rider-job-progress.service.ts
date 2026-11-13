import { Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  DELIVERY_EVENT_TYPES,
  RiderJobEventResultSchema,
  type RiderJobEventInput,
  type RiderJobEventResult,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { riderEdge, type StoredJob } from '../domain/delivery-job';
import type { HandoverCommand } from './handover-support';
import { RiderJobCommands, isActive, type LockedAssignment } from './rider-job-commands';

const EVENT_TYPE = {
  reached_shop: DELIVERY_EVENT_TYPES.reachedShop,
  picked_up: DELIVERY_EVENT_TYPES.pickedUp,
  reached_drop: DELIVERY_EVENT_TYPES.reachedDrop,
  failed: DELIVERY_EVENT_TYPES.failed,
} as const;

/**
 * Rider job progress (F-RD-004, rule 5): accepted -> reached_shop ->
 * picked_up -> reached_drop; fail from any active step with a reason.
 * picked_up needs the order ready and the full current item checklist at
 * the current financial version, then moves the order to out_for_delivery
 * (which issues the customer's delivery OTP). fail cancels the order through
 * Orders' failure-only edge; after pickup stock stays held (no restock).
 */
@Injectable()
export class RiderJobProgressService {
  constructor(private readonly base: RiderJobCommands) {}

  record(request: HandoverCommand, jobId: string, input: RiderJobEventInput): Promise<RiderJobEventResult> {
    return this.base.run<RiderJobEventResult & JsonValue>(
      request, `delivery.job_${input.event}`, `/delivery/jobs/${jobId}/events`, input as JsonValue,
      async (tx) => {
        const locked = await this.base.lockAssigned(tx, request, jobId);
        const { job, order } = locked;
        if (job.version !== input.expectedVersion || order.version !== input.expectedOrderVersion)
          throw new DomainError('DELIVERY_VERSION_CONFLICT');
        if (input.expectedFinancialVersion !== undefined && input.expectedFinancialVersion !== order.financialVersion)
          throw new DomainError('DELIVERY_VERSION_CONFLICT');
        const to = riderEdge(job.status, input.event);
        if (!to) throw new DomainError('DELIVERY_INVALID_TRANSITION');
        const updated = await this.apply(tx, locked, to, input);
        return (await this.result(tx, request, updated)) as RiderJobEventResult & JsonValue;
      },
      {
        store: (result) => ({ jobId: result.jobId }),
        replay: async (tx) => {
          await this.base.access.approved(tx, request);
          const job = await this.base.assignment.jobs.find(tx, jobId);
          if (!job || job.riderUserId !== request.actorId) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
          return (await this.result(tx, request, job)) as RiderJobEventResult & JsonValue;
        },
      },
    );
  }

  private async apply(
    tx: TxContext,
    { job, order, ctx }: LockedAssignment,
    to: 'reached_shop' | 'picked_up' | 'reached_drop' | 'failed',
    input: RiderJobEventInput,
  ): Promise<StoredJob> {
    const { support, assignment } = this.base;
    let checked: { itemIds: string[]; financialVersion: number } | undefined;
    if (to === 'picked_up') {
      if (order.status !== 'ready') throw new DomainError('DELIVERY_INVALID_TRANSITION');
      checked = await this.checklist(tx, order.id, input.checkedItemIds ?? [], order.financialVersion);
    }
    const updated = await assignment.jobs.progress(tx, {
      id: job.id,
      expectedVersion: job.version,
      status: to,
      ...(input.failReason ? { failReason: input.failReason } : {}),
      ...(checked ? { checked } : {}),
      at: ctx.at,
    });
    if (!updated) throw new DomainError('DELIVERY_VERSION_CONFLICT');
    if (to === 'picked_up' || to === 'failed')
      await support.orders.apply(tx, {
        eventName: to === 'picked_up' ? 'delivery.picked_up' : 'delivery.failed',
        orderId: order.id,
        expectedOrderVersion: order.version,
        expectedFinancialVersion: order.financialVersion,
        actorUserId: ctx.actorUserId!,
        handoverId: null,
        ...(input.failReason ? { reasonKey: input.failReason } : {}),
        correlationId: ctx.correlationId,
        at: ctx.at,
      });
    await assignment.events.job(tx, EVENT_TYPE[to], updated, {
      ...ctx,
      ...(input.failReason ? { reasonKey: input.failReason } : {}),
    });
    return updated;
  }

  /** Every current fulfillable item, exactly once (rule 5 / AC13). */
  private async checklist(tx: TxContext, orderId: string, submitted: readonly string[], financialVersion: number) {
    const view = await this.base.support.orders.dispatchView(tx, orderId);
    const current = new Set((view?.items ?? []).filter((item) => item.availability === 'ordered').map((item) => item.id));
    const given = new Set(submitted);
    if (given.size !== submitted.length || given.size !== current.size || [...given].some((id) => !current.has(id)))
      throw new DomainError('DELIVERY_ITEMS_CHANGED');
    return { itemIds: [...given], financialVersion };
  }

  private async result(tx: TxContext, request: HandoverCommand, job: StoredJob): Promise<RiderJobEventResult> {
    const order = await this.base.support.orders.dispatchView(tx, job.orderId);
    if (!order) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    return RiderJobEventResultSchema.parse({
      jobId: job.id,
      jobStatus: job.status,
      jobVersion: job.version,
      orderId: job.orderId,
      orderVersion: order.version,
      job: isActive(job) ? await this.base.activeView(tx, request, job.id) : null,
    });
  }
}
