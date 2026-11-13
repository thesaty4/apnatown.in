import { ApiHeader } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  InventoryItemSchema,
  InventoryListQuerySchema,
  InventoryPageSchema,
  InventoryRestockLowSchema,
  InventoryUpdateSchema,
  ProductBulkCommandSchema,
  ProductBulkResultSchema,
  ProductCreateSchema,
  ProductDeleteQuerySchema,
  ProductOwnerListQuerySchema,
  ProductOwnerPageSchema,
  ProductOwnerSchema,
  ProductPillsReplaceSchema,
  ProductPillsSchema,
  ProductUpdateSchema,
} from '@apnatown/shared/products';
import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { businessKind } from '../../businesses/presentation/business.dto';
import type {
  ProductOwnerCommand,
  ProductOwnerRequest,
} from '../application/product-owner-access';

export class ProductOwnerDto extends createZodDto(ProductOwnerSchema) {}
export class ProductOwnerPageDto extends createZodDto(ProductOwnerPageSchema) {}
export class ProductCreateDto extends createZodDto(ProductCreateSchema) {}
export class ProductUpdateDto extends createZodDto(ProductUpdateSchema) {}
export class ProductBulkCommandDto extends createZodDto(
  ProductBulkCommandSchema,
) {}
export class ProductBulkResultDto extends createZodDto(
  ProductBulkResultSchema,
) {}
export class InventoryItemDto extends createZodDto(InventoryItemSchema) {}
export class InventoryPageDto extends createZodDto(InventoryPageSchema) {}
export class InventoryUpdateDto extends createZodDto(InventoryUpdateSchema) {}
export class InventoryRestockLowDto extends createZodDto(
  InventoryRestockLowSchema,
) {}
export class ProductPillsDto extends createZodDto(ProductPillsSchema) {}
export class ProductPillsReplaceDto extends createZodDto(
  ProductPillsReplaceSchema,
) {}
export class ProductOwnerListQueryDto extends createZodDto(
  ProductOwnerListQuerySchema,
) {}
export class ProductDeleteQueryDto extends createZodDto(
  ProductDeleteQuerySchema,
) {}
export class InventoryListQueryDto extends createZodDto(
  InventoryListQuerySchema,
) {}

// TODO(verify): no product-specific rate limits are specified; these mirror
// the other owner managers.
export const PRODUCT_READ_LIMIT = {
  key: 'products.owner.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
export const PRODUCT_WRITE_LIMIT = {
  key: 'products.owner.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;

export const OWNER =
  "Authenticated owner of an APPROVED vendor/provider business with its live seller role, resolved server-side from the session (X-Business-Kind selects between the caller's own businesses). private, no-store.";
export const FORBIDDEN =
  'COMMON_FORBIDDEN when the caller owns no vendor/provider business, it is not approved/suspended, the seller role is missing, or the account is deleted/inactive.';
export const CONTEXT_REQUIRED =
  'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.';
export const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';
export const PRODUCT_ID = {
  name: 'productId',
  schema: { type: 'string', format: 'uuid' },
} as const;

/** Required `Idempotency-Key` header documentation. */
export function IdempotencyKeyHeader(description: string) {
  return ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description,
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  });
}

export function productOwner(request: AuthRequest): ProductOwnerRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    ...businessKind(request),
  };
}

export function productCommand(
  request: AuthRequest,
  withKey = false,
): ProductOwnerCommand {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    ...productOwner(request),
    correlationId,
    ...(withKey ? { key: request.headers['idempotency-key'] } : {}),
  };
}
