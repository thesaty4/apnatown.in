# SR — Search feature specification

## Contents

- [F-SR-001 — Search tabs](#f-sr-001--search-tabs)
- [F-SR-002 — Keyword to category mapping](#f-sr-002--keyword-to-category-mapping)
- [F-SR-003 — Hindi/Hinglish/typo tolerance](#f-sr-003--hindi-hinglish-typo-tolerance)
- [F-SR-004 — Grouped autocomplete](#f-sr-004--grouped-autocomplete)
- [F-SR-005 — Recent and popular searches](#f-sr-005--recent-and-popular-searches)
- [F-SR-006 — All tab grouped sections](#f-sr-006--all-tab-grouped-sections)
- [F-SR-007 — Per-tab filters in Search](#f-sr-007--per-tab-filters-in-search)
- [F-SR-008 — Sort](#f-sr-008--sort)
- [F-SR-009 — No-results state](#f-sr-009--no-results-state)
- [F-SR-010 — Separate filter state from Explore](#f-sr-010--separate-filter-state-from-explore)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-SR-001, F-SR-002, F-SR-003, F-SR-004, F-SR-005, F-SR-006, F-SR-007, F-SR-008, F-SR-009, F-SR-010 (10).
- **Area dependency:** EX (shared filter component), admin keyword mapping AD15
- **API modules:** search, catalog
- **Data concepts:** Keyword, Product, Service, Owner, Video
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-SR-001 — Search tabs

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** All / Products / Shops / Services / Videos with counts.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-001`. **Data trace:** `P03/F-SR-001` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, MediaCarousel, GalleryGrid.
- **API/data handles:** `P04/F-SR-001`; `P03/F-SR-001`.
- **Verification handles:** F-SR-001-HAPPY, F-SR-001-NEGATIVE, F-SR-001-AUTHZ, F-SR-001-EMPTY-ERROR, F-SR-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SR-002 — Keyword to category mapping

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Keywords map to shop categories, service subcategories and product tags (AC, iPhone 15, DJ, tent, plumber, mobile repair, electrician, catering).
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-002`. **Data trace:** `P03/F-SR-002` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, MapView, AddressForm.
- **API/data handles:** `P04/F-SR-002`; `P03/F-SR-002`.
- **Verification handles:** F-SR-002-HAPPY, F-SR-002-NEGATIVE, F-SR-002-AUTHZ, F-SR-002-EMPTY-ERROR, F-SR-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-SR-003 — Hindi/Hinglish/typo tolerance

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** 'एसी', 'ac', 'plumbr', 'mobile repair' resolve to the right results.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-003`. **Data trace:** `P03/F-SR-003` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-SR-003`; `P03/F-SR-003`.
- **Verification handles:** F-SR-003-HAPPY, F-SR-003-NEGATIVE, F-SR-003-AUTHZ, F-SR-003-EMPTY-ERROR, F-SR-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-SR-004 — Grouped autocomplete

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Groups: Products, Shops, Services, Categories, Subcategories, Related searches.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-004`. **Data trace:** `P03/F-SR-004` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, ServiceCard, EnquiryForm.
- **API/data handles:** `P04/F-SR-004`; `P03/F-SR-004`.
- **Verification handles:** F-SR-004-HAPPY, F-SR-004-NEGATIVE, F-SR-004-AUTHZ, F-SR-004-EMPTY-ERROR, F-SR-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SR-005 — Recent and popular searches

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Chips for recent (per user) and popular (platform).
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-005`. **Data trace:** `P03/F-SR-005` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips.
- **API/data handles:** `P04/F-SR-005`; `P03/F-SR-005`.
- **Verification handles:** F-SR-005-HAPPY, F-SR-005-NEGATIVE, F-SR-005-AUTHZ, F-SR-005-EMPTY-ERROR, F-SR-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SR-006 — All tab grouped sections

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Each group shows a few items, 'See all', and an explanation label such as 'Related services for AC'.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-006`. **Data trace:** `P03/F-SR-006` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ServiceCard, EnquiryForm.
- **API/data handles:** `P04/F-SR-006`; `P03/F-SR-006`.
- **Verification handles:** F-SR-006-HAPPY, F-SR-006-NEGATIVE, F-SR-006-AUTHZ, F-SR-006-EMPTY-ERROR, F-SR-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-SR-007 — Per-tab filters in Search

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Products and Shops use the filter sheet; Services uses the Explore services filter component with its own state.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-007`. **Data trace:** `P03/F-SR-007` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, ServiceCard, EnquiryForm.
- **API/data handles:** `P04/F-SR-007`; `P03/F-SR-007`.
- **Verification handles:** F-SR-007-HAPPY, F-SR-007-NEGATIVE, F-SR-007-AUTHZ, F-SR-007-EMPTY-ERROR, F-SR-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SR-008 — Sort

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Relevance, distance, rating, price, newest.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-008`. **Data trace:** `P03/F-SR-008` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, MapView, AddressForm.
- **API/data handles:** `P04/F-SR-008`; `P03/F-SR-008`.
- **Verification handles:** F-SR-008-HAPPY, F-SR-008-NEGATIVE, F-SR-008-AUTHZ, F-SR-008-EMPTY-ERROR, F-SR-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-SR-009 — No-results state

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Message with related categories and popular searches.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-009`. **Data trace:** `P03/F-SR-009` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-009-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips.
- **API/data handles:** `P04/F-SR-009`; `P03/F-SR-009`.
- **Verification handles:** F-SR-009-HAPPY, F-SR-009-NEGATIVE, F-SR-009-AUTHZ, F-SR-009-EMPTY-ERROR, F-SR-009-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SR-010 — Separate filter state from Explore

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** EX (shared filter component), admin keyword mapping AD15. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Search filters never change Explore and vice versa.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results with related categories.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyword, Product, Service, Owner, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) search, catalog; handle `P04/F-SR-010`. **Data trace:** `P03/F-SR-010` (Keyword, Product, Service, Owner, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SR-010-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SR-010-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SR-010-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SR-010-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SR-010-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-03 Search (`/search?q=`)
- **Journeys:** J5
- **Shared components:** SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips.
- **API/data handles:** `P04/F-SR-010`; `P03/F-SR-010`.
- **Verification handles:** F-SR-010-HAPPY, F-SR-010-NEGATIVE, F-SR-010-AUTHZ, F-SR-010-EMPTY-ERROR, F-SR-010-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-SR-001 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, MediaCarousel, GalleryGrid | F-SR-001-HAPPY, F-SR-001-NEGATIVE, F-SR-001-AUTHZ, F-SR-001-EMPTY-ERROR, F-SR-001-I18N-HI-LONG |
| F-SR-002 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, MapView, AddressForm | F-SR-002-HAPPY, F-SR-002-NEGATIVE, F-SR-002-AUTHZ, F-SR-002-EMPTY-ERROR, F-SR-002-I18N-HI-LONG |
| F-SR-003 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect | F-SR-003-HAPPY, F-SR-003-NEGATIVE, F-SR-003-AUTHZ, F-SR-003-EMPTY-ERROR, F-SR-003-I18N-HI-LONG |
| F-SR-004 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, ServiceCard, EnquiryForm | F-SR-004-HAPPY, F-SR-004-NEGATIVE, F-SR-004-AUTHZ, F-SR-004-EMPTY-ERROR, F-SR-004-I18N-HI-LONG |
| F-SR-005 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips | F-SR-005-HAPPY, F-SR-005-NEGATIVE, F-SR-005-AUTHZ, F-SR-005-EMPTY-ERROR, F-SR-005-I18N-HI-LONG |
| F-SR-006 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ServiceCard, EnquiryForm | F-SR-006-HAPPY, F-SR-006-NEGATIVE, F-SR-006-AUTHZ, F-SR-006-EMPTY-ERROR, F-SR-006-I18N-HI-LONG |
| F-SR-007 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, ServiceCard, EnquiryForm | F-SR-007-HAPPY, F-SR-007-NEGATIVE, F-SR-007-AUTHZ, F-SR-007-EMPTY-ERROR, F-SR-007-I18N-HI-LONG |
| F-SR-008 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips, MapView, AddressForm | F-SR-008-HAPPY, F-SR-008-NEGATIVE, F-SR-008-AUTHZ, F-SR-008-EMPTY-ERROR, F-SR-008-I18N-HI-LONG |
| F-SR-009 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips | F-SR-009-HAPPY, F-SR-009-NEGATIVE, F-SR-009-AUTHZ, F-SR-009-EMPTY-ERROR, F-SR-009-I18N-HI-LONG |
| F-SR-010 | S-CUST-03 | J5 | search, catalog | Keyword, Product, Service, Owner, Video | SearchBar, SearchResultGroup, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips | F-SR-010-HAPPY, F-SR-010-NEGATIVE, F-SR-010-AUTHZ, F-SR-010-EMPTY-ERROR, F-SR-010-I18N-HI-LONG |
