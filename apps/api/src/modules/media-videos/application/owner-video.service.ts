import { Inject, Injectable } from '@nestjs/common';
import {
  ExpectedVersionBodySchema,
  OwnerVideoDetailSchema,
  VideoEditSchema,
  type ExpectedVersionBody,
  type JsonValue,
  type OwnerVideoDetail,
  type VideoEdit,
} from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import type { StoredBusiness } from '../../businesses/domain/business';
import { MEDIA_IMAGES, type ImageRepository } from '../domain/images';
import {
  MEDIA_GALLERY_REPOSITORY,
  MEDIA_OWNER_VIDEO_REPOSITORY,
  type GalleryRepository,
  type OwnerVideoRepository,
  type StoredOwnerVideo,
} from '../domain/media-gallery';
import { parseVideoSource } from '../domain/video-source';
import type { VideoOwnerRequest } from '../domain/videos';
import { toVideoDto } from './media-dto';
import { MediaOwnerCommands } from './media-owner-commands';

const parseDetail = (value: unknown) =>
  OwnerVideoDetailSchema.parse(value) as OwnerVideoDetail & JsonValue;
const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * Owner edit/delete of one video link (Media BE `VideoEdit`). Content or
 * source changes of approved content re-enter pending before any public
 * read; rejected → pending needs explicit `resubmit`; removed content and
 * owner-deleted tombstones cannot be edited or resubmitted.
 */
@Injectable()
export class OwnerVideoService {
  constructor(
    private readonly access: MediaOwnerCommands,
    @Inject(MEDIA_OWNER_VIDEO_REPOSITORY) private readonly videos: OwnerVideoRepository,
    @Inject(MEDIA_GALLERY_REPOSITORY) private readonly gallery: GalleryRepository,
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  get(request: VideoOwnerRequest, id: string): Promise<OwnerVideoDetail> {
    return this.access.read(request, async (tx, business) => {
      const video = await this.videos.find(tx, { businessId: business.id, id, lock: false });
      if (!video || video.ownerDeletedAt) throw new DomainError('MEDIA_NOT_FOUND');
      return OwnerVideoDetailSchema.parse(this.detail(video));
    });
  }

  edit(request: VideoOwnerRequest, id: string, input: VideoEdit): Promise<OwnerVideoDetail> {
    const body = VideoEditSchema.parse(input);
    const source = body.source ? parseVideoSource(body.source.url) : undefined;
    if (source && body.source && source.provider !== body.source.kind)
      throw new DomainError('MEDIA_VIDEO_SOURCE_INVALID', { field: 'source' });
    return this.access.run(
      request,
      { name: 'media.video.edit', method: 'PATCH', resource: `/businesses/me/videos/${id}`, successStatus: 200 },
      { id, ...body, source: source ?? null },
      async (tx, business) => {
        const video = await this.editable(tx, business, id, body.expectedVersion);
        if (body.resubmit && video.status !== 'rejected')
          throw new DomainError('VIDEO_INVALID_TRANSITION');
        if (body.links) await this.requireTargets(tx, business.id, body.links);
        if (body.thumbnailAssetId) await this.requireThumbnail(tx, request, business, body.thumbnailAssetId);
        const next = {
          source: source ?? { provider: video.provider, kind: video.kind, providerId: video.providerId },
          caption: body.caption ?? video.caption,
          hashtags: body.hashtags ?? video.hashtags,
          thumbnailAssetId: body.thumbnailAssetId === undefined ? video.thumbnailAssetId : body.thumbnailAssetId,
        };
        const contentChanged =
          next.source.provider !== video.provider || next.source.kind !== video.kind ||
          next.source.providerId !== video.providerId || next.caption !== video.caption ||
          !sameList(next.hashtags, video.hashtags) || next.thumbnailAssetId !== video.thumbnailAssetId;
        const status =
          video.status === 'rejected' ? (body.resubmit ? 'pending' : 'rejected')
          : video.status === 'approved' && contentChanged ? 'pending'
          : video.status;
        const updated = await this.videos.update(tx, {
          id,
          expectedVersion: body.expectedVersion,
          ...next,
          showInGallery: body.showInGallery ?? video.showInGallery,
          showInReels: body.showInReels ?? video.showInReels,
          status,
          resetModeration: status === 'pending' && video.status !== 'pending',
          links: body.links ?? null,
          at: this.clock.now(),
        });
        if (!updated) throw new DomainError('MEDIA_VERSION_CONFLICT');
        return parseDetail(this.detail(await this.reload(tx, business.id, id)));
      },
      parseDetail,
    );
  }

  remove(request: VideoOwnerRequest, id: string, input: ExpectedVersionBody): Promise<OwnerVideoDetail> {
    const body = ExpectedVersionBodySchema.parse(input);
    return this.access.run(
      request,
      { name: 'media.video.delete', method: 'DELETE', resource: `/businesses/me/videos/${id}`, successStatus: 200 },
      { id, ...body },
      async (tx, business) => {
        const video = await this.videos.find(tx, { businessId: business.id, id, lock: true });
        if (!video || video.ownerDeletedAt) throw new DomainError('MEDIA_NOT_FOUND');
        if (video.version !== body.expectedVersion) throw new DomainError('MEDIA_VERSION_CONFLICT');
        const deleted = await this.videos.ownerDelete(tx, {
          id, expectedVersion: body.expectedVersion, at: this.clock.now(),
        });
        if (!deleted) throw new DomainError('MEDIA_VERSION_CONFLICT');
        return parseDetail(this.detail(await this.reload(tx, business.id, id)));
      },
      parseDetail,
    );
  }

  private async editable(tx: TxContext, business: StoredBusiness, id: string, expectedVersion: number) {
    const video = await this.videos.find(tx, { businessId: business.id, id, lock: true });
    if (!video || video.ownerDeletedAt) throw new DomainError('MEDIA_NOT_FOUND');
    if (video.version !== expectedVersion) throw new DomainError('MEDIA_VERSION_CONFLICT');
    if (video.status === 'removed') throw new DomainError('VIDEO_INVALID_TRANSITION');
    return video;
  }

  private async requireTargets(tx: TxContext, businessId: string, links: VideoEdit['links'] & object) {
    if ((await this.gallery.countPublicTargets(tx, businessId, links)) !== links.length)
      throw new DomainError('MEDIA_LINK_TARGET_INVALID', { field: 'links' });
  }

  private async requireThumbnail(
    tx: TxContext, request: VideoOwnerRequest, business: StoredBusiness, assetId: string,
  ) {
    const owned = await this.images.lockOwned(tx, {
      assetIds: [assetId], ownerUserId: request.actorId, businessId: business.id, purpose: 'video_thumbnail',
    });
    if (owned.length !== 1) throw new DomainError('MEDIA_NOT_FOUND', { field: 'thumbnailAssetId' });
  }

  private async reload(tx: TxContext, businessId: string, id: string) {
    const video = await this.videos.find(tx, { businessId, id, lock: false });
    if (!video) throw new Error('MEDIA_VIDEO_RELOAD_LOST');
    return video;
  }

  private detail(video: StoredOwnerVideo): OwnerVideoDetail {
    return {
      video: toVideoDto(video),
      thumbnail: video.thumbnailAssetId
        ? { assetId: video.thumbnailAssetId, previewPath: `/api/media/previews/${video.thumbnailAssetId}` }
        : null,
      links: video.links,
      decisionReason: video.decisionReason,
      ownerDeleted: video.ownerDeletedAt !== null,
    };
  }
}
