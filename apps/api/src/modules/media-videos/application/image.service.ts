import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { MediaUploadResultSchema, type MediaUploadResult } from '@apnatown/shared';
import type { ImagePolicy } from '@apnatown/shared/settings';
import type { Logger } from 'pino';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { COMMAND_CONTEXT_FACTORY, HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { UNIT_OF_WORK, type TxContext, type UnitOfWork } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import { RUNTIME_LOGGER } from '../../../shared/logger/logger';
import type { AdminCommand } from '../../admin/application/admin-command';
import { AUDIT_WRITER, type AuditWriter } from '../../audit/application/audit-writer.port';
import { SETTINGS_READ, type SettingsReadPort } from '../../settings/application/settings-ports';
import {
  IMAGE_PROCESSOR, IMAGE_STORAGE, MEDIA_IMAGES, variantKey,
  type ImageProcessor, type ImageRepository, type ImageStorage, type StoredImage,
} from '../domain/images';

@Injectable()
export class ImageService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(IMAGE_PROCESSOR) private readonly processor: ImageProcessor,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  async policy(request: AdminCommand): Promise<ImagePolicy> {
    return this.uow.run(async (tx) => {
      await this.authorize(tx, request);
      return this.currentPolicy(tx);
    });
  }

  private async currentPolicy(tx: TxContext): Promise<ImagePolicy> {
    const configured = await this.settings.get('uploads', tx);
    const policy = configured?.value.purposes.catalog_taxonomy;
    if (!this.storage.configured || !policy?.enabled)
      throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
    return policy;
  }

  private async authorize(tx: TxContext, request: AdminCommand) {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId || !principal.roles.includes('super_admin'))
      throw new DomainError('COMMON_FORBIDDEN');
  }

  async upload(request: AdminCommand, file: { buffer: Buffer; mimetype: string }): Promise<MediaUploadResult> {
    const policy = await this.policy(request);
    if (file.buffer.length === 0 || !policy.allowedMimeTypes.some((type) => type === file.mimetype))
      throw new DomainError('MEDIA_TYPE_NOT_ALLOWED');
    if (file.buffer.length > policy.maxBytes) throw new DomainError('MEDIA_TOO_LARGE');
    const command = this.contexts.create(
      { name: 'media.taxonomy.upload', method: 'POST', scope: 'principal', successStatus: 201 },
      { actorId: request.actorId, correlationId: request.correlationId,
        resource: '/media/uploads', business: null, expiresAt: new Date(Date.now() + 86_400_000) },
      { key: request.key, payload: { purpose: 'catalog_taxonomy', mime: file.mimetype,
        digest: createHash('sha256').update(file.buffer).digest('hex') } },
    );
    const leaseId = this.ids.uuidv7();
    const operation = await this.uow.run(async (tx) => {
      await this.authorize(tx, request);
      return this.images.reserve(tx, command, policy, this.ids.uuidv7(), leaseId);
    });
    if (operation.ready) return this.uow.run(async (tx) => {
      await this.authorize(tx, request);
      const image = await this.images.find(tx, operation.id);
      if (!image || image.ownerUserId !== request.actorId) throw new DomainError('MEDIA_NOT_FOUND');
      return this.result(image);
    });
    try {
      if (JSON.stringify(operation.policy) !== JSON.stringify(policy))
        throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
      const processed = await this.processor.process(file.buffer, file.mimetype, operation.policy);
      const variants = [];
      for (const [index, variant] of processed.variants.entries())
        variants.push(await this.storage.put(variantKey(operation.id, index + 1), variant));
      const image: StoredImage = {
        id: operation.id, ownerUserId: request.actorId, width: processed.width,
        height: processed.height, bytes: variants.reduce((sum, item) => sum + item.bytes, 0),
        version: 1, variants,
      };
      return await this.uow.run(async (tx) => {
        await this.authorize(tx, request);
        const current = await this.currentPolicy(tx);
        if (JSON.stringify(current) !== JSON.stringify(operation.policy))
          throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
        await this.images.commit(tx, operation.id, leaseId, image);
        await this.audit.record(tx, {
          actor: { userId: request.actorId, role: 'super_admin', label: 'Super admin' },
          action: 'media.image.uploaded', entityType: 'media_asset', entityId: image.id,
          summary: 'Taxonomy image uploaded', before: null,
          after: { purpose: 'catalog_taxonomy', bytes: image.bytes },
          fields: ['purpose', 'bytes'], correlationId: request.correlationId,
        });
        return this.result(image);
      });
    } catch (error) {
      try {
        await this.uow.run((tx) => this.images.release(tx, operation.id, leaseId));
      } catch {
        this.logger.error({ event: 'media.upload_lease_release_failed', assetId: operation.id });
      }
      throw error;
    }
  }

  async preview(request: AdminCommand, assetId: string): Promise<Buffer> {
    const read = () => this.uow.run(async (tx) => {
      await this.authorize(tx, request);
      const image = await this.images.find(tx, assetId);
      if (!image || image.ownerUserId !== request.actorId) throw new DomainError('MEDIA_NOT_FOUND');
      return image;
    });
    const image = await read();
    const variant = image.variants[image.variants.length - 1]!;
    const bytes = await this.storage.get(variant);
    await read();
    return bytes;
  }

  private result(image: StoredImage): MediaUploadResult {
    return MediaUploadResultSchema.parse({
      assetId: image.id, status: 'ready', purpose: 'catalog_taxonomy',
      visibility: 'public', mimeType: 'image/webp', bytes: image.bytes,
      width: image.width, height: image.height, previewPath: `/api/media/previews/${image.id}`,
    });
  }
}
