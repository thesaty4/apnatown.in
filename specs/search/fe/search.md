# FE: search

Features: F-HM-001, F-HM-002, F-HM-005, F-HM-006, F-HM-007, F-HM-008, F-HM-009, F-HM-010, F-HM-011, F-HM-012, F-HM-013, F-HM-014, F-EX-001, F-EX-002, F-EX-003, F-EX-004, F-EX-005, F-EX-006, F-EX-007, F-EX-008, F-EX-009, F-EX-010, F-EX-011, F-EX-012, F-SR-001, F-SR-002, F-SR-003, F-SR-004, F-SR-005, F-SR-006, F-SR-007, F-SR-008, F-SR-009, F-SR-010 | Screens: S-CUST-01, S-CUST-02, S-CUST-03 | Flows: J1, J2

Backend contract: [BE search](../be/search.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

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
- Layout: sticky header with location, SearchBar, notification/cart badges and Videos link; responsive hero carousel; category tiles; offer, nearby-shop, featured/popular business/product/provider and promotion sections; recently viewed and saved shortcut. Desktop includes the specified footer; mobile uses the customer navigation.
- Data: `GET /search/home`, `GET /search/popular`, Catalog category reads, banner owner contract (unresolved Q-60), Settings legal content, Geo location, Offers and Engagement owner contracts. Recently viewed uses device-local state. Fetch location-specific discovery with `no-store`; cache only location-free public sections. Header badges and footer links are not Search-owned. Never fabricate featured/popular ranking; follow Q-57.
- Special states: location denied and outside-service-area banner; empty individual sections are omitted without collapsing unrelated sections. Voice input behavior remains open under Q-59; typed Search remains available.
- Interactions: category tiles open Explore with category state; offer cards follow their owner-provided target; “View all” links open the corresponding Explore tab/sort; search suggestions open `/search?q=...`; hero controls support keyboard, pause on hover/focus and reduced motion. Location is optional. Bookmark actions use Engagement and login return-to-origin where required (BR-21).
- Rules: F-HM-001, F-HM-002, F-HM-005–014; catalog owns F-HM-003/004; BR-11, BR-15, BR-21.
- Acceptance:
  - Given a customer denies location, when Home loads, then non-location sections remain usable and no precise location is persisted.
  - Given a category tile is selected, when navigation completes, then Explore opens with the category URL state and J1/J2 behavior.
  - Given a banner is focused or hovered, when the carousel would auto-advance, then it pauses; reduced-motion users are not forced to watch motion.
  - Given an offer, saved item, recent view, badge or footer link is rendered, when acted on, then the owning module handles it and Search does not duplicate its data.
  - Given English or Hindi and mobile/tablet/desktop are used, when Home renders, then text wraps without clipping and all controls meet the shared accessibility/token rules.

### S-CUST-02 — Explore

- Screenshots: `d-customer-explore.jpg`, `m-customer-explore.jpg`.
- Layout: Products/Shops/Services tabs with counts; category pill; mobile filter sheet, tablet filter bar and desktop sidebar; responsive result cards; list/map toggle. Reuse shared `ShopCard`, `ProductCard`, `ServiceCard`, `FilterPanel`, `ActiveFilterChips`, `MapView`, and the one `SubcategoryMultiSelect`.
- Data: `GET /explore`; filter option counts and results update from the same API contract. Public cards use owner-module fields; map pins include shops and service providers only.
- Special states: per-tab empty state with Clear category and suggested categories/counts; skeleton while facet counts update.
- Interactions: `tab`, `category`, comma-separated `subcategory` and the offer deep-link `offerId` use allow-listed URL state. Each tab retains its own namespace when switching. Use `useUrlState` and `useBackScroll`; Back restores the prior URL/filter/scroll state. Mobile sheet has sticky “Show N results”, Reset and Apply; desktop updates live. Copy-link copies the current URL. Selecting “Services” reuses the filter without forking it.
- Rules: F-EX-001–012, BR-15, BR-18. Service category/subcategory selection uses OR logic; removing a category removes its subcategories.
- Acceptance:
  - Given `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting`, when loaded or shared, then the same selected tab, filters and counts are restored.
  - Given filters are changed on one tab, when the customer switches tabs and back, then each tab's independent filters remain intact.
  - Given the customer applies a filter, when counts update, then each count reflects all other active filters and is announced accessibly.
  - Given the customer navigates away and presses Back, when Explore returns, then its prior filters and scroll position are restored.
  - Given a service filter is used on Explore, Search, or a service category page, when rendered, then the same `SubcategoryMultiSelect` behavior and long-Hindi layout are used.

### S-CUST-03 — Search

- Screenshots: `d-customer-search.jpg`, `m-customer-search.jpg`.
- Layout: SearchBar and grouped autocomplete; empty-query recent/popular chips; tabs All/Products/Shops/Services/Videos with counts; All tab grouped results and “See all”; product/shop/service filters and sort. Videos use approved media only.
- Data: `GET /search/suggestions`, `GET /search`, `GET /search/popular`; recent searches remain device-local per Q-55. Service filter reuses `SubcategoryMultiSelect`; product/shop/service cards are shared components.
- Special states: empty query with recent/popular; no results with related categories and popular terms; mapping explanation label (e.g. “Related services for AC”).
- Interactions: typing keeps draft input local; submit or suggestion selection updates `q` and Search's own URL/query-state store. Search filters never read or mutate Explore state. Keyboard arrows/Enter navigate suggestions; Esc closes only the topmost suggestion layer. Sort/filter values are allow-listed; all results use keyset “Load more”.
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
- Shared: `SearchBar`, `ShopCard`, `ProductCard`, `ServiceCard`, `OfferCard`, `CategoryTile`, `SearchResultGroup`, `FilterPanel`, `ActiveFilterChips`, `SubcategoryMultiSelect`, `MapView`, `useUrlState`, `useBackScroll`, and standard state components.

## i18n and analytics

- Key prefixes: `home.*`, `explore.*`, `search.*`; provide EN/HI for headings, filters, counts, sort labels, category explanations, validation, empty/error states, and accessibility labels.
- Analytics: `home.discovery_view` (Home visible), `search.query_submit` (submitted), `search.suggestion_select` (suggestion selected), `explore.filter_apply` (filter committed), `explore.view_toggle` (map/list changed). Do not send raw query text, precise coordinates, or personal data.

## Tests

- Component: Home section skeleton/empty/error behavior, carousel keyboard/reduced motion, grouped autocomplete announcements, filter count updates, long Hindi, dark theme and no-result actions.
- Journey: J1 category → Explore → product; J2 services category → Explore Services → filters; direct URL + browser Back/scroll restore; Search ↔ Explore state isolation; keyboard search and filter flow.
