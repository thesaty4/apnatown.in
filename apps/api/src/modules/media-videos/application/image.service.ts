import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  MediaUploadResultSchema, type MediaUploadPurpose, type MediaUploadResult,
} from '@apnatown/shared';
import type { ImagePolicy } from '@apnatown/shared/settings';
import type { Logger } from 'pino';
import { ADMIN_SCOPE, SESSION_ACCESS, type AdminScopePort, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { COMMAND_CONTEXT_FACTORY, HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { UNIT_OF_WORK, type TxContext, type UnitOfWork } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import { RUNTIME_LOGGER } from '../../../shared/logger/logger';
import type { AdminCommand } from '../../admin/application/admin-command';
import { AUDIT_WRITER, type AuditActor, type AuditWriter } from '../../audit/application/audit-writer.port';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import { ROLE_FOR_KIND, capabilities } from '../../businesses/domain/business';
import { SETTINGS_READ, type SettingsReadPort } from '../../settings/application/settings-ports';
import {
  IMAGE_PROCESSOR, IMAGE_STORAGE, MEDIA_IMAGES, variantKey,
  type ImageProcessor, type ImageRepository, type ImageStorage, type StoredImage,
} from '../domain/images';

/** Authenticated caller binding (session, actor, correlation, idempotency key). */
export type MediaCommand = AdminCommand;
/** What is being uploaded and for which business (null for global taxonomy). */
export interface UploadTarget {
  purpose: MediaUploadPurpose;
  businessId: string | null;
}
type Uploader = AuditActor & { userId: string };

/** Purposes that need the approved selling capability (Gallery manager included). */
const LISTING_PURPOSES: readonly MediaUploadPurpose[] = ['product', 'service', 'gallery', 'video_thumbnail'];

@Injectable()
export class ImageService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly adminScope: AdminScopePort,
    private readonly owners: BusinessOwnerContext,
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(IMAGE_PROCESSOR) private readonly processor: ImageProcessor,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  async policy(request: MediaCommand, target: UploadTarget): Promise<ImagePolicy> {
    return this.uow.run(async (tx) => {
      await this.authorize(tx, request, target);
      return this.currentPolicy(tx, target.purpose);
    });
  }

  /**
   * Cheap pre-body admission: only a super_admin or the owner of a live,
   * media-capable business may stream an upload. Full purpose/business
   * authorization still runs in `upload`.
   */
  async mayStreamUpload(userId: string, roles: readonly string[]): Promise<boolean> {
    if (roles.includes('super_admin')) return true;
    return this.uow.run((tx) => this.owners.ownsMediaCapable(tx, userId));
  }

  private async currentPolicy(tx: TxContext, purpose: MediaUploadPurpose): Promise<ImagePolicy> {
    const configured = await this.settings.get('uploads', tx);
    const policy = configured?.value.purposes[purpose];
    if (!this.storage.configured || !policy?.enabled)
      throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
    return policy;
  }

  /**
   * Taxonomy: active super_admin (global use). Owner purposes: the caller's
   * own live business with the capability the spec requires — approved
   * listing capability for product/service, profile-edit capability (incl.
   * applicants, never suspended/inactive) for logo/cover. Anything else is
   * COMMON_FORBIDDEN without disclosing whether the business exists.
   */
  private async authorize(tx: TxContext, request: MediaCommand, target: UploadTarget): Promise<Uploader> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId) throw new DomainError('COMMON_FORBIDDEN');
    if (target.purpose === 'catalog_taxonomy') {
      if (target.businessId !== null || !principal.roles.includes('super_admin'))
        throw new DomainError('COMMON_FORBIDDEN');
      const admin = await this.adminScope.authorize(
        { actorUserId: principal.userId, module: null, action: null, scopes: [] }, tx);
      if (!admin.isSuper) throw new DomainError('COMMON_FORBIDDEN');
      return { userId: principal.userId, role: 'super_admin', label: 'Super admin' };
    }
    const business = target.businessId === null ? null
      : await this.owners.ownedById(tx, { userId: principal.userId, businessId: target.businessId });
    if (!business) throw new DomainError('COMMON_FORBIDDEN');
    const allowed = LISTING_PURPOSES.includes(target.purpose)
      ? capabilities(business, await this.owners.sellerRole(tx, business)).sell
      : capabilities(business, false).uploadMedia;
    if (!allowed) throw new DomainError('COMMON_FORBIDDEN');
    return { userId: principal.userId, role: ROLE_FOR_KIND[business.kind], label: 'Business owner' };
  }

  async upload(request: MediaCommand, target: UploadTarget,
    file: { buffer: Buffer; mimetype: string }): Promise<MediaUploadResult> {
    const policy = await this.policy(request, target);
    if (file.buffer.length === 0 || !policy.allowedMimeTypes.some((type) => type === file.mimetype))
      throw new DomainError('MEDIA_TYPE_NOT_ALLOWED');
    if (file.buffer.length > policy.maxBytes) throw new DomainError('MEDIA_TOO_LARGE');
    const taxonomy = target.purpose === 'catalog_taxonomy';
    const digest = createHash('sha256').update(file.buffer).digest('hex');
    const command = this.contexts.create(
      // The taxonomy fingerprint is unchanged so existing retries still replay.
      { name: taxonomy ? 'media.taxonomy.upload' : 'media.image.upload', method: 'POST',
        scope: 'principal', successStatus: 201 },
      { actorId: request.actorId, correlationId: request.correlationId,
        resource: '/media/uploads', business: null, expiresAt: new Date(Date.now() + 86_400_000) },
      { key: request.key, payload: taxonomy
        ? { purpose: 'catalog_taxonomy', mime: file.mimetype, digest }
        : { purpose: target.purpose, businessId: target.businessId, mime: file.mimetype, digest } },
    );
    const leaseId = this.ids.uuidv7();
    const operation = await this.uow.run(async (tx) => {
      await this.authorize(tx, request, target);
      return this.images.reserve(tx, command, policy, this.ids.uuidv7(), leaseId);
    });
    if (operation.ready) return this.uow.run(async (tx) => {
      await this.authorize(tx, request, target);
      const image = await this.images.findUpload(tx, operation.id);
      if (!image || image.ownerUserId !== request.actorId || image.purpose !== target.purpose ||
          image.businessId !== target.businessId)
        throw new DomainError('MEDIA_NOT_FOUND');
      return this.result(image);
    });
    try {
      if (JSON.stringify(operation.policy) !== JSON.stringify(policy))
        throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
      // Decode/sanitize and provider writes run outside any DB transaction.
      const processed = await this.processor.process(file.buffer, file.mimetype, operation.policy);
      const variants = [];
      for (const [index, variant] of processed.variants.entries())
        variants.push(await this.storage.put(variantKey(operation.id, index + 1), variant));
      const image: StoredImage = {
        id: operation.id, ownerUserId: request.actorId, purpose: target.purpose,
        businessId: target.businessId, width: processed.width,
        height: processed.height, bytes: variants.reduce((sum, item) => sum + item.bytes, 0),
        version: 1, variants,
      };
      return await this.uow.run(async (tx) => {
        // Capability may have been lost while processing; recheck before commit.
        const actor = await this.authorize(tx, request, target);
        const current = await this.currentPolicy(tx, target.purpose);
        if (JSON.stringify(current) !== JSON.stringify(operation.policy))
          throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
        await this.images.commit(tx, operation.id, leaseId, image);
        await this.audit.record(tx, {
          actor, action: 'media.image.uploaded', entityType: 'media_asset', entityId: image.id,
          summary: taxonomy ? 'Taxonomy image uploaded' : 'Business image uploaded', before: null,
          after: taxonomy ? { purpose: target.purpose, bytes: image.bytes }
            : { purpose: target.purpose, businessId: target.businessId, bytes: image.bytes },
          fields: taxonomy ? ['purpose', 'bytes'] : ['purpose', 'businessId', 'bytes'],
          correlationId: request.correlationId,
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

  /**
   * Same-origin, no-store preview for the uploader only, still holding the
   * capability for the asset's purpose/business. Rechecked after the
   * provider read so a revocation during the fetch is honoured.
   */
  async preview(request: MediaCommand, assetId: string): Promise<Buffer> {
    const read = () => this.uow.run(async (tx) => {
      const image = await this.images.findUpload(tx, assetId);
      if (!image || image.ownerUserId !== request.actorId) throw new DomainError('MEDIA_NOT_FOUND');
      await this.authorize(tx, request, { purpose: image.purpose, businessId: image.businessId });
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
      assetId: image.id, status: 'ready', purpose: image.purpose,
      visibility: 'public', mimeType: 'image/webp', bytes: image.bytes,
      width: image.width, height: image.height, previewPath: `/api/media/previews/${image.id}`,
    });
  }
}
