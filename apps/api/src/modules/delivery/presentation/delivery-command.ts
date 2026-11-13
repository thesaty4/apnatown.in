import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { businessKind } from '../../businesses/presentation/business.dto';
import type { HandoverCommand } from '../application/handover-support';

/** Authenticated Delivery command (session, actor, correlation, raw key). */
export function deliveryCommand(request: AuthRequest): HandoverCommand {
  const correlationId = currentCorrelationId();
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    ...businessKind(request),
    correlationId,
    key: request.headers['idempotency-key'],
  };
}
