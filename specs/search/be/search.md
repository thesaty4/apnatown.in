# BE: search

Features: F-HM-001, F-HM-002, F-HM-005, F-HM-006, F-HM-007, F-HM-008, F-HM-009, F-HM-010, F-HM-011, F-HM-012, F-HM-013, F-HM-014, F-EX-001, F-EX-002, F-EX-003, F-EX-004, F-EX-005, F-EX-006, F-EX-007, F-EX-008, F-EX-009, F-EX-010, F-EX-011, F-EX-012, F-SR-001, F-SR-002, F-SR-003, F-SR-004, F-SR-005, F-SR-006, F-SR-007, F-SR-008, F-SR-009, F-SR-010 | Rules: BR-15, BR-18 | State machines: none | Depends on / used by: catalog, businesses, products, services, offers, media-videos, geo, reviews (read ports only) / public discovery screens

Frontend counterpart: [FE search](../fe/search.md) · [Feature inventory](../../../docs/design-context/01-feature-inventory.md)

## Responsibility

Provide read-only Home discovery composition, Explore facets/results and grouped Search suggestions/results. Catalog owns taxonomy and keyword-mapping records; each listing, offer and video module remains the source of its public data. Search owns no source-of-truth tables and does not expose admin keyword-mapping writes (catalog owns AD15/SA8).

## Tables

None. Search reads owner-module application contracts and database read models; it must not write or duplicate their records.

## Endpoints

Discovery endpoints are public reads; the separate admin preview requires permission and scope. Resolve only approved/live public listings and approved videos; never expose drafts, private media or owner-only fields. Use shared typed query DTOs, parameterized queries, stable keyset cursors (default 20, maximum 50), and the shared error contract.

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/search/home` | Public; optional validated discovery context | → `{banners,categorySections,curatedCategorySections,nearbyShops,featuredBusinesses,popularBusinesses,featuredProducts,popularProviders,offers,promotions}` using Catalog/owner DTOs; each bounded section has `{items,nextCursor?,state}`. Categories, local recent views, saved/header counts and footer content remain with their owners/client state | `COMMON_VALIDATION_FAILED`, `SEARCH_LOCATION_REQUIRED` | Yes | F-HM-002, F-HM-005–011, S-CUST-01 |
| GET | `/search/popular` | Public | → curated platform search terms; current prototype list is `AC`, `iPhone 15`, `DJ`, `tent`, `plumber`, `mobile repair`, `एसी` pending Q-56 | — | Yes | F-SR-005, F-SR-009, S-CUST-03 |
| GET | `/search/suggestions?q=` | Public; normalized non-empty query | → grouped suggestion DTOs: products, shops, services, categories, subcategories and related searches; each group is empty when there is no match | `COMMON_VALIDATION_FAILED` | Yes | F-SR-002–004, S-CUST-03 |
| GET | `/search` | Public; `SearchQuery` below | `tab=all\|products\|shops\|services\|videos`; → `DiscoveryResponse`. Empty query returns empty groups; recent terms are not sent | `SEARCH_FILTER_INVALID`, `SEARCH_LOCATION_REQUIRED`, `COMMON_VALIDATION_FAILED` | Yes | F-SR-001–010, S-CUST-03 |
| GET | `/explore` | Public; `ExploreQuery` below | `tab=products\|shops\|services`; → `DiscoveryResponse`, selected-tab facets and page-aligned shop/provider map pins | `SEARCH_FILTER_INVALID`, `SEARCH_LOCATION_REQUIRED`, `COMMON_VALIDATION_FAILED` | Yes | F-EX-001–012, S-CUST-02 |
| POST | `/search/admin/preview` | Admin `catalog:view` + assigned city/area, or super_admin; CSRF; no-store | `{tab,query?,categoryIds?,subcategoryIds?,mapping?:{canonicalTerm,synonyms,targets},cityId?,areaIds?,cursor?,limit?}` → same public projections/counts restricted to trusted scope plus `{appliedMapping,effectiveScope}` | `COMMON_FORBIDDEN`, `SEARCH_FILTER_INVALID`, `KEYWORD_TARGET_INVALID` | Read-only | F-AD-005, F-AD-015 |

Implementation status: the first `/search/home` slice accepts only `locale` and returns `{categorySections}` (Catalog dedicated and curated sections in one array ordered by `position`), cached publicly for 60 seconds. Other sections are added as their owner modules land; omitted sections render nothing on Home.

Home hero banners (2026-11-14) currently read Offers' spec'd public
`GET /promotions/placements?kind=homepage_banner` directly from the Home
server component; they are not yet composed into `/search/home`. When Offers'
`homePlacements` read port is added, `SearchHomeService` should compose the
same `banners` section and Home should stop making the second read.

Implementation status (2026-11-12, full EX1–EX12 backend/shared read contract): **implemented; builds/generated contracts and independent security re-review passed; runtime checks deferred**. The businesses-only response is replaced by `ExploreResponseSchema`:
`{tab,normalizedFilters,counts:{products,shops,services},page:{items,nextCursor},facets:{categories,subcategories,brands,priceRange},mapPins,relatedCategories}`.
Products reads real product rows; Shops reads shop businesses; Services counts individual service rows of shops/providers. No tab is hardcoded empty and no signal is invented when a source has no rows. SearchHome is unchanged.

The path is `ExploreController -> ExploreService -> ExploreRepository -> PrismaExploreRepository -> owner-exported public SQL projections`. One read-only REPEATABLE READ transaction covers Catalog validation/context relations, optional Catalog keyword resolution, geographic context, effective eligibility revision, every count/facet and the keyset page. Filtering/ordering occurs in SQL before limits. Public owner views require published/nondeleted products or active/nondeleted services, approved/nondeleted businesses, active/nondeleted owners, enabled cities and active taxonomy. Business memberships remain PRODUCT kind; service category/subcategory is SERVICE kind. Multi-membership arrays/EXISTS avoid duplicate businesses; service subcategories use the individual listing's single subcategory.

The additive migrations `20261112180000_listing_read_sources`, `20261112180100_discovery_signal_sources` and `20261112180200_owner_public_read_projections` establish Products/Inventory, Services, Reviews, Payments billing/subscription evidence and Offers/promotion sources plus ordinary owner views. They grant runtime **SELECT only** on the new sources, not manager/financial writes. Search owns no table, materialized index, queue or copied entitlement. Reviews aggregates only published, nondeleted reviews of active authors. Offers owns approved/current-window/stock eligibility and integer half-up best product pricing; service offers remain informational. Payments requires a succeeded matching purchase, finite current subscription, explicit immutable Premium snapshot and fiscal/period evidence; missing evidence fails closed. Business featuring comes only from eligible active promotion placements. Manual promotion null bounds are open; purchased windows are finite.

Read-foundation adaptation: `business_subscriptions.purchase_id` links directly to the documented verified `billing_purchases` evidence, without implementing payment attempts/gateway/checkout. Its purchase snapshot requires explicit `premium`, `commissionBps`, `periodRules` and nonempty `taxSnapshot`; its subscription snapshot requires matching `planKey`, `premium`, `commissionBps`. No public writer creates these facts. Owner managers, review submission/moderation, offer approval, payment verification and product/service uploads are **not** claimed implemented by this discovery task. Existing/externally migrated legitimate source data can be read; empty sources legitimately return empty results/null ratings, stock or location signals.

Local seed follow-up (2026-11-12): **authored; migration/seed execution and runtime
acceptance deferred**. Source inspection confirmed the prior explicit seed only
created businesses/videos, so empty Products/Services projections were expected.
`apps/api/prisma/seed-listing-fixtures.mjs` adapts the reference JSON into
53 Products rows, 53 Inventory rows and 38 individual Services rows (7 shop,
31 provider); `seed-listings.mjs` provisions them through the existing explicit
`seed.mjs` transaction/advisory lock. No endpoint, manager, projection, runtime
privilege or frontend fallback is changed.

The target remains local/test only at `127.0.0.1:5434/apnatown_local`, validated
by `localTargets` before connection. Explicit provisioning uses its migration
role rather than widening SELECT-only runtime listing grants. The 17 seeded
category identities and category-scoped service subcategory identities are
reused exactly, including the distinct `appliance-repair` identities; 36 missing
product subcategories are insert-only local fixture data. EN-only product
subcategory labels fill the required Hindi column without fabricated
translations. Missing/mismatched reference taxonomy fails the transaction;
existing inactive taxonomy is never reactivated.

Stable listing IDs and slugs make retries insert-only. Unlike the prior
business/video early skip, listing backfill also runs for existing fixture
businesses after matching ID, slug, kind, resolved owner and phone hash; deleted
businesses/owners and unrelated slug/owner conflicts are skipped. Existing
listing ID/slug/SKU conflicts receive no inventory or updates; stock is created
only with a new product. Status/approval, edits, soft deletions and business
settings are never reset. Gallery defaults use the current setting. Original
stock/availability and exact integer paise are preserved. `free` maps to fixed
zero, supported display units map to existing enum values (`/ chair` -> `unit`),
and the three monthly fees use the new `month` unit with their real amounts
(`20261112191100_service_month_unit`).

Provider visibility (2026-11-12): `businesses_public_context` required a
PRODUCT-category membership for every business, but providers are categorised
by SERVICE taxonomy (prototype `js9.js` provider wizard uses service
categories), so all 31 provider services were excluded. Forward migration
`20261112191000_provider_public_context` keeps the PRODUCT-membership rule for
shops only; approval, owner, city and listing-taxonomy checks are unchanged and
no false memberships are seeded. Unchanged eligible
businesses supply 53 products and 38 services before filters. Reference emoji
images are omitted; no asset/media delivery changes, invented ratings,
verified experience, offers, Premium purchases/subscriptions or delivery
configuration are added. Owner read projections remain authoritative.
See [local provisioning and rerun behavior](../../../README.md#local-development).

Seed follow-up verification: `pnpm --filter @apnatown/api build`, `node --check`
for all four `apps/api/prisma/seed*.mjs` files, targeted ESLint, targeted
Prettier and the owned `git diff --check` all passed. Initial formatting
warnings were corrected before the final checks. No seed/fixture execution,
automated tests, migration application, services, API or database checks were
run; rerun/conflict/visibility behavior is source-reviewed, not runtime-proven.
Security self-review for this bounded provisioning change:
- [x] SQL values are bound; identifiers are static; money/enums and qualified
  taxonomy are validated using the existing shared contracts where available.
- [x] Local target and fixture owner/business identity guards remain explicit;
  no runtime grants, public authorization or owner visibility predicates change.
- [x] No new credentials, session/OTP bypass, secret/PII output or external
  calls; the CLI's existing redacted error handling remains in place.
- [x] Only explicit column allow-lists and insert-only writes; no fixture stock
  reset, reapproval, media URLs or fabricated review/financial evidence.
- [ ] Endpoint CSRF/session/OTP, upload/embed/CSV/webhook, admin audit and
  marketing-consent checklist items: not applicable; these paths are unchanged.
No independent security/architecture approval is claimed for this follow-up.

Cursors bind the full normalized active/inactive/context/query/sort/location context and a digest of current effective public eligibility/ordering inputs. They carry a signed `asOf` (15-minute maximum), full sort tuple and stable ID. A changed effective projection, expiry or cross-filter replay invalidates the cursor; timestamps retain PostgreSQL microseconds, numeric keys retain database precision and null prices sort last in both directions. All Explore/detail responses use `private, no-store` so stale caches cannot preserve expired entitlement or precise location. Ordinary map/list browsing needs no GPS; explicit distance/radius/delivery filters do. Area centroid is the Geo-owned fallback.

Owner GET endpoints are registered in AppModule and the metadata-only OpenAPI composition: `/products/{slug}`, `/services/{slug}`, `/businesses/public/{slug}`. Shared `ProductPublicSchema`, `ServicePublicSchema`, `BusinessDiscoveryDetailSchema` expose `{item,description,images}` plus service included/excluded/area/experience and business hours. Product detail explicitly reports `orderability:{orderable:false,reasonCode:'CHECKOUT_UNAVAILABLE'}`; missing fiscal or checkout implementation cannot imply orderability. `item` is the same public card projection, with nullable `phone` from Businesses' documented public contact (never Users' login phone), nullable range `priceMaxPaise`, and canonical paths `/product/{slug}`, `/service/{slug}`, `/shop/{slug}`, `/provider/{slug}` from the owning FE route tables. Provider business detail uses `item.kind='shop'` as the business-card discriminant and `item.business.kind='provider'`.

Media retains its existing asset identity, authenticated Cloudinary storage and reauthorizing same-origin gateway. Product/service/business descriptor placements recheck exact current attachment, owner, purpose, moderation, listing/business visibility and taxonomy before **and after** byte fetch. HEAD and matching conditional reads authorize the same current placement before returning trusted persisted metadata without downloading bytes. GET and HEAD share the persisted client budget (120/minute); provider downloads are bounded to four per process with no queue. Invalid ranges fail before provider I/O; valid ranges are forwarded, with a bounded, verified full-body fallback only if the provider ignores Range. Cards choose a bounded card variant; detail reads return ordered image variants. No raw provider URL/signature is exposed. Only card/detail/home surfaces are accepted; Gallery/Reels consent is not bypassed by these reads. Taxonomy upload is unchanged; no duplicate upload contract is added.

Explore prototype follow-up: cards also expose nullable `whatsappPhone` from the documented public business contact, `discountPercent` from effective product price/MRP and `lowStockQuantity` from actual in-stock inventory at/below its threshold. Forward migration `20261112184200_explore_card_signals` adds owner read views, not copied signals. Engagement owns service bookmarks through `PUT/DELETE /engagement/bookmarks/service/{targetId}`, batched `bookmarkedServiceIds`, the Saved services tab and Users export/erasure contribution; unavailable targets remain removable. Migration `20261112184300_service_bookmarks` adds only the documented relationship table. Shared/API/client builds and Prisma/OpenAPI/client generation passed; migrations were **not** applied, runtime scenarios were not exercised and the auditor's Media finding awaits independent re-review.

`q` on `/explore` calls existing `CatalogReadPort.resolveKeywords` in the same transaction, combines configured category/subcategory/product-tag targets with bound PostgreSQL text/trigram/full-text matching, and can be independently keyed by the Search-service filter UI. This does **not** implement `/search`, autocomplete, All/Videos search, popular terms or admin preview; those separate SR features remain as specified below.

`OffersDiscoveryPort.homePlacements({cityId?,areaId?,at})` supplies active, in-window hero/featured/local-promotion placements and typed target/asset/order data. Search only composes them; Q-60 no longer leaves banners ownerless. Products' explicit featured flag supplies eligible product cards; popularity/view rankings without an approved source remain `unavailable` under Q-57, never guessed analytics. Catalog owns cross-kind relations from `js23.js`; Geo, browser-local state and Engagement own location, recent views and saved counts.

### Complete query and result contract

Schemas live once in `packages/shared` for the generated API client and `useUrlState`; reject unknown keys and malformed numbers/booleans instead of silently ignoring them.

| Schema | Keys and values |
|---|---|
| Common | `tab`; `view=list\|map` (Explore only, map for shops/services); `sort` per tab below; opaque `cursor`; integer `limit=1..50`; optional public `cityId,areaId`; `contextCategory` is the removable Home category slug, separate from a tab's editable filters |
| Products | `category` single slug; `subcategory` single `categorySlug/subcategorySlug` identity (unambiguous legacy bare slug accepted); `brand` exact facet value; `priceMinPaise,priceMaxPaise` nonnegative safe integers with min ≤ max; `rating=0\|3\|4\|4.5`; booleans `offers,inStock,deliversToMe,pickup,featured`; `distanceKm`; optional UUID `offerId`; `sort=relevance\|distance\|price_asc\|price_desc\|rating\|newest` |
| Shops | `category` single product-category slug (matches any business category membership); `distanceKm,radiusKm,rating`; booleans `openNow,deliversToMe,offers,verified,featured`; `sort=relevance\|distance\|rating\|newest` |
| Services | `category` comma-separated unique slugs; `subcategory` comma-separated unique `categorySlug/subcategorySlug` identities (unambiguous legacy bare slugs accepted); `distanceKm,radiusKm,rating,priceMinPaise,priceMaxPaise`; booleans `priceOnEnquiry,availableToday,offers,verified`; `sort=relevance\|distance\|rating\|price_asc` |
| Search only | Trimmed `q` up to 200 characters; `tab` additionally `all\|videos`; Videos accepts only `sort=relevance`, no product/service price filters; All composes each group's independently typed filters |

Booleans serialize as `true|false`; absent/false means no boolean restriction. Distance 0/omitted means unrestricted; filter options are 1/3/5/10 km. Optional `radiusKm` is 1..12 (initial map UI control 6), but the server never silently defaults/requires it for ordinary map browsing. Explicit radius, distance sorting/filtering or `deliversToMe` without usable context returns `SEARCH_LOCATION_REQUIRED`; ordinary location-free discovery remains valid.

Precise location is ephemeral API request context: the shared client sends validated `X-Discovery-Latitude`/`X-Discovery-Longitude` headers together from active Geo state, never saved address IDs/coordinates in share links. These headers are redacted; location-dependent responses are private/no-store. Area-only selection can use Geo's known area centroid, labelled as an area rather than a fabricated GPS fix.

Active-tab filters use the unprefixed keys above; inactive filters use `products.`, `shops.` or `services.` prefixes and the same strict per-tab schemas. Namespace fields are permitted only for those named tabs, never arbitrary SQL fields. On tab switch, serialize the old active filters into its namespace and promote the destination values; unprefixed values win only for the active tab and duplicate active aliases are rejected. Preserve explicit empty category selections so reload cannot reapply a cleared filter. Search and Explore use independent URLs/stores; cursors reset only for the changed query/tab.

`contextCategory` initializes all tabs through Catalog's ordered relations: product kind selects the same category for Products/Shops and all `RELP` service targets; service kind selects itself for Services and the first `RELS` target for Products/Shops (`js23.js`), or leaves their category unrestricted when no target exists. Existing deep links without it still restore their active category/subcategory exactly. Removing the shared category clears category/subcategory across tabs, not other filters; per-tab Reset resets that tab only. A product context with no relation and no explicitly selected service category shows the prototype's no-related-services state, not all services.

`DiscoveryResponse` is `{tab,query,normalizedFilters,counts:{all?,products,shops,services,videos?},page:{items,nextCursor},groups?,facets,mapPins?,relatedCategories,mappingExplanation?}`. All uses at most four items per nonempty group plus the group's total and See-all target; selected tabs use keyset pages. Suggestions return named arrays `{products,shops,services,categories,subcategories,relatedSearches}` of `{id?,label,target}` with approved same-origin targets, up to three entity suggestions/group and two related terms as in `js23.js`.

Facets are `{categories,subcategories,brands?,priceRange?}`; each option has `{id,value,labelEn,labelHi,count,selected,disabled}` and subcategories also `categoryId`. Compute the option count with its own dimension removed but other filters retained, from the same database snapshot/predicate as page/counts. Disable unselected zero-count options, never prevent deselecting a selected zero-count option. Services count service rows, not expertise/provider joins. Map pins deduplicate business IDs on the same returned page; page further results without claiming all markers are loaded.

Selected service subcategories must exist; when categories are selected, they must belong to those categories. With no selected category, a valid subcategory selection across collapsed groups is still allowed and survives URL reload; do not silently discard it as the prototype's older parser does.

Subcategory identity is category-qualified for **both Products and Services**: facet `value` and every nonempty active/inactive normalized subcategory filter use `categorySlug/subcategorySlug`; facet `id` remains the Catalog subcategory UUID and `categoryId` its parent UUID. Catalog permits identical child slugs under different parents (the seed has `mechanic/appliance-repair` and `electrician/appliance-repair`), so bare child slugs are never global identities.

Resolve each tab's selection against the active Catalog snapshot **after** applying its own explicit category or `contextCategory`/relation defaults. A legacy bare slug is accepted only when exactly one subcategory matches within that tab's selected parent IDs, or across that tab's active taxonomy kind if its category is absent/explicitly empty. No match, multiple matches, a qualified parent outside the selected categories, or duplicate identities after alias resolution returns `SEARCH_FILTER_INVALID` with the affected (possibly namespaced) field. Result counts, city filters and keywords never break ties. Preserve absent values and explicit `subcategory=''` markers; an explicit `category=''` still prevents context restoration.

Examples: `category=mechanic&subcategory=appliance-repair` normalizes to `mechanic/appliance-repair`; bare `appliance-repair` with categories `mechanic,electrician` (or no selected category) is rejected. Explicit `mechanic/appliance-repair,electrician/appliance-repair` remains two independently selectable service values. The same rules apply to `products.subcategory` and `services.subcategory`. Inputs have at most 50 unique values (Products still one), at most 80 characters per slug segment, exactly zero or one `/` per value, and a bounded 8099-character subcategory CSV; blank segments and malformed slugs fail request validation.

SQL resolves canonical pairs through the Catalog parent/child ID relationship and filters listing `subcategory_id`; page/count/facet predicates use that same resolution. Subcategory facet counts still omit their own dimension and selected zero-count options remain removable. Catalog relations and keyword targets remain ID-based. Signed cursors bind the canonical normalized values; old bare-value cursor bindings must restart pagination.

Architect correctness follow-up status (2026-11-12): category-qualified subcategory identity is implemented in shared validation, normalization, facets and the shared SQL predicate. Shared/API/client builds and OpenAPI/client generation passed. No migration or source-data change is needed; database/runtime acceptance scenarios were not executed.

Owner inputs are `BusinessReadPort.publicProjection`, `ProductReadPort.publicProjection`, `ServiceReadPort.publicProjection`, Catalog taxonomy/mappings/relations/home sections, Offers active eligibility/placements and Media approved-video search projections. Reviews supplies published public rating aggregates; Payments supplies the current Premium entitlement to owner listing projections; no private repository joins or extra source-of-truth tables. Owner projections return effective `featured` at `at`; Search does not infer a subscription or copy entitlement state. Products price filters/sorts use the current effective offer price; services use starting/fixed/range lower bounds, price-on-enquiry remains null in DTOs and sorts last. Match `js22.js` filter behavior: a positive minimum excludes enquiry pricing, a maximum alone does not; the enquiry-only toggle combined with a positive minimum can return zero.

Execution boundary: owners export read-only SQL projections with these public column contracts; Search's parameterized repository composes them in the same PostgreSQL read transaction. Apply all matching, eligibility, scope and facet predicates before counting/keyset limiting; never fetch an owner module's first page and then filter it in memory. Business category filters use `EXISTS` against the business-category relationship (and distinct business IDs for counts) so multi-category joins cannot duplicate cards or counts. Effective pricing/rating/featured expressions come from their owning projections, not a second Search implementation of financial/review/subscription rules. Plain SQL views/query projections need no new persisted search index or event-driven read database.

Default/relevance ordering is featured-first, then the existing secondary ordering: Products use distance; Shops use distance; Services use active offer then distance; Search relevance groups matching target kinds and uses the same within-kind order. Business featured status comes from a currently eligible, approved Offers `featured_business` placement; product/service featured status is the listing owner's `featured_selected` plus current Premium feature eligibility from Payments. A featured status never overrides publication, approval, city/area, filters or serviceability. An explicit non-relevance sort (including distance, price, rating or newest) takes precedence and removes the featured boost. Omit distance when location is absent; append stable ID ties. Rating is descending published rating; price is directional; newest is `(createdAt DESC,id DESC)`. Bind cursors to normalized query/filter/sort/context and the feature `asOf`/eligibility version; reject mismatched or invalidated cursors. Home analytics popularity remains the separate Q-57 gate.

## Rules and use-cases

1. Validate query length/shape and every filter against shared Zod schemas; unknown keys, invalid slugs, unsupported sort fields and malformed coordinates fail validation. Do not interpolate query text or client-selected sort fields into SQL.
2. Resolve a query against Catalog's enabled keyword mappings and normalized synonyms, then perform PostgreSQL `unaccent`, `pg_trgm` and full-text matching over owner-module search projections. Return every matching target kind and an explanatory mapping label where configured.
3. Filter out unpublished/deleted listings, unapproved or suspended businesses, businesses in non-enabled cities, and non-approved videos before counting or returning new discovery results. Keep owner-specific visibility and media moderation decisions in their source modules; city disable does not cancel in-flight orders.
4. Explore and Search expose the same allow-listed product/shop/service filters; the current request's tab determines the filter schema. Search uses its own query state and never reads or mutates Explore state (BR-15).
5. Services use the service's single catalog subcategory. Category/subcategory multi-select uses OR logic; removing a category removes its selected subcategories. Counts are calculated from the same predicate/snapshot as results and recomputed against the other active filters (BR-08, BR-18).
6. Use only the per-tab sorts and exact comparison rules above. The `featured` filter matches only an owner's effective featured status, never a stored selection or stale flag. Featured-first applies only to default/relevance ordering; explicit non-relevance sorting is primary. Price/rating/distance cursors encode their last ordered value plus ID; default/relevance cursors also bind the featured and existing secondary keys. No offset-pagination or raw client SQL sort expression. Location is optional unless the user selects a location-dependent filter.
7. Map view uses the same filtered set as list view and only the public map projection for shops and service providers. Map/list is presentation state, not a second result query.
8. Home discovery reads data through the modules permitted in [architecture](../../_foundation/architecture.md). A location-specific `/search/home` response is private/no-store; location-free public sections may use ISR. Catalog supplies ordered homepage category-section configurations; Search composes but does not own them. Missing source data and unavailable integrations are distinct section states; Engagement bookmarks/recent/header counts are not recomputed by Search.
9. Admin preview uses the same public matching/facet engine after intersecting requested scope with trusted grants; an out-of-scope requested area is denied, not silently broadened. Unsaved mappings are validated with Catalog's target schema and applied to this preview only. Never return unpublished business/private media data just because the caller is an admin.

## Events and jobs

Search publishes no domain event and stores no raw query history. It consumes `catalog.taxonomy.changed`, `catalog.home_sections.changed`, `catalog.keyword_mapping.changed`, `business.profile.changed`, `business.application.decision_changed`, `geo.city.status_changed`, `geo.zone.changed`, `product.created`, `product.updated`, `product.deleted`, `product.published`, `inventory.changed`, `service.changed`, Payments `business.subscription.eligibility_changed` and `business.subscription.expired`, and owner-defined offer/media/rating changes to invalidate affected public tags. No Redis/search-engine index or query-history aggregation is added.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `SEARCH_FILTER_INVALID` | 400 | `errors.search.filterInvalid` |
| `SEARCH_LOCATION_REQUIRED` | 422 | `errors.search.locationRequired` |

Other malformed query values use `COMMON_VALIDATION_FAILED`; an empty result is a successful response with zero counts, not an error.

## Acceptance criteria

- Given a query matches several mapped target kinds, when results load, then each eligible kind appears in its own group with the Catalog explanation where available.
- Given Hindi `एसी`, Hinglish/typo `plumbr`, or `iPhone 15`, when the query is submitted, then the same mapping table resolves the expected product/shop/service targets without a language-specific code path.
- Given an unpublished product, unapproved business, or unapproved video matches, when counts and results are returned, then the private/ineligible item is excluded from both.
- Given services are filtered by multiple categories/subcategories, when a facet count is requested, then it uses the remaining active filters and the same predicate as the result set.
- Given an unknown filter key or unsupported sort value, when the request is made, then it fails with a stable validation error and performs no query using the raw value.
- Given the same filters are requested in Search and Explore, when either response is calculated, then results and counts are correct independently and neither request changes the other screen's state.
- Given no location is selected, when Home or Explore loads, then location-specific ordering is omitted and non-location discovery remains available.
- Given a user requests another user's saved/recent data, when Search is called, then no such data is returned; Search never accepts a user ID for personalized state.
- Given a scoped admin previews a draft mapping, when another area has matching rows, then neither its rows nor counts leak and the live mapping remains unchanged.
- Given minimum/maximum paise, directional sorts, a zero-count selected facet and price-on-enquiry services, when results are requested, then exact bounds/order/counts and deselection match the typed contract.
- Given category relations differ by direction, when a Home category initializes Explore, then it uses ordered `RELP`/`RELS` owner data rather than guessed reverse mappings.
- Given a location-dependent filter lacks context or a cursor belongs to another filter set, when requested, then an explicit error is returned rather than silently unfiltered results.
- Given a matching record lies beyond the first unfiltered owner page, when its filters are applied, then it still contributes to results/facets because predicates run before pagination.
- Given a city is disabled/coming soon, when public discovery runs even without a selected location, then its listings are excluded while existing order access remains with Orders.
- Given relevance/default Explore returns eligible businesses, products and services, when results are paged, then featured items precede non-featured items with deterministic secondary ordering and no duplicates.
- Given the user selects an explicit distance, price, rating or newest sort, when results are ordered, then that sort takes precedence over featured status while visibility, filters and geographic eligibility still apply.
- Given a product/service is selected but Premium entitlement is expired or unavailable, when results are queried, then its effective featured flag is false and no stale cursor/page cache preserves featured placement; a verified renewal restores featured ordering for still-selected eligible listings after cache invalidation.
- Given a business belongs to multiple product categories, when it matches one or several selected category predicates, then it appears and counts once.
- Given Home has dedicated and curated category sections, when public config changes or a selected category becomes inactive, then the current ordered configuration and only eligible category cards are returned.

## Verification

Implementation build evidence (2026-11-12): `pnpm --filter @apnatown/api db:generate`, `pnpm --filter @apnatown/shared build`, `pnpm --filter @apnatown/api build`, `pnpm --filter @apnatown/api api:openapi`, `pnpm --filter @apnatown/api-client client:generate`, and `pnpm --filter @apnatown/api-client build`. No runtime/Docker services, migrations, seeds, API/DB checks or automated tests were run. SQL execution/EXPLAIN performance, source-data ingestion, negative authorization/expiry/location/media runtime scenarios and independent security review remain verification gates, not passing evidence. Parent owns FE/inventory documentation and final audit/integration.

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Rules: query normalization and mapped target resolution for `एसी`, `plumbr`, and `iPhone 15`; filter allowlists; OR semantics; stable sort tie-breaks.
- Manual API/DB: facet counts equal the result predicate under combinations of filters; non-public listings/videos are excluded; keyset pagination has no duplicates.
- Negative/security: malformed/unknown namespaced filters and cursor mismatches are rejected; text/sorts remain parameterized; preview checks cover missing permission and a different area within the same city; no private records, raw queries or precise coordinates leak into logs/share links.
