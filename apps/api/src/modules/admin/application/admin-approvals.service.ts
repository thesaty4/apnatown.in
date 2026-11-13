import { Inject, Injectable } from '@nestjs/common';
import {
  AdminApprovalDetailSchema,
  AdminApprovalPageSchema,
  type AdminApprovalDetail,
  type AdminApprovalPage,
  type AdminApprovalQuery,
  type AdminBusinessApprovalType,
} from '@apnatown/shared/admin';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { PageQuery } from '@apnatown/shared/wire';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  AUDIT_ENTITY_HISTORY,
  type AuditEntityHistoryPort,
} from '../../audit/application/audit-entity-history';
import {
  BUSINESS_ADMIN_READ,
  type BusinessApplicationsReadPort,
} from '../../businesses/application/business-ports';
import {
  RIDER_APPLICATIONS_READ,
  type RiderApplicationsReadPort,
} from '../../delivery/application/delivery-ports';

const KIND_FOR_TYPE: Readonly<Record<AdminBusinessApprovalType, BusinessKind>> =
  { business: 'shop', provider: 'provider' };

/**
 * S-ADMN-02 approvals queue composed from owning modules' read ports. Admin
 * never writes the owning tables; decisions go to the owning module. Rider
 * cards come from Delivery's scoped queue (decisions: POST
 * /delivery/admin/riders/{userId}/decision); the shared detail view stays
 * business-only.
 */
@Injectable()
export class AdminApprovalsService {
  constructor(
    @Inject(BUSINESS_ADMIN_READ)
    private readonly businesses: BusinessApplicationsReadPort,
    @Inject(RIDER_APPLICATIONS_READ)
    private readonly riders: RiderApplicationsReadPort,
    @Inject(AUDIT_ENTITY_HISTORY)
    private readonly history: AuditEntityHistoryPort,
  ) {}

  async list(
    ctx: AdminReadContext,
    query: AdminApprovalQuery,
  ): Promise<AdminApprovalPage> {
    if (query.type === 'rider') return this.riderPage(ctx, query);
    const type = query.type;
    const page = await this.businesses.list(ctx, {
      view: 'applications',
      kind: KIND_FOR_TYPE[type],
      status: query.status,
      ...(query.cursor ? { cursor: query.cursor } : {}),
      limit: query.limit,
    });
    return AdminApprovalPageSchema.parse({
      items: page.items.map((card) => ({
        type,
        id: card.id,
        nameEn: card.nameEn,
        nameHi: card.nameHi,
        categoryId: card.categoryId,
        cityId: card.cityId,
        areaId: card.areaId,
        submittedAt: card.submittedAt,
        status: card.status,
        version: card.version,
      })),
      nextCursor: page.nextCursor,
      unavailable: [],
    });
  }

  private async riderPage(
    ctx: AdminReadContext,
    query: AdminApprovalQuery,
  ): Promise<AdminApprovalPage> {
    const page = await this.riders.list(ctx, {
      status: query.status,
      ...(query.cursor ? { cursor: query.cursor } : {}),
      limit: query.limit,
    });
    return AdminApprovalPageSchema.parse({
      items: page.items.map((card) => ({
        type: 'rider',
        id: card.userId,
        nameEn: card.fullName,
        nameHi: null,
        categoryId: null,
        cityId: card.cityId,
        areaId: card.areaId,
        submittedAt: card.submittedAt,
        status: card.status,
        version: card.version,
      })),
      nextCursor: page.nextCursor,
      unavailable: [],
    });
  }

  /** Owning detail (scope rechecked there) plus its narrow audit history. */
  async detail(
    ctx: AdminReadContext,
    input: { type: AdminBusinessApprovalType; id: string },
    page: PageQuery,
  ): Promise<AdminApprovalDetail> {
    const application = await this.businesses.detail(ctx, {
      businessId: input.id,
      view: 'applications',
    });
    // The path type must name the application's own kind.
    if (application.kind !== KIND_FOR_TYPE[input.type])
      throw new DomainError('BUSINESS_NOT_FOUND');
    const history = await this.history.entityHistory(ctx, {
      entityType: 'business',
      entityId: application.id,
      cursor: page.cursor,
      limit: page.limit,
    });
    return AdminApprovalDetailSchema.parse({
      type: input.type,
      application,
      history,
    });
  }
}
