# X — Cross-cutting platform feature specification

## Contents

- [F-X-001 — English/Hindi language toggle](#f-x-001--english-hindi-language-toggle)
- [F-X-002 — Theme light/dark/auto](#f-x-002--theme-light-dark-auto)
- [F-X-003 — Responsive layouts 360/tablet/desktop](#f-x-003--responsive-layouts-360-tablet-desktop)
- [F-X-004 — Accessibility (WCAG 2.2 AA)](#f-x-004--accessibility-wcag-2-2-aa)
- [F-X-005 — Offline banner](#f-x-005--offline-banner)
- [F-X-006 — Slow-connection / data-saver mode](#f-x-006--slow-connection-data-saver-mode)
- [F-X-007 — Five UX states on every screen](#f-x-007--five-ux-states-on-every-screen)
- [F-X-008 — Consent components](#f-x-008--consent-components)
- [F-X-009 — System pages](#f-x-009--system-pages)
- [F-X-010 — SEO page templates](#f-x-010--seo-page-templates)
- [F-X-011 — Print templates](#f-x-011--print-templates)
- [F-X-012 — Notification templates](#f-x-012--notification-templates)
- [F-X-013 — Indian formatting utilities](#f-x-013--indian-formatting-utilities)
- [F-X-014 — Audit trail](#f-x-014--audit-trail)
- [F-X-015 — Rider PWA behaviour](#f-x-015--rider-pwa-behaviour)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-X-001, F-X-002, F-X-003, F-X-004, F-X-005, F-X-006, F-X-007, F-X-008, F-X-009, F-X-010, F-X-011, F-X-012, F-X-013, F-X-014, F-X-015 (15).
- **Area dependency:** platform foundations
- **API modules:** packages/shared, packages/ui, users, communications, auth, businesses, products, services, catalog, orders, notifications, audit, admin, delivery; exact modules are listed per feature below.
- **Data concepts:** Feature-specific; see each feature's data trace below.
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-X-001 — English/Hindi language toggle

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Switch EN/HI anywhere (top bar, footer, account, splash). Every user-facing string has both; long Hindi labels wrap, never truncate. Choice persisted.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; outside service area banner; location denied.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** User/device language preference and language catalogue required for rendering; disclose only fields appropriate to the actor scope.
- **Write:** Persist language choice; its profile/device owner and storage remain open under A-16. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/shared, packages/ui; handle `P04/F-X-001`. **Data trace:** `P03/F-X-001` (UserPreference); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-001-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-01 Home (`/`); S-CUST-38 Design system and checklists (`(internal) /design-system`)
- **Journeys:** J13
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-001`; `P03/F-X-001`.
- **Verification handles:** F-X-001-HAPPY, F-X-001-NEGATIVE, F-X-001-AUTHZ, F-X-001-EMPTY-ERROR, F-X-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-002 — Theme light/dark/auto

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Light is default; dark and auto (system) supported through tokens. All colours from tokens; status never by colour alone.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; outside service area banner; location denied.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Current theme mode and token set; no persistent record is specified in the source; disclose only fields appropriate to the actor scope.
- **Write:** No business-data write is specified. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/shared, packages/ui; handle `P04/F-X-002`. **Data trace:** `P03/F-X-002` (None (presentation preference)); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-002-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-01 Home (`/`); S-CUST-38 Design system and checklists (`(internal) /design-system`)
- **Journeys:** J13
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-002`; `P03/F-X-002`.
- **Verification handles:** F-X-002-HAPPY, F-X-002-NEGATIVE, F-X-002-AUTHZ, F-X-002-EMPTY-ERROR, F-X-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-003 — Responsive layouts 360/tablet/desktop

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Mobile-first 360px base; tablet >=600px; desktop >=900px, container max 1200px. Tables collapse to labelled cards on mobile; filters become sheet/bar/sidebar.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; outside service area banner; location denied.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Viewport and responsive layout state; disclose only fields appropriate to the actor scope.
- **Write:** No persistent write. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/ui; handle `P04/F-X-003`. **Data trace:** `P03/F-X-003` (None (presentation-only)); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-003-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-01 Home (`/`); S-CUST-38 Design system and checklists (`(internal) /design-system`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-003`; `P03/F-X-003`.
- **Verification handles:** F-X-003-HAPPY, F-X-003-NEGATIVE, F-X-003-AUTHZ, F-X-003-EMPTY-ERROR, F-X-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-X-004 — Accessibility (WCAG 2.2 AA)

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Keyboard operation, visible 3px focus ring, 48px touch targets, ARIA only where needed, focus trap in dialogs/sheets/viewer, reduced-motion alternatives, labels on icon buttons.
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
- **Business rules:** BR-22.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Keyboard, focus, motion and assistive-technology state; disclose only fields appropriate to the actor scope.
- **Write:** No persistent write. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/ui; handle `P04/F-X-004`. **Data trace:** `P03/F-X-004` (None (presentation-only)); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-004-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-38 Design system and checklists (`(internal) /design-system`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-004`; `P03/F-X-004`.
- **Verification handles:** F-X-004-HAPPY, F-X-004-NEGATIVE, F-X-004-AUTHZ, F-X-004-EMPTY-ERROR, F-X-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-005 — Offline banner

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Banner when offline with retry; cached shells still render; reels show offline state.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Browser connectivity and cached-shell availability; disclose only fields appropriate to the actor scope.
- **Write:** No persistent write. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/ui; handle `P04/F-X-005`. **Data trace:** `P03/F-X-005` (None (presentation-only)); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-005-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-36 Offline (`/offline`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-005`; `P03/F-X-005`.
- **Verification handles:** F-X-005-HAPPY, F-X-005-NEGATIVE, F-X-005-AUTHZ, F-X-005-EMPTY-ERROR, F-X-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-006 — Slow-connection / data-saver mode

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Lite mode: no autoplay, lazy media, smaller images, 'Tap to play' posters. Toggle in demo/settings and honours the browser Save-Data hint.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Toggle state and browser Save-Data hint; disclose only fields appropriate to the actor scope.
- **Write:** No persistent write is specified. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/shared, packages/ui; handle `P04/F-X-006`. **Data trace:** `P03/F-X-006` (None (transient preference)); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-006-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-006`; `P03/F-X-006`.
- **Verification handles:** F-X-006-HAPPY, F-X-006-NEGATIVE, F-X-006-AUTHZ, F-X-006-EMPTY-ERROR, F-X-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-007 — Five UX states on every screen

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Default, loading skeleton, empty (helpful + one action), error (with retry), no-permission. Plus offline/success where relevant.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; outside service area banner; location denied.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Screen rendering state; disclose only fields appropriate to the actor scope.
- **Write:** No persistent write. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/ui; handle `P04/F-X-007`. **Data trace:** `P03/F-X-007` (None (presentation-only)); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-007-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-01 Home (`/`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-007`; `P03/F-X-007`.
- **Verification handles:** F-X-007-HAPPY, F-X-007-NEGATIVE, F-X-007-AUTHZ, F-X-007-EMPTY-ERROR, F-X-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-008 — Consent components

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Cookie consent banner and WhatsApp opt-in with explicit text; consent recorded with timestamp and purpose; easy opt-out.
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
- **Business rules:** BR-11.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Consent purpose, timestamp and current opt-in/opt-out state; disclose only fields appropriate to the actor scope.
- **Write:** Record or withdraw consent with purpose and timestamp; honor opt-outs. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, communications; handle `P04/F-X-008`. **Data trace:** `P03/F-X-008` (Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-X-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-23 Notification preferences (`/account/preferences`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-008`; `P03/F-X-008`.
- **Verification handles:** F-X-008-HAPPY, F-X-008-NEGATIVE, F-X-008-AUTHZ, F-X-008-EMPTY-ERROR, F-X-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-009 — System pages

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** 404, 500 ('hit a snag'), offline, maintenance, session expired, account deleted ('bye'), each with a clear action.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Session validity and account-deletion completion state as needed for the system page; disclose only fields appropriate to the actor scope.
- **Write:** Logout/session expiry invalidates the session through auth; page rendering itself writes none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) auth, users, packages/ui; handle `P04/F-X-009`. **Data trace:** `P03/F-X-009` (Session, User); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-009-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-28 Session expired (`/session-expired`); S-CUST-29 Account deleted (`/goodbye`); S-CUST-34 Not found (`/404`); S-CUST-35 Server error (`/500`); S-CUST-36 Offline (`/offline`); S-CUST-37 Maintenance (`/maintenance`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-009`; `P03/F-X-009`.
- **Verification handles:** F-X-009-HAPPY, F-X-009-NEGATIVE, F-X-009-AUTHZ, F-X-009-EMPTY-ERROR, F-X-009-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-010 — SEO page templates

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Server-rendered business, product, service, category pages with readable URLs, breadcrumbs, metadata, JSON-LD and canonical rules.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no subcategory match; listing not live; closed; outside delivery range; no services yet; no services; out of stock + notify-me; offer expired; offer out of stock; unavailable; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Public business/product/service/category data used to render SEO pages and metadata; disclose only fields appropriate to the actor scope.
- **Write:** No write; render public pages and metadata from source records. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, catalog; handle `P04/F-X-010`. **Data trace:** `P03/F-X-010` (Business, Product, Service, Category); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-X-010-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-010-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-010-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-010-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-010-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-05 Category page (`/category/:slug`); S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`); S-CUST-08 Product details (`/product/:slug`); S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-010`; `P03/F-X-010`.
- **Verification handles:** F-X-010-HAPPY, F-X-010-NEGATIVE, F-X-010-AUTHZ, F-X-010-EMPTY-ERROR, F-X-010-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-X-011 — Print templates

### Requirement and scope
- **Roles:** Vendor, Provider, Admin. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Printable QR poster / table-tent / sticker, invoice, order slip (browser print to PDF).
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner and order data required to render the selected printable template; disclose only fields appropriate to the actor scope.
- **Write:** No business-data write; printing is client initiated. Physical schemas are deferred to P03.
- **API trace:** owner module(s) businesses, products, services, orders; handle `P04/F-X-011`. **Data trace:** `P03/F-X-011` (Business, Product, Service, Order); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Restrict operations to the listed roles (Vendor, Provider, Admin); apply customer authentication/ownership, vendor or provider ownership and approval, rider assignment, and admin city/area/module scope only for the corresponding role and operation (BR-06/12/21).

### Acceptance criteria
1. **Happy path — F-X-011-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-011-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-011-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-011-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-011-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-16 Invoice (`/orders/:id/invoice`); S-VEND-10 QR and links (`/vendor/qr`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-011`; `P03/F-X-011`.
- **Verification handles:** F-X-011-HAPPY, F-X-011-NEGATIVE, F-X-011-AUTHZ, F-X-011-EMPTY-ERROR, F-X-011-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-X-012 — Notification templates

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** In-app, email and WhatsApp templates for order placed, out for delivery, delivered, cancelled/refund, approval decision, new enquiry, subcategory/video/offer decisions, rider assigned, refund approved, follower announcements. EN+HI.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Template, recipient preferences and consent eligibility required by each source-triggered notification; disclose only fields appropriate to the actor scope.
- **Write:** Dispatch only source-triggered notifications through the owning module; no generic UI mutation. Physical schemas are deferred to P03.
- **API trace:** owner module(s) notifications, communications; handle `P04/F-X-012`. **Data trace:** `P03/F-X-012` (NotificationTemplate, Notification, NotificationPreference, Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-012-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-012-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-012-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-012-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-012-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-22 Notifications (`/notifications`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-012`; `P03/F-X-012`.
- **Verification handles:** F-X-012-HAPPY, F-X-012-NEGATIVE, F-X-012-AUTHZ, F-X-012-EMPTY-ERROR, F-X-012-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-X-013 — Indian formatting utilities

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** INR from integer paise with Indian grouping, IST 12-hour time, '7 Nov 2026' dates, distance in km, +91 phone formatting. One shared implementation.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Integer paise, UTC timestamps, distances and phone values supplied by the calling feature; disclose only fields appropriate to the actor scope.
- **Write:** No persistent write. Physical schemas are deferred to P03.
- **API trace:** owner module(s) packages/shared; handle `P04/F-X-013`. **Data trace:** `P03/F-X-013` (None (formatting utilities)); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-X-013-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-013-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-013-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-013-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-013-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-013`; `P03/F-X-013`.
- **Verification handles:** F-X-013-HAPPY, F-X-013-NEGATIVE, F-X-013-AUTHZ, F-X-013-EMPTY-ERROR, F-X-013-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-X-014 — Audit trail

### Requirement and scope
- **Roles:** Admin, Super admin. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Append-only log of admin and sensitive actions with actor, action, before/after, time; searchable; exportable.
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
- **Business rules:** BR-12.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Actor, action, before/after values and event time within the permitted admin scope; disclose only fields appropriate to the actor scope.
- **Write:** Append audit records for admin and sensitive actions; export is read-only. Physical schemas are deferred to P03.
- **API trace:** owner module(s) audit, admin; handle `P04/F-X-014`. **Data trace:** `P03/F-X-014` (AuditLog, Admin); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin actions require granted modules and assigned city/area/zone; Super Admin actions have platform scope. Sensitive admin actions are audited (BR-12).

### Acceptance criteria
1. **Happy path — F-X-014-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-014-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-014-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-014-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.


5. **Hindi/long text — F-X-014-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the audit trail renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-16 Audit log (`/admin/audit`); S-SUPR-08 Activity monitor (`/super-admin/activity`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-014`; `P03/F-X-014`.
- **Verification handles:** F-X-014-HAPPY, F-X-014-NEGATIVE, F-X-014-AUTHZ, F-X-014-EMPTY-ERROR, F-X-014-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-X-015 — Rider PWA behaviour

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Installable, mobile-first, large controls, works on weak networks, background-safe request countdown.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; not approved.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Approved rider profile, assigned delivery job and server countdown state; disclose only fields appropriate to the actor scope.
- **Write:** Delivery status changes only through the delivery state machine; the countdown is server authoritative. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery; handle `P04/F-X-015`. **Data trace:** `P03/F-X-015` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-X-015-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-X-015-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-X-015-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-X-015-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-X-015-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-02 Rider home (`/rider/home`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge.
- **API/data handles:** `P04/F-X-015`; `P03/F-X-015`.
- **Verification handles:** F-X-015-HAPPY, F-X-015-NEGATIVE, F-X-015-AUTHZ, F-X-015-EMPTY-ERROR, F-X-015-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-X-001 | S-CUST-01, S-CUST-38 | J13 | packages/shared, packages/ui | UserPreference | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-001-HAPPY, F-X-001-NEGATIVE, F-X-001-AUTHZ, F-X-001-EMPTY-ERROR, F-X-001-I18N-HI-LONG |
| F-X-002 | S-CUST-01, S-CUST-38 | J13 | packages/shared, packages/ui | None (presentation preference) | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-002-HAPPY, F-X-002-NEGATIVE, F-X-002-AUTHZ, F-X-002-EMPTY-ERROR, F-X-002-I18N-HI-LONG |
| F-X-003 | S-CUST-01, S-CUST-38 | None specified | packages/ui | None (presentation-only) | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-003-HAPPY, F-X-003-NEGATIVE, F-X-003-AUTHZ, F-X-003-EMPTY-ERROR, F-X-003-I18N-HI-LONG |
| F-X-004 | S-CUST-38 | None specified | packages/ui | None (presentation-only) | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-004-HAPPY, F-X-004-NEGATIVE, F-X-004-AUTHZ, F-X-004-EMPTY-ERROR, F-X-004-I18N-HI-LONG |
| F-X-005 | S-CUST-36 | None specified | packages/ui | None (presentation-only) | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-005-HAPPY, F-X-005-NEGATIVE, F-X-005-AUTHZ, F-X-005-EMPTY-ERROR, F-X-005-I18N-HI-LONG |
| F-X-006 | S-CUST-21 | None specified | packages/shared, packages/ui | None (transient preference) | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-006-HAPPY, F-X-006-NEGATIVE, F-X-006-AUTHZ, F-X-006-EMPTY-ERROR, F-X-006-I18N-HI-LONG |
| F-X-007 | S-CUST-01 | None specified | packages/ui | None (presentation-only) | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-007-HAPPY, F-X-007-NEGATIVE, F-X-007-AUTHZ, F-X-007-EMPTY-ERROR, F-X-007-I18N-HI-LONG |
| F-X-008 | S-CUST-23 | None specified | users, communications | Consent | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-008-HAPPY, F-X-008-NEGATIVE, F-X-008-AUTHZ, F-X-008-EMPTY-ERROR, F-X-008-I18N-HI-LONG |
| F-X-009 | S-CUST-28, S-CUST-29, S-CUST-34, S-CUST-35, S-CUST-36, S-CUST-37 | None specified | auth, users, packages/ui | Session, User | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-009-HAPPY, F-X-009-NEGATIVE, F-X-009-AUTHZ, F-X-009-EMPTY-ERROR, F-X-009-I18N-HI-LONG |
| F-X-010 | S-CUST-05, S-CUST-06, S-CUST-07, S-CUST-08, S-CUST-09 | None specified | businesses, products, services, catalog | Business, Product, Service, Category | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-010-HAPPY, F-X-010-NEGATIVE, F-X-010-AUTHZ, F-X-010-EMPTY-ERROR, F-X-010-I18N-HI-LONG |
| F-X-011 | S-CUST-16, S-VEND-10 | None specified | businesses, products, services, orders | Business, Product, Service, Order | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-011-HAPPY, F-X-011-NEGATIVE, F-X-011-AUTHZ, F-X-011-EMPTY-ERROR, F-X-011-I18N-HI-LONG |
| F-X-012 | S-CUST-22 | None specified | notifications, communications | NotificationTemplate, Notification, NotificationPreference, Consent | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-012-HAPPY, F-X-012-NEGATIVE, F-X-012-AUTHZ, F-X-012-EMPTY-ERROR, F-X-012-I18N-HI-LONG |
| F-X-013 | S-CUST-08 | None specified | packages/shared | None (formatting utilities) | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-013-HAPPY, F-X-013-NEGATIVE, F-X-013-AUTHZ, F-X-013-EMPTY-ERROR, F-X-013-I18N-HI-LONG |
| F-X-014 | S-ADMN-16, S-SUPR-08 | None specified | audit, admin | AuditLog, Admin | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-014-HAPPY, F-X-014-NEGATIVE, F-X-014-AUTHZ, F-X-014-EMPTY-ERROR, F-X-014-I18N-HI-LONG |
| F-X-015 | S-RIDE-02 | None specified | delivery | Rider, DeliveryJob | Button, IconButton, AppShell, DashboardShell, EmptyState, OfflineBanner, StatusBadge | F-X-015-HAPPY, F-X-015-NEGATIVE, F-X-015-AUTHZ, F-X-015-EMPTY-ERROR, F-X-015-I18N-HI-LONG |
