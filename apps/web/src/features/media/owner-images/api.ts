import type { z } from 'zod';
import {
  MediaPolicyResultSchema,
  MediaUploadResultSchema,
  type OwnerImageUploadPurpose,
} from '@apnatown/shared';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

/** Owner listing/profile/gallery/video-thumbnail image purposes (Settings
 * image-policy purposes). */
export type OwnerImagePurpose =
  | 'product'
  | 'service'
  | 'business_profile_logo'
  | 'business_profile_cover'
  | 'gallery'
  | 'video_thumbnail';

/** Ordered listing image reference saved by the product/service form. */
export type OwnerMediaItem = { assetId: string; showInGallery: boolean };

export type OwnerImagePolicy = z.infer<
  typeof MediaPolicyResultSchema
>['policy'];

// Compile-time guard: the public union stays identical to the shared contract.
const purposeContract: OwnerImageUploadPurpose = 'product' as OwnerImagePurpose;
void purposeContract;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Uploader-only, same-origin preview through the reauthorizing Media gateway
 * (`private, no-store`). Only a server-issued UUID ever becomes a path; never
 * a provider/storage URL.
 */
export function ownerPreviewPath(assetId: string): string | undefined {
  return UUID.test(assetId)
    ? `/api/media/previews/${assetId.toLowerCase()}`
    : undefined;
}

export async function getOwnerImagePolicy(
  api: Pick<BrowserApi, 'GET'>,
  purpose: OwnerImagePurpose,
  businessId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/media/policies/{purpose}', {
      params: { path: { purpose }, query: { businessId } },
      ...(signal ? { signal } : {}),
    }),
    MediaPolicyResultSchema,
  );
}

/**
 * One multipart command per file intent. The Idempotency-Key is created when
 * the file is chosen and reused on retry, so a lost response replays the same
 * asset instead of storing a second copy. Text parts precede the file part.
 */
export async function uploadOwnerImage(
  api: BrowserApi,
  input: {
    purpose: OwnerImagePurpose;
    businessId: string;
    file: File;
    key: string;
  },
  assertCurrent: () => void,
) {
  const headers = await api.mutationHeaders();
  assertCurrent();
  const { purpose, businessId, file, key } = input;
  return unwrap(
    await api.POST('/media/uploads', {
      params: { header: { ...headers, 'Idempotency-Key': key } },
      body: { purpose, businessId, file: file.name },
      bodySerializer: () => {
        const form = new FormData();
        form.append('purpose', purpose);
        form.append('businessId', businessId);
        form.append('file', file);
        return form;
      },
    }),
    MediaUploadResultSchema,
  );
}
