import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  RiderDisputeResultSchema,
  type RiderDisputeInput,
  type RiderDisputeResult,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  SUPPORT_INTAKE,
  type SupportIntakePort,
} from '../../settings/application/settings-ports';
import {
  DELIVERY_JOB_READ,
  type DeliveryJobReadPort,
} from './delivery-ports';
import { RiderAccess, type RiderCommand } from './rider-access';

const KEY = /^[A-Za-z0-9._:-]{1,128}$/;

/**
 * Rider disputes (F-RD-008, rule 14). A job-linked dispute must name the
 * rider's own assigned/completed job and goes to Orders' case port, which has
 * not shipped: no such job can exist, so it is DELIVERY_JOB_NOT_FOUND. A
 * jobless report delegates to Settings' support intake (its validation and
 * 5/hour limit apply) and returns the persisted support message ID. The
 * Idempotency-Key becomes a hashed, user-bound intake sourceKey, so a retry
 * returns the same message instead of a duplicate (Settings dedupes by
 * source + sourceKey).
 */
@Injectable()
export class RiderDisputeService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(DELIVERY_JOB_READ) private readonly jobs: DeliveryJobReadPort,
    @Inject(SUPPORT_INTAKE) private readonly support: SupportIntakePort,
    private readonly access: RiderAccess,
  ) {}

  async open(
    request: RiderCommand,
    input: RiderDisputeInput,
  ): Promise<RiderDisputeResult> {
    if (typeof request.key !== 'string' || !KEY.test(request.key))
      throw new DomainError('COMMON_VALIDATION_FAILED', {
        field: 'Idempotency-Key',
      });
    const userId = await this.uow.run(async (tx) => {
      const principal = await this.access.principal(tx, request);
      if (
        input.jobId &&
        !(await this.jobs.historyDetail(tx, {
          riderUserId: principal.userId,
          jobId: input.jobId,
        }))
      )
        throw new DomainError('DELIVERY_JOB_NOT_FOUND');
      return principal.userId;
    });
    // TODO(orders): job-linked disputes call OrdersCasePort.openForRider.
    if (input.jobId) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    const accepted = await this.support.create({
      userId,
      message: `Rider dispute (${input.reasonKey}): ${input.details}`,
      source: 'rider',
      sourceKey: `rider-dispute:${createHash('sha256')
        .update(`${userId}\0${request.key}`)
        .digest('hex')}`,
    });
    return RiderDisputeResultSchema.parse({
      kind: 'support',
      supportMessageId: accepted.id,
    });
  }
}
