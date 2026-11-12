# LC — Location and discovery feature specification

## Contents

- [F-LC-001 — GPS detection and manual location](#f-lc-001--gps-detection-and-manual-location)
- [F-LC-002 — Map and list views](#f-lc-002--map-and-list-views)
- [F-LC-003 — Directions](#f-lc-003--directions)
- [F-LC-004 — Nearby vs Delivers-to-me distinction](#f-lc-004--nearby-vs-delivers-to-me-distinction)
- [F-LC-005 — Location states](#f-lc-005--location-states)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-LC-001, F-LC-002, F-LC-003, F-LC-004, F-LC-005 (5).
- **Area dependency:** platform foundations
- **API modules:** geo
- **Data concepts:** Address, Zone, City
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-LC-001 — GPS detection and manual location

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Detect position, or choose area/locality/PIN; saved locations; stored in session.
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
- **Read:** Address, Zone, City needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) geo; handle `P04/F-LC-001`. **Data trace:** `P03/F-LC-001` (Address, Zone, City); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-LC-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-LC-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-LC-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-LC-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-LC-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-01 Home (`/`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** MapView, AddressForm, Select, Sheet, PhoneInput, OtpInput.
- **API/data handles:** `P04/F-LC-001`; `P03/F-LC-001`.
- **Verification handles:** F-LC-001-HAPPY, F-LC-001-NEGATIVE, F-LC-001-AUTHZ, F-LC-001-EMPTY-ERROR, F-LC-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-LC-002 — Map and list views

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Schematic map with shop pins, radius slider (1-12 km, default 6), 'you are here'; list toggle.
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
- **Read:** Address, Zone, City needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) geo; handle `P04/F-LC-002`. **Data trace:** `P03/F-LC-002` (Address, Zone, City); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-LC-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-LC-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-LC-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-LC-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-LC-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** MapView, AddressForm, Select, Sheet.
- **API/data handles:** `P04/F-LC-002`; `P03/F-LC-002`.
- **Verification handles:** F-LC-002-HAPPY, F-LC-002-NEGATIVE, F-LC-002-AUTHZ, F-LC-002-EMPTY-ERROR, F-LC-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-LC-003 — Directions

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Opens the device maps app with the destination.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; no services; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Address, Zone, City needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) geo; handle `P04/F-LC-003`. **Data trace:** `P03/F-LC-003` (Address, Zone, City); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-LC-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-LC-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-LC-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-LC-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-LC-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-07 Service provider profile (`/provider/:slug`); S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** MapView, AddressForm, Select, Sheet.
- **API/data handles:** `P04/F-LC-003`; `P03/F-LC-003`.
- **Verification handles:** F-LC-003-HAPPY, F-LC-003-NEGATIVE, F-LC-003-AUTHZ, F-LC-003-EMPTY-ERROR, F-LC-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-LC-004 — Nearby vs Delivers-to-me distinction

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Badges and messages separate 'Nearby (distance)' from 'Delivers to your address'.
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
- **Read:** Address, Zone, City needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) geo; handle `P04/F-LC-004`. **Data trace:** `P03/F-LC-004` (Address, Zone, City); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-LC-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-LC-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-LC-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-LC-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-LC-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-02 Explore (`/explore?tab=&category=&subcategory=`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** MapView, AddressForm, Select, Sheet.
- **API/data handles:** `P04/F-LC-004`; `P03/F-LC-004`.
- **Verification handles:** F-LC-004-HAPPY, F-LC-004-NEGATIVE, F-LC-004-AUTHZ, F-LC-004-EMPTY-ERROR, F-LC-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-LC-005 — Location states

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Permission denied, GPS off, outside service area ('We are not in your city yet' + notify-me with phone).
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
- **Read:** Address, Zone, City needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) geo; handle `P04/F-LC-005`. **Data trace:** `P03/F-LC-005` (Address, Zone, City); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-LC-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-LC-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-LC-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-LC-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-LC-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-01 Home (`/`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** MapView, AddressForm, Select, Sheet, ServiceCard, EnquiryForm, DataTable.
- **API/data handles:** `P04/F-LC-005`; `P03/F-LC-005`.
- **Verification handles:** F-LC-005-HAPPY, F-LC-005-NEGATIVE, F-LC-005-AUTHZ, F-LC-005-EMPTY-ERROR, F-LC-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-LC-001 | S-CUST-01 | None specified | geo | Address, Zone, City | MapView, AddressForm, Select, Sheet, PhoneInput, OtpInput | F-LC-001-HAPPY, F-LC-001-NEGATIVE, F-LC-001-AUTHZ, F-LC-001-EMPTY-ERROR, F-LC-001-I18N-HI-LONG |
| F-LC-002 | S-CUST-02 | None specified | geo | Address, Zone, City | MapView, AddressForm, Select, Sheet | F-LC-002-HAPPY, F-LC-002-NEGATIVE, F-LC-002-AUTHZ, F-LC-002-EMPTY-ERROR, F-LC-002-I18N-HI-LONG |
| F-LC-003 | S-CUST-06, S-CUST-07, S-CUST-09 | None specified | geo | Address, Zone, City | MapView, AddressForm, Select, Sheet | F-LC-003-HAPPY, F-LC-003-NEGATIVE, F-LC-003-AUTHZ, F-LC-003-EMPTY-ERROR, F-LC-003-I18N-HI-LONG |
| F-LC-004 | S-CUST-02 | None specified | geo | Address, Zone, City | MapView, AddressForm, Select, Sheet | F-LC-004-HAPPY, F-LC-004-NEGATIVE, F-LC-004-AUTHZ, F-LC-004-EMPTY-ERROR, F-LC-004-I18N-HI-LONG |
| F-LC-005 | S-CUST-01 | None specified | geo | Address, Zone, City | MapView, AddressForm, Select, Sheet, ServiceCard, EnquiryForm, DataTable | F-LC-005-HAPPY, F-LC-005-NEGATIVE, F-LC-005-AUTHZ, F-LC-005-EMPTY-ERROR, F-LC-005-I18N-HI-LONG |
