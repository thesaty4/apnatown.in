# RD — Rider app feature specification

## Contents

- [F-RD-001 — Rider signup and verification](#f-rd-001--rider-signup-and-verification)
- [F-RD-002 — Rider home](#f-rd-002--rider-home)
- [F-RD-003 — Delivery request with countdown](#f-rd-003--delivery-request-with-countdown)
- [F-RD-004 — Active delivery flow](#f-rd-004--active-delivery-flow)
- [F-RD-005 — Rider history](#f-rd-005--rider-history)
- [F-RD-006 — Rider earnings](#f-rd-006--rider-earnings)
- [F-RD-007 — Rider feedback](#f-rd-007--rider-feedback)
- [F-RD-008 — Rider profile and support](#f-rd-008--rider-profile-and-support)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-RD-001, F-RD-002, F-RD-003, F-RD-004, F-RD-005, F-RD-006, F-RD-007, F-RD-008 (8).
- **Area dependency:** AD2 approval, OR
- **API modules:** delivery, users, orders, geo
- **Data concepts:** Rider, DeliveryJob
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-RD-001 — Rider signup and verification

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Profile, selfie, vehicle, licence, ID, RC, bank/UPI, documents, approval states.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; pending; rejected; suspended.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-001`. **Data trace:** `P03/F-RD-001` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-001-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-01 Rider signup (`/rider/onboarding`)
- **Journeys:** J7, J11
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, OrderCard, DataTable.
- **API/data handles:** `P04/F-RD-001`; `P03/F-RD-001`.
- **Verification handles:** F-RD-001-HAPPY, F-RD-001-NEGATIVE, F-RD-001-AUTHZ, F-RD-001-EMPTY-ERROR, F-RD-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-RD-002 — Rider home

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Online/offline toggle, today's deliveries and earnings.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; not approved.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-002`. **Data trace:** `P03/F-RD-002` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-002-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-02 Rider home (`/rider/home`)
- **Journeys:** J7, J11
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, OrderCard.
- **API/data handles:** `P04/F-RD-002`; `P03/F-RD-002`.
- **Verification handles:** F-RD-002-HAPPY, F-RD-002-NEGATIVE, F-RD-002-AUTHZ, F-RD-002-EMPTY-ERROR, F-RD-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RD-003 — Delivery request with countdown

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Pickup shop, drop, distance, estimated earning, 60 s countdown, accept/reject.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; no requests; expired.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-003`. **Data trace:** `P03/F-RD-003` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-003-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-03 Delivery requests (`/rider/requests`)
- **Journeys:** J7, J11
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, AddressForm, OrderCard.
- **API/data handles:** `P04/F-RD-003`; `P03/F-RD-003`.
- **Verification handles:** F-RD-003-HAPPY, F-RD-003-NEGATIVE, F-RD-003-AUTHZ, F-RD-003-EMPTY-ERROR, F-RD-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RD-004 — Active delivery flow

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Accepted, reached shop, items check, picked up, navigation, reached drop, collect cash if COD, customer OTP, delivered; or failed with reason; masked call.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; wrong OTP; failed delivery.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-004`. **Data trace:** `P03/F-RD-004` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-004-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-04 Active delivery (`/rider/active`)
- **Journeys:** J7, J11
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, PhoneInput, OtpInput.
- **API/data handles:** `P04/F-RD-004`; `P03/F-RD-004`.
- **Verification handles:** F-RD-004-HAPPY, F-RD-004-NEGATIVE, F-RD-004-AUTHZ, F-RD-004-EMPTY-ERROR, F-RD-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RD-005 — Rider history

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Filters all/today/week; detail.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-005`. **Data trace:** `P03/F-RD-005` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-005-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-05 History (`/rider/history`)
- **Journeys:** J7, J11
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-RD-005`; `P03/F-RD-005`.
- **Verification handles:** F-RD-005-HAPPY, F-RD-005-NEGATIVE, F-RD-005-AUTHZ, F-RD-005-EMPTY-ERROR, F-RD-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RD-006 — Rider earnings

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Per-ride base + per-km, daily/weekly totals, payout status.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-006`. **Data trace:** `P03/F-RD-006` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-006-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-06 Earnings (`/rider/earnings`)
- **Journeys:** J7, J11
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, OrderCard.
- **API/data handles:** `P04/F-RD-006`; `P03/F-RD-006`.
- **Verification handles:** F-RD-006-HAPPY, F-RD-006-NEGATIVE, F-RD-006-AUTHZ, F-RD-006-EMPTY-ERROR, F-RD-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RD-007 — Rider feedback

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Ratings and comments.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-007`. **Data trace:** `P03/F-RD-007` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-007-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-07 Feedback (`/rider/feedback`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, ReviewForm, RatingBreakdown.
- **API/data handles:** `P04/F-RD-007`; `P03/F-RD-007`.
- **Verification handles:** F-RD-007-HAPPY, F-RD-007-NEGATIVE, F-RD-007-AUTHZ, F-RD-007-EMPTY-ERROR, F-RD-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RD-008 — Rider profile and support

### Requirement and scope
- **Roles:** Rider. **Priority:** P0.
- **Area dependencies:** AD2 approval, OR. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Documents, payout, language, support, dispute report.
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
- **Business rules:** BR-05, BR-06.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Rider, DeliveryJob needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) delivery, users, orders, geo; handle `P04/F-RD-008`. **Data trace:** `P03/F-RD-008` (Rider, DeliveryJob); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Approved, authenticated Rider, restricted to assigned jobs; customer contact is masked and OTPs are never disclosed (BR-05/06).

### Acceptance criteria
1. **Happy path — F-RD-008-HAPPY**

   Given an authorized Rider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RD-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RD-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RD-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RD-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-RIDE-08 Rider profile (`/rider/profile`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, NotificationCard, Toggle.
- **API/data handles:** `P04/F-RD-008`; `P03/F-RD-008`.
- **Verification handles:** F-RD-008-HAPPY, F-RD-008-NEGATIVE, F-RD-008-AUTHZ, F-RD-008-EMPTY-ERROR, F-RD-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-RD-001 | S-RIDE-01 | J7, J11 | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, OrderCard, DataTable | F-RD-001-HAPPY, F-RD-001-NEGATIVE, F-RD-001-AUTHZ, F-RD-001-EMPTY-ERROR, F-RD-001-I18N-HI-LONG |
| F-RD-002 | S-RIDE-02 | J7, J11 | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, OrderCard | F-RD-002-HAPPY, F-RD-002-NEGATIVE, F-RD-002-AUTHZ, F-RD-002-EMPTY-ERROR, F-RD-002-I18N-HI-LONG |
| F-RD-003 | S-RIDE-03 | J7, J11 | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, AddressForm, OrderCard | F-RD-003-HAPPY, F-RD-003-NEGATIVE, F-RD-003-AUTHZ, F-RD-003-EMPTY-ERROR, F-RD-003-I18N-HI-LONG |
| F-RD-004 | S-RIDE-04 | J7, J11 | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, PhoneInput, OtpInput | F-RD-004-HAPPY, F-RD-004-NEGATIVE, F-RD-004-AUTHZ, F-RD-004-EMPTY-ERROR, F-RD-004-I18N-HI-LONG |
| F-RD-005 | S-RIDE-05 | J7, J11 | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, FilterPanel, SubcategoryMultiSelect | F-RD-005-HAPPY, F-RD-005-NEGATIVE, F-RD-005-AUTHZ, F-RD-005-EMPTY-ERROR, F-RD-005-I18N-HI-LONG |
| F-RD-006 | S-RIDE-06 | J7, J11 | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, OrderCard | F-RD-006-HAPPY, F-RD-006-NEGATIVE, F-RD-006-AUTHZ, F-RD-006-EMPTY-ERROR, F-RD-006-I18N-HI-LONG |
| F-RD-007 | S-RIDE-07 | None specified | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, ReviewForm, RatingBreakdown | F-RD-007-HAPPY, F-RD-007-NEGATIVE, F-RD-007-AUTHZ, F-RD-007-EMPTY-ERROR, F-RD-007-I18N-HI-LONG |
| F-RD-008 | S-RIDE-08 | None specified | delivery, users, orders, geo | Rider, DeliveryJob | DashboardShell, DeliveryCard, Timeline, MapView, StatusBadge, NotificationCard, Toggle | F-RD-008-HAPPY, F-RD-008-NEGATIVE, F-RD-008-AUTHZ, F-RD-008-EMPTY-ERROR, F-RD-008-I18N-HI-LONG |
