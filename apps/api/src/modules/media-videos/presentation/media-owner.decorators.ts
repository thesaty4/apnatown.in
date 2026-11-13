import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { OwnAccount } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';

/** Class-level guard + docs shared by owner Videos/Gallery manager routes. */
export const MediaOwnerApi = () =>
  applyDecorators(
    PrivateApi(),
    OwnAccount(),
    ApiHeader({
      name: 'X-Business-Kind',
      required: false,
      description: 'Selects which of the authenticated owner’s businesses is used; grants no access.',
      schema: { type: 'string', enum: ['shop', 'provider'] },
    }),
  );

/** CSRF-checked browser write that requires an Idempotency-Key. */
export const IdempotentMutation = () =>
  applyDecorators(
    BrowserMutation(),
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      description: 'Retry the identical submission with the same key for up to 24 hours.',
      schema: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9._:-]+$' },
    }),
  );

export const OWNER_READ_LIMIT = {
  key: 'media.manager.owner.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;

export const OWNER_WRITE_LIMIT = {
  key: 'media.manager.owner.write',
  maximumHits: 60,
  windowSeconds: 3600,
  subject: 'principal',
} as const;

export const OWNER_ERRORS = {
  400: 'VALIDATION_ERROR for invalid fields/cursor or COMMON_VALIDATION_FAILED for an invalid Idempotency-Key.',
  403: 'USERS_APPROVAL_REQUIRED unless the caller owns an approved vendor/provider business; CSRF_INVALID for an untrusted browser session.',
  404: 'MEDIA_NOT_FOUND for a missing, foreign or owner-deleted item.',
  409: 'MEDIA_VERSION_CONFLICT for a stale version; COMMON_CONFLICT for idempotency key reuse with a different payload.',
  422: 'BUSINESS_CONTEXT_REQUIRED when the owner has both business kinds but omitted X-Business-Kind.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
} as const;
