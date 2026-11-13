import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { UserRole } from '@apnatown/shared/users';
import type { AdminAction, AdminModule } from '@apnatown/shared/admin';

export const AUTH_ROUTE = 'apnatown:auth-route';
export const ROLES_ROUTE = 'apnatown:roles';
export const PERMISSION_ROUTE = 'apnatown:permission';
export const SCOPED_ROUTE = 'apnatown:scoped';
export type AuthRoutePolicy =
  'public-read' | 'csrf' | 'guest' | 'session' | 'own' | 'role';
/** Public reads only; this NEVER exempts a mutation from authorization or CSRF. */
export const PublicRoute = () => SetMetadata(AUTH_ROUTE, 'public-read');
/** Own-account access, not an admin/seller/rider permission grant. */
export const OwnAccount = () => SetMetadata(AUTH_ROUTE, 'own');
export const LoginRoute = () => SetMetadata(AUTH_ROUTE, 'guest');
export const CsrfBootstrap = () => SetMetadata(AUTH_ROUTE, 'csrf');
/**
 * Any live session (anonymous guest or authenticated) with Origin/CSRF
 * protection. The principal is attached only when authenticated; it grants
 * no role, ownership or admin authority.
 */
export const SessionRoute = () => SetMetadata(AUTH_ROUTE, 'session');
/**
 * Authenticated session holding at least one listed role. Admin principals
 * additionally pass the Admin scope port (active account, grants read per
 * request); super_admin is platform-wide.
 */
export const Roles = (...roles: [UserRole, ...UserRole[]]) =>
  applyDecorators(
    SetMetadata(AUTH_ROUTE, 'role'),
    SetMetadata(ROLES_ROUTE, Object.freeze([...roles])),
  );
/** Admin module/action permission checked with the shared scope predicate. */
export const Permission = (module: AdminModule, action: AdminAction) =>
  SetMetadata(PERMISSION_ROUTE, Object.freeze({ module, action }));
export interface ScopedRoute {
  readonly key: string;
  readonly param: string;
}
/**
 * Resource scope resolved server-side by the owning module's ScopeRegistry
 * resolver from a UUID path parameter; never from request claims.
 */
export const Scoped = (key: string, param = 'id') =>
  SetMetadata(SCOPED_ROUTE, Object.freeze({ key, param }));
