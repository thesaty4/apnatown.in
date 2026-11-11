import type { Principal } from '@apnatown/shared/auth';
import type { TxContext } from '../persistence/ports';

export const SESSION_ACCESS = Symbol('SESSION_ACCESS');
export interface SessionBinding {
  readonly id: string;
  readonly csrfToken: string;
}
export interface SessionAccess {
  /** Locks and revalidates the session and current identity through commit. */
  requirePrincipal(tx: TxContext, binding: SessionBinding): Promise<Principal>;
}
export const AUTH_SESSION_PORT = Symbol('AUTH_SESSION_PORT');
export interface AuthSessionPort {
  revokeUserSessions(input: { userId: string }, tx?: TxContext): Promise<void>;
}
