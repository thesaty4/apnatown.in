import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  AdminBusinessListingSchema,
  type AdminBusinessListing,
  type ScopeRef,
} from '@apnatown/shared/admin';
import type { BusinessKind, BusinessStatus } from '@apnatown/shared/businesses';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { ScopeRegistry } from '../../../shared/auth/scope-registry';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  BUSINESS_REPOSITORY,
  allowedActions,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import type {
  BusinessAdminListingReadPort,
  BusinessListingTarget,
} from './business-admin-listing-ports';
import {
  BusinessReviewer,
  assertReader,
  businessScope,
  visibility,
} from './business-reviewer';

/** Listing statuses (drafts are not listings). */
const LISTING_STATUSES: readonly BusinessStatus[] = [
  'pending',
  'changes_requested',
  'rejected',
  'approved',
  'suspended',
  'inactive',
];
const positionSchema = z.tuple([TimestampSchema, IdSchema]);

/** Live, non-draft listing (drafts and deleted rows are not listings). */
export function liveListing(
  business: StoredBusiness | null,
): business is StoredBusiness {
  return !!business && !business.deletedAt && business.status !== 'draft';
}

export function listingDto(
  business: StoredBusiness,
  categoryId: string | null,
): AdminBusinessListing {
  return AdminBusinessListingSchema.parse({
    id: business.id,
    kind: business.kind,
    status: business.status,
    nameEn: business.nameEn,
    nameHi: business.nameHi,
    categoryId,
    cityId: business.cityId,
    areaId: business.areaId,
    ownerUserId: business.ownerUserId,
    phoneE164: business.phoneE164,
    addressText: business.addressText,
    logoAssetId: business.logoAssetId,
    coverAssetId: business.coverAssetId,
    submittedAt: business.submittedAt,
    createdAt: business.createdAt,
    version: business.version,
  });
}

/**
 * Admin Listings reads (F-AD-003, BR-12/BR-14). List visibility is the
 * caller's server-derived `catalog:view` scope; single reads re-authorize
 * over the stored area inside the transaction. No KYC documents.
 */
@Injectable()
export class BusinessListingReadService
  implements BusinessAdminListingReadPort, OnModuleInit
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    private readonly registry: ScopeRegistry,
    private readonly reviewer: BusinessReviewer,
  ) {}

  onModuleInit(): void {
    // A listing's stored area is its catalog authorization scope. Missing
    // rows resolve as unresolved (super_admin only) so IDs cannot be probed.
    this.registry.register('business.listing', async (id, tx) => {
      const row = await (tx
        ? this.businesses.find(tx, id)
        : this.uow.run((t) => this.businesses.find(t, id)));
      return liveListing(row) ? [businessScope(row)] : [];
    });
  }

  list(
    ctx: AdminReadContext,
    input: {
      kind: BusinessKind;
      status?: BusinessStatus;
      q?: string;
      cursor?: string;
      limit: number;
    },
  ): Promise<{ items: AdminBusinessListing[]; nextCursor: string | null }> {
    assertReader(ctx, 'catalog');
    if (input.status && !LISTING_STATUSES.includes(input.status))
      throw new DomainError('VALIDATION_ERROR', { field: 'status' });
    const binding: CursorBinding = {
      operation: 'businesses.admin.listings',
      sort: 'createdAt-id',
      filters: {
        kind: input.kind,
        status: input.status ?? null,
        q: input.q ?? null,
      },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(input.cursor, binding);
    return this.uow.run(async (tx) => {
      const rows = await this.businesses.scopedPage(tx, {
        statuses: input.status ? [input.status] : LISTING_STATUSES,
        kind: input.kind,
        ...(input.q ? { q: input.q } : {}),
        visibility: visibility(ctx),
        ...(after ? { after } : {}),
        limit: input.limit,
      });
      const page = rows.slice(0, input.limit);
      const primary = await this.businesses.primaryCategories(
        tx,
        page.map((row) => row.id),
      );
      const last = page.at(-1);
      return {
        items: page.map((row) => listingDto(row, primary.get(row.id) ?? null)),
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      };
    });
  }

  async detail(
    tx: TxContext,
    ctx: AdminReadContext,
    input: { businessId: string; kind: BusinessKind },
  ) {
    assertReader(ctx, 'catalog');
    const business = await this.businesses.find(tx, input.businessId);
    if (!liveListing(business) || business.kind !== input.kind)
      throw new DomainError('BUSINESS_NOT_FOUND');
    await this.reviewer.authorize(tx, ctx.actorUserId, {
      module: 'catalog',
      action: 'view',
      scopes: [businessScope(business)],
    });
    const primary = await this.businesses.primaryCategories(tx, [business.id]);
    return {
      listing: listingDto(business, primary.get(business.id) ?? null),
      decisionActions: allowedActions(business.status),
    };
  }

  async publicTarget(
    tx: TxContext,
    input: { businessId: string; kind: BusinessKind },
  ): Promise<BusinessListingTarget | null> {
    const business = await this.businesses.find(tx, input.businessId);
    if (
      !liveListing(business) ||
      business.kind !== input.kind ||
      business.status !== 'approved' ||
      !business.slug ||
      !business.cityId ||
      !business.areaId
    )
      return null;
    return {
      id: business.id,
      kind: business.kind,
      ownerUserId: business.ownerUserId,
      cityId: business.cityId,
      areaId: business.areaId,
    };
  }

  async scopeOf(
    tx: TxContext,
    businessId: string,
  ): Promise<{ scope: ScopeRef; ownerUserId: string } | null> {
    const business = await this.businesses.find(tx, businessId);
    return liveListing(business)
      ? { scope: businessScope(business), ownerUserId: business.ownerUserId }
      : null;
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): [string, string] | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return parsed.data;
  }
}
