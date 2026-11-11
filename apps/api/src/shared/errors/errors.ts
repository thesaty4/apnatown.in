import type { ErrorResponse } from '@apnatown/shared/wire';

const catalogue = {
  COMMON_VALIDATION_FAILED: [400, 'errors.common.validationFailed'],
  COMMON_UNAUTHENTICATED: [401, 'errors.common.unauthenticated'],
  COMMON_FORBIDDEN: [403, 'errors.common.forbidden'],
  COMMON_NOT_FOUND: [404, 'errors.common.notFound'],
  COMMON_CONFLICT: [409, 'errors.common.conflict'],
  COMMON_RATE_LIMITED: [429, 'errors.common.rateLimited'],
  COMMON_UNAVAILABLE: [503, 'errors.common.unavailable'],
  COMMON_INTERNAL_ERROR: [500, 'errors.common.internalError'],
} as const;

export type CommonCode = keyof typeof catalogue;

export class DomainError extends Error {
  constructor(readonly code: CommonCode) {
    super(code);
  }
}

export function errorResponse(
  code: CommonCode,
  correlationId: string,
): ErrorResponse {
  const [status, message_key] = catalogue[code];
  return { code, message_key, status, details: {}, correlationId };
}
