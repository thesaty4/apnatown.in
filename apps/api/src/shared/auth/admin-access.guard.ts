import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@apnatown/shared/users';
import type { AdminAction, AdminModule } from '@apnatown/shared/admin';
import { DomainError } from '../errors/errors';
import {
  AUTH_ROUTE,
  PERMISSION_ROUTE,
  ROLES_ROUTE,
  SCOPED_ROUTE,
  type AuthRoutePolicy,
  type ScopedRoute,
} from './metadata';
import { ADMIN_SCOPE, type AdminScopePort } from './ports';
import type { AuthRequest } from './request';
import { ScopeRegistry } from './scope-registry';

/**
 * Runs after AuthGuard. For `@Roles` routes: role intersection, then for
 * admin/super_admin principals the Admin scope port (active account,
 * `@Permission` module/action, `@Scoped` resource scopes). Grants are read on
 * every request; no long-lived cache.
 */
@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly registry: ScopeRegistry,
    @Inject(ADMIN_SCOPE) private readonly scope: AdminScopePort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const policy = this.reflector.getAllAndOverride<AuthRoutePolicy>(
      AUTH_ROUTE,
      targets,
    );
    const permission = this.reflector.getAllAndOverride<
      { module: AdminModule; action: AdminAction } | undefined
    >(PERMISSION_ROUTE, targets);
    const scoped = this.reflector.getAllAndOverride<ScopedRoute | undefined>(
      SCOPED_ROUTE,
      targets,
    );
    if (policy !== 'role') {
      // Permission/scope metadata without a role policy is a wiring error.
      if (permission || scoped) throw new DomainError('COMMON_FORBIDDEN');
      return true;
    }
    const roles = this.reflector.getAllAndOverride<readonly UserRole[]>(
      ROLES_ROUTE,
      targets,
    );
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const principal = request.principal;
    if (
      !principal ||
      !roles?.length ||
      !principal.roles.some((role) => roles.includes(role))
    )
      throw new DomainError('COMMON_FORBIDDEN');
    const adminRoute = roles.includes('admin') || roles.includes('super_admin');
    if (!adminRoute) {
      if (permission || scoped) throw new DomainError('COMMON_FORBIDDEN');
      return true;
    }
    const scopes = scoped
      ? await this.registry.resolve(scoped.key, request.params[scoped.param])
      : [];
    request.adminContext = await this.scope.authorize({
      actorUserId: principal.userId,
      module: permission?.module ?? null,
      action: permission?.action ?? null,
      scopes,
    });
    // A super_admin-only route never admits an admin account.
    if (!roles.includes('admin') && !request.adminContext.isSuper)
      throw new DomainError('COMMON_FORBIDDEN');
    return true;
  }
}
