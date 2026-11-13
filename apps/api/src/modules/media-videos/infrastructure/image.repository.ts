import { Injectable } from '@nestjs/common';
import { ImagePolicySchema, type ImagePolicy } from '@apnatown/shared/settings';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { CommandContext, TxContext } from '../../../shared/persistence/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { MediaUploadPurpose } from '@apnatown/shared';
import { IdSchema } from '@apnatown/shared/wire';
import type { MediaAsset } from '../../../shared/persistence/generated/client';
import {
  StoredVariantSchema, storedPurpose, uploadPurpose,
  type ImageRepository, type StoredImage, type StoredImagePurpose,
} from '../domain/images';

@Injectable()
export class PrismaImageRepository implements ImageRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async reserve(tx: TxContext, command: CommandContext, policy: ImagePolicy, id: string, leaseId: string) {
    const client = this.db.client(tx);
    const ownerUserId = command.actor.id;
    const keyHash = Buffer.from(command.keyHash).toString('hex');
    const requestHash = Buffer.from(command.requestHash).toString('hex');
    await client.mediaUploadOperation.createMany({
      data: { id, ownerUserId, keyHash, requestHash, policy, expiresAt: command.expiresAt },
      skipDuplicates: true,
    });
    await client.$queryRaw`SELECT id FROM media_upload_operations
      WHERE owner_user_id = ${ownerUserId}::uuid AND key_hash = ${keyHash} FOR UPDATE`;
    const op = await client.mediaUploadOperation.findUniqueOrThrow({
      where: { ownerUserId_keyHash: { ownerUserId, keyHash } },
    });
    if (op.requestHash !== requestHash || !['pending','ready'].includes(op.state) ||
        op.expiresAt.getTime() <= Date.now())
      throw new DomainError('COMMON_CONFLICT');
    if (op.state === 'ready')
      return { id: op.id, policy: ImagePolicySchema.parse(op.policy), ready: true };
    if (op.leaseUntil && op.leaseUntil.getTime() > Date.now())
      throw new DomainError('COMMON_CONFLICT');
    if (JSON.stringify(op.policy) !== JSON.stringify(policy)) {
      // JSONB key order is not meaningful; compare the parsed policy.
      if (JSON.stringify(ImagePolicySchema.parse(op.policy)) !== JSON.stringify(ImagePolicySchema.parse(policy)))
        throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
    }
    await client.mediaUploadOperation.update({
      where: { id: op.id },
      data: { leaseId, leaseUntil: new Date(Date.now() + 300_000) },
    });
    return { id: op.id, policy: ImagePolicySchema.parse(op.policy), ready: false };
  }

  async commit(tx: TxContext, id: string, leaseId: string, image: StoredImage) {
    const client = this.db.client(tx);
    const updated = await client.mediaUploadOperation.updateMany({
      where: { id, leaseId, state: 'pending', leaseUntil: { gt: new Date() } },
      data: { state: 'ready', leaseId: null, leaseUntil: null },
    });
    if (updated.count !== 1) throw new DomainError('COMMON_CONFLICT');
    const stored = storedPurpose(image.purpose);
    await client.mediaAsset.create({
      data: {
        id, ownerUserId: image.ownerUserId, businessId: image.businessId,
        purpose: stored.purpose, subjectType: stored.subjectType,
        storageKey: id, mimeType: 'image/webp', bytes: image.bytes,
        width: image.width, height: image.height, variants: image.variants,
      },
    });
  }

  async find(tx: TxContext, id: string, purpose: StoredImagePurpose = 'catalog_taxonomy'): Promise<StoredImage | null> {
    const row = await this.db.client(tx).mediaAsset.findFirst({
      where: { id, purpose, visibility: 'public', moderationState: 'allowed', deletedAt: null },
    });
    return row ? this.image(row) : null;
  }

  async findUpload(tx: TxContext, id: string): Promise<StoredImage | null> {
    const row = await this.db.client(tx).mediaAsset.findFirst({
      where: { id, visibility: 'public', moderationState: 'allowed', deletedAt: null },
    });
    return row ? this.image(row) : null;
  }

  async lockOwned(tx: TxContext, input: {
    assetIds: readonly string[]; ownerUserId: string; businessId: string; purpose: MediaUploadPurpose;
  }) {
    // Malformed IDs can never match; never hand them to a uuid cast.
    const ids = [...new Set(input.assetIds)].filter((id) => IdSchema.safeParse(id).success);
    if (!ids.length) return [];
    const stored = storedPurpose(input.purpose);
    return this.db.client(tx).$queryRaw<{ id: string; version: number; width: number; height: number }[]>`
      SELECT id::text AS id, version, width, height FROM media_assets
      WHERE id = ANY(${ids}::uuid[]) AND owner_user_id = ${input.ownerUserId}::uuid
        AND business_id = ${input.businessId}::uuid AND purpose = ${stored.purpose}
        AND subject_type IS NOT DISTINCT FROM ${stored.subjectType}::text
        AND visibility = 'public' AND moderation_state = 'allowed'
        AND deleted_at IS NULL AND mime_type = 'image/webp'
      ORDER BY id
      FOR SHARE`;
  }

  private image(row: MediaAsset): StoredImage | null {
    const purpose = uploadPurpose(row.purpose, row.subjectType);
    if (!purpose) return null;
    return {
      id: row.id, ownerUserId: row.ownerUserId, purpose, businessId: row.businessId,
      width: row.width, height: row.height, bytes: Number(row.bytes), version: row.version,
      variants: StoredVariantSchema.array().min(1).max(purpose === 'catalog_taxonomy' ? 3 : 4).parse(row.variants),
    };
  }

  async claimCleanup(tx: TxContext) {
    const client = this.db.client(tx);
    const rows = await client.$queryRaw<{ id: string }[]>`
      SELECT id FROM media_upload_operations
      WHERE state IN ('pending','cleaning') AND expires_at <= now()
        AND (lease_until IS NULL OR lease_until <= now())
      ORDER BY expires_at,id LIMIT 10 FOR UPDATE SKIP LOCKED`;
    const result = [];
    for (const { id } of rows) {
      const op = await client.mediaUploadOperation.update({
        where: { id }, data: { state: 'cleaning', leaseUntil: new Date(Date.now() + 300_000) },
      });
      if (await client.mediaAsset.findUnique({ where: { id } }))
        throw new Error('MEDIA_CLEANUP_COMMITTED_ASSET');
      result.push({ id, policy: ImagePolicySchema.parse(op.policy), ready: false });
    }

    return result;
  }

  async release(tx: TxContext, id: string, leaseId: string) {
    await this.db.client(tx).mediaUploadOperation.updateMany({
      where: { id, leaseId, state: 'pending' },
      data: { leaseId: null, leaseUntil: null },
    });
  }

  async finishCleanup(tx: TxContext, id: string) {
    await this.db.client(tx).mediaUploadOperation.updateMany({
      where: { id, state: 'cleaning' }, data: { state: 'failed', leaseUntil: null },
    });
  }
}
