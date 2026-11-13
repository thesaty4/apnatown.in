import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VersionSchema } from '@apnatown/shared/wire';
import {
  AdminOrderPageSchema,
  AdminOrdersQuerySchema,
  BusinessOrderCountsSchema,
  BusinessOrderPageSchema,
  BusinessOrdersQuerySchema,
  CustomerOrderPageSchema,
  CustomerOrdersQuerySchema,
  BUSINESS_REJECT_REASONS,
  CUSTOMER_CANCEL_REASONS,
  OrderDetailSchema,
  OrderTransitionSchema,
} from '@apnatown/shared/orders';
import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { businessKind } from '../../businesses/presentation/business.dto';
import type { OrderCommandRequest, OrderRequest } from '../application/order-access';

export class OrderDetailDto extends createZodDto(OrderDetailSchema) {}
export class CustomerOrderPageDto extends createZodDto(CustomerOrderPageSchema) {}
export class CustomerOrdersQueryDto extends createZodDto(CustomerOrdersQuerySchema) {}
export class BusinessOrderPageDto extends createZodDto(BusinessOrderPageSchema) {}
export class BusinessOrderCountsDto extends createZodDto(BusinessOrderCountsSchema) {}
export class BusinessOrdersQueryDto extends createZodDto(BusinessOrdersQuerySchema) {}
export class AdminOrderPageDto extends createZodDto(AdminOrderPageSchema) {}
export class AdminOrdersQueryDto extends createZodDto(AdminOrdersQuerySchema) {}
export class OrderTransitionDto extends createZodDto(OrderTransitionSchema) {}
/** OpenAPI body shape; validation uses the discriminated OrderCancelSchema. */
export class OrderCancelDto extends createZodDto(
  z.strictObject({
    event: z.enum(['cancel', 'reject']),
    reasonKey: z.enum([...CUSTOMER_CANCEL_REASONS, ...BUSINESS_REJECT_REASONS]),
    expectedVersion: VersionSchema,
  }),
) {}

// TODO(verify): the orders spec states no numeric rate limits; these mirror
// the other owner/customer managers.
export const ORDER_READ_LIMIT = {
  key: 'orders.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
export const ORDER_WRITE_LIMIT = {
  key: 'orders.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;

export const ORDER_ID = { name: 'orderId', schema: { type: 'string', format: 'uuid' } } as const;
export const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';
export const SELLER_FORBIDDEN =
  'COMMON_FORBIDDEN when the caller owns no vendor/provider business, it is not approved, the seller role is missing, or the account is inactive.';

export function orderRequest(request: AuthRequest): OrderRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    ...businessKind(request),
  };
}

export function orderCommand(request: AuthRequest): OrderCommandRequest {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return { ...orderRequest(request), correlationId, key: request.headers['idempotency-key'] };
}
