import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  DeliveryDispatchStateSchema,
  RiderCandidatePageSchema,
  type DeliveryAssign,
  type DeliveryDispatchState,
  type DeliveryRequest,
  type RiderCandidatePage,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import type { FulfilmentOrder } from '../../orders/application/order-ports';
import { USER_ROLES, type UserRolePort } from '../../users/application/user-role-port';
import { vehicleLabel, type CandidateRow, type StoredJob } from '../domain/delivery-job';
import type { DispatchContext } from './delivery-dispatch-port';
import { DispatchAssignment } from './dispatch-assignment';
import { DispatchProjection } from './dispatch-projection';
import { DispatchService } from './dispatch.service';
import { HandoverSupport, type HandoverCommand } from './handover-support';

/**
 * Owner dispatch (F-VD-008, S-VEND-04): request/requeue auto-assignment,
 * list eligible riders and direct the offer to one rider (who still accepts
 * within 60 s). Approved owner of the order's business only; ready platform
 * orders; Idempotency-Key + versions; lock order -> job -> offer.
 */
@Injectable()
export class OwnerDispatchService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(USER_ROLES) private readonly roles: UserRolePort,
    private readonly support: HandoverSupport,
    private readonly dispatch: DispatchService,
    private readonly assignment: DispatchAssignment,
    private readonly projection: DispatchProjection,
  ) {}

  request(request: HandoverCommand, orderId: string, input: DeliveryRequest): Promise<DeliveryDispatchState> {
    return this.run(request, orderId, 'request', input, async (tx, order, ctx) => {
      const job = await this.dispatch.ensure(tx, await this.facts(tx, order), ctx);
      if (job.status !== 'requested') return;
      if (job.assignmentState === 'offered') {
        const live = await this.assignment.offers.liveForJob(tx, job.id, true);
        if (live && live.expiresAt > ctx.at) return;
        await this.assignment.closeLive(tx, job, 'expired', ctx);
      }
      await this.assignment.offerNext(tx, job, ctx);
    });
  }

  assign(request: HandoverCommand, orderId: string, input: DeliveryAssign): Promise<DeliveryDispatchState> {
    return this.run(request, orderId, 'assign', input, async (tx, order, ctx) => {
      const existing = await this.assignment.jobs.byOrder(tx, orderId, true);
      if (existing ? input.expectedJobVersion !== existing.version : input.expectedJobVersion !== undefined)
        throw new DomainError('DELIVERY_VERSION_CONFLICT');
      const job = existing ?? (await this.dispatch.create(tx, await this.facts(tx, order), ctx));
      if (job.status !== 'requested') throw new DomainError('DELIVERY_INVALID_TRANSITION');
      const live = await this.assignment.offers.liveForJob(tx, job.id, true);
      if (live?.riderUserId === input.riderUserId && live.expiresAt > ctx.at) return;
      await this.eligible(tx, job, input.riderUserId, ctx.at);
      await this.assignment.closeLive(tx, job, 'revoked', ctx);
      await this.assignment.offerTo(tx, job, input.riderUserId, ctx);
    });
  }

  riders(request: HandoverCommand, orderId: string): Promise<RiderCandidatePage> {
    return this.uow.run(async (tx) => {
      const order = await this.platformOrder(tx, request, orderId);
      const job = await this.assignment.jobs.byOrder(tx, orderId);
      const rows = await this.assignment.offers.candidates(tx, {
        jobId: job?.id ?? null, cityId: job?.cityId ?? order.scope.cityId, now: this.support.clock.now(),
      });
      return RiderCandidatePageSchema.parse({
        jobId: job?.id ?? null,
        jobVersion: job?.version ?? null,
        orderVersion: order.version,
        items: rows.filter((row) => row.fullName).map(candidate),
        nextCursor: null,
      });
    });
  }

  /** Live eligibility recheck for a directed offer (rule 3). */
  private async eligible(tx: TxContext, job: StoredJob, riderUserId: string, now: Date) {
    const row = await this.assignment.offers.candidate(tx, { jobId: job.id, cityId: job.cityId, riderUserId, now });
    if (!row || row.status !== 'approved' || !(await this.roles.hasActiveRole({ userId: riderUserId, role: 'rider' }, tx)))
      throw new DomainError('RIDER_NOT_APPROVED');
    if (row.cityId !== job.cityId) throw new DomainError('RIDER_UNAVAILABLE', { field: 'riderUserId' });
    if (!row.online) throw new DomainError('RIDER_NOT_ONLINE');
    if (row.busy) throw new DomainError('RIDER_HAS_ACTIVE_JOB');
    if (row.pendingOffer || row.declined) throw new DomainError('RIDER_UNAVAILABLE', { field: 'riderUserId' });
  }

  private run(
    request: HandoverCommand,
    orderId: string,
    action: 'request' | 'assign',
    input: DeliveryRequest | DeliveryAssign,
    work: (tx: TxContext, order: FulfilmentOrder, ctx: DispatchContext) => Promise<void>,
  ): Promise<DeliveryDispatchState> {
    const resource = `/delivery/orders/${orderId}/${action}`;
    return this.commands.run(
      this.support.command(request, `delivery.rider_${action}`, resource, input as JsonValue),
      async (tx) => {
        const order = await this.platformOrder(tx, request, orderId, input.expectedOrderVersion);
        const ctx = { at: this.support.clock.now(), correlationId: request.correlationId, actorUserId: request.actorId };
        await work(tx, order, ctx);
        return (await this.state(tx, order)) as DeliveryDispatchState & JsonValue;
      },
      {
        store: (result) => ({ orderId: result.orderId }),
        replay: async (tx) => (await this.state(tx, await this.platformOrder(tx, request, orderId))) as DeliveryDispatchState & JsonValue,
      },
    );
  }

  /** Approved owner + ready platform-rider order (+ expected version). */
  private async platformOrder(tx: TxContext, request: HandoverCommand, orderId: string, expectedVersion?: number) {
    const order = await this.support.ownedOrder(tx, request, orderId);
    if (order.mode !== 'delivery' || order.deliveryMethod !== 'apna_town_rider' || order.status !== 'ready')
      throw new DomainError('DELIVERY_INVALID_TRANSITION');
    if (expectedVersion !== undefined && order.version !== expectedVersion)
      throw new DomainError('DELIVERY_VERSION_CONFLICT');
    return order;
  }

  private async facts(tx: TxContext, order: FulfilmentOrder) {
    const view = await this.support.orders.dispatchView(tx, order.id);
    return {
      orderId: order.id,
      businessId: order.businessId,
      scope: order.scope,
      financialVersion: order.financialVersion,
      dropPoint: view?.address?.location ?? null,
    };
  }

  private async state(tx: TxContext, order: FulfilmentOrder): Promise<DeliveryDispatchState> {
    const delivery = await this.projection.orderBlock(tx, order.id, 'business', this.support.clock.now());
    if (!delivery) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
    return DeliveryDispatchStateSchema.parse({ orderId: order.id, orderVersion: order.version, delivery });
  }
}

function candidate(row: CandidateRow) {
  const reason = row.busy ? 'busy' : row.pendingOffer ? 'pending_offer' : row.declined ? 'declined' : null;
  return {
    riderUserId: row.riderUserId,
    displayName: row.fullName,
    vehicleLabel: vehicleLabel(row.vehicleType, row.vehicleNumber),
    scope: { cityId: row.cityId, areaId: row.areaId },
    // TODO(verify): rider ratings are not published (Reviews RV-Q3).
    ratingAverage: null,
    ratingCount: 0,
    online: row.online,
    available: row.online && reason === null,
    unavailableReason: reason,
    distanceM: row.distanceM,
  };
}
