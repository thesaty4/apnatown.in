import {
  BUSINESS_KIND_HEADER,
  BusinessApplicationPageSchema,
  BusinessApplicationQuerySchema,
  BusinessDecisionResultSchema,
  BusinessDecisionSchema,
  BusinessDocumentListSchema,
  BusinessKindSchema,
  BusinessOverviewSchema,
  BusinessOwnerSchema,
  BusinessProfilePatchSchema,
  BusinessVersionCommandSchema,
  CreateBusinessApplicationSchema,
  type BusinessKind,
} from '@apnatown/shared/businesses';
import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import type { OwnerRequest } from '../application/business-owner.service';

// Owner
export class CreateBusinessApplicationDto extends createZodDto(
  CreateBusinessApplicationSchema,
) {}
export class BusinessProfilePatchDto extends createZodDto(
  BusinessProfilePatchSchema,
) {}
export class BusinessVersionCommandDto extends createZodDto(
  BusinessVersionCommandSchema,
) {}
export class BusinessOwnerDto extends createZodDto(BusinessOwnerSchema) {}
export class BusinessOverviewDto extends createZodDto(BusinessOverviewSchema) {}

// Admin
export class BusinessApplicationQueryDto extends createZodDto(
  BusinessApplicationQuerySchema,
) {}
export class BusinessApplicationPageDto extends createZodDto(
  BusinessApplicationPageSchema,
) {}
export class BusinessDocumentListDto extends createZodDto(
  BusinessDocumentListSchema,
) {}
export class BusinessDecisionDto extends createZodDto(BusinessDecisionSchema) {}
export class BusinessDecisionResultDto extends createZodDto(
  BusinessDecisionResultSchema,
) {}

/** Idempotency-Key header for versioned/once-only commands. */
export function IdempotencyKey(description: string) {
  return applyDecorators(
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      description,
      schema: {
        type: 'string',
        minLength: 1,
        maxLength: 128,
        pattern: '^[A-Za-z0-9._:-]+$',
      },
    }),
  );
}

/** Documents the optional owner-context header. */
export function BusinessKindHeader() {
  return ApiHeader({
    name: 'X-Business-Kind',
    required: false,
    description:
      "Owner route context (shop|provider) selecting which of the caller's own businesses is meant; required only when the caller owns both. Grants nothing.",
    schema: { type: 'string', enum: ['shop', 'provider'] },
  });
}

/** Optional `X-Business-Kind` owner context; selects, never grants. */
export function businessKind(request: AuthRequest): {
  businessKind?: BusinessKind;
} {
  const header = request.headers[BUSINESS_KIND_HEADER];
  if (header === undefined) return {};
  const parsed = BusinessKindSchema.safeParse(header);
  if (!parsed.success)
    throw new DomainError('VALIDATION_ERROR', { field: 'X-Business-Kind' });
  return { businessKind: parsed.data };
}

export function owner(request: AuthRequest): OwnerRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    ...businessKind(request),
  };
}
