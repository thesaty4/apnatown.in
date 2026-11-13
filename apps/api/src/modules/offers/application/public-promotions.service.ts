import { Inject, Injectable } from '@nestjs/common';
import {
  OfferPublicPageSchema,
  PlacementPublicPageSchema,
  type OfferPublicPage,
  type OfferPublicQuery,
  type PlacementPublicPage,
  type PlacementPublicQuery,
} from '@apnatown/shared/offers';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import { CURSOR_CODEC, type CursorCodec } from '../../../shared/pagination/cursor';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import {
  PUBLIC_PROMOTIONS_REPOSITORY,
  type PublicPromotionsRepository,
} from '../domain/public-promotions';

const position = z.tuple([TimestampSchema, IdSchema]);

/**
 * Public offers and promotion placements (S-CUST-20, F-HM-002/006/007).
 * Eligibility lives in the runtime views; this service only projects and
 * drops placements whose internal destination is no longer public.
 */
@Injectable()
export class PublicPromotionsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(PUBLIC_PROMOTIONS_REPOSITORY)
    private readonly repository: PublicPromotionsRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  offers(query: OfferPublicQuery): Promise<OfferPublicPage> {
    return this.uow.run(async (tx) => {
      const binding = {
        operation: 'offers.public.list',
        sort: 'validTo-desc',
        filters: {
          businessId: query.businessId ?? null,
          featured: query.featured ?? null,
        },
        scope: 'public',
      };
      let after = null;
      if (query.cursor) {
        const parsed = position.safeParse(this.cursors.decode(query.cursor, binding));
        if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
        after = { validTo: parsed.data[0], id: parsed.data[1] };
      }
      const rows = await this.repository.offers(tx, {
        businessId: query.businessId ?? null,
        featured:
          query.featured === undefined ? null : query.featured === 'true',
        take: query.limit + 1,
        after,
      });
      const items = rows.slice(0, query.limit);
      const last = items.at(-1);
      return OfferPublicPageSchema.parse({
        items: items.map((row) => ({
          id: row.id,
          business: {
            id: row.businessId,
            kind: row.businessKind,
            slug: row.businessSlug,
            nameEn: row.businessNameEn,
            nameHi: row.businessNameHi,
          },
          titleEn: row.titleEn,
          titleHi: row.titleHi,
          termsEn: row.termsEn,
          termsHi: row.termsHi,
          discount: {
            type: row.discountType,
            percent: row.discountPercent,
            flatPaise: row.discountPaise,
          },
          validFrom: row.validFrom,
          validTo: row.validTo,
          state: row.state,
          featured: row.featured,
          destination:
            `/${row.businessKind === 'shop' ? 'shop' : 'provider'}/${row.businessSlug}`,
        })),
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.validTo, last.id])
            : null,
      });
    });
  }

  placements(query: PlacementPublicQuery): Promise<PlacementPublicPage> {
    return this.uow.run(async (tx) => {
      const rows = await this.repository.placements(tx, {
        kind: query.kind ?? null,
        cityId: query.cityId ?? null,
        areaId: query.areaId ?? null,
        take: query.limit,
      });
      return PlacementPublicPageSchema.parse({
        items: rows
          .filter(
            (row) =>
              row.destinationKind !== null &&
              row.destinationHref !== null &&
              (row.kind !== 'homepage_banner' ||
                row.titleEn !== null ||
                row.titleHi !== null),
          )
          .map((row) => ({
            id: row.id,
            kind: row.kind,
            surface: row.surface,
            titleEn: row.titleEn,
            titleHi: row.titleHi,
            subtitleEn: row.subtitleEn,
            subtitleHi: row.subtitleHi,
            banner: row.banner,
            destination: {
              kind: row.destinationKind!,
              targetId: row.destinationTargetId,
              href: row.destinationHref!,
            },
            position: row.position,
          })),
      });
    });
  }
}
