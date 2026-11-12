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
  // Public, locale-independent safe projections (both EN/HI values inside).
  publicSettings: ['public', 'settings'] as const,
  health: ['public', 'health'] as const,
  // Public reference data: both EN and HI names are in every response.
  geoCities: ['geo', 'cities'] as const,
  geoAreas: (cityId: string) => ['geo', 'cities', cityId, 'areas'] as const,
  // Public taxonomy: both EN and HI names are in every response.
  catalog: ['catalog'] as const,
  catalogCategories: (kind?: 'product' | 'service') =>
    ['catalog', 'categories', kind ?? 'all'] as const,
  catalogCategory: (slug: string) => ['catalog', 'category', slug] as const,
  catalogDuplicateCheck: (
    scope: AccountScope,
    check: Readonly<Record<string, string | undefined>>,
  ) => ['private', scope, 'catalog', 'duplicate-check', check] as const,
  // Owner suggestion history (the business is resolved server-side).
  catalogSuggestions: (scope: AccountScope) =>
    ['private', scope, 'catalog', 'suggestions'] as const,
  // Admin taxonomy reads. Suggestion pages are keyed by the URL status tab.
  adminCatalog: (scope: AccountScope) =>
    ['private', scope, 'admin', 'catalog'] as const,
  adminCatalogTree: (scope: AccountScope) =>
    ['private', scope, 'admin', 'catalog', 'tree'] as const,
  adminCatalogHomeSections: (scope: AccountScope) =>
    ['private', scope, 'admin', 'catalog', 'homeSections'] as const,
  adminCatalogSuggestions: (scope: AccountScope, status: string) =>
    ['private', scope, 'admin', 'catalog', 'suggestions', status] as const,
  adminCatalogKeywords: (scope: AccountScope) =>
    ['private', scope, 'admin', 'catalog', 'keywords'] as const,
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
  // Super-admin city management (platform-wide; the detail key sits under the
  // list key so a list invalidation also refreshes any open city).
  adminGeoCities: (scope: AccountScope) =>
    ['private', scope, 'admin', 'geo', 'cities'] as const,
  adminGeoCity: (scope: AccountScope, cityId: string) =>
    ['private', scope, 'admin', 'geo', 'cities', cityId] as const,
  // All super-admin settings, flags, legal versions and integration status.
  settings: (scope: AccountScope) =>
    ['private', scope, 'admin', 'settings'] as const,
  // Audit search terms are already visible URL state and hold redacted action
  // text, so the validated filters key the list. The admin scope revision
  // separates pages read under older area/city grants.
  audit: (scope: AccountScope, section: 'audit' | 'activity') =>
    ['private', scope, 'admin', section] as const,
  auditList: (
    scope: AccountScope,
    section: 'audit' | 'activity',
    scopeRevision: string,
    filters: Readonly<Record<string, string | undefined>>,
  ) =>
    [
      'private',
      scope,
      'admin',
      section,
      'list',
      scopeRevision,
      filters,
    ] as const,
  auditEntry: (
    scope: AccountScope,
    section: 'audit' | 'activity',
    scopeRevision: string,
    id: string,
  ) =>
    ['private', scope, 'admin', section, 'entry', scopeRevision, id] as const,
};
