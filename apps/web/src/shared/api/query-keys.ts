import type { components } from '@apnatown/api-client';

export type Session = components['schemas']['SessionDto'];
export function accountScope(session: Session, epoch: number) {
  return {
    userId: session.userId,
    roles: [...session.roles].sort(),
    approvalStates: session.approvalStates,
    epoch,
  };
}
export type AccountScope = ReturnType<typeof accountScope>;

// These endpoints return locale-independent identity/preferences, not translated
// content. Never include phone, email, OTP, CSRF or other credentials in keys.
export const queryKeys = {
  session: ['auth', 'session'] as const,
  private: ['private'] as const,
  profile: (scope: AccountScope) => ['private', scope, 'profile'] as const,
  preferences: (scope: AccountScope) =>
    ['private', scope, 'preferences'] as const,
  pendingPreferences: (epoch: number) =>
    ['private', 'login-preferences', epoch] as const,
  addresses: (scope: AccountScope) => ['private', scope, 'addresses'] as const,
  consents: (scope: AccountScope) => ['private', scope, 'consents'] as const,
  dataRequest: (scope: AccountScope, requestId: string) =>
    ['private', scope, 'data-requests', requestId] as const,
  dataExport: (scope: AccountScope, requestId: string) =>
    ['private', scope, 'data-exports', requestId] as const,
  // Survives session revocation by design; the request ID only, never the
  // completion capability.
  deletionCompletion: (requestId: string) =>
    ['data-request-completion', requestId] as const,
  // Public reference data: both EN and HI names are in every response.
  geoCities: ['geo', 'cities'] as const,
  geoAreas: (cityId: string) => ['geo', 'cities', cityId, 'areas'] as const,
  // Admin reads are scoped by account/roles/epoch like every private key. The
  // free-text search never enters a key (it may hold a phone or email); the
  // caller keys it by an in-memory revision instead.
  admin: (scope: AccountScope) => ['private', scope, 'admin'] as const,
  adminMe: (scope: AccountScope) => ['private', scope, 'admin', 'me'] as const,
  adminList: (scope: AccountScope) =>
    ['private', scope, 'admin', 'admins'] as const,
  admins: (
    scope: AccountScope,
    filters: Readonly<Record<string, string | undefined>>,
    searchRevision: number,
  ) =>
    [
      'private',
      scope,
      'admin',
      'admins',
      'list',
      filters,
      searchRevision,
    ] as const,
  adminImpact: (scope: AccountScope, adminId: string) =>
    ['private', scope, 'admin', 'admins', adminId, 'impact'] as const,
  roles: (scope: AccountScope) => ['private', scope, 'admin', 'roles'] as const,
};
