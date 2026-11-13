import type { OwnerImagePolicy } from './api';

// Upload issue mapping and policy pre-checks (no UI); the server stays authoritative.

/** Localized `media.ownerImages.issues.*` reasons for one file. */
export type UploadIssue =
  | 'tooLarge'
  | 'typeNotAllowed'
  | 'tooSmall'
  | 'processingFailed'
  | 'unavailable'
  | 'storageUnavailable'
  | 'rateLimited'
  | 'offline'
  | 'forbidden'
  | 'failed';

export function issueForCode(code: string, online: boolean): UploadIssue {
  if (!online) return 'offline';
  switch (code) {
    case 'MEDIA_TOO_LARGE':
      return 'tooLarge';
    case 'MEDIA_TYPE_NOT_ALLOWED':
      return 'typeNotAllowed';
    case 'MEDIA_IMAGE_PROCESSING_FAILED':
      return 'processingFailed';
    case 'MEDIA_UPLOAD_POLICY_REQUIRED':
      return 'unavailable';
    case 'MEDIA_STORAGE_UNAVAILABLE':
      return 'storageUnavailable';
    case 'COMMON_RATE_LIMITED':
      return 'rateLimited';
    case 'COMMON_FORBIDDEN':
    case 'BUSINESS_NOT_OWNED':
    case 'USERS_APPROVAL_REQUIRED':
      return 'forbidden';
    default:
      return 'failed';
  }
}

/** Issues a retry of the same bytes cannot fix. */
export const finalIssues = new Set<UploadIssue>([
  'tooLarge',
  'typeNotAllowed',
  'tooSmall',
  'processingFailed',
  'forbidden',
]);

/**
 * Fast client feedback from the current policy. The server re-validates the
 * signature, size and dimensions and stays the authority; an image the
 * browser cannot decode is left for the server to judge.
 */
export async function precheck(
  file: File,
  policy: OwnerImagePolicy,
): Promise<UploadIssue | null> {
  if (!policy.allowedMimeTypes.some((type) => type === file.type))
    return 'typeNotAllowed';
  if (file.size > policy.maxBytes) return 'tooLarge';
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const small =
        bitmap.width < policy.minWidth || bitmap.height < policy.minHeight;
      bitmap.close();
      if (small) return 'tooSmall';
    } catch {
      // Undecodable here: the server decides (processing failure).
    }
  }
  return null;
}
