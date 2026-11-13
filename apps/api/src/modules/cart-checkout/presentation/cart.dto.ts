import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiParam, ApiSecurity } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  AddCartLineSchema,
  CartLineVersionsSchema,
  CartMergeResultSchema,
  CartSchema,
  UpdateCartLineSchema,
} from '@apnatown/shared/cart';
import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import { currentCorrelationId } from '../../../shared/logger/context';
import type { CartActor } from '../application/cart-support';

export class CartDto extends createZodDto(CartSchema) {}
export class CartMergeResultDto extends createZodDto(CartMergeResultSchema) {}
export class AddCartLineDto extends createZodDto(AddCartLineSchema) {}
export class UpdateCartLineDto extends createZodDto(UpdateCartLineSchema) {}
export class CartLineVersionsDto extends createZodDto(CartLineVersionsSchema) {}

// TODO(verify): the spec states no numeric cart rate limits.
export const READ_LIMITS = [
  { key: 'cart.read', maximumHits: 120, windowSeconds: 60, subject: 'session' },
  { key: 'cart.read.ip', maximumHits: 600, windowSeconds: 60, subject: 'ip' },
] as const;
export const WRITE_LIMITS = [
  { key: 'cart.write', maximumHits: 60, windowSeconds: 60, subject: 'session' },
  { key: 'cart.write.ip', maximumHits: 300, windowSeconds: 60, subject: 'ip' },
] as const;
export const MERGE_LIMITS = [
  { key: 'cart.merge', maximumHits: 10, windowSeconds: 60, subject: 'principal' },
] as const;

export const CART_OWNER =
  'Signed-in customers always use their account cart. Guests use the cart bound to the httpOnly guest-cart cookie issued by GET /cart; no cart ID is ever accepted from the client. private, no-store.';
export const LINE_ID = { name: 'lineId', schema: { type: 'string', format: 'uuid' } } as const;
export const COMMON_ERRORS = {
  401: 'SESSION_EXPIRED when a signed-in session ended mid-request.',
  403: 'CSRF_INVALID for a missing session, Origin or CSRF token.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
  503: 'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable or guest carts are not configured (Q-70).',
} as const;

export function CartCommand() {
  return applyDecorators(
    ApiSecurity('sessionCookie'),
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      description:
        'Case-sensitive key; retry the identical command within 24 hours to replay the recorded cart. Replay rechecks the signed-in owner.',
      schema: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9._:-]+$' },
    }),
  );
}

export const LineParam = () => ApiParam(LINE_ID);

export function cartActor(request: AuthRequest, guestCookie: unknown): CartActor {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    session: sessionBinding(request),
    principalId: request.principal?.userId ?? null,
    guestCookie,
    correlationId,
    key: request.headers['idempotency-key'],
  };
}
