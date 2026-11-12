import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  BusinessAnalyticsSchema,
  BusinessDocumentUploadResultSchema,
  BusinessMediaUploadResultSchema,
  BusinessOverviewSchema,
  BusinessOwnerSchema,
  type BusinessAnalytics,
  type BusinessDocumentUpload,
  type BusinessDocumentUploadResult,
  type BusinessKind,
  type BusinessMediaUpload,
  type BusinessMediaUploadResult,
  type BusinessOverview,
  type BusinessOwner,
  type BusinessProfilePatch,
  type BusinessSettings,
  type BusinessVersionCommand,
  type CreateBusinessApplication,
} from '@apnatown/shared/businesses';
import { catalogSlug } from '@apnatown/shared/catalog';
import type { SessionBinding } from '../../../shared/auth';
import {
  SESSION_ACCESS,
  type SessionAccess,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import { receipt } from '../../catalog/application/catalog-mappers';
import {
  CATALOG_READ,
  type CatalogReadPort,
} from '../../catalog/application/catalog-ports';
import { GEO_SCOPE, type GeoScopePort } from '../../geo/application/geo-scope.port';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  USER_ROLES,
  type UserRolePort,
} from '../../users/application/user-role-port';
import {
  BUSINESS_REPOSITORY,
  ROLE_FOR_KIND,
  capabilities,
  deliveryConfigured,
  type BusinessAggregate,
  type BusinessChanges,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import { BusinessEvents } from './business-events';
import { BusinessInsights } from './business-insights';
import {
  BUSINESS_AUDIT_FIELDS,
  businessSnapshot,
  ownerDto,
} from './business-mappers';
import { BusinessOwnerContext } from './business-owner-context';
import {
  BUSINESS_MEDIA_ASSETS,
  type BusinessMediaAssetPort,
  type UploadedFile,
} from './business-ports';

// Local retry horizon, not a retention policy (mirrors AdminCommands).
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

/** Authenticated owner request; `businessKind` selects, never grants. */
export interface OwnerRequest {
  session: SessionBinding;
  actorId: string;
  businessKind?: BusinessKind;
}
export interface OwnerCommand extends OwnerRequest {
  correlationId: string;
  key: unknown;
}

const SIMPLE_FIELDS = [
  'nameEn',
  'nameHi',
  'description',
  'addressText',
  'location',
  'whatsappE164',
  'email',
  'instagramUrl',
  'youtubeUrl',
  'facebookUrl',
] as const;

/**
 * Owner application/profile use-cases (F-VD-001..003, F-PV-001/002/006).
 * Ownership is always resolved server-side from the live session; status is
 * never accepted from PATCH and every write is version-guarded.
 */
@Injectable()
export class BusinessOwnerService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(USER_ROLES) private readonly roles: UserRolePort,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    @Inject(BUSINESS_MEDIA_ASSETS)
    private readonly media: BusinessMediaAssetPort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly owners: BusinessOwnerContext,
    private readonly insights: BusinessInsights,
    private readonly events: BusinessEvents,
  ) {}

  /** Draft for the session user with their verified phone (not the body). */
  create(
    request: OwnerCommand,
    input: CreateBusinessApplication,
  ): Promise<BusinessOwner> {
    return this.commands.run(
      this.command(request, 'business.application.create', '/businesses/applications', 201, input),
      async (tx) => {
        const userId = await this.principal(tx, request);
        const phone = await this.identity.verifiedPhone(tx, userId);
        if (!phone) throw new DomainError('COMMON_FORBIDDEN');
        const id = this.ids.uuidv7();
        if (
          !(await this.businesses.insertDraft(tx, {
            id,
            ownerUserId: userId,
            kind: input.kind,
            phoneE164: phone,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('BUSINESS_ALREADY_EXISTS', { field: 'kind' });
        return (await this.dto(tx, (await this.businesses.find(tx, id))!)) as BusinessOwner & JsonValue;
      },
      receipt(BusinessOwnerSchema),
    );
  }

  me(request: OwnerRequest): Promise<BusinessOwner> {
    return this.uow.run(async (tx) =>
      this.dto(tx, await this.owned(tx, request)),
    );
  }

  /**
   * Explicit allow-listed profile patch: profile, categories, hours and
   * settings share one version and one transaction.
   */
  async patch(
    request: OwnerRequest & { correlationId: string },
    input: BusinessProfilePatch,
  ): Promise<BusinessOwner> {
    // Category validation reads Catalog's taxonomy outside the write tx.
    if (input.categoryIds?.length) await this.assertCategories(input.categoryIds);
    return this.uow.run(async (tx) => {
      const current = await this.owned(tx, request, true);
      if (current.version !== input.expectedVersion)
        throw new DomainError('BUSINESS_VERSION_CONFLICT');
      if (!capabilities(current, false).editProfile)
        throw new DomainError('BUSINESS_STATE_CONFLICT');
      const before = await this.businesses.aggregate(tx, current);
      const changes: BusinessChanges = {};
      let kind = current.kind;
      if (input.kind !== undefined && input.kind !== current.kind) {
        // Kind is draft-only and stays unique per owner.
        if (current.status !== 'draft')
          throw new DomainError('BUSINESS_STATE_CONFLICT', { field: 'kind' });
        const taken = await this.businesses.ownedBy(tx, {
          ownerUserId: current.ownerUserId,
          kind: input.kind,
        });
        if (taken.length)
          throw new DomainError('BUSINESS_ALREADY_EXISTS', { field: 'kind' });
        changes.kind = kind = input.kind;
      }
      for (const field of SIMPLE_FIELDS)
        if (input[field] !== undefined)
          (changes as Record<string, unknown>)[field] = input[field];
      if (input.businessPhoneE164 !== undefined)
        changes.phoneE164 = input.businessPhoneE164;
      if (input.areaId !== undefined) {
        if (input.areaId === null) {
          changes.areaId = null;
          changes.cityId = null;
        } else {
          const scope = await this.geo.resolve({ areaId: input.areaId }, tx);
          changes.areaId = scope.areaId;
          changes.cityId = scope.cityId;
        }
      }
      for (const purpose of ['logo', 'cover'] as const) {
        const field = purpose === 'logo' ? 'logoAssetId' : 'coverAssetId';
        const assetId = input[field];
        if (assetId === undefined) continue;
        if (assetId !== null && assetId !== current[field])
          await this.media.requireAttachableImage(tx, {
            assetId,
            businessId: current.id,
            ownerUserId: current.ownerUserId,
            purpose,
          });
        changes[field] = assetId;
      }
      const settings = this.mergeSettings(before.settings, input, kind);
      const categories = this.mergeCategories(before, input);
      // A submitted business keeps every submission-required value.
      if (current.status !== 'draft') {
        const merged = { ...current, ...changes };
        for (const field of ['nameEn', 'areaId', 'addressText'] as const)
          if (merged[field] === null)
            throw new DomainError('VALIDATION_ERROR', { field });
        if (!categories.primary)
          throw new DomainError('VALIDATION_ERROR', { field: 'categoryIds' });
      }
      const at = this.clock.now();
      if (
        !(await this.businesses.updateProfile(tx, {
          id: current.id,
          expectedVersion: input.expectedVersion,
          changes,
          at,
        }))
      )
        throw new DomainError('BUSINESS_VERSION_CONFLICT');
      if (categories.changed)
        await this.businesses.replaceCategories(
          tx,
          current.id,
          categories.ids,
          categories.primary,
          at,
        );
      if (input.hours) await this.businesses.replaceHours(tx, current.id, input.hours);
      if (settings) await this.businesses.updateSettings(tx, current.id, settings, at);
      const after = (await this.businesses.find(tx, current.id))!;
      await this.events.profileChanged(
        tx,
        after,
        {
          categoryIdsBefore: before.categories.map((link) => link.categoryId),
          categoryIdsAfter: categories.ids,
        },
        request.correlationId,
      );
      return this.dto(tx, after);
    });
  }

  /** Validates completeness, allocates the immutable slug, enters pending. */
  submit(request: OwnerCommand, input: BusinessVersionCommand): Promise<BusinessOwner> {
    return this.versioned(request, 'business.application.submit', '/businesses/me/submit', input, async (tx, current) => {
      if (!capabilities(current, false).submit)
        throw new DomainError('BUSINESS_STATE_CONFLICT');
      const aggregate = await this.businesses.aggregate(tx, current);
      for (const field of ['nameEn', 'areaId', 'addressText'] as const)
        if (current[field] === null)
          throw new DomainError('VALIDATION_ERROR', { field });
      const primary = aggregate.categories.filter((link) => link.isPrimary);
      if (!aggregate.categories.length || primary.length !== 1)
        throw new DomainError('VALIDATION_ERROR', { field: 'categoryIds' });
      await this.assertCategories(
        aggregate.categories.map((link) => link.categoryId),
      );
      const slug =
        current.slug ??
        (await this.businesses.allocateSlug(
          tx,
          catalogSlug(current.nameEn!) || 'business',
        ));
      const at = this.clock.now();
      if (
        !(await this.businesses.transition(tx, {
          id: current.id,
          expectedVersion: input.expectedVersion,
          status: 'pending',
          slug,
          submittedAt: at,
          review: 'clear',
          at,
        }))
      )
        throw new DomainError('BUSINESS_VERSION_CONFLICT');
      const after = (await this.businesses.find(tx, current.id))!;
      await this.events.submitted(tx, after, current.status, request.correlationId);
      return after;
    });
  }

  /** inactive -> approved (ST-approval owner edge); restores the role. */
  reactivate(request: OwnerCommand, input: BusinessVersionCommand): Promise<BusinessOwner> {
    return this.versioned(request, 'business.reactivate', '/businesses/me/reactivate', input, async (tx, current) => {
      if (current.status !== 'inactive')
        throw new DomainError('BUSINESS_STATE_CONFLICT');
      const at = this.clock.now();
      if (
        !(await this.businesses.transition(tx, {
          id: current.id,
          expectedVersion: input.expectedVersion,
          status: 'approved',
          at,
        }))
      )
        throw new DomainError('BUSINESS_VERSION_CONFLICT');
      const after = (await this.businesses.find(tx, current.id))!;
      await this.roles.assignApprovedRole(
        {
          userId: after.ownerUserId,
          role: ROLE_FOR_KIND[after.kind],
          sourceId: after.id,
          caller: 'businesses',
        },
        tx,
      );
      const [profile] = await this.identity.describe(tx, [after.ownerUserId]);
      await this.audit.record(tx, {
        actor: {
          userId: after.ownerUserId,
          role: ROLE_FOR_KIND[after.kind],
          label: profile?.displayName ?? 'Business owner',
        },
        action: 'business.reactivated',
        entityType: 'business',
        entityId: after.id,
        cityId: after.cityId,
        areaId: after.areaId,
        summary: 'Business reactivated by owner',
        before: businessSnapshot(current),
        after: businessSnapshot(after),
        fields: BUSINESS_AUDIT_FIELDS,
        correlationId: request.correlationId,
      });
      const categories = (await this.businesses.aggregate(tx, after)).categories.map(
        (link) => link.categoryId,
      );
      await this.events.profileChanged(
        tx,
        after,
        {
          previousStatus: current.status,
          categoryIdsBefore: categories,
          categoryIdsAfter: categories,
        },
        request.correlationId,
      );
      return after;
    });
  }

  /** Logo/cover through Media's validated asset port; attach via PATCH. */
  uploadMedia(
    request: OwnerCommand,
    input: BusinessMediaUpload,
    file: UploadedFile,
  ): Promise<BusinessMediaUploadResult> {
    return this.commands.run(
      this.command(request, 'business.media.upload', '/businesses/me/media', 201, {
        ...input,
        file: fingerprint(file),
      }),
      async (tx) => {
        const current = await this.owned(tx, request, true);
        if (!capabilities(current, false).uploadMedia)
          throw new DomainError('BUSINESS_STATE_CONFLICT');
        const asset = await this.media.uploadProfileImage(tx, {
          businessId: current.id,
          ownerUserId: current.ownerUserId,
          purpose: input.assetKind,
          file,
        });
        return BusinessMediaUploadResultSchema.parse(asset) as BusinessMediaUploadResult & JsonValue;
      },
      receipt(BusinessMediaUploadResultSchema),
    );
  }

  /** Optional private onboarding document; only private metadata returned. */
  uploadDocument(
    request: OwnerCommand,
    input: BusinessDocumentUpload,
    file: UploadedFile,
  ): Promise<BusinessDocumentUploadResult> {
    return this.commands.run(
      this.command(request, 'business.document.upload', '/businesses/me/documents', 201, {
        ...input,
        file: fingerprint(file),
      }),
      async (tx) => {
        const current = await this.owned(tx, request, true);
        if (!capabilities(current, false).uploadDocuments)
          throw new DomainError('BUSINESS_STATE_CONFLICT');
        const asset = await this.media.uploadPrivateDocument(tx, {
          businessId: current.id,
          ownerUserId: current.ownerUserId,
          documentKind: input.documentKind,
          file,
        });
        const document = await this.businesses.insertDocument(tx, {
          id: this.ids.uuidv7(),
          businessId: current.id,
          documentKind: input.documentKind,
          assetId: asset.assetId,
          uploadedBy: current.ownerUserId,
          at: this.clock.now(),
        });
        return BusinessDocumentUploadResultSchema.parse({
          documentId: document.id,
          documentKind: document.documentKind,
          assetId: document.assetId,
          status: asset.status,
        }) as BusinessDocumentUploadResult & JsonValue;
      },
      receipt(BusinessDocumentUploadResultSchema),
    );
  }

  overview(request: OwnerRequest): Promise<BusinessOverview> {
    return this.uow.run(async (tx) => {
      const business = await this.owned(tx, request);
      return BusinessOverviewSchema.parse(
        await this.insights.overview(
          tx,
          business,
          await this.owners.sellerRole(tx, business),
        ),
      );
    });
  }

  /** Approved providers only (F-PV-006). */
  analytics(request: OwnerRequest): Promise<BusinessAnalytics> {
    return this.uow.run(async (tx) => {
      const business = await this.owned(tx, request);
      if (business.kind !== 'provider' || business.status !== 'approved')
        throw new DomainError('BUSINESS_STATE_CONFLICT');
      return BusinessAnalyticsSchema.parse(
        await this.insights.analytics(tx, business),
      );
    });
  }

  /** Live session + the caller's own business for the route context. */
  async owned(
    tx: TxContext,
    request: OwnerRequest,
    lock = false,
  ): Promise<StoredBusiness> {
    const userId = await this.principal(tx, request);
    return this.owners.resolve(tx, {
      userId,
      ...(request.businessKind ? { kind: request.businessKind } : {}),
      lock,
    });
  }

  private async principal(tx: TxContext, request: OwnerRequest): Promise<string> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    return principal.userId;
  }

  private async dto(tx: TxContext, business: StoredBusiness): Promise<BusinessOwner> {
    return ownerDto(
      await this.businesses.aggregate(tx, business),
      await this.owners.sellerRole(tx, business),
    );
  }

  /** Distinct active product categories (Catalog taxonomy). */
  private async assertCategories(ids: readonly string[]): Promise<void> {
    const taxonomy = await this.catalog.taxonomy({
      categoryIds: ids,
      kind: 'product',
      activeOnly: true,
    });
    const active = new Set(
      taxonomy.categories
        .filter((category) => category.active && category.kind === 'product')
        .map((category) => category.id),
    );
    if (ids.some((id) => !active.has(id)))
      throw new DomainError('VALIDATION_ERROR', { field: 'categoryIds' });
  }

  private mergeCategories(
    before: BusinessAggregate,
    input: BusinessProfilePatch,
  ): { ids: string[]; primary: string | null; changed: boolean } {
    const ids = before.categories.map((link) => link.categoryId);
    const primary =
      before.categories.find((link) => link.isPrimary)?.categoryId ?? null;
    if (input.categoryIds !== undefined)
      return {
        ids: [...input.categoryIds],
        primary: input.primaryCategoryId ?? null,
        changed: true,
      };
    if (input.primaryCategoryId === undefined)
      return { ids, primary, changed: false };
    // Primary-only change must name one of the stored categories.
    if (
      input.primaryCategoryId !== null &&
      !ids.includes(input.primaryCategoryId)
    )
      throw new DomainError('VALIDATION_ERROR', { field: 'primaryCategoryId' });
    if (input.primaryCategoryId === null && ids.length)
      throw new DomainError('VALIDATION_ERROR', { field: 'primaryCategoryId' });
    return { ids, primary: input.primaryCategoryId, changed: true };
  }

  /**
   * Merged settings or null when untouched. Provider service-area fields are
   * rejected for a shop; enabled delivery needs method/radius/minimum and a
   * self-delivery fee (null is never treated as zero).
   */
  private mergeSettings(
    current: BusinessSettings,
    input: BusinessProfilePatch,
    kind: BusinessKind,
  ): BusinessSettings | null {
    const patch = input.settings;
    if (
      kind === 'shop' &&
      ((patch?.serviceRadiusKm ?? null) !== null ||
        (patch?.serviceArea ?? null) !== null)
    )
      throw new DomainError('VALIDATION_ERROR', {
        field: patch?.serviceArea ? 'settings.serviceArea' : 'settings.serviceRadiusKm',
      });
    const kindChangedToShop = kind === 'shop' && input.kind === 'shop';
    if (!patch && !kindChangedToShop) return null;
    const merged: BusinessSettings = { ...current, ...patch };
    if (kind === 'shop') {
      merged.serviceRadiusKm = null;
      merged.serviceArea = null;
    }
    if (merged.deliveryMethod !== null && !deliveryConfigured(merged))
      throw new DomainError('VALIDATION_ERROR', {
        field: 'settings.deliveryMethod',
      });
    return merged;
  }

  /** Idempotent, version-guarded owner status command. */
  private versioned(
    request: OwnerCommand,
    name: string,
    resource: string,
    input: BusinessVersionCommand,
    work: (tx: TxContext, current: StoredBusiness) => Promise<StoredBusiness>,
  ): Promise<BusinessOwner> {
    return this.commands.run(
      this.command(request, name, resource, 200, input),
      async (tx) => {
        const current = await this.owned(tx, request, true);
        if (current.version !== input.expectedVersion)
          throw new DomainError('BUSINESS_VERSION_CONFLICT');
        return (await this.dto(tx, await work(tx, current))) as BusinessOwner & JsonValue;
      },
      receipt(BusinessOwnerSchema),
    );
  }

  private command(
    request: OwnerCommand,
    name: string,
    resource: string,
    successStatus: number,
    payload: object,
  ) {
    return this.contexts.create(
      { name, method: 'POST', scope: 'principal', successStatus },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        // The owner route context is part of the request fingerprint.
        payload: JSON.parse(
          JSON.stringify({ ...payload, businessKind: request.businessKind ?? null }),
        ) as JsonValue,
      },
    );
  }
}

/** Upload fingerprint for idempotency (content hash + size, no content). */
function fingerprint(file: UploadedFile) {
  return {
    sha256: createHash('sha256').update(file.buffer).digest('hex'),
    size: file.size,
    mimetype: file.mimetype,
  };
}
