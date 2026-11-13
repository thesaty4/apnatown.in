import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type IdempotencyResultPolicy,
  type TxContext,
} from '../../../shared/persistence/ports';
import type { FulfilmentOrder } from '../../orders/application/order-ports';
import type { StoredRider } from '../domain/rider';
import { ACTIVE_JOB_STATUSES, type StoredJob } from '../domain/delivery-job';
import type { DispatchContext } from './delivery-dispatch-port';
import { DispatchAssignment } from './dispatch-assignment';
import { HandoverSupport, type HandoverCommand } from './handover-support';
import { RiderAccess } from './rider-access';
import { RiderJobView } from './rider-job-view';

export interface LockedAssignment {
  readonly rider: StoredRider;
  readonly order: FulfilmentOrder;
  readonly job: StoredJob;
  readonly ctx: DispatchContext;
}

/**
 * Shared rider command plumbing: Idempotency-Key contexts and the single
 * lock hierarchy rider -> order -> job (-> offer/code), with live
 * approval/role rechecks inside the transaction (rule 3/8, BR-06).
 */
@Injectable()
export class RiderJobCommands {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    readonly support: HandoverSupport,
    readonly access: RiderAccess,
    readonly assignment: DispatchAssignment,
    readonly view: RiderJobView,
  ) {}

  run<T extends JsonValue>(
    request: HandoverCommand,
    name: string,
    resource: string,
    input: JsonValue,
    work: (tx: TxContext) => Promise<T>,
    policy: IdempotencyResultPolicy<T>,
  ): Promise<T> {
    return this.commands.run(this.support.command(request, name, resource, input), work, policy);
  }

  context(request: HandoverCommand): DispatchContext {
    return { at: this.support.clock.now(), correlationId: request.correlationId, actorUserId: request.actorId };
  }

  /** Locks rider, order and the caller's own job; foreign/missing = 404. */
  async lockAssigned(tx: TxContext, request: HandoverCommand, jobId: string): Promise<LockedAssignment> {
    const rider = await this.access.approved(tx, request, true);
    const peek = await this.assignment.jobs.find(tx, jobId);
    if (!peek || peek.riderUserId !== rider.userId) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    const order = await this.support.orders.read(tx, peek.orderId);
    const job = await this.assignment.jobs.find(tx, jobId, true);
    if (!order || !job || job.riderUserId !== rider.userId) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    return { rider, order, job, ctx: this.context(request) };
  }

  /** Current active job view for the rider (replays reauthorize, never cache PII). */
  async activeView(tx: TxContext, request: HandoverCommand, jobId: string) {
    const rider = await this.access.approved(tx, request);
    const job = await this.assignment.jobs.find(tx, jobId);
    if (!job || job.riderUserId !== rider.userId) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    return isActive(job) ? this.view.job(tx, job) : null;
  }
}

export function isActive(job: StoredJob): boolean {
  return (ACTIVE_JOB_STATUSES as readonly string[]).includes(job.status);
}
