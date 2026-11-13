import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  BusinessAdminDetailSchema,
  BusinessApplicationPageSchema,
  BusinessDocumentListSchema,
  type BusinessAdminDetail,
  type BusinessApplicationPage,
  type BusinessDocumentList,
  type BusinessKind,
  type BusinessStatus,
} from '@apnatown/shared/businesses';
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
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import { cardDto } from './business-mappers';
import type { BusinessAdminView, BusinessApplicationsReadPort } from './business-ports';
import {
  BusinessReviewer,
  assertReader,
  businessScope,
  visibility,
} from './business-reviewer';

/** Statuses an approval viewer may list; drafts are not applications. */
const APPLICATION_STATUSES: readonly BusinessStatus[] = [
  'pending',
  'changes_requested',
  'rejected',
  'approved',
  'suspended',
  'inactive',
];
const DEFAULT_LIMIT = 20;
const positionSchema = z.tuple([TimestampSchema, IdSchema]);

/**
 * Scoped approval reads (F-VD-001/F-PV-001, BR-12/BR-14). List visibility is
 * the caller's server-derived city/area scope; single-application reads
 * re-authorize `approvals:view` over the stored area in the transaction.
 * Never returns KYC contents, storage keys or URLs.
 */
@Injectable()
export class BusinessAdminReadService
  implements BusinessApplicationsReadPort, OnModuleInit
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
    // The business's stored area is its review authorization scope.
    this.registry.register('business.application', async (id, tx) => {
      const row = await (tx
        ? this.businesses.find(tx, id)
        : this.uow.run((t) => this.businesses.find(t, id)));
      // Missing rows resolve as unresolved scope (super_admin only) so scoped
      // admins cannot probe IDs; the in-transaction read returns not-found.
      if (!row || row.deletedAt) return [];
      return [businessScope(row)];
    });
  }

  list(
    ctx: AdminReadContext,
    input: {
      view: BusinessAdminView;
      kind?: BusinessKind;
      status?: BusinessStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<BusinessApplicationPage> {
    this.assertApplications(ctx, input.view);
    const status = input.status ?? 'pending';
    if (!APPLICATION_STATUSES.includes(status))
      throw new DomainError('VALIDATION_ERROR', { field: 'status' });
    const limit = input.limit ?? DEFAULT_LIMIT;
    const binding: CursorBinding = {
      operation: 'businesses.admin.applications',
      sort: 'createdAt-id',
      filters: { status, kind: input.kind ?? null },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(input.cursor, binding);
    return this.uow.run(async (tx) => {
      const rows = await this.businesses.scopedPage(tx, {
        statuses: [status],
        ...(input.kind ? { kind: input.kind } : {}),
        visibility: visibility(ctx),
        ...(after ? { after } : {}),
        limit,
      });
      const page = rows.slice(0, limit);
      const primary = await this.businesses.primaryCategories(
        tx,
        page.map((row) => row.id),
      );
      const last = page.at(-1);
      return BusinessApplicationPageSchema.parse({
        items: page.map((row) => cardDto(row, primary.get(row.id) ?? null)),
        nextCursor:
          rows.length > limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  detail(
    ctx: AdminReadContext,
    input: { businessId: string; view: BusinessAdminView },
  ): Promise<BusinessAdminDetail> {
    this.assertApplications(ctx, input.view);
    return this.uow.run(async (tx) => {
      const business = await this.application(tx, ctx, input.businessId);
      const primary = await this.businesses.primaryCategories(tx, [
        business.id,
      ]);
      const documents = await this.businesses.documents(tx, business.id);
      return BusinessAdminDetailSchema.parse({
        ...cardDto(business, primary.get(business.id) ?? null),
        ownerUserId: business.ownerUserId,
        phoneE164: business.phoneE164,
        addressText: business.addressText,
        logoAssetId: business.logoAssetId,
        coverAssetId: business.coverAssetId,
        documents: documents.map((doc) => ({
          documentId: doc.id,
          kind: doc.documentKind,
          assetId: doc.assetId,
        })),
      });
    });
  }

  /** Document metadata; the private view capability ships with Media (Q-40). */
  documents(
    ctx: AdminReadContext,
    businessId: string,
  ): Promise<BusinessDocumentList> {
    assertReader(ctx, 'approvals');
    return this.uow.run(async (tx) => {
      const business = await this.application(tx, ctx, businessId);
      const rows = await this.businesses.documents(tx, business.id);
      return BusinessDocumentListSchema.parse({
        items: rows.map((doc) => ({
          documentId: doc.id,
          documentKind: doc.documentKind,
          assetId: doc.assetId,
          uploadedAt: doc.createdAt,
          view: { state: 'unavailable', code: 'SOURCE_UNAVAILABLE' },
        })),
      });
    });
  }

  /** Live submitted application inside the caller's `approvals:view` scope. */
  private async application(
    tx: TxContext,
    ctx: AdminReadContext,
    businessId: string,
  ): Promise<StoredBusiness> {
    const business = await this.businesses.find(tx, businessId);
    if (!business || business.deletedAt || business.status === 'draft')
      throw new DomainError('BUSINESS_NOT_FOUND');
    await this.reviewer.authorize(tx, ctx.actorUserId, {
      module: 'approvals',
      action: 'view',
      scopes: [businessScope(business)],
    });
    return business;
  }

  /** Only the applications view ships; listings need the catalog slice. */
  private assertApplications(
    ctx: AdminReadContext,
    view: BusinessAdminView,
  ): void {
    if (view !== 'applications') throw new DomainError('COMMON_FORBIDDEN');
    assertReader(ctx, 'approvals');
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
