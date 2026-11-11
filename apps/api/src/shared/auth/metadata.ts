import { SetMetadata } from '@nestjs/common';

export const AUTH_ROUTE = 'apnatown:auth-route';
export type AuthRoutePolicy = 'public-read' | 'csrf' | 'guest' | 'own';
/** Public reads only; this NEVER exempts a mutation from authorization or CSRF. */
export const PublicRoute = () => SetMetadata(AUTH_ROUTE, 'public-read');
/** Own-account access, not an admin/seller/rider permission grant. */
export const OwnAccount = () => SetMetadata(AUTH_ROUTE, 'own');
export const LoginRoute = () => SetMetadata(AUTH_ROUTE, 'guest');
export const CsrfBootstrap = () => SetMetadata(AUTH_ROUTE, 'csrf');
