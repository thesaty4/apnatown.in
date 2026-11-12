# FE: search

Features: F-HM-001, F-HM-002, F-HM-005, F-HM-006, F-HM-007, F-HM-008, F-HM-009, F-HM-010, F-HM-011, F-HM-012, F-HM-013, F-HM-014, F-EX-001, F-EX-002, F-EX-003, F-EX-004, F-EX-005, F-EX-006, F-EX-007, F-EX-008, F-EX-009, F-EX-010, F-EX-011, F-EX-012, F-SR-001, F-SR-002, F-SR-003, F-SR-004, F-SR-005, F-SR-006, F-SR-007, F-SR-008, F-SR-009, F-SR-010 | Screens: S-CUST-01, S-CUST-02, S-CUST-03 | Flows: J1, J2

Backend contract: [BE search](../be/search.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

Explore maps and media cards reuse the
[media/map contract](../../_foundation/media-and-maps.md); no second map
library, geocoding service or direct image-storage URL. Tile failure retains
the same Search-owned results/list rather than replacing them with empty data.

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/` | S-CUST-01 | ISR; revalidate public discovery tags from owning modules | Public | Index; shared Home metadata/JSON-LD |
| `/explore` | S-CUST-02 | SSR; results/facets derive from URL and optional location | Public | `noindex,follow`; no canonicalization of filter combinations |
| `/search?q=` | S-CUST-03 | SSR; query and filter state derive from URL | Public | `noindex,follow` |

Standard default, skeleton, empty, error+retry, offline and no-permission behavior is defined in [frontend-shared.md](../../_foundation/frontend-shared.md). Match the named screenshots and design tokens; provide English/Hindi parity and text/icon status in addition to color.

## Screens

### S-CUST-01 — Home

- Screenshots: `d-customer-home.jpg`, `m-customer-home.jpg`.
- Layout: sticky header with location, SearchBar, notification/cart badges and Videos link; responsive hero carousel; category tiles; dedicated category sections; curated category-pill sections; offer, nearby-shop, featured/popular business/product/provider and promotion sections; recently viewed and saved shortcut. Desktop includes the specified footer; mobile uses the customer navigation.
- Data: `GET /search/home` composes Catalog-owned homepage sections, Offers-owned banners/placements and owner public cards; `GET /search/popular`, Catalog categories, Settings legal content, Geo and Engagement supply their own data. Recently viewed uses device-local state. Fetch location-specific discovery with `no-store`; cache only location-free sections. Header badges/footer links remain with their owners. Unavailable Q-57 popularity data is not a fabricated zero or sample ranking.
- Special states: location denied and outside-service-area banner; empty individual sections are omitted without collapsing unrelated sections. Voice input behavior remains open under Q-59; typed Search remains available.
- Interactions: category tiles open Explore with category state; offer cards follow their owner-provided target; “View all” links open the corresponding Explore tab/sort; search suggestions open `/search?q=...`; hero controls support keyboard, pause on hover/focus and reduced motion. Location is optional. Bookmark actions use Engagement and login return-to-origin where required (BR-21).
- Homepage category sections: dedicated sections use the localized category heading/supporting text and all eligible active subcategories. Curated sections show localized heading/supporting text and ordered category pills of one kind; initial selection is the configured active category. Switching pills updates only the section's cards, not Explore/Search URL or shared filters; reload returns to configured initial selection. Subcategory cards use category-owned images and link to Explore with the matching category/subcategory.
- Rules: F-HM-001, F-HM-002, F-HM-005–014; catalog owns F-HM-003/004; BR-11, BR-15, BR-21.
- Acceptance:
  - Given a customer denies location, when Home loads, then non-location sections remain usable and no precise location is persisted.
  - Given a category tile is selected, when navigation completes, then Explore opens with the category URL state and J1/J2 behavior.
  - Given a banner is focused or hovered, when the carousel would auto-advance, then it pauses; reduced-motion users are not forced to watch motion.
  - Given a curated section is opened, when it renders, then the configured eligible initial pill is selected; switching pills updates only that section and keyboard state is announced.
  - Given a configured section or all its subcategories become unavailable, when Home reloads, then the section is omitted and no inactive destination is exposed.
  - Given an offer, saved item, recent view, badge or footer link is rendered, when acted on, then the owning module handles it and Search does not duplicate its data.
  - Given English or Hindi and mobile/tablet/desktop are used, when Home renders, then text wraps without clipping and all controls meet the shared accessibility/token rules.

### S-CUST-02 — Explore

The full Explore implementation supersedes the earlier businesses-only slice
(D-11). Products, Shops and individual Services now use owner-owned public
read projections through `GET /explore`. Prices, inventory, ratings, offers,
featured status, public contacts and location eligibility are server-derived;
missing records are not replaced with sample listings or fabricated signals.
See the [BE implementation status](../be/search.md#endpoints).

The first result page is a no-store SSR read hydrated into React Query.
Subsequent tab/filter changes use Next's native-history URL integration and
the typed API client, without re-running that initial server read. Inactive
tab namespaces preserve explicit defaults as well as selections, so clearing
a category survives a round trip through another tab. Unsupported, duplicate
or malformed URL filters display a resettable error, never broader results.
Explore is `noindex,follow` with no canonical for filter combinations.

Back/Forward restores URL state and ephemeral per-URL scroll positions after
results load. On return, cached Load-more pages are not overwritten by an SSR
first page; scroll history is bounded to 50 URLs and not persisted to storage.
Category reads, pagination and clipboard failures are explicit and retryable;
tab keys include arrows, Home and End. Invalid/expired cursors restart the
query rather than repeatedly submitting the rejected cursor.

`ExploreFilterPanel` implements tab-specific filters and sorts; reusable
`ServiceCategoryFilter` implements grouped, counted OR multi-select. Mobile
uses a draft sheet with sticky result-count Apply, Cancel and Reset; desktop
commits live, and the smaller-screen filter bar shows the active count.
Without selected categories, eligible subcategory groups are collapsed;
selected groups remain visible/open, including zero-count removable selections.
Group eligibility uses subcategory facet counts (excluding the current
subcategory restriction), so selecting one group does not hide other groups.
Choosing the first category narrows category-free selections to its children,
avoiding a request that pairs a selected category with another parent's child.
Canonical subcategory values are `categorySlug/subcategorySlug`, because slugs
are unique only within a category. Legacy bare-slug links normalize only when
unambiguous in their category context; chips include the parent label. Draft
controls adopt normalized values only for their current response, not stale
preview data.
`ExploreFilterChips` and empty-state suggestions use actual server facets.
`ExploreResults` supplies the same component on Explore, `/search` and
category/subcategory routes with independent query families.

`ExploreCards` matches the reference product pricing/MRP/discount/stock badges
and shop/service contact actions. Service Save uses Engagement's account-scoped
batch state and CSRF-protected bookmark mutations, including login return-to-origin
and Saved Services. WhatsApp uses the business's explicitly public contact.
Card links open real `/product/:slug`, `/service/:slug`, `/shop/:slug` and
`/provider/:slug` read pages. These are minimal owner detail destinations:
checkout, owner managers and the full PD/PF/SV flows are not claimed complete.

`ExploreMap` uses the shared lazy Leaflet `MapView`, authorized public business
pins, keyboard-accessible pin buttons, Directions and list fallback on tile
failure. All tabs support Map; Products deduplicates owning shops (prototype
`js16.js`), not invented product coordinates. Pins cover loaded result pages.
With a usable GPS point or selected area, radius defaults to 6 km and is
adjustable from 1 to 12 km. Radius constrains server results/counts; clearing
it or resetting filters returns to List. Precise coordinates remain only in
memory and request headers, never URL, storage or query keys.

Verification (2026-11-12): Prisma generation; shared, API, API-client and UI
builds; OpenAPI/client generation and API/client generated checks passed.
The final integrated command
`APP_ENV=local APP_BASE_URL=http://localhost:3000 API_INTERNAL_ORIGIN=http://localhost:3001 pnpm --dir apps/web build`
and targeted frontend ESLint passed. Security-auditor re-review returned PASS
after image GET/HEAD budgeting, bounded provider downloads and metadata-only
authorized HEAD/304 handling; service bookmarks/export/erasure were included.
`pnpm --dir packages/ui check:generated`, `pnpm --dir apps/web check:generated`,
`pnpm --dir apps/api check:generated` and
`pnpm --dir packages/api-client check:generated` passed. Documentation validation
still reports the 93-error baseline: missing instruction links and the existing
backend-instruction size overage. The changed integration instruction remains
within its 4,000-character budget.
No migrations/seeds, runtime services, browser/API/DB checks or automated
test files were executed/created.

Deferred runtime acceptance:
- Migrate an isolated database and verify real source eligibility, offer/feature
  time boundaries, paise/stock badges, IST opening hours, facet counts and all
  sorts; secondary memberships must not duplicate rows.
- Verify equal-sort pagination, expiry/tampered/filter-bound cursors, refresh
  after source eligibility changes, and query performance at realistic scale.
- Change/clear a category, switch tabs and return, then navigate away and Back:
  filters, cached pages and scroll survive; cancelled mobile drafts do not apply.
- With both Mechanic and Electrician selected, independently toggle each
  `appliance-repair` subcategory, Select all/Clear its group and remove its
  parent; the other category's selection/counts must remain independent.
  Without categories, expand a group and select a subcategory directly, then
  add a second group's subcategory without losing that group's controls.
- Verify optional/denied GPS, selected-area distance, radius/count/pin parity,
  tile retry/attribution, deduplicated Products pins and provider Directions.
- Verify guest login return, account switching, CSRF/role negatives, bookmark
  retries, unavailable Saved removal, export/erasure and image throttling.
- Check EN/HI, mobile/tablet/desktop, light/dark, keyboard/focus, clipboard,
  pending/offline/error states and stale-response races with actual services.

- Screenshots: `d-customer-explore.jpg`, `m-customer-explore.jpg`.
- Layout: Products/Shops/Services tabs with counts; category pill; mobile filter sheet, tablet filter bar and desktop sidebar; responsive result cards; list/map toggle. Reuse shared `ShopCard`, `ProductCard`, `ServiceCard`, `FilterPanel`, `ActiveFilterChips`, `MapView`, and the one `SubcategoryMultiSelect`.
- Data: `GET /explore`; filter option counts and results update from the same API contract. Public cards use owner-module fields; map pins include shops and service providers only.
- Special states: per-tab empty state with Clear category and suggested categories/counts; skeleton while facet counts update.
- Interactions: use the exact typed query/namespace contract in [BE Search](../be/search.md), including both price directions, brand/stock/delivery/pickup, verified/featured and enquiry/availability controls. Services Explore subcategories use the shared `SubcategoryMultiSelect` rendered as token-based selectable pills, preserving real checkbox semantics, OR multi-select, counts, selected/disabled state and clear actions. Active filters retain the reference's unprefixed URL; inactive tabs use `products.`, `shops.`, `services.`. `contextCategory` preserves the shared Home pill/related-category initialization; per-tab Reset differs from Clear shared category. `useUrlState`/`useBackScroll` restore URL/filter/scroll; Copy link excludes private location headers. Mobile sheet has draft-only controls and sticky “Show N results”, Reset/Apply; cancel discards drafts; desktop commits live without one history entry per slider pixel.
- Featured cards: effective featured results render the shared `FeaturedBadge` with visible EN/HI text plus an icon; do not rely on color alone. Apply only to active featured businesses/products/services returned by their owner projections.
- Rules: F-EX-001–012, BR-15, BR-18. Service category/subcategory selection uses OR logic; removing a category removes its subcategories.
- Acceptance:
  - Given `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting`, when loaded or shared, then the same selected tab, filters and counts are restored.
  - Given filters are changed on one tab, when the customer switches tabs and back, then each tab's independent filters remain intact.
  - Given the customer applies a filter, when counts update, then each count reflects all other active filters and is announced accessibly.
  - Given the customer navigates away and presses Back, when Explore returns, then its prior filters and scroll position are restored.
  - Given a service filter is used on Explore, Search, or a service category page, when rendered, then the same `SubcategoryMultiSelect` behavior and long-Hindi layout are used.
  - Given more than eight subcategories exist, when the filter opens, then inner search and Show more are available; grouped headings, Select all/Clear per group, collapsed unselected groups and selected chips use the same component everywhere.
  - Given an unselected option has zero results, when facets refresh, then it is disabled; a selected zero-count option remains removable. Removing a category removes its selected subcategories.
  - Given a service subcategory filter is rendered, when the customer uses keyboard or touch, then each pill exposes native checkbox checked/disabled semantics, visible focus, localized label and count; changing its visual style does not change URL, count, Back or scroll behavior.
  - Given featured and non-featured results match relevance, when returned, then featured appears first with a text-labelled badge; an explicit sort instead follows its selected order.
  - Given a slower response belongs to a previous URL/draft, when it arrives, then it cannot overwrite current cards/counts; responses are keyed by normalized filters and stale requests are cancelled/ignored explicitly.
  - Given no location is available, when Distance/Delivers-to-me is selected, then the Geo picker explains the requirement while ordinary browsing still works; never invent a pin or silently ignore the filter.

### S-CUST-03 — Search

Current delivery reuses Explore's real Products/Shops/Services results and
filters under an independent Search query family, satisfying EX12 reuse.
The separate All/Videos, autocomplete, popular/recent and grouped Search
requirements below remain pending; this is not full SR1–SR10 delivery.

- Screenshots: `d-customer-search.jpg`, `m-customer-search.jpg`.
- Layout: SearchBar and grouped autocomplete; empty-query recent/popular chips; tabs All/Products/Shops/Services/Videos with counts; All tab grouped results and “See all”; product/shop/service filters and sort. Videos use approved media only.
- Data: `GET /search/suggestions`, `GET /search`, `GET /search/popular`; recent searches remain device-local per Q-55. Service filter reuses `SubcategoryMultiSelect`; product/shop/service cards are shared components.
- Special states: empty query with recent/popular; no results with related categories and popular terms; mapping explanation label (e.g. “Related services for AC”).
- Interactions: typing keeps draft input local; submit or suggestion selection updates `q` and Search's independent URL/query-state store. Reuse typed per-tab filters and namespace serialization, not Explore state. All shows four items per group and See all; selected tabs use keyset Load more. Keyboard arrows/Enter navigate suggestions; Esc closes only the topmost suggestion layer. Unsupported per-tab sort controls are not submitted.
- Rules: F-SR-001–010, F-EX-012, BR-15, BR-18. Autocomplete groups are Products, Shops, Services, Categories, Subcategories and Related searches.
- Acceptance:
  - Given `एसी`, `plumbr`, or `iPhone 15` is entered, when suggestions/results load, then mapped target groups and localized labels appear without a separate per-language branch.
  - Given an empty query, when Search opens, then recent and popular chips appear; selecting one submits that term.
  - Given no result matches, when the results tab is opened, then related categories and popular terms offer a clear next action.
  - Given a service filter is changed in Search, when Explore is opened, then Explore's filters remain unchanged, and vice versa.
  - Given keyboard-only or screen-reader navigation is used, when autocomplete and tabs are operated, then focus, selected state, counts and Escape behavior are announced and usable.
  - Given Hindi or dark mode is active, when results, filters and empty states render, then copy uses translation keys and token-driven styles without clipping.

## Feature components and shared components

- Feature-local: `HomeDiscoverySections`, `ExploreResults`, `SearchResults`, `GroupedAutocomplete`; no duplicate card, filter, map or state-view component.
- Shared: `SearchBar`, `ShopCard`, `ProductCard`, `ServiceCard`, `OfferCard`, `CategoryTile`, `FeaturedBadge`, `SearchResultGroup`, `FilterPanel`, `ActiveFilterChips`, `SubcategoryMultiSelect`, `MapView`, `useUrlState`, `useBackScroll`, and standard state components.

## i18n and analytics

- Key prefixes: `home.*`, `explore.*`, `search.*`; provide EN/HI for headings, filters, counts, sort labels, category explanations, validation, empty/error states, and accessibility labels.
- Analytics: `home.discovery_view` (Home visible), `search.query_submit` (submitted), `search.suggestion_select` (suggestion selected), `explore.filter_apply` (filter committed), `explore.view_toggle` (map/list changed). Do not send raw query text, precise coordinates, or personal data.

## Verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Manual UI: Home section skeleton/empty/error behavior, carousel keyboard/reduced motion, grouped autocomplete announcements, filter count updates, long Hindi, dark theme and no-result actions.
- Journey: J1 category → Explore → product; J2 services category → Explore Services → filters; direct URL + browser Back/scroll restore; Search ↔ Explore state isolation; keyboard search and filter flow.
