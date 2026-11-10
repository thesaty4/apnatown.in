# BE: search

Features: F-HM-001, F-HM-002, F-HM-005, F-HM-006, F-HM-007, F-HM-008, F-HM-009, F-HM-010, F-HM-011, F-HM-012, F-HM-013, F-HM-014, F-EX-001, F-EX-002, F-EX-003, F-EX-004, F-EX-005, F-EX-006, F-EX-007, F-EX-008, F-EX-009, F-EX-010, F-EX-011, F-EX-012, F-SR-001, F-SR-002, F-SR-003, F-SR-004, F-SR-005, F-SR-006, F-SR-007, F-SR-008, F-SR-009, F-SR-010 | Rules: BR-15, BR-18 | State machines: none | Depends on / used by: catalog, businesses, products, services, offers, media-videos / public discovery screens

Frontend counterpart: [FE search](../fe/search.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Provide read-only Home discovery composition, Explore facets/results and grouped Search suggestions/results. Catalog owns taxonomy and keyword-mapping records; each listing, offer and video module remains the source of its public data. Search owns no source-of-truth tables and does not expose admin keyword-mapping writes (catalog owns AD15/SA8).

## Tables

None. Search reads owner-module application contracts and database read models; it must not write or duplicate their records.

## Endpoints

All endpoints are public reads. Resolve only approved/live public listings and approved videos; never expose drafts, private media or owner-only fields. Use typed, allow-listed query DTOs, parameterized queries, stable keyset cursors (default 20, maximum 50), and the shared error contract.

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/search/home` | Public; optional selected `areaId` or valid `lat`/`lng` discovery context | → public discovery sections: nearby shops, business/provider/product placements, active offers and local promotions; each item uses its owner-module public DTO. Categories, banners, local recent views, saved counts, header badges and footer content are read from their owning modules/client state, not copied here. | `COMMON_VALIDATION_FAILED` | Yes | F-HM-005–011, S-CUST-01 |
| GET | `/search/popular` | Public | → curated platform search terms; current prototype list is `AC`, `iPhone 15`, `DJ`, `tent`, `plumber`, `mobile repair`, `एसी` pending Q-56 | — | Yes | F-SR-005, F-SR-009, S-CUST-03 |
| GET | `/search/suggestions?q=` | Public; normalized non-empty query | → grouped suggestion DTOs: products, shops, services, categories, subcategories and related searches; each group is empty when there is no match | `COMMON_VALIDATION_FAILED` | Yes | F-SR-002–004, S-CUST-03 |
| GET | `/search?q=&tab=&filters...&sort=&cursor=&limit=` | Public; allow-listed tab/filter/sort values | `tab=all|products|shops|services|videos`; → per-tab counts, grouped first-page results, and selected-tab keyset page. Empty query returns no result groups; recent terms are device-local and not sent to this API. | `SEARCH_FILTER_INVALID`, `COMMON_VALIDATION_FAILED` | Yes | F-SR-001–010, S-CUST-03 |
| GET | `/explore?tab=&category=&subcategory=&offerId=&filters...&sort=&view=&cursor=&limit=` | Public; allow-listed tab/filter/sort/view values | `tab=products|shops|services`; comma-separated taxonomy slugs; optional `offerId` narrows Products to that offer's eligible targets; → result page, counts for all tabs and each filter option, optional map-pin projection for shops/service providers | `SEARCH_FILTER_INVALID`, `COMMON_VALIDATION_FAILED` | Yes | F-EX-001–012, S-CUST-02 |

`/search/home` does not return hero-banner configuration, location, recent views or bookmarks: banner ownership is open in Q-60; location, local recent views and saved counts use Geo, browser-local state and Engagement respectively. Popular/featured ranking sources and cross-kind category relations remain open in Q-57/Q-58; do not infer a ranking or add Search-owned taxonomy. Search maps only published Catalog keyword mappings to all matching target kinds, then composes eligible Products, Shops, Services and approved Videos. Hindi/Hinglish and typo matching uses the same normalized mapping terms (e.g. `एसी`, `plumbr`, `iPhone 15`), not language-specific branches.

## Rules and use-cases

1. Validate query length/shape and every filter against shared Zod schemas; unknown keys, invalid slugs, unsupported sort fields and malformed coordinates fail validation. Do not interpolate query text or client-selected sort fields into SQL.
2. Resolve a query against Catalog's enabled keyword mappings and normalized synonyms, then perform PostgreSQL `unaccent`, `pg_trgm` and full-text matching over owner-module search projections. Return every matching target kind and an explanatory mapping label where configured.
3. Filter out unpublished/deleted listings, unapproved or suspended businesses, and non-approved videos before counting or returning results. Keep owner-specific visibility and media moderation decisions in their source modules.
4. Explore and Search expose the same allow-listed product/shop/service filters; the current request's tab determines the filter schema. Search uses its own query state and never reads or mutates Explore state (BR-15).
5. Services use the service's single catalog subcategory. Category/subcategory multi-select uses OR logic; removing a category removes its selected subcategories. Counts are calculated from the same predicate/snapshot as results and recomputed against the other active filters (BR-08, BR-18).
6. Allow-listed sorts are relevance, distance, rating, price (where meaningful) and newest; use a stable ID tie-breaker. Distance requires optional location context; location remains optional. Money filters use integer paise.
7. Map view uses the same filtered set as list view and only the public map projection for shops and service providers. Map/list is presentation state, not a second result query.
8. Home discovery reads data through the modules permitted in [architecture](../../_foundation/architecture.md). A location-specific `/search/home` response is private/no-store; location-free public sections may use ISR. Banner ownership is unresolved in Q-60; Engagement bookmarks, recent views and user-specific header counts are not persisted or recomputed by Search.

## Events and jobs

None. Search is synchronous and read-only; no query-history event is emitted. Recent-search persistence and popularity aggregation are unresolved under Q-55/Q-56.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `SEARCH_FILTER_INVALID` | 400 | `errors.search.filterInvalid` |

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

## Tests

- Unit: query normalization and mapped target resolution for `एसी`, `plumbr`, and `iPhone 15`; filter allowlists; OR semantics; stable sort tie-breaks.
- Integration: facet counts equal the result predicate under combinations of filters; non-public listings/videos are excluded; keyset pagination has no duplicates.
- Negative/security: malformed filters are rejected; user text and sort values remain parameterized; Search cannot expose private or personalized records. No authenticated Search endpoint exists, so role-specific authorization is owned and tested by the source modules.
