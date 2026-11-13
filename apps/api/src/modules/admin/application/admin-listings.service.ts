import { Inject, Injectable } from '@nestjs/common';
import {
  AdminListingDetailSchema,
  AdminListingMutationResultSchema,
  AdminListingPageSchema,
  type AdminBusinessListingType,
  type AdminListingAction,
  type AdminListingCreate,
  type AdminListingDetail,
  type AdminListingEdit,
  type AdminListingMutationResult,
  type AdminListingPage,
  type AdminListingQuery,
  type AdminListingRemove,
  type ScopeRef,
} from '@apnatown/shared/admin';
import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  ADMIN_SCOPE,
  type AdminReadContext,
  type AdminScopePort,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  BUSINESS_ADMIN_LISTING_READ,
  BUSINESS_ADMIN_LISTINGS,
  type BusinessAdminListingReadPort,
  type BusinessAdminListingResult,
  type BusinessAdminListingsPort,
} from '../../businesses/application/business-ports';
import type { AdminCommand } from './admin-command';
import { AdminListingReportsService } from './admin-listing-reports.service';

const KIND_FOR_TYPE: Readonly<Record<AdminBusinessListingType, BusinessKind>> =
  {
    business: 'shop',
    provider: 'provider',
  };
const DETAIL_REPORTS_LIMIT = 20;

/**
 * S-ADMN-03 Listings composed from owning modules' ports (F-AD-003). Admin
 * never writes Businesses tables: edits/removals call the Businesses
 * versioned commands. Delivery (riders) and Reviews (ratings) have not
 * shipped: rider lists return no items with `unavailable: ['rider']` and
 * ratings are null with `unavailable: ['rating']`, never zeros.
 */
@Injectable()
export class AdminListingsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(BUSINESS_ADMIN_LISTING_READ)
    private readonly reads: BusinessAdminListingReadPort,
    @Inject(BUSINESS_ADMIN_LISTINGS)
    private readonly commands: BusinessAdminListingsPort,
    @Inject(ADMIN_SCOPE) private readonly scope: AdminScopePort,
    private readonly reports: AdminListingReportsService,
  ) {}

  async list(
    ctx: AdminReadContext,
    query: AdminListingQuery,
  ): Promise<AdminListingPage> {
    if (query.type === 'rider')
      return AdminListingPageSchema.parse({
        items: [],
        nextCursor: null,
        unavailable: ['rider'],
      });
    const type = query.type;
    const page = await this.reads.list(ctx, {
      kind: KIND_FOR_TYPE[type],
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { q: query.q } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
      limit: query.limit,
    });
    const counts = await this.uow.run((tx) =>
      this.reports.openCounts(
        tx,
        page.items.map((item) => item.id),
      ),
    );
    return AdminListingPageSchema.parse({
      items: page.items.map((item) => ({
        type,
        id: item.id,
        nameEn: item.nameEn,
        nameHi: item.nameHi,
        categoryId: item.categoryId,
        cityId: item.cityId,
        areaId: item.areaId,
        rating: null,
        openReportCount: counts.get(item.id) ?? 0,
        status: item.status,
        version: item.version,
      })),
      nextCursor: page.nextCursor,
      unavailable: ['rating'],
    });
  }

  /** Owning detail (scope rechecked there), open reports and caller actions. */
  async detail(
    ctx: AdminReadContext,
    input: { type: AdminBusinessListingType; id: string },
  ): Promise<AdminListingDetail> {
    const { listing, openCount, allowedActions } = await this.uow.run(
      async (tx) => {
        const owned = await this.reads
          .detail(tx, ctx, {
            businessId: input.id,
            kind: KIND_FOR_TYPE[input.type],
          })
          .catch((error: unknown) => {
            // Spec contract: a missing/deleted/mismatched listing is COMMON_NOT_FOUND.
            if (
              error instanceof DomainError &&
              error.code === 'BUSINESS_NOT_FOUND'
            )
              throw new DomainError('COMMON_NOT_FOUND');
            throw error;
          });
        const counts = await this.reports.openCounts(tx, [input.id]);
        const scope: ScopeRef = owned.listing.areaId
          ? { cityId: owned.listing.cityId, areaId: owned.listing.areaId }
          : { cityId: null, areaId: null };
        const actions: AdminListingAction[] = [];
        // Permission-aware hint only; every command re-authorizes server-side.
        if (owned.listing.ownerUserId !== ctx.actorUserId) {
          if (await this.permits(tx, ctx, 'catalog', scope))
            actions.push('edit', 'remove');
          if (
            actions.length &&
            (await this.permits(tx, ctx, 'approvals', scope))
          )
            actions.push(...owned.decisionActions);
        }
        return {
          listing: owned.listing,
          openCount: counts.get(input.id) ?? 0,
          allowedActions: actions,
        };
      },
    );
    const reports = await this.reports.list(ctx, {
      targetId: input.id,
      status: 'open',
      limit: DETAIL_REPORTS_LIMIT,
    });
    return AdminListingDetailSchema.parse({
      type: input.type,
      listing,
      rating: null,
      reports: {
        openCount,
        items: reports.items,
        nextCursor: reports.nextCursor,
      },
      allowedActions,
      unavailable: ['rating'],
    });
  }

  /**
   * ADM-Q1 is unresolved: authorizes `catalog:edit` over the destination
   * area, then always ADMIN_CREATION_POLICY_REQUIRED; never creates a row.
   */
  create(request: AdminCommand, input: AdminListingCreate): Promise<never> {
    return this.commands.adminCreate(request, input);
  }

  async update(
    request: AdminCommand,
    params: { type: AdminBusinessListingType; id: string },
    input: AdminListingEdit,
  ): Promise<AdminListingMutationResult> {
    return mutation(
      params.type,
      await this.commands.adminUpdate(request, {
        ...input,
        businessId: params.id,
        kind: KIND_FOR_TYPE[params.type],
      }),
    );
  }

  async remove(
    request: AdminCommand,
    params: { type: AdminBusinessListingType; id: string },
    input: AdminListingRemove,
  ): Promise<AdminListingMutationResult> {
    return mutation(
      params.type,
      await this.commands.adminRemove(request, {
        ...input,
        businessId: params.id,
        kind: KIND_FOR_TYPE[params.type],
      }),
    );
  }

  private async permits(
    tx: TxContext,
    ctx: AdminReadContext,
    module: 'catalog' | 'approvals',
    scope: ScopeRef,
  ): Promise<boolean> {
    try {
      await this.scope.authorize(
        {
          actorUserId: ctx.actorUserId,
          module,
          action: 'edit',
          scopes: [scope],
        },
        tx,
      );
      return true;
    } catch (error) {
      if (
        error instanceof DomainError &&
        (error.code === 'COMMON_FORBIDDEN' ||
          error.code === 'ADMIN_SCOPE_FORBIDDEN')
      )
        return false;
      throw error;
    }
  }
}

function mutation(
  type: AdminBusinessListingType,
  result: BusinessAdminListingResult,
): AdminListingMutationResult {
  return AdminListingMutationResultSchema.parse({
    type,
    id: result.businessId,
    status: result.status,
    deleted: result.deleted,
    version: result.version,
  });
}
