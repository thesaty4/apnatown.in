import { Inject, Injectable } from '@nestjs/common';
import type {
  AdminListingCreate,
  AdminListingEdit,
  AdminListingRemove,
  ScopeRef,
} from '@apnatown/shared/admin';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  GEO_SCOPE,
  type GeoScopePort,
} from '../../geo/application/geo-scope.port';
import {
  BUSINESS_REPOSITORY,
  type BusinessChanges,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import {
  BusinessAdminListingCommands,
  listingResult as result,
} from './business-admin-listing-commands';
import type {
  BusinessAdminListingCommand as Command,
  BusinessAdminListingResult,
  BusinessAdminListingsPort,
} from './business-admin-listing-ports';
import { BusinessDecisionService } from './business-decision.service';
import { BusinessEvents } from './business-events';
import { liveListing } from './business-listing-read.service';
import {
  BusinessReviewer,
  businessScope,
  type ReviewerActor,
} from './business-reviewer';

/**
 * Businesses-owned Admin Listings commands (F-AD-003, BR-12). Permission and
 * the stored (source) and new (destination) area scopes are rechecked in the
 * command transaction; status changes reuse the ST-approval decision edges.
 * TODO(verify): Orders has not shipped, so no in-flight order check
 * (ADMIN_INFLIGHT_POLICY_REQUIRED) is possible yet.
 */
@Injectable()
export class BusinessAdminListingsService implements BusinessAdminListingsPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly reviewer: BusinessReviewer,
    private readonly decisions: BusinessDecisionService,
    private readonly events: BusinessEvents,
    private readonly listingCommands: BusinessAdminListingCommands,
  ) {}

  /** ADM-Q1: authorizes the destination, then refuses without a row. */
  async adminCreate(
    request: Command,
    input: AdminListingCreate,
  ): Promise<never> {
    await this.uow.run(async (tx) => {
      const scope = await this.geo.resolve({ areaId: input.areaId }, tx);
      await this.reviewer.require(tx, request, {
        module: 'catalog',
        action: 'edit',
        scopes: [{ cityId: scope.cityId, areaId: scope.areaId }],
      });
    });
    throw new DomainError('ADMIN_CREATION_POLICY_REQUIRED');
  }

  adminUpdate(
    request: Command,
    input: { businessId: string; kind: BusinessKind } & AdminListingEdit,
  ): Promise<BusinessAdminListingResult> {
    const { businessId, kind, ...payload } = input;
    return this.listingCommands.run(
      request,
      'update',
      'PATCH',
      input,
      payload,
      async (tx) => {
        const before = await this.live(tx, businessId, kind);
        const changes: BusinessChanges = {};
        if (input.nameEn !== undefined) changes.nameEn = input.nameEn;
        if (input.nameHi !== undefined) changes.nameHi = input.nameHi;
        if (input.phoneE164 !== undefined) changes.phoneE164 = input.phoneE164;
        const scopes: ScopeRef[] = [businessScope(before)];
        if (input.areaId !== undefined && input.areaId !== before.areaId) {
          const destination = await this.geo.resolve(
            { areaId: input.areaId },
            tx,
          );
          changes.areaId = destination.areaId;
          changes.cityId = destination.cityId;
          scopes.push({
            cityId: destination.cityId,
            areaId: destination.areaId,
          });
        }
        const actor = await this.actor(tx, request, before, scopes);
        if (input.statusAction)
          await this.reviewer.authorize(tx, actor.userId, {
            module: 'approvals',
            action: 'edit',
            scopes,
          });
        if (before.version !== input.expectedVersion)
          throw new DomainError('BUSINESS_VERSION_CONFLICT');
        let current = before;
        if (Object.keys(changes).length) {
          if (
            !(await this.businesses.updateProfile(tx, {
              id: before.id,
              expectedVersion: input.expectedVersion,
              changes,
              at: this.clock.now(),
            }))
          )
            throw new DomainError('BUSINESS_VERSION_CONFLICT');
          current = (await this.businesses.find(tx, before.id))!;
          await this.listingCommands.record(
            tx,
            request,
            actor,
            'update',
            { before, after: current },
            scopes,
          );
          const categories = await this.categoryIds(tx, current);
          await this.events.profileChanged(
            tx,
            current,
            { categoryIdsBefore: categories, categoryIdsAfter: categories },
            request.correlationId,
          );
        }
        if (input.statusAction)
          current = await this.decisions.apply(tx, request, actor, current, {
            action: input.statusAction,
            ...(input.note ? { reason: input.note } : {}),
            expectedVersion: current.version,
          });
        return result(current);
      },
    );
  }

  adminRemove(
    request: Command,
    input: { businessId: string; kind: BusinessKind } & AdminListingRemove,
  ): Promise<BusinessAdminListingResult> {
    const { businessId, kind, ...payload } = input;
    return this.listingCommands.run(
      request,
      'remove',
      'DELETE',
      input,
      payload,
      async (tx) => {
        const before = await this.live(tx, businessId, kind);
        const scopes = [businessScope(before)];
        const actor = await this.actor(tx, request, before, scopes);
        if (before.version !== input.expectedVersion)
          throw new DomainError('BUSINESS_VERSION_CONFLICT');
        if (
          !(await this.businesses.softDelete(tx, {
            id: before.id,
            expectedVersion: input.expectedVersion,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('BUSINESS_VERSION_CONFLICT');
        const after = (await this.businesses.find(tx, before.id))!;
        await this.listingCommands.record(
          tx,
          request,
          actor,
          'remove',
          { before, after, ...(input.note ? { note: input.note } : {}) },
          scopes,
        );
        const categories = await this.categoryIds(tx, after);
        await this.events.profileChanged(
          tx,
          after,
          { categoryIdsBefore: categories, categoryIdsAfter: categories },
          request.correlationId,
        );
        return result(after);
      },
    );
  }

  private async live(
    tx: TxContext,
    businessId: string,
    kind: BusinessKind,
  ): Promise<StoredBusiness> {
    const business = await this.businesses.find(tx, businessId, true);
    if (!liveListing(business) || business.kind !== kind)
      throw new DomainError('BUSINESS_NOT_FOUND');
    return business;
  }

  /** `catalog:edit` over every scope; never on the actor's own listing. */
  private async actor(
    tx: TxContext,
    request: Command,
    business: StoredBusiness,
    scopes: readonly ScopeRef[],
  ): Promise<ReviewerActor> {
    const actor = await this.reviewer.require(tx, request, {
      module: 'catalog',
      action: 'edit',
      scopes,
    });
    if (actor.userId === business.ownerUserId)
      throw new DomainError('ADMIN_SELF_ACTION');
    return actor;
  }

  private async categoryIds(tx: TxContext, business: StoredBusiness) {
    return (await this.businesses.aggregate(tx, business)).categories.map(
      (link) => link.categoryId,
    );
  }
}
