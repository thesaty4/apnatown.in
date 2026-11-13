import { Inject, Injectable } from '@nestjs/common';
import type { UserRole } from '@apnatown/shared/users';
import {
  ADMIN_SCOPE,
  SESSION_ACCESS,
  type AdminScopePort,
  type SessionAccess,
  type SessionBinding,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import type { AlertModuleGrant, FeedFilter } from '../domain/notification';
import {
  NOTIFICATION_BUSINESS_CONTEXT,
  type NotificationBusinessContextPort,
} from './notification-ports';

export interface FeedRequest {
  session: SessionBinding;
  actorId: string;
}

const ALERT_MODULES: readonly AlertModuleGrant['module'][] = [
  'approvals',
  'catalog',
  'reviews',
  'users',
];
const ADMIN_DENIALS = new Set([
  'COMMON_FORBIDDEN',
  'ADMIN_INACTIVE',
  'ADMIN_SCOPE_FORBIDDEN',
]);

/**
 * Own-user feed filter. The requested role must be one the caller holds now
 * (vendor/provider applicants qualify through their own business). Admin
 * alert visibility is re-derived per request from live module/scope grants.
 */
@Injectable()
export class NotificationFeedAccess {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly adminScope: AdminScopePort,
    @Inject(NOTIFICATION_BUSINESS_CONTEXT)
    private readonly businesses: NotificationBusinessContextPort,
  ) {}

  async filter(
    tx: TxContext,
    request: FeedRequest,
    role: UserRole,
  ): Promise<FeedFilter> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    const userId = principal.userId;
    if (!principal.roles.includes(role)) {
      const applicant =
        (role === 'vendor' || role === 'provider') &&
        (await this.businesses.applicantRoles(tx, userId)).includes(role);
      if (!applicant) throw new DomainError('COMMON_FORBIDDEN');
    }
    const alerts =
      role === 'admin' ? await this.adminVisibility(tx, userId) : null;
    return { userId, audienceRole: role, alerts };
  }

  /** Per-module live view grants; a denied module contributes nothing. */
  private async adminVisibility(
    tx: TxContext,
    actorUserId: string,
  ): Promise<AlertModuleGrant[]> {
    const grants: AlertModuleGrant[] = [];
    for (const module of ALERT_MODULES) {
      try {
        const context = await this.adminScope.authorize(
          { actorUserId, module, action: 'view', scopes: [] },
          tx,
        );
        grants.push({
          module,
          platformWide: context.isSuper || context.scope.platformWide,
          cityIds: [...context.scope.cityWideIds],
          areaIds: [...context.scope.areaIds],
        });
      } catch (error) {
        if (error instanceof DomainError && ADMIN_DENIALS.has(error.code))
          continue;
        throw error;
      }
    }
    return grants;
  }
}
