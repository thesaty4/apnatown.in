import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  BusinessDecisionResultSchema,
  type BusinessDecision,
  type BusinessDecisionResult,
} from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';
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
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
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
  BUSINESS_REPOSITORY,
  DECISION_EDGES,
  ROLE_FOR_KIND,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import { BusinessEvents } from './business-events';
import { BUSINESS_AUDIT_FIELDS, businessSnapshot } from './business-mappers';
import {
  BusinessReviewer,
  businessScope,
  type ReviewerActor,
} from './business-reviewer';

// Local retry horizon, not a retention policy (mirrors AdminCommands).
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

export interface BusinessAdminCommand {
  session: SessionBinding;
  actorId: string;
  correlationId: string;
  key: unknown;
}

/**
 * ST-approval admin decisions (F-VD-001/F-PV-001, BR-12). Permission and the
 * business's stored area scope are rechecked inside the command transaction;
 * the owner can never decide on their own business. The status change, role
 * grant, audit and outbox events commit atomically.
 */
@Injectable()
export class BusinessDecisionService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(USER_ROLES) private readonly roles: UserRolePort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly reviewer: BusinessReviewer,
    private readonly events: BusinessEvents,
  ) {}

  decide(
    request: BusinessAdminCommand,
    businessId: string,
    input: BusinessDecision,
  ): Promise<BusinessDecisionResult> {
    return this.commands.run(
      this.command(request, businessId, input),
      async (tx) => {
        const before = await this.live(tx, businessId, true);
        const actor = await this.authorize(tx, request, before);
        const after = await this.apply(tx, request, actor, before, input);
        return BusinessDecisionResultSchema.parse({
          id: after.id,
          status: after.status,
          previousStatus: before.status,
          version: after.version,
          reviewedAt: after.reviewedAt,
        }) as BusinessDecisionResult & JsonValue;
      },
      {
        ...receipt(BusinessDecisionResultSchema),
        // Replay rechecks the reviewer's current access to the business.
        replay: async (tx, stored) => {
          await this.authorize(tx, request, await this.live(tx, businessId));
          return BusinessDecisionResultSchema.parse(
            stored,
          ) as BusinessDecisionResult & JsonValue;
        },
      },
    );
  }

  /**
   * Applies an authorized decision edge inside the caller's transaction
   * (also used by Admin Listings `statusAction`): version and state checks,
   * transition, role grant, audit and outbox events.
   */
  async apply(
    tx: TxContext,
    request: { correlationId: string },
    actor: ReviewerActor,
    before: StoredBusiness,
    input: BusinessDecision,
  ): Promise<StoredBusiness> {
    if (before.version !== input.expectedVersion)
      throw new DomainError('BUSINESS_VERSION_CONFLICT');
    const edge = DECISION_EDGES[input.action];
    if (!edge.from.includes(before.status))
      throw new DomainError('BUSINESS_STATE_CONFLICT');
    const at = this.clock.now();
    if (
      !(await this.businesses.transition(tx, {
        id: before.id,
        expectedVersion: input.expectedVersion,
        status: edge.to,
        review: { reason: input.reason ?? null, reviewedBy: actor.userId },
        at,
      }))
    )
      throw new DomainError('BUSINESS_VERSION_CONFLICT');
    const after = (await this.businesses.find(tx, before.id))!;
    await this.record(tx, request, actor, input, before, after);
    return after;
  }

  /** Role grant (into approved), audit and outbox, in the decision tx. */
  private async record(
    tx: TxContext,
    request: { correlationId: string },
    actor: ReviewerActor,
    input: BusinessDecision,
    before: StoredBusiness,
    after: StoredBusiness,
  ): Promise<void> {
    // Idempotent; the role never replaces the live business approval check.
    if (after.status === 'approved')
      await this.roles.assignApprovedRole(
        {
          userId: after.ownerUserId,
          role: ROLE_FOR_KIND[after.kind],
          sourceId: after.id,
          caller: 'businesses',
        },
        tx,
      );
    await this.audit.record(tx, {
      actor,
      action: `business.decision.${input.action}`,
      entityType: 'business',
      entityId: after.id,
      cityId: after.cityId,
      areaId: after.areaId,
      summary: `Business ${before.status} -> ${after.status}`,
      before: businessSnapshot(before),
      after: businessSnapshot(after),
      fields: BUSINESS_AUDIT_FIELDS,
      correlationId: request.correlationId,
    });
    await this.events.decisionChanged(
      tx,
      after,
      before.status,
      request.correlationId,
    );
    // Public visibility changed: revalidate public profile/search caches.
    if (before.status === 'approved' || after.status === 'approved') {
      const categories = (await this.businesses.aggregate(tx, after))
        .categories.map((link) => link.categoryId);
      await this.events.profileChanged(
        tx,
        after,
        {
          previousStatus: before.status,
          categoryIdsBefore: categories,
          categoryIdsAfter: categories,
        },
        request.correlationId,
      );
    }
  }

  /**
   * Live session, admin role, `approvals:edit` over the stored area; the
   * business owner may never decide on their own business.
   */
  private async authorize(
    tx: TxContext,
    request: BusinessAdminCommand,
    business: StoredBusiness,
  ): Promise<ReviewerActor> {
    const actor = await this.reviewer.require(tx, request, {
      module: 'approvals',
      action: 'edit',
      scopes: [businessScope(business)],
    });
    if (actor.userId === business.ownerUserId)
      throw new DomainError('ADMIN_SELF_ACTION');
    return actor;
  }

  private async live(
    tx: TxContext,
    businessId: string,
    lock = false,
  ): Promise<StoredBusiness> {
    const business = await this.businesses.find(tx, businessId, lock);
    if (!business || business.deletedAt)
      throw new DomainError('BUSINESS_NOT_FOUND');
    return business;
  }

  private command(
    request: BusinessAdminCommand,
    businessId: string,
    input: BusinessDecision,
  ) {
    return this.contexts.create(
      {
        name: 'business.application.decide',
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/businesses/admin/applications/${businessId}/decision`,
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
