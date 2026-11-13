import type { JsonValue } from '@apnatown/shared';
import type { CommandContext } from '../persistence/ports';
import type { Clock } from '../runtime/providers';
import type { HttpCommandContextFactory } from './context';
import { RECEIPT_TTL_MS } from './receipt-ttl';

/** Authenticated owner POST carrying an Idempotency-Key. */
export interface OwnerCommandRequest {
  readonly actorId: string;
  readonly correlationId: string;
  readonly key: unknown;
  readonly businessKind?: 'shop' | 'provider';
}

/**
 * Principal-scoped idempotent POST context for owner routes. The route's
 * X-Business-Kind is part of the request fingerprint, so the same key under
 * another business context is a conflict, not a replay.
 */
export function ownerCommandContext(
  contexts: HttpCommandContextFactory,
  clock: Clock,
  request: OwnerCommandRequest,
  operation: { name: string; resource: string; successStatus: number },
  payload: object,
): CommandContext {
  return contexts.create(
    { name: operation.name, method: 'POST', scope: 'principal', successStatus: operation.successStatus },
    {
      actorId: request.actorId,
      correlationId: request.correlationId,
      resource: operation.resource,
      business: null,
      expiresAt: new Date(clock.now().getTime() + RECEIPT_TTL_MS),
    },
    {
      key: request.key,
      payload: JSON.parse(
        JSON.stringify({ ...payload, businessKind: request.businessKind ?? null }),
      ) as JsonValue,
    },
  );
}
