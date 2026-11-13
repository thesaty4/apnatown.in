import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  RiderDecisionResultSchema,
  type RiderDecision,
  type RiderDecisionResult,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  AdminScopedActor,
  type ScopedAdminActor,
} from '../../admin/application/admin-scoped-actor';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import { receipt } from '../../catalog/application/catalog-mappers';
import {
  USER_ROLES,
  type UserRolePort,
} from '../../users/application/user-role-port';
import {
  RIDER_DECISION_EDGES,
  RIDER_REPOSITORY,
  riderScope,
  type RiderRepository,
  type StoredRider,
} from '../domain/rider';
import type { RiderCommand } from './rider-access';
import { RiderEvents } from './rider-events';

// Local retry horizon, not a retention policy (mirrors Businesses).
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const AUDIT_FIELDS = ['status', 'version', 'cityId', 'areaId', 'isOnline'];

const snapshot = (rider: StoredRider) => ({
  status: rider.status,
  version: rider.version,
  cityId: rider.cityId,
  areaId: rider.areaId,
  isOnline: rider.isOnline,
});

/**
 * ST-approval (rider) admin decisions (F-AD-002, BR-06/BR-12). Permission
 * and the application's city/area scope are rechecked in the command
 * transaction; an admin never decides their own application. Status, the
 * Users rider grant (into approved), audit and outbox commit atomically.
 * Suspension forces offline in the same row update.
 */
@Injectable()
export class RiderDecisionService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
    @Inject(USER_ROLES) private readonly roles: UserRolePort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly admins: AdminScopedActor,
    private readonly events: RiderEvents,
  ) {}

  decide(
    request: RiderCommand,
    riderUserId: string,
    input: RiderDecision,
  ): Promise<RiderDecisionResult> {
    return this.commands.run(
      this.command(request, riderUserId, input),
      async (tx) => {
        const before = await this.live(tx, riderUserId, true);
        const actor = await this.authorize(tx, request, before);
        if (before.version !== input.expectedVersion)
          throw new DomainError('DELIVERY_VERSION_CONFLICT');
        const edge = RIDER_DECISION_EDGES[input.action];
        if (!edge.from.includes(before.status))
          throw new DomainError('RIDER_STATE_CONFLICT');
        const at = this.clock.now();
        if (
          !(await this.riders.transition(tx, {
            userId: riderUserId,
            expectedVersion: input.expectedVersion,
            status: edge.to,
            reason: input.reason ?? null,
            at,
          }))
        )
          throw new DomainError('DELIVERY_VERSION_CONFLICT');
        const after = (await this.riders.find(tx, riderUserId))!;
        await this.record(tx, request, actor, input, before, after);
        return RiderDecisionResultSchema.parse({
          userId: after.userId,
          status: after.status,
          previousStatus: before.status,
          version: after.version,
          decidedAt: at.toISOString(),
        }) as RiderDecisionResult & JsonValue;
      },
      {
        ...receipt(RiderDecisionResultSchema),
        // Replay rechecks the reviewer's current access to the application.
        replay: async (tx, stored) => {
          await this.authorize(tx, request, await this.live(tx, riderUserId));
          return RiderDecisionResultSchema.parse(
            stored,
          ) as RiderDecisionResult & JsonValue;
        },
      },
    );
  }

  /** Users rider grant (idempotent, into approved), audit and outbox. */
  private async record(
    tx: TxContext,
    request: RiderCommand,
    actor: ScopedAdminActor,
    input: RiderDecision,
    before: StoredRider,
    after: StoredRider,
  ): Promise<void> {
    const decisionId = this.ids.uuidv7();
    if (after.status === 'approved')
      await this.roles.assignApprovedRole(
        {
          userId: after.userId,
          role: 'rider',
          sourceId: decisionId,
          caller: 'delivery',
        },
        tx,
      );
    await this.audit.record(tx, {
      actor,
      action: `rider.decision.${input.action}`,
      entityType: 'rider_application',
      entityId: after.userId,
      cityId: after.cityId,
      areaId: after.areaId,
      summary: `Rider ${before.status} -> ${after.status}`,
      before: snapshot(before),
      after: snapshot(after),
      fields: AUDIT_FIELDS,
      correlationId: request.correlationId,
    });
    await this.events.decided(
      tx,
      after,
      { previousStatus: before.status, decisionId },
      request.correlationId,
    );
  }

  /** approvals:edit over the stored city/area; never the applicant. */
  private async authorize(
    tx: TxContext,
    request: RiderCommand,
    rider: StoredRider,
  ): Promise<ScopedAdminActor> {
    const actor = await this.admins.require(tx, request, {
      module: 'approvals',
      action: 'edit',
      scopes: [riderScope(rider)],
    });
    if (actor.userId === rider.userId)
      throw new DomainError('ADMIN_SELF_ACTION');
    return actor;
  }

  private async live(
    tx: TxContext,
    riderUserId: string,
    lock = false,
  ): Promise<StoredRider> {
    const rider = await this.riders.find(tx, riderUserId, lock);
    if (!rider || rider.status === 'draft')
      throw new DomainError('COMMON_NOT_FOUND');
    return rider;
  }

  private command(
    request: RiderCommand,
    riderUserId: string,
    input: RiderDecision,
  ) {
    return this.contexts.create(
      {
        name: 'delivery.rider.application.decide',
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/delivery/admin/riders/${riderUserId}/decision`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(input)) as JsonValue,
      },
    );
  }
}
