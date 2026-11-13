import { Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  DELIVERY_EVENT_TYPES,
  HandoverResultSchema,
  type HandoverResult,
  type RiderJobComplete,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { riderEarning } from '../domain/delivery-job';
import { DispatchService } from './dispatch.service';
import type { HandoverCommand } from './handover-support';
import { HandoverVerifier, type Rejected } from './handover-verifier';
import { RiderJobCommands } from './rider-job-commands';

type Outcome = { result: HandoverResult } | Rejected;
const REJECTED_STATUS = { DELIVERY_CODE_INVALID: 422, DELIVERY_CODE_LOCKED: 423 } as const;

/**
 * Platform completion (F-RD-004, BR-05, rules 8/9/12): assigned rider at
 * reached_drop, order out_for_delivery. The customer's OTP is verified with
 * the shared HandoverVerifier (constant-time keyed hash, attempt/lock
 * bookkeeping committed as a typed rejection); success consumes the code,
 * delivers the order, records COD cash and persists the immutable earned
 * snapshot from the current rider_earning setting, all in one UoW.
 */
@Injectable()
export class RiderJobCompleteService {
  constructor(
    private readonly base: RiderJobCommands,
    private readonly verifier: HandoverVerifier,
    private readonly dispatch: DispatchService,
  ) {}

  async complete(request: HandoverCommand, jobId: string, input: RiderJobComplete): Promise<HandoverResult> {
    const stored = await this.base.run<JsonValue>(
      request, 'delivery.job_complete', `/delivery/jobs/${jobId}/complete`, { jobId, ...input } as JsonValue,
      async (tx) => (await this.attempt(tx, request, jobId, input)) as JsonValue,
      {
        store: (result) => result,
        replay: async (tx, previous) => {
          await this.base.access.rider(tx, request);
          return previous;
        },
        httpStatus: (result) => {
          const rejected = (result as Outcome as Partial<Rejected>).rejected;
          return rejected ? REJECTED_STATUS[rejected] : 200;
        },
      },
    );
    const outcome = stored as Outcome;
    if ('rejected' in outcome) throw new DomainError(outcome.rejected);
    return HandoverResultSchema.parse(outcome.result);
  }

  private async attempt(tx: TxContext, request: HandoverCommand, jobId: string, input: RiderJobComplete): Promise<Outcome> {
    const { job, order, ctx } = await this.base.lockAssigned(tx, request, jobId);
    if (job.version !== input.expectedVersion || order.version !== input.expectedOrderVersion)
      throw new DomainError('DELIVERY_VERSION_CONFLICT');
    if (input.expectedFinancialVersion !== undefined && input.expectedFinancialVersion !== order.financialVersion)
      throw new DomainError('DELIVERY_VERSION_CONFLICT');
    if (job.status !== 'reached_drop' || order.status !== 'out_for_delivery')
      throw new DomainError('DELIVERY_INVALID_TRANSITION');
    // Completion-time policy (rule 12); unconfigured blocks before any consume.
    const policy = await this.dispatch.earningPolicy(tx);
    const checked = await this.verifier.check(tx, {
      order,
      kind: 'delivery_otp',
      input: {
        code: input.otp,
        codeVersion: input.codeVersion,
        cashCollected: input.cashCollected,
        expectedOrderVersion: input.expectedOrderVersion,
      },
      at: ctx.at,
      correlationId: ctx.correlationId,
    });
    if ('rejected' in checked) return checked;
    const result = await this.verifier.commit(tx, {
      order, code: checked.code, event: 'delivery.delivered', actorUserId: request.actorId,
      outstandingPaise: checked.outstandingPaise, correlationId: ctx.correlationId, at: ctx.at,
    });
    const earning = riderEarning(policy.basePaise, policy.perKmPaise, job.distanceM);
    const delivered = await this.base.assignment.jobs.deliver(tx, {
      id: job.id,
      expectedVersion: job.version,
      earned: {
        basePaise: policy.basePaise,
        perKmPaise: policy.perKmPaise,
        distanceM: job.distanceM,
        ...earning,
        settingsVersion: policy.settingsVersion,
      },
      at: ctx.at,
    });
    if (!delivered) throw new DomainError('DELIVERY_VERSION_CONFLICT');
    await this.base.assignment.events.job(tx, DELIVERY_EVENT_TYPES.delivered, delivered, {
      ...ctx,
      handoverId: result.handoverId,
    });
    return { result: { ...result, jobId: delivered.id, jobVersion: delivered.version } };
  }
}
