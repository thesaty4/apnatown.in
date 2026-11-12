import { createHash } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import type { RuntimeConfig } from '../../shared/config/config';
import { DomainError } from '../../shared/errors/errors';
import {
  StoredVariantSchema,
  type ImageStorage,
  type ProcessedImage,
  type StoredVariant,
} from '../../modules/media-videos/domain/images';

const providerResult = z.object({
  public_id: z.string(),
  asset_id: z.string(),
  version: z.number().int().positive(),
  resource_type: z.literal('image'),
  type: z.literal('authenticated'),
  format: z.literal('webp'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
  context: z.object({ custom: z.object({ sha256: z.string() }) }).optional(),
});
const notFound = (error: unknown) =>
  typeof error === 'object' && error !== null && 'http_code' in error &&
  error.http_code === 404;

/** Only this adapter knows Cloudinary credentials or delivery URLs. */
export class CloudinaryImageStorage implements ImageStorage {
  readonly configured: boolean;
  constructor(config: RuntimeConfig) {
    this.configured = Boolean(config.CLOUDINARY_CLOUD_NAME &&
      config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);
    if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async put(publicId: string, image: ProcessedImage['variants'][number]): Promise<StoredVariant> {
    this.requireConfiguration();
    const digest = createHash('sha256').update(image.body).digest('hex');
    let response: unknown;
    try {
      response = await cloudinary.api.resource(publicId, {
        resource_type: 'image', type: 'authenticated', context: true, timeout: 10_000,
      });
    } catch (error) {
      if (!notFound(error)) throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
      try {
        response = await new Promise<unknown>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({
            public_id: publicId, resource_type: 'image', type: 'authenticated',
            overwrite: false, unique_filename: false, use_filename: false,
            context: { sha256: digest }, timeout: 10_000,
          }, (failure, result) => failure ? reject(failure) : resolve(result));
          stream.on('error', reject);
          stream.end(image.body);
        });
      } catch {
        // The persisted operation owns this immutable ID. A later retry
        // reconciles it with resource(), never with another object name.
        throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
      }
    }
    const parsed = providerResult.safeParse(response);
    if (!parsed.success || parsed.data.public_id !== publicId ||
        parsed.data.context?.custom.sha256 !== digest ||
        parsed.data.width !== image.width || parsed.data.height !== image.height ||
        parsed.data.bytes !== image.body.length)
      throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
    return StoredVariantSchema.parse({
      publicId, width: image.width, height: image.height, bytes: image.body.length,
      providerAssetId: parsed.data.asset_id, providerVersion: parsed.data.version,
    });
  }

  async get(variant: StoredVariant): Promise<Buffer> {
    this.requireConfiguration();
    const url = cloudinary.url(variant.publicId, {
      secure: true, resource_type: 'image', type: 'authenticated',
      sign_url: true, long_url_signature: true,
      version: variant.providerVersion, format: 'webp',
    });
    try {
      const response = await fetch(url, {
        redirect: 'error', signal: AbortSignal.timeout(10_000), cache: 'no-store',
      });
      if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'image/webp' ||
          !response.body) throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
      const reader = response.body.getReader();
      const chunks: Buffer[] = [];
      let size = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > variant.bytes) throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
          chunks.push(Buffer.from(part.value));
        }
      } finally {
        await reader.cancel();
      }
      if (size !== variant.bytes) throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
      return Buffer.concat(chunks);
    } catch {
      throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
    }
  }

  async remove(publicId: string): Promise<void> {
    this.requireConfiguration();
    try {
      const options = {
        resource_type: 'image' as const, type: 'authenticated' as const,
        invalidate: true, timeout: 10_000,
      };
      const result: unknown = await cloudinary.uploader.destroy(publicId, options);
      const parsed = z.object({ result: z.enum(['ok', 'not found']) }).safeParse(result);
      if (!parsed.success) throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
    } catch {
      throw new DomainError('MEDIA_STORAGE_UNAVAILABLE');
    }
  }

  private requireConfiguration() {
    if (!this.configured) throw new DomainError('MEDIA_UPLOAD_POLICY_REQUIRED');
  }
}
