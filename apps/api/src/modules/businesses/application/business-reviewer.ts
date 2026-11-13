import { Inject, Injectable } from '@nestjs/common';
import type { AdminAction, AdminModule, ScopeRef } from '@apnatown/shared/admin';
import type { SessionBinding } from '../../../shared/auth';
import {
  ADMIN_SCOPE,
  SESSION_ACCESS,
  type AdminReadContext,
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
import type { StoredBusiness } from '../domain/business';

export type ReviewerActor = AuditActor & { userId: string };

/** The business's stored scope; an unresolved area needs super_admin. */
export function businessScope(business: StoredBusiness): ScopeRef {
  return business.areaId
    ? { cityId: business.cityId, areaId: business.areaId }
    : { cityId: null, areaId: null };
}

/**
 * In-transaction admin re-authorization (BR-12): live session, admin or
 * super_admin, module/action permission and exact city/area scope of the
 * business's stored area. Out-of-scope maps to BUSINESS_SCOPE_DENIED.
 */
@Injectable()
export class BusinessReviewer {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly adminScope: AdminScopePort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
  ) {}

  async require(
    tx: TxContext,
    request: { session: SessionBinding; actorId: string },
    input: { module: AdminModule; action: AdminAction; scopes: readonly ScopeRef[] },
  ): Promise<ReviewerActor> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (
      principal.userId !== request.actorId ||
      !principal.roles.some(
        (role) => role === 'admin' || role === 'super_admin',
      )
    )
      throw new DomainError('COMMON_FORBIDDEN');
    const ctx = await this.authorize(tx, principal.userId, input);
    return this.actor(tx, ctx);
  }

  async authorize(
    tx: TxContext,
    actorUserId: string,
    input: { module: AdminModule; action: AdminAction; scopes: readonly ScopeRef[] },
  ): Promise<AdminReadContext> {
    try {
      return await this.adminScope.authorize({ actorUserId, ...input }, tx);
    } catch (error) {
      if (error instanceof DomainError && error.code === 'ADMIN_SCOPE_FORBIDDEN')
        throw new DomainError('BUSINESS_SCOPE_DENIED');
      throw error;
    }
  }

  async actor(tx: TxContext, ctx: AdminReadContext): Promise<ReviewerActor> {
    const [profile] = await this.identity.describe(tx, [ctx.actorUserId]);
    return {
      userId: ctx.actorUserId,
      role: ctx.isSuper ? 'super_admin' : 'admin',
      label: profile?.displayName ?? (ctx.isSuper ? 'Super admin' : 'Admin'),
    };
  }
}

/** Trusted read context holds the module permission and some scope. */
export function assertReader(ctx: AdminReadContext, module: AdminModule): void {
  if (ctx.isSuper) return;
  if (
    ctx.permission?.module !== module ||
    !(
      ctx.scope.platformWide ||
      ctx.scope.cityWideIds.length ||
      ctx.scope.areaIds.length
    )
  )
    throw new DomainError('COMMON_FORBIDDEN');
}

export function visibility(ctx: AdminReadContext) {
  return {
    platformWide: ctx.isSuper || ctx.scope.platformWide,
    cityIds: ctx.scope.cityWideIds,
    areaIds: ctx.scope.areaIds,
  };
}
