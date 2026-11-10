# BE: search

Features: F-HM-001, F-HM-002, F-HM-005, F-HM-006, F-HM-007, F-HM-008, F-HM-009, F-HM-010, F-HM-011, F-HM-012, F-HM-013, F-HM-014, F-EX-001, F-EX-002, F-EX-003, F-EX-004, F-EX-005, F-EX-006, F-EX-007, F-EX-008, F-EX-009, F-EX-010, F-EX-011, F-EX-012, F-SR-001, F-SR-002, F-SR-003, F-SR-004, F-SR-005, F-SR-006, F-SR-007, F-SR-008, F-SR-009, F-SR-010 | Rules: BR-15, BR-18 | State machines: none | Depends on / used by: catalog, businesses, products, services, offers, media-videos, geo, reviews (read ports only) / public discovery screens

Frontend counterpart: [FE search](../fe/search.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Provide read-only Home discovery composition, Explore facets/results and grouped Search suggestions/results. Catalog owns taxonomy and keyword-mapping records; each listing, offer and video module remains the source of its public data. Search owns no source-of-truth tables and does not expose admin keyword-mapping writes (catalog owns AD15/SA8).

## Tables

None. Search reads owner-module application contracts and database read models; it must not write or duplicate their records.

## Endpoints

Discovery endpoints are public reads; the separate admin preview requires permission and scope. Resolve only approved/live public listings and approved videos; never expose drafts, private media or owner-only fields. Use shared typed query DTOs, parameterized queries, stable keyset cursors (default 20, maximum 50), and the shared error contract.

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/search/home` | Public; optional validated discovery context | → `{banners,nearbyShops,featuredBusinesses,popularBusinesses,featuredProducts,popularProviders,offers,promotions}` using owner DTOs; each bounded section has `{items,nextCursor?,state}`. Categories, local recent views, saved/header counts and footer content remain with their owners/client state | `COMMON_VALIDATION_FAILED`, `SEARCH_LOCATION_REQUIRED` | Yes | F-HM-002, F-HM-005–011, S-CUST-01 |
| GET | `/search/popular` | Public | → curated platform search terms; current prototype list is `AC`, `iPhone 15`, `DJ`, `tent`, `plumber`, `mobile repair`, `एसी` pending Q-56 | — | Yes | F-SR-005, F-SR-009, S-CUST-03 |
| GET | `/search/suggestions?q=` | Public; normalized non-empty query | → grouped suggestion DTOs: products, shops, services, categories, subcategories and related searches; each group is empty when there is no match | `COMMON_VALIDATION_FAILED` | Yes | F-SR-002–004, S-CUST-03 |
| GET | `/search` | Public; `SearchQuery` below | `tab=all\|products\|shops\|services\|videos`; → `DiscoveryResponse`. Empty query returns empty groups; recent terms are not sent | `SEARCH_FILTER_INVALID`, `SEARCH_LOCATION_REQUIRED`, `COMMON_VALIDATION_FAILED` | Yes | F-SR-001–010, S-CUST-03 |
| GET | `/explore` | Public; `ExploreQuery` below | `tab=products\|shops\|services`; → `DiscoveryResponse`, selected-tab facets and page-aligned shop/provider map pins | `SEARCH_FILTER_INVALID`, `SEARCH_LOCATION_REQUIRED`, `COMMON_VALIDATION_FAILED` | Yes | F-EX-001–012, S-CUST-02 |
| POST | `/search/admin/preview` | Admin `catalog:view` + assigned city/area, or super_admin; CSRF; no-store | `{tab,query?,categoryIds?,subcategoryIds?,mapping?:{canonicalTerm,synonyms,targets},cityId?,areaIds?,cursor?,limit?}` → same public projections/counts restricted to trusted scope plus `{appliedMapping,effectiveScope}` | `COMMON_FORBIDDEN`, `SEARCH_FILTER_INVALID`, `KEYWORD_TARGET_INVALID` | Read-only | F-AD-005, F-AD-015 |

`OffersDiscoveryPort.homePlacements({cityId?,areaId?,at})` supplies active, in-window hero/featured/local-promotion placements and typed target/asset/order data. Search only composes them; Q-60 no longer leaves banners ownerless. Products' explicit featured flag supplies eligible product cards; popularity/view rankings without an approved source remain `unavailable` under Q-57, never guessed analytics. Catalog owns cross-kind relations from `js23.js`; Geo, browser-local state and Engagement own location, recent views and saved counts.

### Complete query and result contract

Schemas live once in `packages/shared` for the generated API client and `useUrlState`; reject unknown keys and malformed numbers/booleans instead of silently ignoring them.

| Schema | Keys and values |
|---|---|
| Common | `tab`; `view=list\|map` (Explore only, map for shops/services); `sort` per tab below; opaque `cursor`; integer `limit=1..50`; optional public `cityId,areaId`; `contextCategory` is the removable Home category slug, separate from a tab's editable filters |
| Products | `category` and `subcategory` single slugs; `brand` exact facet value; `priceMinPaise,priceMaxPaise` nonnegative safe integers with min ≤ max; `rating=0\|3\|4\|4.5`; booleans `offers,inStock,deliversToMe,pickup,featured`; `distanceKm`; optional UUID `offerId`; `sort=relevance\|price_asc\|price_desc\|rating\|newest` |
| Shops | `category` single product-category slug; `distanceKm,rating`; booleans `openNow,deliversToMe,offers,verified,featured`; `sort=relevance\|distance\|rating\|newest` |
| Services | `category,subcategory` comma-separated unique slugs; `distanceKm,rating,priceMinPaise,priceMaxPaise`; booleans `priceOnEnquiry,availableToday,offers,verified`; `sort=relevance\|distance\|rating\|price_asc` |
| Search only | Trimmed `q` up to 200 characters; `tab` additionally `all\|videos`; Videos accepts only `sort=relevance`, no product/service price filters; All composes each group's independently typed filters |

Booleans serialize as `true|false`; absent/false means no boolean restriction. Distance 0/omitted means unrestricted; filter options are 1/3/5/10 km, with map radius 1..12 km (initial map control 6). Explicit distance sorting/filtering or `deliversToMe` without usable context returns `SEARCH_LOCATION_REQUIRED`; ordinary location-free discovery remains valid.

Precise location is ephemeral API request context: the shared client sends validated `X-Discovery-Latitude`/`X-Discovery-Longitude` headers together from active Geo state, never saved address IDs/coordinates in share links. These headers are redacted; location-dependent responses are private/no-store. Area-only selection can use Geo's known area centroid, labelled as an area rather than a fabricated GPS fix.

Active-tab filters use the unprefixed keys above; inactive filters use `products.`, `shops.` or `services.` prefixes and the same strict per-tab schemas. Namespace fields are permitted only for those named tabs, never arbitrary SQL fields. On tab switch, serialize the old active filters into its namespace and promote the destination values; unprefixed values win only for the active tab and duplicate active aliases are rejected. Preserve explicit empty category selections so reload cannot reapply a cleared filter. Search and Explore use independent URLs/stores; cursors reset only for the changed query/tab.

`contextCategory` initializes all tabs through Catalog's ordered relations: product kind selects the same category for Products/Shops and all `RELP` service targets; service kind selects itself for Services and the first `RELS` target for Products/Shops (`js23.js`), or leaves their category unrestricted when no target exists. Existing deep links without it still restore their active category/subcategory exactly. Removing the shared category clears category/subcategory across tabs, not other filters; per-tab Reset resets that tab only. A product context with no relation and no explicitly selected service category shows the prototype's no-related-services state, not all services.

`DiscoveryResponse` is `{tab,query,normalizedFilters,counts:{all?,products,shops,services,videos?},page:{items,nextCursor},groups?,facets,mapPins?,relatedCategories,mappingExplanation?}`. All uses at most four items per nonempty group plus the group's total and See-all target; selected tabs use keyset pages. Suggestions return named arrays `{products,shops,services,categories,subcategories,relatedSearches}` of `{id?,label,target}` with approved same-origin targets, up to three entity suggestions/group and two related terms as in `js23.js`.

Facets are `{categories,subcategories,brands?,priceRange?}`; each option has `{id,value,labelEn,labelHi,count,selected,disabled}` and subcategories also `categoryId`. Compute the option count with its own dimension removed but other filters retained, from the same database snapshot/predicate as page/counts. Disable unselected zero-count options, never prevent deselecting a selected zero-count option. Services count service rows, not expertise/provider joins. Map pins deduplicate business IDs on the same returned page; page further results without claiming all markers are loaded.

Selected service subcategories must exist; when categories are selected, they must belong to those categories. With no selected category, a valid subcategory selection across collapsed groups is still allowed and survives URL reload; do not silently discard it as the prototype's older parser does.

Owner inputs are `BusinessReadPort.publicProjection`, `ProductReadPort.publicProjection`, `ServiceReadPort.publicProjection`, Catalog taxonomy/mappings/relations, Offers active eligibility/placements and Media approved-video search projections. Reviews supplies published public rating aggregates; no private repository joins or extra source-of-truth tables. Products price filters/sorts use the current effective offer price; services use starting/fixed/range lower bounds, price-on-enquiry remains null in DTOs and sorts last. Match `js22.js` filter behavior: a positive minimum excludes enquiry pricing, a maximum alone does not; the enquiry-only toggle combined with a positive minimum can return zero.

Execution boundary: owners export read-only SQL projections with these public column contracts; Search's parameterized repository composes them in the same PostgreSQL read transaction. Apply all matching, eligibility, scope and facet predicates before counting/keyset limiting; never fetch an owner module's first page and then filter it in memory. Effective pricing/rating expressions come from their owning projections, not a second Search implementation of financial/review rules. Plain SQL views/query projections need no new persisted search index or event-driven read database.

Current prototype ordering is explicit, not an invented ranking algorithm: Explore Products = featured then distance; Shops = distance; Services = active offer then distance; Search relevance = matching groups then distance within applicable groups. Omit the distance key when location is absent, and append stable ID ties. Rating is descending published rating; price is directional; newest is `(createdAt DESC,id DESC)`. Bind cursors to normalized query/filter/sort/context and reject mismatched cursors. Home analytics popularity remains the separate Q-57 gate.

## Rules and use-cases

1. Validate query length/shape and every filter against shared Zod schemas; unknown keys, invalid slugs, unsupported sort fields and malformed coordinates fail validation. Do not interpolate query text or client-selected sort fields into SQL.
2. Resolve a query against Catalog's enabled keyword mappings and normalized synonyms, then perform PostgreSQL `unaccent`, `pg_trgm` and full-text matching over owner-module search projections. Return every matching target kind and an explanatory mapping label where configured.
3. Filter out unpublished/deleted listings, unapproved or suspended businesses, businesses in non-enabled cities, and non-approved videos before counting or returning new discovery results. Keep owner-specific visibility and media moderation decisions in their source modules; city disable does not cancel in-flight orders.
4. Explore and Search expose the same allow-listed product/shop/service filters; the current request's tab determines the filter schema. Search uses its own query state and never reads or mutates Explore state (BR-15).
5. Services use the service's single catalog subcategory. Category/subcategory multi-select uses OR logic; removing a category removes its selected subcategories. Counts are calculated from the same predicate/snapshot as results and recomputed against the other active filters (BR-08, BR-18).
6. Use only the per-tab sorts and exact comparison rules above. Price/rating/distance cursors encode their last ordered value plus ID; no offset-pagination or raw client SQL sort expression. Location is optional unless the user selects a location-dependent filter.
7. Map view uses the same filtered set as list view and only the public map projection for shops and service providers. Map/list is presentation state, not a second result query.
8. Home discovery reads data through the modules permitted in [architecture](../../_foundation/architecture.md). A location-specific `/search/home` response is private/no-store; location-free public sections may use ISR. Missing source data and unavailable integrations are distinct section states; Engagement bookmarks/recent/header counts are not recomputed by Search.
9. Admin preview uses the same public matching/facet engine after intersecting requested scope with trusted grants; an out-of-scope requested area is denied, not silently broadened. Unsaved mappings are validated with Catalog's target schema and applied to this preview only. Never return unpublished business/private media data just because the caller is an admin.

## Events and jobs

Search publishes no domain event and stores no raw query history. It consumes `catalog.taxonomy.changed`, `catalog.keyword_mapping.changed`, `business.profile.changed`, `business.application.decision_changed`, `geo.city.status_changed`, `geo.zone.changed`, `product.created`, `product.updated`, `product.deleted`, `product.published`, `inventory.changed`, `service.changed` and owner-defined offer/media/rating changes to invalidate affected public tags. No Redis/search-engine index or query-history aggregation is added.

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

## Tests

- Unit: query normalization and mapped target resolution for `एसी`, `plumbr`, and `iPhone 15`; filter allowlists; OR semantics; stable sort tie-breaks.
- Integration: facet counts equal the result predicate under combinations of filters; non-public listings/videos are excluded; keyset pagination has no duplicates.
- Negative/security: malformed/unknown namespaced filters and cursor mismatches are rejected; text/sorts remain parameterized; preview tests cover missing permission and a different area within the same city; no private records, raw queries or precise coordinates leak into logs/share links.
