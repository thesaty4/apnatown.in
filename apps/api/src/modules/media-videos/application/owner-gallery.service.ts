import { Inject, Injectable } from '@nestjs/common';
import {
  CreateGalleryPhotoSchema,
  ExpectedVersionBodySchema,
  GALLERY_PHOTOS_MAX,
  OwnerGalleryPageSchema,
  OwnerGalleryPhotoSchema,
  UpdateGalleryPhotoSchema,
  type CreateGalleryPhoto,
  type ExpectedVersionBody,
  type JsonValue,
  type MediaLinkTarget,
  type OwnerGalleryPage,
  type OwnerGalleryPhoto,
  type UpdateGalleryPhoto,
} from '@apnatown/shared';
import { IdSchema, type PageQuery } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import { CURSOR_CODEC, type CursorBinding, type CursorCodec } from '../../../shared/pagination/cursor';
import type { TxContext } from '../../../shared/persistence/ports';
import { CLOCK, ID_PROVIDER, type Clock, type IdProvider } from '../../../shared/runtime/providers';
import { MEDIA_IMAGES, type ImageRepository } from '../domain/images';
import {
  MEDIA_GALLERY_REPOSITORY,
  type GalleryRepository,
  type OwnerListPosition,
  type StoredGalleryPhoto,
} from '../domain/media-gallery';
import type { VideoOwnerRequest } from '../domain/videos';
import { MediaOwnerCommands } from './media-owner-commands';

const positionSchema = z.tuple([z.number().int().min(0), IdSchema]);
const parsePhoto = (value: unknown) =>
  OwnerGalleryPhotoSchema.parse(value) as OwnerGalleryPhoto & JsonValue;
const RESOURCE = '/businesses/me/gallery';

/**
 * Owner Gallery manager for gallery-only photos (`gallery` purpose assets of
 * the caller's own approved business). Product/service images stay owned by
 * their listing and are only surfaced through per-placement consent.
 */
@Injectable()
export class OwnerGalleryService {
  constructor(
    private readonly access: MediaOwnerCommands,
    @Inject(MEDIA_GALLERY_REPOSITORY) private readonly gallery: GalleryRepository,
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  list(request: VideoOwnerRequest, query: PageQuery): Promise<OwnerGalleryPage> {
    return this.access.read(request, async (tx, business) => {
      const binding: CursorBinding = {
        operation: 'media.gallery.mine',
        sort: 'sortOrder-id-asc',
        filters: null,
        scope: { actor: request.actorId, businessId: business.id, businessKind: business.kind },
      };
      const after = this.position(query.cursor, binding);
      const rows = await this.gallery.page(tx, {
        businessId: business.id, limit: query.limit, ...(after ? { after } : {}),
      });
      const page = rows.slice(0, query.limit);
      const last = page.at(-1);
      return OwnerGalleryPageSchema.parse({
        items: page.map((row) => this.dto(row)),
        nextCursor: rows.length > query.limit && last
          ? this.cursors.encode(binding, [last.sortOrder, last.id])
          : null,
      });
    });
  }

  get(request: VideoOwnerRequest, id: string): Promise<OwnerGalleryPhoto> {
    return this.access.read(request, async (tx, business) => {
      const photo = await this.gallery.find(tx, { businessId: business.id, id, lock: false });
      if (!photo) throw new DomainError('MEDIA_NOT_FOUND');
      return OwnerGalleryPhotoSchema.parse(this.dto(photo));
    });
  }

  create(request: VideoOwnerRequest, input: CreateGalleryPhoto): Promise<OwnerGalleryPhoto> {
    const body = CreateGalleryPhotoSchema.parse(input);
    return this.access.run(
      request,
      { name: 'media.gallery.create', method: 'POST', resource: RESOURCE, successStatus: 201 },
      body,
      async (tx, business) => {
        const owned = await this.images.lockOwned(tx, {
          assetIds: [body.assetId], ownerUserId: request.actorId, businessId: business.id, purpose: 'gallery',
        });
        if (owned.length !== 1) throw new DomainError('MEDIA_NOT_FOUND', { field: 'assetId' });
        if (body.linkedTarget) await this.requireTarget(tx, business.id, body.linkedTarget);
        await this.gallery.lockOrder(tx, business.id, 'gallery');
        const stats = await this.gallery.stats(tx, business.id);
        if (stats.count >= GALLERY_PHOTOS_MAX)
          throw new DomainError('COMMON_CONFLICT', { field: 'assetId' });
        const at = this.clock.now();
        const row: StoredGalleryPhoto = {
          id: this.ids.uuidv7(),
          businessId: business.id,
          assetId: body.assetId,
          caption: body.caption || null,
          linkedTarget: body.linkedTarget ?? null,
          sortOrder: stats.nextSortOrder,
          moderationState: 'allowed',
          version: 1,
          createdAt: at.toISOString(),
        };
        if ((await this.gallery.insert(tx, row, at)) === 'asset_in_use')
          throw new DomainError('COMMON_CONFLICT', { field: 'assetId' });
        await this.gallery.bumpOrder(tx, business.id, 'gallery', at);
        return parsePhoto(this.dto(row));
      },
      parsePhoto,
    );
  }

  update(request: VideoOwnerRequest, id: string, input: UpdateGalleryPhoto): Promise<OwnerGalleryPhoto> {
    const body = UpdateGalleryPhotoSchema.parse(input);
    return this.access.run(
      request,
      { name: 'media.gallery.update', method: 'PATCH', resource: `${RESOURCE}/${id}`, successStatus: 200 },
      { id, ...body },
      async (tx, business) => {
        const photo = await this.locked(tx, business.id, id, body.expectedVersion);
        if (body.linkedTarget) await this.requireTarget(tx, business.id, body.linkedTarget);
        const updated = await this.gallery.update(tx, {
          id,
          caption: body.caption === undefined ? photo.caption : body.caption || null,
          linkedTarget: body.linkedTarget === undefined ? photo.linkedTarget : body.linkedTarget,
          at: this.clock.now(),
        });
        return parsePhoto(this.dto(updated));
      },
      parsePhoto,
    );
  }

  remove(request: VideoOwnerRequest, id: string, input: ExpectedVersionBody): Promise<OwnerGalleryPhoto> {
    const body = ExpectedVersionBodySchema.parse(input);
    return this.access.run(
      request,
      { name: 'media.gallery.delete', method: 'DELETE', resource: `${RESOURCE}/${id}`, successStatus: 200 },
      { id, ...body },
      async (tx, business) => {
        await this.gallery.lockOrder(tx, business.id, 'gallery');
        const photo = await this.locked(tx, business.id, id, body.expectedVersion);
        const at = this.clock.now();
        await this.gallery.softDelete(tx, id, at);
        await this.gallery.bumpOrder(tx, business.id, 'gallery', at);
        return parsePhoto(this.dto(photo));
      },
      parsePhoto,
    );
  }

  private async locked(tx: TxContext, businessId: string, id: string, expectedVersion: number) {
    const photo = await this.gallery.find(tx, { businessId, id, lock: true });
    if (!photo) throw new DomainError('MEDIA_NOT_FOUND');
    if (photo.version !== expectedVersion) throw new DomainError('MEDIA_VERSION_CONFLICT');
    return photo;
  }

  private async requireTarget(tx: TxContext, businessId: string, target: MediaLinkTarget) {
    if ((await this.gallery.countPublicTargets(tx, businessId, [target])) !== 1)
      throw new DomainError('MEDIA_LINK_TARGET_INVALID', { field: 'linkedTarget' });
  }

  private position(cursor: string | undefined, binding: CursorBinding): OwnerListPosition | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(this.cursors.decode(cursor, binding));
    if (!parsed.success) throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return { sortOrder: parsed.data[0], id: parsed.data[1] };
  }

  private dto(photo: StoredGalleryPhoto): OwnerGalleryPhoto {
    return {
      id: photo.id,
      businessId: photo.businessId,
      assetId: photo.assetId,
      caption: photo.caption,
      linkedTarget: photo.linkedTarget,
      preview: { assetId: photo.assetId, previewPath: `/api/media/previews/${photo.assetId}` },
      moderationState: photo.moderationState,
      version: photo.version,
      createdAt: photo.createdAt,
    };
  }
}
