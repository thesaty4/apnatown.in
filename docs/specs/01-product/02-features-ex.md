# EX — Explore feature specification

## Contents

- [F-EX-001 — Explore tabs with counts](#f-ex-001--explore-tabs-with-counts)
- [F-EX-002 — Category pill pre-applied](#f-ex-002--category-pill-pre-applied)
- [F-EX-003 — Per-tab filters remembered](#f-ex-003--per-tab-filters-remembered)
- [F-EX-004 — Products filters](#f-ex-004--products-filters)
- [F-EX-005 — Shops filters](#f-ex-005--shops-filters)
- [F-EX-006 — Services filter with subcategory multi-select](#f-ex-006--services-filter-with-subcategory-multi-select)
- [F-EX-007 — Filter surfaces](#f-ex-007--filter-surfaces)
- [F-EX-008 — Shareable URL state](#f-ex-008--shareable-url-state)
- [F-EX-009 — Back button restores page and scroll](#f-ex-009--back-button-restores-page-and-scroll)
- [F-EX-010 — Per-tab empty state](#f-ex-010--per-tab-empty-state)
- [F-EX-011 — Map/List toggle](#f-ex-011--map-list-toggle)
- [F-EX-012 — Reusable filter component](#f-ex-012--reusable-filter-component)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-EX-001, F-EX-002, F-EX-003, F-EX-004, F-EX-005, F-EX-006, F-EX-007, F-EX-008, F-EX-009, F-EX-010, F-EX-011, F-EX-012 (12).
- **Area dependency:** AU, HM, LC, 07 rules BR-15/BR-18
- **API modules:** search, catalog
- **Data concepts:** Category, Subcategory, Product, Service, Owner
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-EX-001 — Explore tabs with counts

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Products / Shops / Services with result counts per tab for the applied category/filters.
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** No feature-specific BR is declared; cross-cutting rules apply only when their stated conditions hold.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-001`. **Data trace:** `P03/F-EX-001` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J1, J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, ServiceCard.
- **API/data handles:** `P04/F-EX-001`; `P03/F-EX-001`.
- **Verification handles:** F-EX-001-HAPPY, F-EX-001-NEGATIVE, F-EX-001-AUTHZ, F-EX-001-EMPTY-ERROR, F-EX-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EX-002 — Category pill pre-applied

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Category chosen on Home is shown as removable, changeable pill and applied in all three tabs (related service category where one exists).
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-002`. **Data trace:** `P03/F-EX-002` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J1, J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, ServiceCard.
- **API/data handles:** `P04/F-EX-002`; `P03/F-EX-002`.
- **Verification handles:** F-EX-002-HAPPY, F-EX-002-NEGATIVE, F-EX-002-AUTHZ, F-EX-002-EMPTY-ERROR, F-EX-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-EX-003 — Per-tab filters remembered

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Switching tabs keeps each tab's filters; Reset per tab.
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-003`. **Data trace:** `P03/F-EX-003` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs.
- **API/data handles:** `P04/F-EX-003`; `P03/F-EX-003`.
- **Verification handles:** F-EX-003-HAPPY, F-EX-003-NEGATIVE, F-EX-003-AUTHZ, F-EX-003-EMPTY-ERROR, F-EX-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EX-004 — Products filters

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Price range (slider + min/max), rating 4+/3+, category + subcategory, brand, offers, in stock, delivery/pickup, distance, sort (relevance, price low-high, high-low, rating, newest).
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-004`. **Data trace:** `P03/F-EX-004` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm.
- **API/data handles:** `P04/F-EX-004`; `P03/F-EX-004`.
- **Verification handles:** F-EX-004-HAPPY, F-EX-004-NEGATIVE, F-EX-004-AUTHZ, F-EX-004-EMPTY-ERROR, F-EX-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EX-005 — Shops filters

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Category, distance, rating, open now, delivers to my address, offers, verified, featured, sort (relevance, distance, rating, newest).
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-005`. **Data trace:** `P03/F-EX-005` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm.
- **API/data handles:** `P04/F-EX-005`; `P03/F-EX-005`.
- **Verification handles:** F-EX-005-HAPPY, F-EX-005-NEGATIVE, F-EX-005-AUTHZ, F-EX-005-EMPTY-ERROR, F-EX-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EX-006 — Services filter with subcategory multi-select

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Category multi-select + Subcategory multi-select grouped under category headings, checkbox counts, Select all/Clear per group, inner search above 8 items, Show more, disabled when count 0, OR logic, removing a category removes its subcategories, grouped collapsed sections when no category, chips + Clear all, skeleton while counts update, long-Hindi safe, keyboard and screen-reader support. Other filters: distance, rating, price or 'Price on enquiry', open now/available today, has offers, verified, sort (relevance, distance, rating, price).
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-006`. **Data trace:** `P03/F-EX-006` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm.
- **API/data handles:** `P04/F-EX-006`; `P03/F-EX-006`.
- **Verification handles:** F-EX-006-HAPPY, F-EX-006-NEGATIVE, F-EX-006-AUTHZ, F-EX-006-EMPTY-ERROR, F-EX-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EX-007 — Filter surfaces

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Mobile bottom sheet with sticky 'Show N results' and Reset/Apply; desktop left sidebar with live results; tablet horizontal bar with Filters button and active-count badge.
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-007`. **Data trace:** `P03/F-EX-007` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs.
- **API/data handles:** `P04/F-EX-007`; `P03/F-EX-007`.
- **Verification handles:** F-EX-007-HAPPY, F-EX-007-NEGATIVE, F-EX-007-AUTHZ, F-EX-007-EMPTY-ERROR, F-EX-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EX-008 — Shareable URL state

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** /explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting (slugs, comma-separated). Parsed and validated; copy-link action.
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-008`. **Data trace:** `P03/F-EX-008` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, MediaCarousel.
- **API/data handles:** `P04/F-EX-008`; `P03/F-EX-008`.
- **Verification handles:** F-EX-008-HAPPY, F-EX-008-NEGATIVE, F-EX-008-AUTHZ, F-EX-008-EMPTY-ERROR, F-EX-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-EX-009 — Back button restores page and scroll

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Back from Explore returns to previous page with scroll position preserved (handles query-string history entries).
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-009`. **Data trace:** `P03/F-EX-009` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-009-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs.
- **API/data handles:** `P04/F-EX-009`; `P03/F-EX-009`.
- **Verification handles:** F-EX-009-HAPPY, F-EX-009-NEGATIVE, F-EX-009-AUTHZ, F-EX-009-EMPTY-ERROR, F-EX-009-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-EX-010 — Per-tab empty state

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Friendly message, 'Clear category' and suggested categories with counts.
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-010`. **Data trace:** `P03/F-EX-010` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-010-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-010-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-010-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-010-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-010-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs.
- **API/data handles:** `P04/F-EX-010`; `P03/F-EX-010`.
- **Verification handles:** F-EX-010-HAPPY, F-EX-010-NEGATIVE, F-EX-010-AUTHZ, F-EX-010-EMPTY-ERROR, F-EX-010-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-EX-011 — Map/List toggle

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Switch result view; map pins for shops (and owners of services).
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-011`. **Data trace:** `P03/F-EX-011` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-011-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-011-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-011-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-011-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-011-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm.
- **API/data handles:** `P04/F-EX-011`; `P03/F-EX-011`.
- **Verification handles:** F-EX-011-HAPPY, F-EX-011-NEGATIVE, F-EX-011-AUTHZ, F-EX-011-EMPTY-ERROR, F-EX-011-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-EX-012 — Reusable filter component

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU, HM, LC, 07 rules BR-15/BR-18. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Same Services filter on Explore, Search (separate state) and service category pages.
- **Preconditions:** The linked screen is reachable and the actor satisfies the listed role, ownership/scope, approval and source-state requirements. Presentation-only behavior creates no persistent business data.

### Main flow
1. An actor in the listed role opens the linked screen; the feature renders its default state.
2. The actor performs the interaction exactly as described in the source requirement; preserve named controls, values, conditions and outcomes.
3. For mutations, the server validates and authorizes before persistence; presentation-only features do not mutate business data.
4. Return the resulting localized state and preserve the route/URL state where required by the source.

### Alternate and error flows
- Invalid input or unsupported state: reject the mutation without partial writes; return a machine-readable error and an actionable localized state.
- Unauthorized role, ownership, city/area or module permission: deny server-side and expose only the no-permission state without protected data.
- Empty, failure and offline cases use the applicable screen special state and baseline empty/error/offline state. Retry/reset/clear controls appear only where specified.
- No other alternate path is defined by the source pack; later prompts must not invent one silently.

### Rules and UX states
- **Business rules:** BR-15, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty per tab with Clear category; loading skeleton while counts update; no results with related categories; no subcategory match.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Category, Subcategory, Product, Service, Owner needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-EX-012`. **Data trace:** `P03/F-EX-012` (Category, Subcategory, Product, Service, Owner); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EX-012-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EX-012-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EX-012-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EX-012-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EX-012-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`); S-CUST-03 Search (`/search?q=`); S-CUST-05 Category page (`/category/:slug`)
- **Journeys:** J2
- **Shared components:** FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, ServiceCard.
- **API/data handles:** `P04/F-EX-012`; `P03/F-EX-012`.
- **Verification handles:** F-EX-012-HAPPY, F-EX-012-NEGATIVE, F-EX-012-AUTHZ, F-EX-012-EMPTY-ERROR, F-EX-012-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-EX-001 | S-CUST-02 | J1, J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, ServiceCard | F-EX-001-HAPPY, F-EX-001-NEGATIVE, F-EX-001-AUTHZ, F-EX-001-EMPTY-ERROR, F-EX-001-I18N-HI-LONG |
| F-EX-002 | S-CUST-02 | J1, J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, ServiceCard | F-EX-002-HAPPY, F-EX-002-NEGATIVE, F-EX-002-AUTHZ, F-EX-002-EMPTY-ERROR, F-EX-002-I18N-HI-LONG |
| F-EX-003 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs | F-EX-003-HAPPY, F-EX-003-NEGATIVE, F-EX-003-AUTHZ, F-EX-003-EMPTY-ERROR, F-EX-003-I18N-HI-LONG |
| F-EX-004 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm | F-EX-004-HAPPY, F-EX-004-NEGATIVE, F-EX-004-AUTHZ, F-EX-004-EMPTY-ERROR, F-EX-004-I18N-HI-LONG |
| F-EX-005 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm | F-EX-005-HAPPY, F-EX-005-NEGATIVE, F-EX-005-AUTHZ, F-EX-005-EMPTY-ERROR, F-EX-005-I18N-HI-LONG |
| F-EX-006 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm | F-EX-006-HAPPY, F-EX-006-NEGATIVE, F-EX-006-AUTHZ, F-EX-006-EMPTY-ERROR, F-EX-006-I18N-HI-LONG |
| F-EX-007 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs | F-EX-007-HAPPY, F-EX-007-NEGATIVE, F-EX-007-AUTHZ, F-EX-007-EMPTY-ERROR, F-EX-007-I18N-HI-LONG |
| F-EX-008 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, MediaCarousel | F-EX-008-HAPPY, F-EX-008-NEGATIVE, F-EX-008-AUTHZ, F-EX-008-EMPTY-ERROR, F-EX-008-I18N-HI-LONG |
| F-EX-009 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs | F-EX-009-HAPPY, F-EX-009-NEGATIVE, F-EX-009-AUTHZ, F-EX-009-EMPTY-ERROR, F-EX-009-I18N-HI-LONG |
| F-EX-010 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs | F-EX-010-HAPPY, F-EX-010-NEGATIVE, F-EX-010-AUTHZ, F-EX-010-EMPTY-ERROR, F-EX-010-I18N-HI-LONG |
| F-EX-011 | S-CUST-02 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, AddressForm | F-EX-011-HAPPY, F-EX-011-NEGATIVE, F-EX-011-AUTHZ, F-EX-011-EMPTY-ERROR, F-EX-011-I18N-HI-LONG |
| F-EX-012 | S-CUST-02, S-CUST-03, S-CUST-05 | J2 | search, catalog | Category, Subcategory, Product, Service, Owner | FilterPanel, SubcategoryMultiSelect, CategoryMultiSelect, ActiveFilterChips, MapView, Tabs, ServiceCard | F-EX-012-HAPPY, F-EX-012-NEGATIVE, F-EX-012-AUTHZ, F-EX-012-EMPTY-ERROR, F-EX-012-I18N-HI-LONG |
