# SA — Super admin feature specification

## Contents

- [F-SA-001 — Super admin overview with chart](#f-sa-001--super-admin-overview-with-chart)
- [F-SA-002 — Admins and areas](#f-sa-002--admins-and-areas)
- [F-SA-003 — Roles and permissions](#f-sa-003--roles-and-permissions)
- [F-SA-004 — Cities and zones](#f-sa-004--cities-and-zones)
- [F-SA-005 — Global settings](#f-sa-005--global-settings)
- [F-SA-006 — Platform analytics](#f-sa-006--platform-analytics)
- [F-SA-007 — Activity monitor](#f-sa-007--activity-monitor)
- [F-SA-008 — Main-category management and tree](#f-sa-008--main-category-management-and-tree)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-SA-001, F-SA-002, F-SA-003, F-SA-004, F-SA-005, F-SA-006, F-SA-007, F-SA-008 (8).
- **Area dependency:** X14 audit
- **API modules:** admin, settings, geo, audit, catalog
- **Data concepts:** Admin, Role, City, Zone, Setting, Category
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-SA-001 — Super admin overview with chart

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Prototype deviation (G-18):** the prototype includes a Graph/Candle toggle, but the approved behavior is graph-only because no candle/OHLC data definition exists. Preserve the supported metric, date-range and city filters, plus skeleton, empty, error and accessible table states.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; chart skeleton/empty/error.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-001`. **Data trace:** `P03/F-SA-001` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-001-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-SUPR-01 Super admin overview (`/super-admin/overview`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, MapView.
- **API/data handles:** `P04/F-SA-001`; `P03/F-SA-001`.
- **Test handles:** F-SA-001-HAPPY, F-SA-001-NEGATIVE, F-SA-001-AUTHZ, F-SA-001-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-SA-002 — Admins and areas

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Collapsible cards, search, filters (city, area/zone, role, status) with chips, count, clear all; activate/deactivate with impact confirmation; area assignment; per-admin permission matrix.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no results.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-002`. **Data trace:** `P03/F-SA-002` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-002-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-SUPR-02 Admins and areas (`/super-admin/admins`)
- **Journeys:** J10
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel.
- **API/data handles:** `P04/F-SA-002`; `P03/F-SA-002`.
- **Test handles:** F-SA-002-HAPPY, F-SA-002-NEGATIVE, F-SA-002-AUTHZ, F-SA-002-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SA-003 — Roles and permissions

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Create, edit with unsaved indicator and before/after summary, duplicate, delete blocked with reassign picker, system roles locked.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; delete blocked.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-003`. **Data trace:** `P03/F-SA-003` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-003-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-SUPR-03 Roles and permissions (`/super-admin/roles`)
- **Journeys:** J10
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, AuditDiff.
- **API/data handles:** `P04/F-SA-003`; `P03/F-SA-003`.
- **Test handles:** F-SA-003-HAPPY, F-SA-003-NEGATIVE, F-SA-003-AUTHZ, F-SA-003-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SA-004 — Cities and zones

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** City cards (Enabled/Disabled/Coming soon), enable/disable confirm, add city, city detail with polygon editor, zones with fee slabs, assigned admins, empty state.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no zones yet.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-004`. **Data trace:** `P03/F-SA-004` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-004-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-SUPR-04 Cities (`/super-admin/cities`); S-SUPR-05 City detail and zones (`/super-admin/cities/:id`)
- **Journeys:** J10
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, MapView.
- **API/data handles:** `P04/F-SA-004`; `P03/F-SA-004`.
- **Test handles:** F-SA-004-HAPPY, F-SA-004-NEGATIVE, F-SA-004-AUTHZ, F-SA-004-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SA-005 — Global settings

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Branding, delivery slabs, rider earning, commission, plans, promotion fees, payments, refund window, review rules, integrations, SEO defaults, feature flags, legal pages.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-005`. **Data trace:** `P03/F-SA-005` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-005-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-SUPR-06 Global settings (`/super-admin/settings`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, ReviewForm.
- **API/data handles:** `P04/F-SA-005`; `P03/F-SA-005`.
- **Test handles:** F-SA-005-HAPPY, F-SA-005-NEGATIVE, F-SA-005-AUTHZ, F-SA-005-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SA-006 — Platform analytics

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** GMV, orders, AOV, repeat customers, orders by category, delivery vs pickup, top vendors.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-006`. **Data trace:** `P03/F-SA-006` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-006-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-SUPR-07 Platform analytics (`/super-admin/analytics`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel.
- **API/data handles:** `P04/F-SA-006`; `P03/F-SA-006`.
- **Test handles:** F-SA-006-HAPPY, F-SA-006-NEGATIVE, F-SA-006-AUTHZ, F-SA-006-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SA-007 — Activity monitor

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Audit trail with filters, before/after diff, export.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-007`. **Data trace:** `P03/F-SA-007` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-007-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-SUPR-08 Activity monitor (`/super-admin/activity`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel.
- **API/data handles:** `P04/F-SA-007`; `P03/F-SA-007`.
- **Test handles:** F-SA-007-HAPPY, F-SA-007-NEGATIVE, F-SA-007-AUTHZ, F-SA-007-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SA-008 — Main-category management and tree

### Requirement and scope
- **Roles:** Super admin. **Priority:** P0.
- **Area dependencies:** X14 audit. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Only super admin edits main categories; category tree with keyword/synonym mapping.
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
- **Business rules:** BR-07, BR-12, BR-13.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, Role, City, Zone, Setting, Category needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, settings, geo, audit, catalog; handle `P04/F-SA-008`. **Data trace:** `P03/F-SA-008` (Admin, Role, City, Zone, Setting, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Super Admin only, platform-wide; protect administrative and global-setting mutations with the relevant permission and audit sensitive changes (BR-12).

### Acceptance criteria
1. **Happy path — F-SA-008-HAPPY**

   Given an authorized Super admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SA-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SA-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SA-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SA-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-05 Categories (`/admin/categories`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel.
- **API/data handles:** `P04/F-SA-008`; `P03/F-SA-008`.
- **Test handles:** F-SA-008-HAPPY, F-SA-008-NEGATIVE, F-SA-008-AUTHZ, F-SA-008-EMPTY-ERROR, -I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Test IDs |
|---|---|---|---|---|---|---|
| F-SA-001 | S-SUPR-01 | None specified | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, MapView | F-SA-001-HAPPY, F-SA-001-NEGATIVE, F-SA-001-AUTHZ, F-SA-001-EMPTY-ERROR, F-SA-001-I18N-HI-LONG |
| F-SA-002 | S-SUPR-02 | J10 | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel | F-SA-002-HAPPY, F-SA-002-NEGATIVE, F-SA-002-AUTHZ, F-SA-002-EMPTY-ERROR, F-SA-002-I18N-HI-LONG |
| F-SA-003 | S-SUPR-03 | J10 | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, AuditDiff | F-SA-003-HAPPY, F-SA-003-NEGATIVE, F-SA-003-AUTHZ, F-SA-003-EMPTY-ERROR, F-SA-003-I18N-HI-LONG |
| F-SA-004 | S-SUPR-04, S-SUPR-05 | J10 | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, MapView | F-SA-004-HAPPY, F-SA-004-NEGATIVE, F-SA-004-AUTHZ, F-SA-004-EMPTY-ERROR, F-SA-004-I18N-HI-LONG |
| F-SA-005 | S-SUPR-06 | None specified | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, ReviewForm | F-SA-005-HAPPY, F-SA-005-NEGATIVE, F-SA-005-AUTHZ, F-SA-005-EMPTY-ERROR, F-SA-005-I18N-HI-LONG |
| F-SA-006 | S-SUPR-07 | None specified | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel | F-SA-006-HAPPY, F-SA-006-NEGATIVE, F-SA-006-AUTHZ, F-SA-006-EMPTY-ERROR, F-SA-006-I18N-HI-LONG |
| F-SA-007 | S-SUPR-08 | None specified | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel | F-SA-007-HAPPY, F-SA-007-NEGATIVE, F-SA-007-AUTHZ, F-SA-007-EMPTY-ERROR, F-SA-007-I18N-HI-LONG |
| F-SA-008 | S-ADMN-05 | None specified | admin, settings, geo, audit, catalog | Admin, Role, City, Zone, Setting, Category | DashboardShell, DataTable, PermissionMatrix, ChartCard, CityCard, ZoneEditor, FilterPanel | F-SA-008-HAPPY, F-SA-008-NEGATIVE, F-SA-008-AUTHZ, F-SA-008-EMPTY-ERROR, F-SA-008-I18N-HI-LONG |
