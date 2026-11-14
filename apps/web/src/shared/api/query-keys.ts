import type { components } from '@apnatown/api-client';
import type { ExploreFilters } from '@apnatown/shared/search';

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
  myReviews: (scope: AccountScope) =>
    ['private', scope, 'reviews', 'mine'] as const,
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
  explore: (
    filters: ExploreFilters,
    locationRevision = 0,
    screen = 'explore',
  ) => ['public', screen, filters, locationRevision] as const,
  // S-CUST-06/07 public profile tabs: locale-independent (EN+HI labels inside),
  // keyed by the validated URL pill selection; never personalized.
  publicBusinessProducts: (slug: string, subcategory: string | null) =>
    ['public', 'business-profile', slug, 'products', subcategory] as const,
  publicBusinessServices: (
    slug: string,
    category: string | null,
    subcategory: string | null,
  ) =>
    [
      'public',
      'business-profile',
      slug,
      'services',
      category,
      subcategory,
    ] as const,
  // S-CUST-06/07 Gallery/Videos tabs and PD5/SV4 strip (Media-owned public
  // reads). Locale-independent and never personalized; the URL filter keys
  // the Gallery so a filter change resets its cursor pages.
  publicBusinessGallery: (slug: string, filter: string) =>
    ['public', 'business-profile', slug, 'gallery', filter] as const,
  publicBusinessVideos: (slug: string) =>
    ['public', 'business-profile', slug, 'videos'] as const,
  publicLinkedVideos: (targetType: 'product' | 'service', targetId: string) =>
    ['public', 'media', 'linked-videos', targetType, targetId] as const,
  publicReviews: (targetType: string, targetId: string, sort: string) =>
    ['public', 'reviews', targetType, targetId, sort] as const,
  catalogDuplicateCheck: (
    scope: AccountScope,
    check: Readonly<Record<string, string | undefined>>,
  ) => ['private', scope, 'catalog', 'duplicate-check', check] as const,
  // Owner suggestion history (the business is resolved server-side).
  catalogSuggestions: (scope: AccountScope) =>
    ['private', scope, 'catalog', 'suggestions'] as const,
  videoFeed: (
    viewer: string,
    pill: string,
    category: string | undefined,
    locationRevision: number,
    snapshotOrAnchor: string | undefined,
  ) =>
    [
      'private',
      viewer,
      'media',
      'reels-feed',
      pill,
      category ?? null,
      locationRevision,
      snapshotOrAnchor ?? null,
    ] as const,
  mediaVideos: (scope: AccountScope, kind: 'shop' | 'provider') =>
    ['private', scope, 'media', 'videos', kind] as const,
  // S-VEND-11 / S-PROV-12 manager: every owner video in manager order plus the
  // order version (one read); detail hydrates the editor. Both sit under
  // `mediaVideos`, so invalidating that root refreshes list, order and detail.
  mediaVideoManager: (scope: AccountScope, kind: 'shop' | 'provider') =>
    [...queryKeys.mediaVideos(scope, kind), 'manager'] as const,
  mediaVideoDetail: (
    scope: AccountScope,
    kind: 'shop' | 'provider',
    id: string,
  ) => [...queryKeys.mediaVideos(scope, kind), 'detail', id] as const,
  // Owner gallery-only photos in manager order with the order version.
  mediaGallery: (scope: AccountScope, kind: 'shop' | 'provider') =>
    ['private', scope, 'media', 'gallery', kind] as const,
  mediaVideo: (id: string) => ['public', 'media', 'video', id] as const,
  videoCommentsPublic: (id: string) =>
    ['public', 'media', 'video-comments', id] as const,
  videoCommentsPrivate: (scope: AccountScope, id: string) =>
    ['private', scope, 'media', 'video-comments', id] as const,
  engagementStateRoot: (scope: AccountScope | null, epoch: number) =>
    ['private', scope ?? { epoch }, 'engagement', 'state'] as const,
  savedRoot: (scope: AccountScope) =>
    ['private', scope, 'engagement', 'saved'] as const,
  saved: (scope: AccountScope, tab: string, mediaFilter: string) =>
    [...queryKeys.savedRoot(scope), tab, mediaFilter] as const,
  engagementState: (
    scope: AccountScope | null,
    epoch: number,
    videoIds: readonly string[],
    businessIds: readonly string[] = [],
  ) =>
    [
      ...queryKeys.engagementStateRoot(scope, epoch),
      videoIds,
      businessIds,
    ] as const,
  /** Guest-or-customer cart (S-CUST-10). Guests share the epoch-scoped key. */
  cart: (scope: AccountScope | null, epoch: number) =>
    ['private', scope ?? { epoch }, 'cart'] as const,
  // S-CUST-12 own checkout attempt (per-shop order IDs; never a code/address).
  checkoutAttempt: (scope: AccountScope, attemptId: string) =>
    ['private', scope, 'checkout', 'attempts', attemptId] as const,
  // S-CUST-13/14 customer orders. Lists are keyed by the URL group; the
  // detail sits under the same root so one invalidation refreshes both.
  customerOrdersRoot: (scope: AccountScope) =>
    ['private', scope, 'orders'] as const,
  customerOrders: (scope: AccountScope, group: string) =>
    [...queryKeys.customerOrdersRoot(scope), 'list', group] as const,
  customerOrder: (scope: AccountScope, orderId: string) =>
    [...queryKeys.customerOrdersRoot(scope), 'detail', orderId] as const,
  // Customer handover code (no-store channel): memory-only, gcTime 0. The
  // nonsecret code version keys a reissued generation; never the code.
  deliveryCode: (
    scope: AccountScope,
    orderId: string,
    codeVersion: number | null,
  ) => ['private', scope, 'delivery', 'code', orderId, codeVersion] as const,
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
  adminVideoModerationRoot: (scope: AccountScope) =>
    ['private', scope, 'admin', 'videos', 'moderation'] as const,
  adminVideoCommentsRoot: (scope: AccountScope) =>
    ['private', scope, 'admin', 'videos', 'comments'] as const,
  adminVideoComments: (
    scope: AccountScope,
    scopeRevision: string,
    status: string,
  ) =>
    [
      ...queryKeys.adminVideoCommentsRoot(scope),
      scopeRevision,
      status,
    ] as const,
  adminVideoModeration: (
    scope: AccountScope,
    scopeRevision: string,
    tab: string,
  ) =>
    [...queryKeys.adminVideoModerationRoot(scope), scopeRevision, tab] as const,
  // S-ADMN-11 combined video + photo report queue and its counts.
  adminMediaReportsRoot: (scope: AccountScope) =>
    ['private', scope, 'admin', 'media-reports'] as const,
  adminMediaReports: (
    scope: AccountScope,
    scopeRevision: string,
    targetKind: string,
  ) =>
    [
      ...queryKeys.adminMediaReportsRoot(scope),
      scopeRevision,
      'list',
      targetKind,
    ] as const,
  adminMediaReportCounts: (scope: AccountScope, scopeRevision: string) =>
    [
      ...queryKeys.adminMediaReportsRoot(scope),
      scopeRevision,
      'counts',
    ] as const,
  // Admin reads are scoped by account/roles/epoch like every private key. The
  // free-text search never enters a key (it may hold a phone or email); the
  // caller keys it by an in-memory revision instead.
  admin: (scope: AccountScope) => ['private', scope, 'admin'] as const,
  adminMe: (scope: AccountScope) => ['private', scope, 'admin', 'me'] as const,
  // S-ADMN-02 approvals: queue pages, detail (+history pages) and document
  // metadata, separated by the admin scope revision that read them.
  adminApprovalsRoot: (scope: AccountScope) =>
    ['private', scope, 'admin', 'approvals'] as const,
  adminApprovalQueue: (
    scope: AccountScope,
    scopeRevision: string,
    type: string,
    status: string,
  ) =>
    [
      ...queryKeys.adminApprovalsRoot(scope),
      'queue',
      scopeRevision,
      type,
      status,
    ] as const,
  adminApprovalDetail: (
    scope: AccountScope,
    scopeRevision: string,
    type: string,
    id: string,
  ) =>
    [
      ...queryKeys.adminApprovalsRoot(scope),
      'detail',
      scopeRevision,
      type,
      id,
    ] as const,
  adminApprovalDocuments: (
    scope: AccountScope,
    scopeRevision: string,
    id: string,
  ) =>
    [
      ...queryKeys.adminApprovalsRoot(scope),
      'documents',
      scopeRevision,
      id,
    ] as const,
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
  // S-VEND-14 / S-PROV-03 owner enquiries, under the owner's kind-scoped
  // business root (vendor and provider contexts never share pages). The inbox
  // search only matches customer name/message text and is already visible URL
  // state, so the validated filters key the pages; phones never enter a key.
  enquiriesRoot: (scope: AccountScope, kind: 'shop' | 'provider') =>
    ['private', scope, 'business', kind, 'enquiries'] as const,
  enquiryInbox: (
    scope: AccountScope,
    kind: 'shop' | 'provider',
    status: string,
    query: string,
  ) =>
    [...queryKeys.enquiriesRoot(scope, kind), 'inbox', status, query] as const,
  enquiry: (scope: AccountScope, kind: 'shop' | 'provider', id: string) =>
    [...queryKeys.enquiriesRoot(scope, kind), 'detail', id] as const,
  // S-VEND-05/06/08, S-PROV-06/07 owner catalogue, kind-scoped like enquiries.
  // The search is visible URL state (name/SKU only), so it may key the pages.
  productsRoot: (scope: AccountScope, kind: 'shop' | 'provider') =>
    ['private', scope, 'business', kind, 'products'] as const,
  productList: (
    scope: AccountScope,
    kind: 'shop' | 'provider',
    stock: string,
    query: string,
  ) => [...queryKeys.productsRoot(scope, kind), 'list', stock, query] as const,
  product: (scope: AccountScope, kind: 'shop' | 'provider', id: string) =>
    [...queryKeys.productsRoot(scope, kind), 'detail', id] as const,
  productPills: (scope: AccountScope, kind: 'shop' | 'provider') =>
    [...queryKeys.productsRoot(scope, kind), 'pills'] as const,
  productImportPolicy: (scope: AccountScope, kind: 'shop' | 'provider') =>
    [...queryKeys.productsRoot(scope, kind), 'import-policy'] as const,
  inventory: (scope: AccountScope, kind: 'shop' | 'provider') =>
    ['private', scope, 'business', kind, 'inventory'] as const,
  // Owner image upload limits per purpose and target business (never a file
  // name, bytes or preview path).
  ownerImagePolicy: (
    scope: AccountScope,
    purpose: string,
    businessId: string,
  ) =>
    [
      'private',
      scope,
      'media',
      'owner-image-policy',
      purpose,
      businessId,
    ] as const,
  // S-VEND-13 / S-PROV-08 owner services, kind-scoped like products/enquiries.
  servicesRoot: (scope: AccountScope, kind: 'shop' | 'provider') =>
    ['private', scope, 'business', kind, 'services'] as const,
  serviceList: (
    scope: AccountScope,
    kind: 'shop' | 'provider',
    status: string,
  ) => [...queryKeys.servicesRoot(scope, kind), 'list', status] as const,
  ownerService: (scope: AccountScope, kind: 'shop' | 'provider', id: string) =>
    [...queryKeys.servicesRoot(scope, kind), 'detail', id] as const,
  // S-CUST-01 located Home read (nearby shops). Not account data; keyed by the
  // public city/area and the in-memory location revision, never coordinates.
  searchHomeLocated: (
    locale: string,
    cityId: string | null,
    areaId: string | null,
    locationRevision: number,
  ) =>
    [
      'public',
      'search-home',
      locale,
      cityId,
      areaId,
      locationRevision,
    ] as const,
};
