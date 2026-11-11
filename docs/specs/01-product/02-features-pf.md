# PF — Business and provider profile feature specification

## Contents

- [F-PF-001 — Profile header](#f-pf-001--profile-header)
- [F-PF-002 — Sticky action bar](#f-pf-002--sticky-action-bar)
- [F-PF-003 — Profile tabs](#f-pf-003--profile-tabs)
- [F-PF-004 — Products & Services section](#f-pf-004--products-services-section)
- [F-PF-005 — Expert-in subcategories](#f-pf-005--expert-in-subcategories)
- [F-PF-006 — Hours, delivery and pickup info](#f-pf-006--hours-delivery-and-pickup-info)
- [F-PF-007 — Map, directions, QR, report, share](#f-pf-007--map-directions-qr-report-share)
- [F-PF-008 — Follow with bell](#f-pf-008--follow-with-bell)
- [F-PF-009 — Gallery with filters and lightbox](#f-pf-009--gallery-with-filters-and-lightbox)
- [F-PF-010 — Videos/Reels tab](#f-pf-010--videos-reels-tab)
- [F-PF-011 — Cart and enquiry on any profile](#f-pf-011--cart-and-enquiry-on-any-profile)
- [F-PF-012 — Owner-only prompts](#f-pf-012--owner-only-prompts)
- [F-PF-013 — Profile states](#f-pf-013--profile-states)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-PF-001, F-PF-002, F-PF-003, F-PF-004, F-PF-005, F-PF-006, F-PF-007, F-PF-008, F-PF-009, F-PF-010, F-PF-011, F-PF-012, F-PF-013 (13).
- **Area dependency:** VD/PV data, OF, RL, EG
- **API modules:** businesses, products, services, offers, engagement, media-videos
- **Data concepts:** Owner, Product, Service, Video
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-PF-001 — Profile header

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Cover, logo, name, category, verified, rating, open/closed with today's hours, distance.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-001`. **Data trace:** `P03/F-PF-001` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-001`; `P03/F-PF-001`.
- **Test handles:** F-PF-001-HAPPY, F-PF-001-NEGATIVE, F-PF-001-AUTHZ, F-PF-001-EMPTY-ERROR, F-PF-001-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PF-002 — Sticky action bar

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Call, WhatsApp, Directions, Share, Save.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-002`. **Data trace:** `P03/F-PF-002` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-002`; `P03/F-PF-002`.
- **Test handles:** F-PF-002-HAPPY, F-PF-002-NEGATIVE, F-PF-002-AUTHZ, F-PF-002-EMPTY-ERROR, F-PF-002-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PF-003 — Profile tabs

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** About / Products & Services / Offers / Gallery / Videos/Reels / Reviews / Contact & Location.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-003`. **Data trace:** `P03/F-PF-003` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-003`; `P03/F-PF-003`.
- **Test handles:** F-PF-003-HAPPY, F-PF-003-NEGATIVE, F-PF-003-AUTHZ, F-PF-003-EMPTY-ERROR, F-PF-003-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PF-004 — Products & Services section

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Segmented switch (only applicable ones); products: sticky scrollable category pills with counts; services: category pills then subcategory pills; empty state 'This business has not added any services yet'.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-004`. **Data trace:** `P03/F-PF-004` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-004`; `P03/F-PF-004`.
- **Test handles:** F-PF-004-HAPPY, F-PF-004-NEGATIVE, F-PF-004-AUTHZ, F-PF-004-EMPTY-ERROR, F-PF-004-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PF-005 — Expert-in subcategories

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Provider's expert-in subcategories visible on service cards and profile.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-005`. **Data trace:** `P03/F-PF-005` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-005`; `P03/F-PF-005`.
- **Test handles:** F-PF-005-HAPPY, F-PF-005-NEGATIVE, F-PF-005-AUTHZ, F-PF-005-EMPTY-ERROR, F-PF-005-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PF-006 — Hours, delivery and pickup info

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Weekly table with holidays/temporarily closed; delivery mode, radius, fee, minimum order; pickup instructions; eligibility for user's address.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-006`. **Data trace:** `P03/F-PF-006` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-006`; `P03/F-PF-006`.
- **Test handles:** F-PF-006-HAPPY, F-PF-006-NEGATIVE, F-PF-006-AUTHZ, F-PF-006-EMPTY-ERROR, F-PF-006-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PF-007 — Map, directions, QR, report, share

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Location map; QR view/share; report listing; WhatsApp/copy-link share.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-007`. **Data trace:** `P03/F-PF-007` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-007`; `P03/F-PF-007`.
- **Test handles:** F-PF-007-HAPPY, F-PF-007-NEGATIVE, F-PF-007-AUTHZ, F-PF-007-EMPTY-ERROR, F-PF-007-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PF-008 — Follow with bell

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Follow/Following, unfollow confirmation, notification bell.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-008`. **Data trace:** `P03/F-PF-008` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-008`; `P03/F-PF-008`.
- **Test handles:** F-PF-008-HAPPY, F-PF-008-NEGATIVE, F-PF-008-AUTHZ, F-PF-008-EMPTY-ERROR, F-PF-008-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PF-009 — Gallery with filters and lightbox

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Filters All/Photos/Videos/By product/By service; lightbox with swipe, captions, linked-item chip, hearts, report media.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-009`. **Data trace:** `P03/F-PF-009` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-009-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** J6
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-009`; `P03/F-PF-009`.
- **Test handles:** F-PF-009-HAPPY, F-PF-009-NEGATIVE, F-PF-009-AUTHZ, F-PF-009-EMPTY-ERROR, F-PF-009-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PF-010 — Videos/Reels tab

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Grid with view counts and follow button; opens Reels at that video.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-010`. **Data trace:** `P03/F-PF-010` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-010-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-010-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-010-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-010-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-010-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** J6
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-010`; `P03/F-PF-010`.
- **Test handles:** F-PF-010-HAPPY, F-PF-010-NEGATIVE, F-PF-010-AUTHZ, F-PF-010-EMPTY-ERROR, F-PF-010-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PF-011 — Cart and enquiry on any profile

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Add to cart for products and Send Enquiry for services on the same profile.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-011`. **Data trace:** `P03/F-PF-011` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-011-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-011-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-011-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-011-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-011-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-011`; `P03/F-PF-011`.
- **Test handles:** F-PF-011-HAPPY, F-PF-011-NEGATIVE, F-PF-011-AUTHZ, F-PF-011-EMPTY-ERROR, F-PF-011-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PF-012 — Owner-only prompts

### Requirement and scope
- **Roles:** Vendor, Provider. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** 'Add product / Add service' prompts when viewing own profile.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-012`. **Data trace:** `P03/F-PF-012` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Restrict operations to the listed roles (Vendor, Provider); apply customer authentication/ownership, vendor or provider ownership and approval, rider assignment, and admin city/area/module scope only for the corresponding role and operation (BR-06/12/21).

### Acceptance criteria
1. **Happy path — F-PF-012-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-012-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-012-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-012-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-012-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-012`; `P03/F-PF-012`.
- **Test handles:** F-PF-012-HAPPY, F-PF-012-NEGATIVE, F-PF-012-AUTHZ, F-PF-012-EMPTY-ERROR, F-PF-012-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PF-013 — Profile states

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** VD/PV data, OF, RL, EG. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Listing not live (pending/suspended), closed, outside delivery range.
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
- **Business rules:** BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, offers, engagement, media-videos; handle `P04/F-PF-013`. **Data trace:** `P03/F-PF-013` (Owner, Product, Service, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PF-013-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PF-013-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PF-013-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PF-013-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PF-013-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid.
- **API/data handles:** `P04/F-PF-013`; `P03/F-PF-013`.
- **Test handles:** F-PF-013-HAPPY, F-PF-013-NEGATIVE, F-PF-013-AUTHZ, F-PF-013-EMPTY-ERROR, F-PF-013-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Test IDs |
|---|---|---|---|---|---|---|
| F-PF-001 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-001-HAPPY, F-PF-001-NEGATIVE, F-PF-001-AUTHZ, F-PF-001-EMPTY-ERROR, F-PF-001-I18N-HI-LONG |
| F-PF-002 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-002-HAPPY, F-PF-002-NEGATIVE, F-PF-002-AUTHZ, F-PF-002-EMPTY-ERROR, F-PF-002-I18N-HI-LONG |
| F-PF-003 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-003-HAPPY, F-PF-003-NEGATIVE, F-PF-003-AUTHZ, F-PF-003-EMPTY-ERROR, F-PF-003-I18N-HI-LONG |
| F-PF-004 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-004-HAPPY, F-PF-004-NEGATIVE, F-PF-004-AUTHZ, F-PF-004-EMPTY-ERROR, F-PF-004-I18N-HI-LONG |
| F-PF-005 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-005-HAPPY, F-PF-005-NEGATIVE, F-PF-005-AUTHZ, F-PF-005-EMPTY-ERROR, F-PF-005-I18N-HI-LONG |
| F-PF-006 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-006-HAPPY, F-PF-006-NEGATIVE, F-PF-006-AUTHZ, F-PF-006-EMPTY-ERROR, F-PF-006-I18N-HI-LONG |
| F-PF-007 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-007-HAPPY, F-PF-007-NEGATIVE, F-PF-007-AUTHZ, F-PF-007-EMPTY-ERROR, F-PF-007-I18N-HI-LONG |
| F-PF-008 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-008-HAPPY, F-PF-008-NEGATIVE, F-PF-008-AUTHZ, F-PF-008-EMPTY-ERROR, F-PF-008-I18N-HI-LONG |
| F-PF-009 | S-CUST-06, S-CUST-07 | J6 | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-009-HAPPY, F-PF-009-NEGATIVE, F-PF-009-AUTHZ, F-PF-009-EMPTY-ERROR, F-PF-009-I18N-HI-LONG |
| F-PF-010 | S-CUST-06, S-CUST-07 | J6 | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-010-HAPPY, F-PF-010-NEGATIVE, F-PF-010-AUTHZ, F-PF-010-EMPTY-ERROR, F-PF-010-I18N-HI-LONG |
| F-PF-011 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-011-HAPPY, F-PF-011-NEGATIVE, F-PF-011-AUTHZ, F-PF-011-EMPTY-ERROR, F-PF-011-I18N-HI-LONG |
| F-PF-012 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-012-HAPPY, F-PF-012-NEGATIVE, F-PF-012-AUTHZ, F-PF-012-EMPTY-ERROR, F-PF-012-I18N-HI-LONG |
| F-PF-013 | S-CUST-06, S-CUST-07 | None specified | businesses, products, services, offers, engagement, media-videos | Owner, Product, Service, Video | ShopCard, ServiceCard, Tabs, CategoryPillRow, SubcategoryPillRow, FollowButton, GalleryGrid | F-PF-013-HAPPY, F-PF-013-NEGATIVE, F-PF-013-AUTHZ, F-PF-013-EMPTY-ERROR, F-PF-013-I18N-HI-LONG |
