# AD — Admin feature specification

## Contents

- [F-AD-001 — Admin overview](#f-ad-001--admin-overview)
- [F-AD-002 — Approvals](#f-ad-002--approvals)
- [F-AD-003 — Listings management](#f-ad-003--listings-management)
- [F-AD-004 — Users management](#f-ad-004--users-management)
- [F-AD-005 — Categories and tree preview](#f-ad-005--categories-and-tree-preview)
- [F-AD-006 — Subcategory suggestion queue](#f-ad-006--subcategory-suggestion-queue)
- [F-AD-007 — Orders and disputes](#f-ad-007--orders-and-disputes)
- [F-AD-008 — Live deliveries map](#f-ad-008--live-deliveries-map)
- [F-AD-009 — Review moderation](#f-ad-009--review-moderation)
- [F-AD-010 — Video moderation queue](#f-ad-010--video-moderation-queue)
- [F-AD-011 — Promotions](#f-ad-011--promotions)
- [F-AD-012 — Communications](#f-ad-012--communications)
- [F-AD-013 — Reports](#f-ad-013--reports)
- [F-AD-014 — Audit log](#f-ad-014--audit-log)
- [F-AD-015 — Search keyword mapping tool](#f-ad-015--search-keyword-mapping-tool)
- [F-AD-016 — Permission-aware UI](#f-ad-016--permission-aware-ui)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-AD-001, F-AD-002, F-AD-003, F-AD-004, F-AD-005, F-AD-006, F-AD-007, F-AD-008, F-AD-009, F-AD-010, F-AD-011, F-AD-012, F-AD-013, F-AD-014, F-AD-015, F-AD-016 (16).
- **Area dependency:** SA3 roles and permissions
- **API modules:** admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search
- **Data concepts:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-AD-001 — Admin overview

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** KPIs, approvals queue, live orders, alerts.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no permission modules hidden/disabled.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-001`. **Data trace:** `P03/F-AD-001` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-001-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-01 Admin overview (`/admin/overview`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, OrderCard.
- **API/data handles:** `P04/F-AD-001`; `P03/F-AD-001`.
- **Verification handles:** F-AD-001-HAPPY, F-AD-001-NEGATIVE, F-AD-001-AUTHZ, F-AD-001-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-002 — Approvals

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Business/provider/rider queues, document viewer, approve/reject/request changes with reason, history, notification.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-002`. **Data trace:** `P03/F-AD-002` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-002-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-02 Approvals (`/admin/approvals(/:id)`)
- **Journeys:** J7
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, NotificationCard.
- **API/data handles:** `P04/F-AD-002`; `P03/F-AD-002`.
- **Verification handles:** F-AD-002-HAPPY, F-AD-002-NEGATIVE, F-AD-002-AUTHZ, F-AD-002-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-AD-003 — Listings management

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Create, edit status/details, remove; unpublish products.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-003`. **Data trace:** `P03/F-AD-003` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-003-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-03 Listings (`/admin/listings`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, ProductCard.
- **API/data handles:** `P04/F-AD-003`; `P03/F-AD-003`.
- **Verification handles:** F-AD-003-HAPPY, F-AD-003-NEGATIVE, F-AD-003-AUTHZ, F-AD-003-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-AD-004 — Users management

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Customers, vendors, riders; search, profile, order history, suspend/reactivate.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-004`. **Data trace:** `P03/F-AD-004` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-004-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-04 Users (`/admin/users`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel.
- **API/data handles:** `P04/F-AD-004`; `P03/F-AD-004`.
- **Verification handles:** F-AD-004-HAPPY, F-AD-004-NEGATIVE, F-AD-004-AUTHZ, F-AD-004-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-005 — Categories and tree preview

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** View fixed main categories; subcategory tree with service types, keywords, filter preview.
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
- **Business rules:** BR-07, BR-12, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-005`. **Data trace:** `P03/F-AD-005` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-005-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-05 Categories (`/admin/categories`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel.
- **API/data handles:** `P04/F-AD-005`; `P03/F-AD-005`.
- **Verification handles:** F-AD-005-HAPPY, F-AD-005-NEGATIVE, F-AD-005-AUTHZ, F-AD-005-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-006 — Subcategory suggestion queue

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Pending/Approved/Rejected/Merged; approve, reject with reason, merge, duplicate warning, notify suggester.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-006`. **Data trace:** `P03/F-AD-006` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-006-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-06 Subcategory suggestions (`/admin/subcategory-suggestions`)
- **Journeys:** J9
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel.
- **API/data handles:** `P04/F-AD-006`; `P03/F-AD-006`.
- **Verification handles:** F-AD-006-HAPPY, F-AD-006-NEGATIVE, F-AD-006-AUTHZ, F-AD-006-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-AD-007 — Orders and disputes

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** All orders, disputed/refund/failed cases, workflow open -> in review -> resolved, notes, refund approval/completion, rider assign/reassign.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; resolved.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-007`. **Data trace:** `P03/F-AD-007` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-007-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-07 Orders and disputes (`/admin/orders`); S-ADMN-08 Case detail (`/admin/orders/:id`)
- **Journeys:** J8
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, ReviewForm.
- **API/data handles:** `P04/F-AD-007`; `P03/F-AD-007`.
- **Verification handles:** F-AD-007-HAPPY, F-AD-007-NEGATIVE, F-AD-007-AUTHZ, F-AD-007-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-008 — Live deliveries map

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** City filter (All with cluster pins/one city), side list, empty state.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty city.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-008`. **Data trace:** `P03/F-AD-008` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-008-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-09 Live deliveries (`/admin/live`)
- **Journeys:** J10
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel.
- **API/data handles:** `P04/F-AD-008`; `P03/F-AD-008`.
- **Verification handles:** F-AD-008-HAPPY, F-AD-008-NEGATIVE, F-AD-008-AUTHZ, F-AD-008-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-009 — Review moderation

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Reported/pending/removed; approve, hide, delete.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-009`. **Data trace:** `P03/F-AD-009` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-009-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-10 Review moderation (`/admin/reviews`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, ReviewForm.
- **API/data handles:** `P04/F-AD-009`; `P03/F-AD-009`.
- **Verification handles:** F-AD-009-HAPPY, F-AD-009-NEGATIVE, F-AD-009-AUTHZ, F-AD-009-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-010 — Video moderation queue

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Pending/approved/rejected/removed/reported, reasons, engagement report.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-010`. **Data trace:** `P03/F-AD-010` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-010-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-010-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-010-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-010-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-010-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-11 Videos and moderation (`/admin/videos`)
- **Journeys:** J6
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, MediaCarousel.
- **API/data handles:** `P04/F-AD-010`; `P03/F-AD-010`.
- **Verification handles:** F-AD-010-HAPPY, F-AD-010-NEGATIVE, F-AD-010-AUTHZ, F-AD-010-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-011 — Promotions

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Homepage banners, featured businesses, offer approvals.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-011`. **Data trace:** `P03/F-AD-011` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-011-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-011-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-011-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-011-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-011-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-12 Promotions (`/admin/promotions`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, OfferCard.
- **API/data handles:** `P04/F-AD-011`; `P03/F-AD-011`.
- **Verification handles:** F-AD-011-HAPPY, F-AD-011-NEGATIVE, F-AD-011-AUTHZ, F-AD-011-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-AD-012 — Communications

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Searchable audience combobox, scope Overall/City/Zone (permission-aware), templates, channels WhatsApp/in-app/email, consent-aware counts, preview, schedule, review-before-send summary, delivery report with opt-outs.
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
- **Business rules:** BR-07, BR-11, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; scope not allowed.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-012`. **Data trace:** `P03/F-AD-012` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-012-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-012-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-012-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-012-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-012-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-13 Communications (`/admin/communications`)
- **Journeys:** J10
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel.
- **API/data handles:** `P04/F-AD-012`; `P03/F-AD-012`.
- **Verification handles:** F-AD-012-HAPPY, F-AD-012-NEGATIVE, F-AD-012-AUTHZ, F-AD-012-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-013 — Reports

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Orders, revenue, vendor and rider performance, enquiries; CSV export.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-013`. **Data trace:** `P03/F-AD-013` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-013-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-013-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-013-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-013-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-013-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-14 Reports (`/admin/reports`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, OrderCard.
- **API/data handles:** `P04/F-AD-013`; `P03/F-AD-013`.
- **Verification handles:** F-AD-013-HAPPY, F-AD-013-NEGATIVE, F-AD-013-AUTHZ, F-AD-013-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-014 — Audit log

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Search and before/after.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-014`. **Data trace:** `P03/F-AD-014` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-014-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-014-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-014-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-014-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-014-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-16 Audit log (`/admin/audit`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel.
- **API/data handles:** `P04/F-AD-014`; `P03/F-AD-014`.
- **Verification handles:** F-AD-014-HAPPY, F-AD-014-NEGATIVE, F-AD-014-AUTHZ, F-AD-014-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-015 — Search keyword mapping tool

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Keyword + synonyms (Hindi/Hinglish) to categories, subcategories, tags; results preview.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-015`. **Data trace:** `P03/F-AD-015` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-015-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-015-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-015-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-015-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-015-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-15 Search keywords (`/admin/keywords`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel.
- **API/data handles:** `P04/F-AD-015`; `P03/F-AD-015`.
- **Verification handles:** F-AD-015-HAPPY, F-AD-015-NEGATIVE, F-AD-015-AUTHZ, F-AD-015-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AD-016 — Permission-aware UI

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** SA3 roles and permissions. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Sections without permission show 'You don't have permission' state.
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
- **Business rules:** BR-07, BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no permission modules hidden/disabled.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search; handle `P04/F-AD-016`. **Data trace:** `P03/F-AD-016` (Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-AD-016-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AD-016-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AD-016-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AD-016-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AD-016-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-01 Admin overview (`/admin/overview`); S-ADMN-17 Admin profile (`/admin/profile`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff.
- **API/data handles:** `P04/F-AD-016`; `P03/F-AD-016`.
- **Verification handles:** F-AD-016-HAPPY, F-AD-016-NEGATIVE, F-AD-016-AUTHZ, F-AD-016-EMPTY-ERROR, -I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-AD-001 | S-ADMN-01 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, OrderCard | F-AD-001-HAPPY, F-AD-001-NEGATIVE, F-AD-001-AUTHZ, F-AD-001-EMPTY-ERROR, F-AD-001-I18N-HI-LONG |
| F-AD-002 | S-ADMN-02 | J7 | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, NotificationCard | F-AD-002-HAPPY, F-AD-002-NEGATIVE, F-AD-002-AUTHZ, F-AD-002-EMPTY-ERROR, F-AD-002-I18N-HI-LONG |
| F-AD-003 | S-ADMN-03 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, ProductCard | F-AD-003-HAPPY, F-AD-003-NEGATIVE, F-AD-003-AUTHZ, F-AD-003-EMPTY-ERROR, F-AD-003-I18N-HI-LONG |
| F-AD-004 | S-ADMN-04 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel | F-AD-004-HAPPY, F-AD-004-NEGATIVE, F-AD-004-AUTHZ, F-AD-004-EMPTY-ERROR, F-AD-004-I18N-HI-LONG |
| F-AD-005 | S-ADMN-05 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel | F-AD-005-HAPPY, F-AD-005-NEGATIVE, F-AD-005-AUTHZ, F-AD-005-EMPTY-ERROR, F-AD-005-I18N-HI-LONG |
| F-AD-006 | S-ADMN-06 | J9 | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel | F-AD-006-HAPPY, F-AD-006-NEGATIVE, F-AD-006-AUTHZ, F-AD-006-EMPTY-ERROR, F-AD-006-I18N-HI-LONG |
| F-AD-007 | S-ADMN-07, S-ADMN-08 | J8 | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, ReviewForm | F-AD-007-HAPPY, F-AD-007-NEGATIVE, F-AD-007-AUTHZ, F-AD-007-EMPTY-ERROR, F-AD-007-I18N-HI-LONG |
| F-AD-008 | S-ADMN-09 | J10 | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel | F-AD-008-HAPPY, F-AD-008-NEGATIVE, F-AD-008-AUTHZ, F-AD-008-EMPTY-ERROR, F-AD-008-I18N-HI-LONG |
| F-AD-009 | S-ADMN-10 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, ReviewForm | F-AD-009-HAPPY, F-AD-009-NEGATIVE, F-AD-009-AUTHZ, F-AD-009-EMPTY-ERROR, F-AD-009-I18N-HI-LONG |
| F-AD-010 | S-ADMN-11 | J6 | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, MediaCarousel | F-AD-010-HAPPY, F-AD-010-NEGATIVE, F-AD-010-AUTHZ, F-AD-010-EMPTY-ERROR, F-AD-010-I18N-HI-LONG |
| F-AD-011 | S-ADMN-12 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, OfferCard | F-AD-011-HAPPY, F-AD-011-NEGATIVE, F-AD-011-AUTHZ, F-AD-011-EMPTY-ERROR, F-AD-011-I18N-HI-LONG |
| F-AD-012 | S-ADMN-13 | J10 | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel | F-AD-012-HAPPY, F-AD-012-NEGATIVE, F-AD-012-AUTHZ, F-AD-012-EMPTY-ERROR, F-AD-012-I18N-HI-LONG |
| F-AD-013 | S-ADMN-14 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, OrderCard | F-AD-013-HAPPY, F-AD-013-NEGATIVE, F-AD-013-AUTHZ, F-AD-013-EMPTY-ERROR, F-AD-013-I18N-HI-LONG |
| F-AD-014 | S-ADMN-16 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel | F-AD-014-HAPPY, F-AD-014-NEGATIVE, F-AD-014-AUTHZ, F-AD-014-EMPTY-ERROR, F-AD-014-I18N-HI-LONG |
| F-AD-015 | S-ADMN-15 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff, FilterPanel | F-AD-015-HAPPY, F-AD-015-NEGATIVE, F-AD-015-AUTHZ, F-AD-015-EMPTY-ERROR, F-AD-015-I18N-HI-LONG |
| F-AD-016 | S-ADMN-01, S-ADMN-17 | None specified | admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search | Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign | DashboardShell, DataTable, PermissionMatrix, ConfirmImpactDialog, ApprovalDocumentViewer, AuditDiff | F-AD-016-HAPPY, F-AD-016-NEGATIVE, F-AD-016-AUTHZ, F-AD-016-EMPTY-ERROR, F-AD-016-I18N-HI-LONG |
