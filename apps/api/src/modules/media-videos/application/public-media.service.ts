import { Inject, Injectable } from '@nestjs/common';
import {
  BusinessGalleryPageSchema,
  BusinessGalleryQuerySchema,
  BusinessVideosQuerySchema,
  LinkedVideosQuerySchema,
  PublicVideoCardPageSchema,
  type BusinessGalleryPage,
  type BusinessGalleryQuery,
  type BusinessVideosQuery,
  type GalleryItem,
  type LinkedVideosQuery,
  type MediaPhotoPlacementType,
  type MediaPublicQuery,
  type PublicVideoCardPage,
} from '@apnatown/shared';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import { CURSOR_CODEC, type CursorBinding, type CursorCodec } from '../../../shared/pagination/cursor';
import { UNIT_OF_WORK, type TxContext, type UnitOfWork } from '../../../shared/persistence/ports';
import {
  MEDIA_PUBLIC_READ_REPOSITORY,
  type PublicGalleryRecord,
  type PublicMediaReadRepository,
  type PublicVideoRecord,
} from '../domain/media-gallery';
import { defaultPath, publicImage, toPublicVideoCard } from './media-dto';

const galleryCursor = z.tuple([z.number().int().min(0), z.number().int(), z.string().min(1).max(200)]);
const videoCursor = z.tuple([z.number().int(), IdSchema]);
const linkedCursor = z.tuple([TimestampSchema, IdSchema]);

/** Report vocabulary → gateway placement vocabulary (surface `gallery`). */
const GATEWAY_PLACEMENT: Record<MediaPhotoPlacementType, MediaPublicQuery['placementType']> = {
  gallery_photo: 'gallery_photo',
  product_image: 'product',
  service_image: 'service',
};

/**
 * Public Gallery/Videos tabs and product/service "Videos & Reels" sections.
 * All rows come from Media public projections that recheck business
 * publication, approval, consent, asset moderation and linked item
 * visibility on every read; image URLs are same-origin gateway paths only.
 */
@Injectable()
export class PublicMediaService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(MEDIA_PUBLIC_READ_REPOSITORY) private readonly reads: PublicMediaReadRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  gallery(slug: string, input: BusinessGalleryQuery): Promise<BusinessGalleryPage> {
    const query = BusinessGalleryQuerySchema.parse(input);
    return this.uow.run(async (tx) => {
      const businessId = await this.business(tx, slug);
      const binding = this.binding('media.gallery.public', 'group-order-key-asc', businessId, query.filter);
      const raw = query.cursor ? galleryCursor.safeParse(this.cursors.decode(query.cursor, binding)) : null;
      if (raw && !raw.success) throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      const rows = await this.reads.galleryPage(tx, {
        businessId,
        filter: query.filter,
        limit: query.limit,
        ...(raw?.success ? { after: { group: raw.data[0], order: raw.data[1], key: raw.data[2] } } : {}),
      });
      const page = rows.slice(0, query.limit);
      const videos = await this.videoMap(tx, page);
      const items = page.flatMap((row) => this.galleryItem(row, businessId, videos));
      const last = page.at(-1);
      return BusinessGalleryPageSchema.parse({
        filter: query.filter,
        items,
        nextCursor: rows.length > query.limit && last
          ? this.cursors.encode(binding, [last.rankGroup, last.rankOrder, last.rankKey])
          : null,
      });
    });
  }

  businessVideos(slug: string, input: BusinessVideosQuery): Promise<PublicVideoCardPage> {
    const query = BusinessVideosQuerySchema.parse(input);
    return this.uow.run(async (tx) => {
      const businessId = await this.business(tx, slug);
      const binding = this.binding('media.videos.business', 'order-id-asc', businessId, null);
      const raw = query.cursor ? videoCursor.safeParse(this.cursors.decode(query.cursor, binding)) : null;
      if (raw && !raw.success) throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      const rows = await this.reads.businessVideos(tx, {
        businessId,
        limit: query.limit,
        ...(raw?.success ? { after: { order: raw.data[0], id: raw.data[1] } } : {}),
      });
      return this.videoPage(rows, query.limit, (last) => this.cursors.encode(binding, [last.rankOrder, last.id]));
    });
  }

  linkedVideos(input: LinkedVideosQuery): Promise<PublicVideoCardPage> {
    const query = LinkedVideosQuerySchema.parse(input);
    const target = { targetType: query.targetType, targetId: query.targetId };
    return this.uow.run(async (tx) => {
      const binding: CursorBinding = {
        operation: 'media.videos.linked',
        sort: 'createdAt-id-desc',
        filters: target,
        scope: null,
      };
      const raw = query.cursor ? linkedCursor.safeParse(this.cursors.decode(query.cursor, binding)) : null;
      if (raw && !raw.success) throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      const rows = await this.reads.linkedVideos(tx, {
        target,
        limit: query.limit,
        ...(raw?.success ? { after: { createdAt: raw.data[0], id: raw.data[1] } } : {}),
      });
      return this.videoPage(rows, query.limit, (last) => this.cursors.encode(binding, [last.createdAt, last.id]));
    });
  }

  private async business(tx: TxContext, slug: string) {
    const id = await this.reads.publicBusinessId(tx, slug);
    if (!id) throw new DomainError('BUSINESS_NOT_PUBLIC');
    return id;
  }

  private binding(operation: string, sort: string, businessId: string, filter: string | null): CursorBinding {
    return { operation, sort, filters: filter, scope: { businessId } };
  }

  private videoPage(
    rows: PublicVideoRecord[],
    limit: number,
    encode: (last: PublicVideoRecord) => string,
  ): PublicVideoCardPage {
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return PublicVideoCardPageSchema.parse({
      items: page.map((row) => toPublicVideoCard(row, 'reels')),
      nextCursor: rows.length > limit && last ? encode(last) : null,
    });
  }

  private async videoMap(tx: TxContext, rows: PublicGalleryRecord[]) {
    const ids = rows.flatMap((row) => (row.itemKind === 'video' && row.videoId ? [row.videoId] : []));
    const videos = ids.length ? await this.reads.videosByIds(tx, ids) : [];
    return new Map(videos.map((video) => [video.id, video]));
  }

  /** Rows that became ineligible between the page read and hydration are skipped. */
  private galleryItem(
    row: PublicGalleryRecord,
    businessId: string,
    videos: Map<string, PublicVideoRecord>,
  ): GalleryItem[] {
    if (row.itemKind === 'video') {
      const video = row.videoId ? videos.get(row.videoId) : undefined;
      return video ? [{ kind: 'video', ...toPublicVideoCard(video, 'gallery') }] : [];
    }
    if (!row.image || !row.placementType || !row.placementId) return [];
    const image = publicImage(row.image, {
      placementType: GATEWAY_PLACEMENT[row.placementType],
      placementId: row.placementId,
      surface: 'gallery',
    });
    return [{
      kind: 'photo',
      assetId: row.image.assetId,
      placementType: row.placementType,
      placementId: row.placementId,
      businessId,
      caption: row.caption,
      linkedTarget: row.linkedTarget,
      publicPath: defaultPath(image),
      image,
    }];
  }
}
