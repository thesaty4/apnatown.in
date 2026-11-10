# FE: catalog

Features: F-HM-003, F-HM-004, F-SV-008, F-VD-006, F-AD-005, F-AD-006, F-AD-015, F-SA-008 | Screens: S-CUST-01, S-CUST-04, S-CUST-05, S-VEND-05, S-VEND-13, S-ADMN-05, S-ADMN-06, S-ADMN-15 | Flows: J1, J2, J9

Backend contract: [BE catalog](../be/catalog.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/` (category tiles only) | S-CUST-01 | ISR; category data tagged for revalidation | Public | Existing home SEO policy |
| `/services` | S-CUST-04 | ISR; public category content and featured results | Public | Index |
| `/category/[slug]` | S-CUST-05 | ISR; category metadata and result list are server-rendered | Public | Index category landing pages; canonical, EN/HI alternates |
| `/vendor/products` (suggestion sheet) | S-VEND-05 | SSR shell; suggestion form is a client island | Vendor, own business | Noindex |
| `/vendor/services` (taxonomy selector contract) | S-VEND-13 | SSR shell; service form is owned by `services` | Vendor, own business | Noindex |
| `/admin/categories` | S-ADMN-05 | SSR; authenticated tree and scoped preview | Admin with `catalog:view`; super admin | Noindex |
| `/admin/subcategory-suggestions` | S-ADMN-06 | SSR queue with client decision sheets | Admin with scoped `catalog:view/edit`; super admin | Noindex |
| `/admin/keywords` | S-ADMN-15 | SSR list with client editor/preview | Admin with `catalog:view`; super admin (writes super-admin-only pending Q-39) | Noindex |

## Screens

### S-CUST-01 — Home category entry points

- Screenshots: `d-customer-home.jpg`, `m-customer-home.jpg`.
- Layout: shared `CategoryTile` grids in the home content; mobile-first, tablet and desktop columns match the home screenshots/design system.
- Data: `GET /catalog/categories?kind=product` and `GET /catalog/categories?kind=service`; home layout/results are owned by `search`.
- Special states: no active categories hides only the empty tile group; do not show inactive categories.
- Interactions: product tile opens `/explore?tab=products&category={slug}`; service tile opens `/explore?tab=services&category={slug}`; preserve URL state and Back behavior.
- Rules: F-HM-003/004, BR-15.
- Acceptance:
  - Given an active product or service category, when its tile is selected, then it opens Explore with the matching category in the URL.
  - Given a category is inactive, when home loads, then it is absent from the selectable tile groups.
  - Given Hindi or dark mode, when tiles render at mobile/tablet/desktop sizes, then localized labels wrap and use design tokens.

### S-CUST-04 — Services home

- Screenshots: `d-customer-services.jpg`, `m-customer-services.jpg`.
- Layout: category grid and featured-provider sections; category cards use shared `CategoryTile`.
- Data: catalog categories plus search-owned featured providers.
- Special states: empty category group.
- Interactions: category opens Explore Services with its category in the URL; keyboard users can activate each tile.
- Rules: F-HM-004, BR-15, BR-18.
- Acceptance:
  - Given an active service category, when selected, then Explore Services opens with the matching category.
  - Given no active service categories, when rendered, then the shared empty state offers the Explore action.
  - Given keyboard focus, when a category tile is activated, then it navigates without requiring pointer input.

### S-CUST-05 — Category page

- Screenshots: `d-customer-cat-grocery.jpg`, `d-customer-cat-wedding.jpg`, `m-customer-cat-grocery.jpg`, `m-customer-cat-wedding.jpg`.
- Layout: mobile stacks category header/results and uses the shared filter sheet; tablet uses the shared horizontal filter bar; desktop pairs the category header/results with the filter panel. Services reuse `SubcategoryMultiSelect`.
- Data: category DTO from catalog; products/shops/services and facet counts from `search`; ISR tags revalidate on taxonomy change.
- Special states: empty category, no matching active subcategory.
- Interactions: service filters update URL params; Back restores filters and scroll; CTA opens Explore with the same category.
- Rules: F-X-010, BR-15, BR-18; filter combinations remain `noindex`.
- Acceptance:
  - Given an indexable category landing page, when crawled, then canonical/metadata/JSON-LD and EN/HI alternates match the shared SEO contract.
  - Given a filter combination, when the URL changes, then it remains `noindex` and Back restores filters and scroll.
  - Given Hindi or dark mode, when filters render, then labels wrap and remain token-based.

### S-VEND-05 — Products and subcategory suggestion

- Screenshots: `d-vendor-vproducts.jpg`, `m-vendor-vproducts.jpg`.
- Layout: mobile opens the shared bottom `Sheet`; desktop uses the shared responsive sheet; use `Select`, `Input` (including textarea), `Button` and a localized duplicate-warning panel.
- Data: `POST /catalog/subcategory-suggestions/duplicate-check` while editing; `POST /catalog/subcategory-suggestions` on confirmed submit; `GET /catalog/me/subcategory-suggestions`; category options from `GET /catalog/categories`.
- Special states: exact duplicate blocks submit; fuzzy match offers “Suggest anyway”; history shows pending/approved/rejected/merged and rejection reason.
- Interactions: default category comes from the owner's trusted business context; allow choosing another category; Esc closes the sheet, focus returns to its trigger.
- Rules: F-VD-006, BR-07, BR-12, ST-subcategory-suggestion.
- Acceptance:
  - Given an exact duplicate, when entered, then submit is unavailable and the existing subcategory is identified.
  - Given a fuzzy match, when the user confirms “Suggest anyway”, then the suggestion is sent once.
  - Given another owner's business, when its suggestion history is requested, then no rows are exposed.
- Reuse this suggestion contract on the provider product screen when present; `products` owns that screen's full specification.

### S-VEND-13 — Service subcategory selector contract

- Screenshots: `d-vendor-vservices.jpg`, `m-vendor-vservices.jpg`.
- Full service-manager layout is specified by `services`; catalog supplies the active service subcategory options only.
- Data: `GET /catalog/categories?kind=service`; service create/update is owned by `services`.
- Rules: F-SV-008, BR-08. Every service selects exactly one active subcategory; provider expertise multi-select remains separate.
- Acceptance:
  - Given a service editor, when saved without exactly one active service subcategory, then the service API rejects it.
  - Given a valid service subcategory, when selected, then the service saves its one subcategory ID.
  - Given provider expertise selections, when saved, then the service subcategory selector does not alter that separate list.

### S-ADMN-05 — Categories

- Screenshots: `d-admin-acats.jpg`, `m-admin-acats.jpg`.
- Layout: mobile uses stacked tree/cards; tablet and desktop use the shared tree/preview regions and `DataTable`; main categories are visibly fixed for area admins.
- Data: `GET /catalog/admin/categories`; filter preview uses `POST /search/admin/preview` with selected taxonomy IDs and the permitted scope; edits follow BE role constraints.
- Special states: no permission; empty subcategory tree; duplicate warning; preview with no results.
- Interactions: expand/collapse category; preview filter; add/edit is available only to super admin pending Q-39; area admins use the suggestion queue.
- Rules: F-AD-005/F-SA-008, BR-07, BR-12; no destructive category delete.
- Acceptance:
  - Given an area admin, when opening the tree, then global categories are read-only and scope is enforced on preview.
  - Given a super admin, when saving a category, then validation/version conflicts are localized without losing form values.
  - Given a category with subcategories, when previewed, then the search-owned preview reflects the selected taxonomy.

### S-ADMN-06 — Subcategory suggestions

- Screenshots: `d-admin-asubs.jpg`, `m-admin-asubs.jpg`.
- Layout: mobile uses labelled cards and stacked status tabs; tablet/desktop use `DataTable`, `Tabs`, `StatusBadge`, `Sheet`, `ConfirmDialog`.
- Data: scoped `GET /catalog/admin/subcategory-suggestions`; decision endpoint from BE; decision changes refresh the active queue and badge counts.
- Special states: empty per status; duplicate candidates; rejection reason required; merge target picker limited to active siblings; approval requires reviewed Hindi text when the suggestion omitted it.
- Interactions: status tabs are keyboard-operable; decision dialog traps focus and closes on Esc; never recolour status without text/icon.
- Rules: ST-subcategory-suggestion, BR-07, BR-12, BR-22.
- Acceptance:
  - Given an out-of-scope item, when an admin deep-links to it, then no-permission state replaces the action controls.
  - Given a rejection, when the reason is blank, then submit is blocked and a localized field error appears.
  - Given a merge, when a valid target is selected, then the item moves to Merged and shows the target.
  - Given a suggestion lacks Hindi, when Approve opens, then the reviewer must provide `approvalNameHi`; an untranslated/null taxonomy row is never silently published.

### S-ADMN-15 — Search keywords

- Screenshots: `d-admin-akeys.jpg`, `m-admin-akeys.jpg`.
- Layout: mobile uses mapping cards and a responsive `Sheet`; tablet/desktop use `DataTable` with target chips and a live preview panel.
- Data: catalog keyword mapping list/write APIs; `POST /search/admin/preview` accepts the unsaved typed mapping and returns scoped product/shop/service/video groups without publishing it.
- Special states: no mappings; no preview results; duplicate synonym; no permission for writes.
- Interactions: search terms and targets are editable by super admin; preview before save; delete requires confirmation; EN/HI/Hinglish variants share one mapping.
- Rules: F-AD-015, F-SA-008, BR-12.
- Acceptance:
  - Given a Hindi or Hinglish synonym, when previewed, then the same target groups appear as for the canonical term.
  - Given a preview with no results, when rendered, then the empty state explains that no matching groups were found.
  - Given an area admin, when attempting a global write, then the UI explains the current permission boundary instead of implying success.

## Components and i18n

- Feature-only: `SubcategorySuggestionSheet`, `DuplicateMatchPanel`, `KeywordTargetEditor`.
- Shared: `CategoryTile`, `SubcategoryMultiSelect`, `FilterPanel`, `Breadcrumbs`, `Sheet`, `DataTable`, `Tabs`, `StatusBadge`, `Input`, `Select`, `Button`, `ConfirmDialog`, standard state views.
- Keys: `catalog.categories.*`, `catalog.subcategorySuggestion.*`, `catalog.admin.suggestions.*`, `catalog.admin.keywords.*`; all visible copy EN/HI, with long Hindi labels wrapping.
- Analytics: no new events until the shared event plan in Q-11 is approved.

## Tests

Component: category selection, exact/fuzzy duplicate states, queue decisions, target editor keyboard/RTL-independent Hindi wrapping. E2E: J1/J2 category navigation and J9 suggestion-to-decision; test denied scope, permission state, light/dark, mobile/desktop.
