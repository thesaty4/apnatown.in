import type { Principal } from '@apnatown/shared/auth';
import type {
  AdminAction,
  AdminModule,
  ScopeRef,
} from '@apnatown/shared/admin';
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

/** Server-derived admin authority (admin spec "Scope and read context"). */
export interface AdminReadContext {
  readonly actorUserId: string;
  readonly isSuper: boolean;
  readonly permission: {
    readonly module: AdminModule;
    readonly action: AdminAction;
  } | null;
  readonly scope: {
    readonly platformWide: boolean;
    readonly cityWideIds: readonly string[];
    readonly areaIds: readonly string[];
  };
  /** `platform` for super admins, otherwise `v{admin account version}`. */
  readonly scopeRevision: string;
  readonly locale: 'en' | 'hi';
}
export const ADMIN_SCOPE = Symbol('ADMIN_SCOPE');
export interface AdminScopePort {
  /**
   * Shared predicate: super_admin passes; an active admin needs the
   * module/action (when given) and, for every scope, the exact area or an
   * explicit whole-city grant. City-only scopes need a whole-city grant;
   * global/unresolved scopes need super_admin. Grants are read per call.
   * Throws ADMIN_INACTIVE, COMMON_FORBIDDEN or ADMIN_SCOPE_FORBIDDEN.
   */
  authorize(
    input: {
      actorUserId: string;
      module: AdminModule | null;
      action: AdminAction | null;
      scopes: readonly ScopeRef[];
    },
    tx?: TxContext,
  ): Promise<AdminReadContext>;
}
