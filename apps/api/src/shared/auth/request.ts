import type { Request } from 'express';
import type { Principal } from '@apnatown/shared/auth';
import type { SessionBinding } from './ports';
import { DomainError } from '../errors/errors';

export interface AuthRequest extends Request {
  authSession?: SessionBinding;
  principal?: Principal;
  csrfState?: string;
  rateLimitPrincipalId?: string;
}
export function sessionBinding(request: AuthRequest): SessionBinding {
  if (!request.authSession) throw new DomainError('SESSION_EXPIRED');
  return request.authSession;
}
