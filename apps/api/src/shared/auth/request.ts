import type { Request } from 'express';
import type { Principal } from '@apnatown/shared/auth';
import type { AdminReadContext, SessionBinding } from './ports';
import { DomainError } from '../errors/errors';

export interface AuthRequest extends Request {
  authSession?: SessionBinding;
  principal?: Principal;
  adminContext?: AdminReadContext;
  csrfState?: string;
  rateLimitPrincipalId?: string;
}
export function sessionBinding(request: AuthRequest): SessionBinding {
  if (!request.authSession) throw new DomainError('SESSION_EXPIRED');
  return request.authSession;
}
/** Server-derived admin read context attached by AdminAccessGuard. */
export function adminContext(request: AuthRequest): AdminReadContext {
  if (!request.adminContext) throw new DomainError('COMMON_FORBIDDEN');
  return request.adminContext;
}
