import { createHmac } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type {
  BusinessCategoryRef,
  BusinessKind,
  BusinessOverview,
  BusinessPublic,
} from '@apnatown/shared/businesses';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
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
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  CATALOG_READ,
  type CatalogReadPort,
} from '../../catalog/application/catalog-ports';
import { GEO_SCOPE, type GeoScopePort } from '../../geo/application/geo-scope.port';
import {
  BUSINESS_REPOSITORY,
  ROLE_FOR_KIND,
  type BusinessAggregate,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import { BusinessInsights } from './business-insights';
import { publicDto } from './business-mappers';
import { BusinessOwnerContext } from './business-owner-context';
import {
  BUSINESS_MEDIA_ASSETS,
  type BusinessCheckoutContext,
  type BusinessMediaAssetPort,
  type BusinessMediaReadPort,
  type BusinessNotificationReadPort,
  type BusinessReadPort,
} from './business-ports';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const PROJECTION_MAX = 50;
const VIEW_WINDOW_MS = 30 * 60 * 1000;
const VIEW_KEY_LABEL = 'business.view.v1';

/**
 * Public profile reads, the reporting-v1 profile-view signal and the
 * purpose-limited read ports Businesses exposes (BUSINESS_READ,
 * BUSINESS_MEDIA_READ, BUSINESS_NOTIFICATION_READ). Only approved,
 * non-deleted businesses are ever projected publicly.
 */
@Injectable()
export class BusinessPublicService implements BusinessReadPort {
  private readonly viewKey: Buffer;

  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    @Inject(BUSINESS_MEDIA_ASSETS)
    private readonly media: BusinessMediaAssetPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(RUNTIME_CONFIG) config: RuntimeConfig,
    private readonly owners: BusinessOwnerContext,
    private readonly insights: BusinessInsights,
  ) {
    // Purpose-separated subkey: view-dedup hashes never equal rate-limit or
    // cursor MACs derived from the same secret.
    this.viewKey = createHmac('sha256', config.CURSOR_SIGNING_KEY)
      .update(VIEW_KEY_LABEL)
      .digest();
  }

  /** Approved profile by slug; anything else is BUSINESS_NOT_PUBLIC. */
  async profile(slug: string): Promise<BusinessPublic> {
    const aggregate = await this.uow.run(async (tx) => {
      const business = await this.businesses.findPublicBySlug(tx, slug);
      if (!business) throw new DomainError('BUSINESS_NOT_PUBLIC');
      return this.businesses.aggregate(tx, business);
    });
    const [item] = await this.project([aggregate]);
    return item!;
  }

  /**
   * reporting-v1 visible-detail signal: one count per session per business
   * per 30-minute window; the owner's own views are not counted. The hash is
   * server-derived from the session and never stores the session ID.
   */
  async recordView(input: {
    slug: string;
    sessionId: string;
    principalUserId: string | null;
  }): Promise<void> {
    const now = this.clock.now();
    await this.uow.run(async (tx) => {
      const business = await this.businesses.findPublicBySlug(tx, input.slug);
      if (!business) throw new DomainError('BUSINESS_NOT_PUBLIC');
      if (input.principalUserId === business.ownerUserId) return;
      await this.businesses.recordView(tx, {
        businessId: business.id,
        subjectHash: createHmac('sha256', this.viewKey)
          .update(input.sessionId)
          .digest(),
        windowStart: new Date(
          Math.floor(now.getTime() / VIEW_WINDOW_MS) * VIEW_WINDOW_MS,
        ),
      });
    });
  }

  // --- BusinessReadPort -----------------------------------------------------

  async publicProjection(input: {
    businessIds?: readonly string[];
    kind?: BusinessKind;
    categoryIds?: readonly string[];
    cursor?: string;
    limit?: number;
  }): Promise<{ items: BusinessPublic[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(input.limit ?? 20, 1), PROJECTION_MAX);
    const binding: CursorBinding = {
      operation: 'business.public-projection',
      sort: 'createdAt-id',
      filters: {
        businessIds: input.businessIds ? [...input.businessIds] : null,
        kind: input.kind ?? null,
        categoryIds: input.categoryIds ? [...input.categoryIds] : null,
      },
      scope: null,
    };
    let after: [string, string] | undefined;
    if (input.cursor) {
      const parsed = positionSchema.safeParse(
        this.cursors.decode(input.cursor, binding),
      );
      if (!parsed.success)
        throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      after = parsed.data;
    }
    const { rows, aggregates } = await this.uow.run(async (tx) => {
      const page = await this.businesses.publicPage(tx, {
        ...(input.businessIds ? { businessIds: input.businessIds } : {}),
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.categoryIds ? { categoryIds: input.categoryIds } : {}),
        ...(after ? { after } : {}),
        limit,
      });
      const visible = page.slice(0, limit);
      const loaded: BusinessAggregate[] = [];
      for (const row of visible)
        loaded.push(await this.businesses.aggregate(tx, row));
      return { rows: page, aggregates: loaded };
    });
    const items = await this.project(aggregates);
    const last = aggregates.at(-1)?.business;
    return {
      items,
      nextCursor:
        rows.length > limit && last
          ? this.cursors.encode(binding, [last.createdAt, last.id])
          : null,
    };
  }

  forCheckout(
    input: { businessIds: readonly string[] },
    tx?: TxContext,
  ): Promise<BusinessCheckoutContext[]> {
    const work = async (t: TxContext) => {
      const rows = await this.businesses.findMany(t, input.businessIds);
      const result: BusinessCheckoutContext[] = [];
      for (const business of rows) {
        const aggregate = await this.businesses.aggregate(t, business);
        const settings = aggregate.settings;
        result.push({
          businessId: business.id,
          status: business.status,
          cityId: business.cityId,
          areaId: business.areaId,
          location:
            business.lat !== null && business.lng !== null
              ? { lat: business.lat, lng: business.lng }
              : null,
          hours: aggregate.hours,
          temporarilyClosed: settings.temporarilyClosed,
          deliveryMethod: settings.deliveryMethod,
          deliveryRadiusKm: settings.deliveryRadiusKm,
          deliveryFeePaise: settings.deliveryFeePaise,
          minimumOrderPaise: settings.minimumOrderPaise,
          pickupEnabled: settings.pickupEnabled,
          pickupInstructions: settings.pickupInstructions,
          version: business.version,
        });
      }
      return result;
    };
    return tx ? work(tx) : this.uow.run(work);
  }

  ownerSummary(input: {
    businessId: string;
    actorUserId: string;
  }): Promise<BusinessOverview> {
    return this.uow.run(async (tx) => {
      const business = await this.businesses.find(tx, input.businessId);
      if (!business || business.deletedAt)
        throw new DomainError('BUSINESS_NOT_FOUND');
      if (business.ownerUserId !== input.actorUserId)
        throw new DomainError('BUSINESS_NOT_OWNED');
      return this.insights.overview(
        tx,
        business,
        await this.owners.sellerRole(tx, business),
      );
    });
  }

  // --- BusinessMediaReadPort / BusinessNotificationReadPort ---------------
  // Bound in BusinessesModule as `{ context }` adapters over these methods.

  mediaContext(
    businessId: string,
    tx?: TxContext,
  ): ReturnType<BusinessMediaReadPort['context']> {
    const work = async (t: TxContext) => {
      const business = await this.live(t, businessId);
      const aggregate = await this.businesses.aggregate(t, business);
      const approved = business.status === 'approved';
      return {
        id: business.id,
        ownerUserId: business.ownerUserId,
        kind: business.kind,
        status: business.status,
        scope: { cityId: business.cityId, areaId: business.areaId },
        categoryId:
          aggregate.categories.find((link) => link.isPrimary)?.categoryId ??
          null,
        slug: business.slug,
        name: { en: business.nameEn, hi: business.nameHi },
        verified: business.verifiedAt !== null,
        logoAssetId: business.logoAssetId,
        coverAssetId: business.coverAssetId,
        galleryMediaDefault: aggregate.settings.galleryMediaDefault,
        // TODO(verify): Gallery consent policy (Media); unknown never grants,
        // so only the owner's explicit default on an approved profile counts.
        galleryAllowed: approved && aggregate.settings.galleryMediaDefault,
        hours: aggregate.hours,
        location:
          business.lat !== null && business.lng !== null
            ? { lat: business.lat, lng: business.lng }
            : null,
        version: business.version,
      };
    };
    return tx ? work(tx) : this.uow.run(work);
  }

  /**
   * Recipient-scoped decision context. Without a status history table the
   * committed decision is only provable while the row still carries the
   * event's version; a later change returns BUSINESS_VERSION_CONFLICT.
   */
  notificationContext(
    businessId: string,
    eventVersion: number,
  ): ReturnType<BusinessNotificationReadPort['context']> {
    return this.uow.run(async (tx) => {
      const business = await this.businesses.find(tx, businessId);
      if (!business) throw new DomainError('BUSINESS_NOT_FOUND');
      if (business.version !== eventVersion)
        throw new DomainError('BUSINESS_VERSION_CONFLICT');
      return {
        ownerUserId: business.ownerUserId,
        ownerRole: ROLE_FOR_KIND[business.kind],
        scope: { cityId: business.cityId, areaId: business.areaId },
        nameEn: business.nameEn,
        nameHi: business.nameHi,
        status: business.status,
        reason: business.reviewReason,
      };
    });
  }

  private async live(tx: TxContext, id: string): Promise<StoredBusiness> {
    const business = await this.businesses.find(tx, id);
    if (!business || business.deletedAt)
      throw new DomainError('BUSINESS_NOT_FOUND');
    return business;
  }

  /** Resolves categories, areas and attached public images in bulk. */
  private async project(
    aggregates: readonly BusinessAggregate[],
  ): Promise<BusinessPublic[]> {
    if (!aggregates.length) return [];
    const categoryIds = [
      ...new Set(
        aggregates.flatMap((item) =>
          item.categories.map((link) => link.categoryId),
        ),
      ),
    ];
    const categories = new Map<string, BusinessCategoryRef>();
    if (categoryIds.length) {
      const taxonomy = await this.catalog.taxonomy({
        categoryIds,
        kind: 'product',
        activeOnly: true,
      });
      for (const category of taxonomy.categories)
        categories.set(category.id, {
          id: category.id,
          slug: category.slug,
          nameEn: category.nameEn,
          nameHi: category.nameHi,
        });
    }
    const areaIds = [
      ...new Set(
        aggregates
          .map((item) => item.business.areaId)
          .filter((id): id is string => id !== null),
      ),
    ];
    const areas = new Map(
      (await this.geo.describeAreas(areaIds)).map((area) => [
        area.id,
        { id: area.id, nameEn: area.nameEn, nameHi: area.nameHi },
      ]),
    );
    const assetIds = aggregates.flatMap((item) =>
      [item.business.logoAssetId, item.business.coverAssetId].filter(
        (id): id is string => id !== null,
      ),
    );
    const images = assetIds.length
      ? await this.media.describePublic(assetIds)
      : new Map();
    const now = this.clock.now();
    return aggregates.map((aggregate) =>
      publicDto(aggregate, {
        categories,
        area: areas.get(aggregate.business.areaId ?? '') ?? null,
        images,
        now,
      }),
    );
  }
}
