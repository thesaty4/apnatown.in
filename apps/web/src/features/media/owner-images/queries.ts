'use client';

import { useQuery } from '@tanstack/react-query';
import type { MediaUploadResult } from '@apnatown/shared';
import { privateQueryOptions } from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import { ApiFailure, failureCode } from '../../../shared/api/result';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { useOwnerContext } from '../../businesses/queries';
import {
  getOwnerImagePolicy,
  uploadOwnerImage,
  type OwnerImagePurpose,
} from './api';

/** Policy outcomes that are answers, not transient failures. */
const FINAL_POLICY_CODES = new Set([
  'MEDIA_UPLOAD_POLICY_REQUIRED',
  'COMMON_FORBIDDEN',
  'BUSINESS_NOT_OWNED',
  'USERS_APPROVAL_REQUIRED',
  'SESSION_CHANGED',
  'MAINTENANCE',
]);

/**
 * Current owner upload limits for one purpose and business. Used for client
 * pre-checks only; the upload endpoint stays authoritative. Kept briefly so a
 * policy change by a super admin is picked up on the next form open.
 */
export function useOwnerImagePolicy(
  purpose: OwnerImagePurpose,
  businessId: string,
) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope
        ? queryKeys.ownerImagePolicy(scope, purpose, businessId)
        : ['private', 'pending', 'media', 'owner-image-policy', purpose],
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getOwnerImagePolicy(api, purpose, businessId, signal),
    ),
    enabled: scope !== null && businessId.length > 0,
    staleTime: 60_000,
    retry: (count, error) =>
      count < 2 &&
      !FINAL_POLICY_CODES.has(failureCode(error)) &&
      (!(error instanceof ApiFailure) ||
        error.status === 0 ||
        error.status >= 500),
  });
}

export type OwnerImageUploadOutcome =
  { ok: true; result: MediaUploadResult } | { ok: false; code: string };

/**
 * Owner image upload command. `upload(file, key)` resolves with the stored
 * asset or a normalized failure code and never throws; uploads are serialized
 * by the caller (one command at a time per field). `SESSION_CHANGED` means the
 * account/epoch changed and the result must be discarded.
 */
export function useOwnerImageUpload(
  purpose: OwnerImagePurpose,
  businessId: string,
) {
  const { api, lifecycle } = useOwnerContext();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { file: File; key: string; report: (code: string) => void },
      assertCurrent,
    ) => {
      try {
        return await uploadOwnerImage(
          api,
          { purpose, businessId, file: input.file, key: input.key },
          assertCurrent,
        );
      } catch (error) {
        input.report(failureCode(error));
        throw error;
      }
    },
  );
  return {
    mutation,
    upload(file: File, key: string): Promise<OwnerImageUploadOutcome> {
      // No report and no result: superseded by an account/epoch change (or a
      // concurrent call, which callers never make), so nothing may be shown.
      let code = 'SESSION_CHANGED';
      let result: MediaUploadResult | undefined;
      return mutation
        .run({ file, key, report: (failed) => (code = failed) }, (output) => {
          result = output;
        })
        .then(() => (result ? { ok: true, result } : { ok: false, code }));
    },
  };
}
