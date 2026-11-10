# VD — Vendor dashboard feature specification

## Contents

- [F-VD-001 — Vendor signup wizard](#f-vd-001--vendor-signup-wizard)
- [F-VD-002 — Vendor overview](#f-vd-002--vendor-overview)
- [F-VD-003 — Business profile editor](#f-vd-003--business-profile-editor)
- [F-VD-004 — Products management](#f-vd-004--products-management)
- [F-VD-005 — Product category pills manager](#f-vd-005--product-category-pills-manager)
- [F-VD-006 — Subcategory suggestion](#f-vd-006--subcategory-suggestion)
- [F-VD-007 — Offers manager](#f-vd-007--offers-manager)
- [F-VD-008 — Vendor orders](#f-vd-008--vendor-orders)
- [F-VD-009 — Inventory](#f-vd-009--inventory)
- [F-VD-010 — Vendor reviews](#f-vd-010--vendor-reviews)
- [F-VD-011 — QR and links](#f-vd-011--qr-and-links)
- [F-VD-012 — Gallery manager and videos/reels manager](#f-vd-012--gallery-manager-and-videos-reels-manager)
- [F-VD-013 — Media-consent toggle](#f-vd-013--media-consent-toggle)
- [F-VD-014 — Services manager](#f-vd-014--services-manager)
- [F-VD-015 — Followers](#f-vd-015--followers)
- [F-VD-016 — Enquiries inbox](#f-vd-016--enquiries-inbox)
- [F-VD-017 — Earnings, plan, promotions, invoices](#f-vd-017--earnings-plan-promotions-invoices)
- [F-VD-018 — Vendor account](#f-vd-018--vendor-account)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-VD-001, F-VD-002, F-VD-003, F-VD-004, F-VD-005, F-VD-006, F-VD-007, F-VD-008, F-VD-009, F-VD-010, F-VD-011, F-VD-012, F-VD-013, F-VD-014, F-VD-015, F-VD-016, F-VD-017, F-VD-018 (18).
- **Area dependency:** AD2 approval
- **API modules:** users, businesses, products, services, offers, orders, reviews, media-videos, engagement
- **Data concepts:** Owner, Product, Service, Offer, Order, Video
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-VD-001 — Vendor signup wizard

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Mobile OTP, business type, basics, location, hours and delivery, documents (optional), review; save draft; approval states.
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
- **Business rules:** BR-05, BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; pending; rejected with reason; suspended; inactive.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-001`. **Data trace:** `P03/F-VD-001` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-001-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-01 Vendor signup wizard (`/vendor/onboarding`)
- **Journeys:** J7
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, PhoneInput.
- **API/data handles:** `P04/F-VD-001`; `P03/F-VD-001`.
- **Test handles:** F-VD-001-HAPPY, F-VD-001-NEGATIVE, F-VD-001-AUTHZ, F-VD-001-EMPTY-ERROR, F-VD-001-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-002 — Vendor overview

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** KPI cards, charts, low-stock alerts, pending actions.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; not approved limited access.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-002`. **Data trace:** `P03/F-VD-002` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-002-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-02 Vendor overview (`/vendor/overview`)
- **Journeys:** J7
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, ProductCard.
- **API/data handles:** `P04/F-VD-002`; `P03/F-VD-002`.
- **Test handles:** F-VD-002-HAPPY, F-VD-002-NEGATIVE, F-VD-002-AUTHZ, F-VD-002-EMPTY-ERROR, F-VD-002-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-VD-003 — Business profile editor

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Logo, cover, EN/HI name, hours per day, temporarily closed, delivery settings, pickup, map pin, live preview.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-003`. **Data trace:** `P03/F-VD-003` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-003-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-12 Business profile editor (`/vendor/profile`)
- **Journeys:** J7
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, MapView.
- **API/data handles:** `P04/F-VD-003`; `P03/F-VD-003`.
- **Test handles:** F-VD-003-HAPPY, F-VD-003-NEGATIVE, F-VD-003-AUTHZ, F-VD-003-EMPTY-ERROR, F-VD-003-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-004 — Products management

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** List, search, filter, bulk actions, CSV import, add/edit with variants, SKU, stock, tags, media sorter (images + YouTube/Instagram), shareable link.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; import errors; validation errors.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-004`. **Data trace:** `P03/F-VD-004` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-004-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-05 Products (`/vendor/products`); S-VEND-06 Product editor (`/vendor/products/:id`)
- **Journeys:** J7
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel.
- **API/data handles:** `P04/F-VD-004`; `P03/F-VD-004`.
- **Test handles:** F-VD-004-HAPPY, F-VD-004-NEGATIVE, F-VD-004-AUTHZ, F-VD-004-EMPTY-ERROR, F-VD-004-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-005 — Product category pills manager

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Reorder, rename, hide.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; import errors.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-005`. **Data trace:** `P03/F-VD-005` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-005-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-05 Products (`/vendor/products`)
- **Journeys:** J7
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel.
- **API/data handles:** `P04/F-VD-005`; `P03/F-VD-005`.
- **Test handles:** F-VD-005-HAPPY, F-VD-005-NEGATIVE, F-VD-005-AUTHZ, F-VD-005-EMPTY-ERROR, F-VD-005-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-006 — Subcategory suggestion

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Form with duplicate detection and 'my suggestions' status.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; import errors.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-006`. **Data trace:** `P03/F-VD-006` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-006-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-05 Products (`/vendor/products`)
- **Journeys:** J7, J9
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel.
- **API/data handles:** `P04/F-VD-006`; `P03/F-VD-006`.
- **Test handles:** F-VD-006-HAPPY, F-VD-006-NEGATIVE, F-VD-006-AUTHZ, F-VD-006-EMPTY-ERROR, F-VD-006-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-VD-007 — Offers manager

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Create/edit/pause/end, discount type, validity, products, banner, featured, performance; admin approval.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; pending approval.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-007`. **Data trace:** `P03/F-VD-007` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-007-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-07 Offers (`/vendor/offers`)
- **Journeys:** J7
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, OfferCard.
- **API/data handles:** `P04/F-VD-007`; `P03/F-VD-007`.
- **Test handles:** F-VD-007-HAPPY, F-VD-007-NEGATIVE, F-VD-007-AUTHZ, F-VD-007-EMPTY-ERROR, F-VD-007-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-008 — Vendor orders

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** New-order alert, accept/reject with reason, preparing, ready, request/assign rider or own delivery with OTP, pickup handover with code, print slip, mark item unavailable, refund handling.
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
- **Business rules:** BR-05, BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refund requested.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-008`. **Data trace:** `P03/F-VD-008` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-008-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-03 Vendor orders (`/vendor/orders`); S-VEND-04 Vendor order detail (`/vendor/orders/:id`)
- **Journeys:** J7, J8
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, PhoneInput.
- **API/data handles:** `P04/F-VD-008`; `P03/F-VD-008`.
- **Test handles:** F-VD-008-HAPPY, F-VD-008-NEGATIVE, F-VD-008-AUTHZ, F-VD-008-EMPTY-ERROR, F-VD-008-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-009 — Inventory

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Stock levels, thresholds, quick toggles, restock, bulk update.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; low stock.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-009`. **Data trace:** `P03/F-VD-009` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-009-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-08 Inventory (`/vendor/inventory`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, ProductCard.
- **API/data handles:** `P04/F-VD-009`; `P03/F-VD-009`.
- **Test handles:** F-VD-009-HAPPY, F-VD-009-NEGATIVE, F-VD-009-AUTHZ, F-VD-009-EMPTY-ERROR, F-VD-009-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-010 — Vendor reviews

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** List, filter, reply, report.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-010`. **Data trace:** `P03/F-VD-010` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-010-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-010-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-010-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-010-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-010-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-09 Reviews (`/vendor/reviews`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel.
- **API/data handles:** `P04/F-VD-010`; `P03/F-VD-010`.
- **Test handles:** F-VD-010-HAPPY, F-VD-010-NEGATIVE, F-VD-010-AUTHZ, F-VD-010-EMPTY-ERROR, F-VD-010-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-011 — QR and links

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Business QR with logo, poster/table-tent/sticker templates, links, share.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-011`. **Data trace:** `P03/F-VD-011` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-011-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-011-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-011-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-011-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-011-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-10 QR and links (`/vendor/qr`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, MediaCarousel.
- **API/data handles:** `P04/F-VD-011`; `P03/F-VD-011`.
- **Test handles:** F-VD-011-HAPPY, F-VD-011-NEGATIVE, F-VD-011-AUTHZ, F-VD-011-EMPTY-ERROR, F-VD-011-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-VD-012 — Gallery manager and videos/reels manager

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Gallery-only photos, default consent setting, link/upload videos, thumbnail, caption, hashtags, link items, 'Show in Gallery'/'Show in Reels', approval status, analytics.
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
- **Business rules:** BR-06, BR-07, BR-11, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; pending; rejected with reason; removed.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-012`. **Data trace:** `P03/F-VD-012` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-012-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-012-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-012-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-012-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-012-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-11 Gallery and videos manager (`/vendor/media`)
- **Journeys:** J6
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, NotificationCard.
- **API/data handles:** `P04/F-VD-012`; `P03/F-VD-012`.
- **Test handles:** F-VD-012-HAPPY, F-VD-012-NEGATIVE, F-VD-012-AUTHZ, F-VD-012-EMPTY-ERROR, F-VD-012-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-013 — Media-consent toggle

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** On every product/service media upload: 'Also show this in my business Gallery / Videos & Reels' with explanation and default.
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
- **Business rules:** BR-06, BR-07, BR-11, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; validation errors; pending; rejected with reason; removed.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-013`. **Data trace:** `P03/F-VD-013` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-013-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-013-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-013-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-013-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-013-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-06 Product editor (`/vendor/products/:id`); S-VEND-11 Gallery and videos manager (`/vendor/media`)
- **Journeys:** J6
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, NotificationCard.
- **API/data handles:** `P04/F-VD-013`; `P03/F-VD-013`.
- **Test handles:** F-VD-013-HAPPY, F-VD-013-NEGATIVE, F-VD-013-AUTHZ, F-VD-013-EMPTY-ERROR, F-VD-013-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-014 — Services manager

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Title, category, one subcategory, price type/amount/unit, inclusions, exclusions, area, images, video, active/pause, shareable link.
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
- **Business rules:** BR-06, BR-07, BR-08, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-014`. **Data trace:** `P03/F-VD-014` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-014-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-014-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-014-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-014-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-014-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-13 Services manager (`/vendor/services`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel.
- **API/data handles:** `P04/F-VD-014`; `P03/F-VD-014`.
- **Test handles:** F-VD-014-HAPPY, F-VD-014-NEGATIVE, F-VD-014-AUTHZ, F-VD-014-EMPTY-ERROR, F-VD-014-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-VD-015 — Followers

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Count, growth chart, announce to followers.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-015`. **Data trace:** `P03/F-VD-015` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-015-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-015-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-015-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-015-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-015-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-15 Followers (`/vendor/followers`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm.
- **API/data handles:** `P04/F-VD-015`; `P03/F-VD-015`.
- **Test handles:** F-VD-015-HAPPY, F-VD-015-NEGATIVE, F-VD-015-AUTHZ, F-VD-015-EMPTY-ERROR, F-VD-015-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-VD-016 — Enquiries inbox

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Statuses new/contacted/converted/closed.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-016`. **Data trace:** `P03/F-VD-016` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-016-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-016-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-016-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-016-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-016-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-14 Enquiries (`/vendor/enquiries(/:id)`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, ServiceCard.
- **API/data handles:** `P04/F-VD-016`; `P03/F-VD-016`.
- **Test handles:** F-VD-016-HAPPY, F-VD-016-NEGATIVE, F-VD-016-AUTHZ, F-VD-016-EMPTY-ERROR, F-VD-016-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-VD-017 — Earnings, plan, promotions, invoices

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Payout summary, plan and commission, buy promotions, invoices.
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
- **Business rules:** BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-017`. **Data trace:** `P03/F-VD-017` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-017-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-017-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-017-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-017-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-017-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-16 Earnings and plan (`/vendor/earnings`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, OfferCard.
- **API/data handles:** `P04/F-VD-017`; `P03/F-VD-017`.
- **Test handles:** F-VD-017-HAPPY, F-VD-017-NEGATIVE, F-VD-017-AUTHZ, F-VD-017-EMPTY-ERROR, F-VD-017-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-VD-018 — Vendor account

### Requirement and scope
- **Roles:** Vendor. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Owner details, payout UPI/bank, staff access list, security, language.
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
- **Business rules:** BR-05, BR-06, BR-07, BR-16.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Product, Service, Offer, Order, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, products, services, offers, orders, reviews, media-videos, engagement; handle `P04/F-VD-018`. **Data trace:** `P03/F-VD-018` (Owner, Product, Service, Offer, Order, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Vendor, restricted to the owner’s own business and records; approval is required to sell or accept orders (BR-06).

### Acceptance criteria
1. **Happy path — F-VD-018-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-VD-018-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-VD-018-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-VD-018-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-VD-018-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-18 Vendor account (`/vendor/account`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, NotificationCard.
- **API/data handles:** `P04/F-VD-018`; `P03/F-VD-018`.
- **Test handles:** F-VD-018-HAPPY, F-VD-018-NEGATIVE, F-VD-018-AUTHZ, F-VD-018-EMPTY-ERROR, F-VD-018-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Test IDs |
|---|---|---|---|---|---|---|
| F-VD-001 | S-VEND-01 | J7 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, PhoneInput | F-VD-001-HAPPY, F-VD-001-NEGATIVE, F-VD-001-AUTHZ, F-VD-001-EMPTY-ERROR, F-VD-001-I18N-HI-LONG |
| F-VD-002 | S-VEND-02 | J7 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, ProductCard | F-VD-002-HAPPY, F-VD-002-NEGATIVE, F-VD-002-AUTHZ, F-VD-002-EMPTY-ERROR, F-VD-002-I18N-HI-LONG |
| F-VD-003 | S-VEND-12 | J7 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, MapView | F-VD-003-HAPPY, F-VD-003-NEGATIVE, F-VD-003-AUTHZ, F-VD-003-EMPTY-ERROR, F-VD-003-I18N-HI-LONG |
| F-VD-004 | S-VEND-05, S-VEND-06 | J7 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel | F-VD-004-HAPPY, F-VD-004-NEGATIVE, F-VD-004-AUTHZ, F-VD-004-EMPTY-ERROR, F-VD-004-I18N-HI-LONG |
| F-VD-005 | S-VEND-05 | J7 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel | F-VD-005-HAPPY, F-VD-005-NEGATIVE, F-VD-005-AUTHZ, F-VD-005-EMPTY-ERROR, F-VD-005-I18N-HI-LONG |
| F-VD-006 | S-VEND-05 | J7, J9 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel | F-VD-006-HAPPY, F-VD-006-NEGATIVE, F-VD-006-AUTHZ, F-VD-006-EMPTY-ERROR, F-VD-006-I18N-HI-LONG |
| F-VD-007 | S-VEND-07 | J7 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, OfferCard | F-VD-007-HAPPY, F-VD-007-NEGATIVE, F-VD-007-AUTHZ, F-VD-007-EMPTY-ERROR, F-VD-007-I18N-HI-LONG |
| F-VD-008 | S-VEND-03, S-VEND-04 | J7, J8 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, PhoneInput | F-VD-008-HAPPY, F-VD-008-NEGATIVE, F-VD-008-AUTHZ, F-VD-008-EMPTY-ERROR, F-VD-008-I18N-HI-LONG |
| F-VD-009 | S-VEND-08 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, ProductCard | F-VD-009-HAPPY, F-VD-009-NEGATIVE, F-VD-009-AUTHZ, F-VD-009-EMPTY-ERROR, F-VD-009-I18N-HI-LONG |
| F-VD-010 | S-VEND-09 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel | F-VD-010-HAPPY, F-VD-010-NEGATIVE, F-VD-010-AUTHZ, F-VD-010-EMPTY-ERROR, F-VD-010-I18N-HI-LONG |
| F-VD-011 | S-VEND-10 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, MediaCarousel | F-VD-011-HAPPY, F-VD-011-NEGATIVE, F-VD-011-AUTHZ, F-VD-011-EMPTY-ERROR, F-VD-011-I18N-HI-LONG |
| F-VD-012 | S-VEND-11 | J6 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, NotificationCard | F-VD-012-HAPPY, F-VD-012-NEGATIVE, F-VD-012-AUTHZ, F-VD-012-EMPTY-ERROR, F-VD-012-I18N-HI-LONG |
| F-VD-013 | S-VEND-06, S-VEND-11 | J6 | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, NotificationCard | F-VD-013-HAPPY, F-VD-013-NEGATIVE, F-VD-013-AUTHZ, F-VD-013-EMPTY-ERROR, F-VD-013-I18N-HI-LONG |
| F-VD-014 | S-VEND-13 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, FilterPanel | F-VD-014-HAPPY, F-VD-014-NEGATIVE, F-VD-014-AUTHZ, F-VD-014-EMPTY-ERROR, F-VD-014-I18N-HI-LONG |
| F-VD-015 | S-VEND-15 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm | F-VD-015-HAPPY, F-VD-015-NEGATIVE, F-VD-015-AUTHZ, F-VD-015-EMPTY-ERROR, F-VD-015-I18N-HI-LONG |
| F-VD-016 | S-VEND-14 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, ServiceCard | F-VD-016-HAPPY, F-VD-016-NEGATIVE, F-VD-016-AUTHZ, F-VD-016-EMPTY-ERROR, F-VD-016-I18N-HI-LONG |
| F-VD-017 | S-VEND-16 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, OfferCard | F-VD-017-HAPPY, F-VD-017-NEGATIVE, F-VD-017-AUTHZ, F-VD-017-EMPTY-ERROR, F-VD-017-I18N-HI-LONG |
| F-VD-018 | S-VEND-18 | None specified | users, businesses, products, services, offers, orders, reviews, media-videos, engagement | Owner, Product, Service, Offer, Order, Video | DashboardShell, DataTable, Input, MediaSorter, MediaConsentToggle, EnquiryForm, NotificationCard | F-VD-018-HAPPY, F-VD-018-NEGATIVE, F-VD-018-AUTHZ, F-VD-018-EMPTY-ERROR, F-VD-018-I18N-HI-LONG |
