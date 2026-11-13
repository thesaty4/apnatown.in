import { Inject, Injectable } from '@nestjs/common';
import type {
  AdminAction,
  AdminModule,
  ScopeRef,
} from '@apnatown/shared/admin';
import type { SessionBinding } from '../../../shared/auth';
import {
  ADMIN_SCOPE,
  SESSION_ACCESS,
  type AdminScopePort,
  type SessionAccess,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import type { AuditActor } from '../../audit/application/audit-writer.port';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';

export type ScopedAdminActor = AuditActor & { readonly userId: string };

/**
 * In-transaction admin re-authorization for scoped (non-super) commands:
 * live session bound to the caller, admin/super_admin role, module/action
 * permission and every given city/area scope (ADMIN_SCOPE). Returns the
 * audit actor. Errors: COMMON_FORBIDDEN, ADMIN_INACTIVE, ADMIN_SCOPE_FORBIDDEN.
 */
@Injectable()
export class AdminScopedActor {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly scope: AdminScopePort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
  ) {}

  async require(
    tx: TxContext,
    request: { session: SessionBinding; actorId: string },
    input: {
      module: AdminModule;
      action: AdminAction;
      scopes: readonly ScopeRef[];
    },
  ): Promise<ScopedAdminActor> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (
      principal.userId !== request.actorId ||
      !principal.roles.some(
        (role) => role === 'admin' || role === 'super_admin',
      )
    )
      throw new DomainError('COMMON_FORBIDDEN');
    const ctx = await this.scope.authorize(
      { actorUserId: principal.userId, ...input },
      tx,
    );
    const [profile] = await this.identity.describe(tx, [ctx.actorUserId]);
    return {
      userId: ctx.actorUserId,
      role: ctx.isSuper ? 'super_admin' : 'admin',
      label: profile?.displayName ?? (ctx.isSuper ? 'Super admin' : 'Admin'),
    };
  }
}

/**
 * Maps an out-of-scope denial to COMMON_NOT_FOUND so a record outside the
 * caller's scope is indistinguishable from a missing one (no oracle).
 */
export async function hideOutOfScope<T>(check: Promise<T>): Promise<T> {
  try {
    return await check;
  } catch (error) {
    if (error instanceof DomainError && error.code === 'ADMIN_SCOPE_FORBIDDEN')
      throw new DomainError('COMMON_NOT_FOUND');
    throw error;
  }
}
