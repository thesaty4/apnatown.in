# OR — Orders and tracking feature specification

## Contents

- [F-OR-001 — Orders list and detail](#f-or-001--orders-list-and-detail)
- [F-OR-002 — Order timelines](#f-or-002--order-timelines)
- [F-OR-003 — Live tracking with delivery OTP](#f-or-003--live-tracking-with-delivery-otp)
- [F-OR-004 — Pickup with code](#f-or-004--pickup-with-code)
- [F-OR-005 — Order actions](#f-or-005--order-actions)
- [F-OR-006 — Cancellation and refund flow](#f-or-006--cancellation-and-refund-flow)
- [F-OR-007 — Partial fulfilment and substitution](#f-or-007--partial-fulfilment-and-substitution)
- [F-OR-008 — Dispute visibility](#f-or-008--dispute-visibility)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-OR-001, F-OR-002, F-OR-003, F-OR-004, F-OR-005, F-OR-006, F-OR-007, F-OR-008 (8).
- **Area dependency:** CK, RD, 07 state machines
- **API modules:** orders, delivery, payments, notifications
- **Data concepts:** Order, OrderItem, Payment, DeliveryJob, Refund
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-OR-001 — Orders list and detail

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Active/completed/cancelled filters; detail with items, amounts, address, shop.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; login required; cancelled; refunded; partial fulfilment; failed delivery.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-001`. **Data trace:** `P03/F-OR-001` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-OR-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-13 My orders (`/orders`); S-CUST-14 Order detail and tracking (`/orders/:id`)
- **Journeys:** J1
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips.
- **API/data handles:** `P04/F-OR-001`; `P03/F-OR-001`.
- **Verification handles:** F-OR-001-HAPPY, F-OR-001-NEGATIVE, F-OR-001-AUTHZ, F-OR-001-EMPTY-ERROR, F-OR-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-OR-002 — Order timelines

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Delivery: placed, accepted, preparing, ready, out for delivery, delivered; pickup: placed, accepted, ready, picked up; plus cancelled, refunded.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refunded; partial fulfilment; failed delivery.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-002`. **Data trace:** `P03/F-OR-002` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-OR-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-14 Order detail and tracking (`/orders/:id`)
- **Journeys:** J1
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button.
- **API/data handles:** `P04/F-OR-002`; `P03/F-OR-002`.
- **Verification handles:** F-OR-002-HAPPY, F-OR-002-NEGATIVE, F-OR-002-AUTHZ, F-OR-002-EMPTY-ERROR, F-OR-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-OR-003 — Live tracking with delivery OTP

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Rider name, phone, rating, status, ETA; delivery OTP shown to customer.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refunded; partial fulfilment; failed delivery.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-003`. **Data trace:** `P03/F-OR-003` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-OR-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-14 Order detail and tracking (`/orders/:id`)
- **Journeys:** J1
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button, PhoneInput, OtpInput, Sheet.
- **API/data handles:** `P04/F-OR-003`; `P03/F-OR-003`.
- **Verification handles:** F-OR-003-HAPPY, F-OR-003-NEGATIVE, F-OR-003-AUTHZ, F-OR-003-EMPTY-ERROR, F-OR-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-OR-004 — Pickup with code

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Shop address, directions, instructions, pickup code.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refunded; partial fulfilment; failed delivery.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-004`. **Data trace:** `P03/F-OR-004` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-OR-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-14 Order detail and tracking (`/orders/:id`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button, MapView, AddressForm.
- **API/data handles:** `P04/F-OR-004`; `P03/F-OR-004`.
- **Verification handles:** F-OR-004-HAPPY, F-OR-004-NEGATIVE, F-OR-004-AUTHZ, F-OR-004-EMPTY-ERROR, F-OR-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-OR-005 — Order actions

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Cancel, request refund, report a problem, contact shop/rider, reorder, download invoice.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refunded; partial fulfilment; failed delivery.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-005`. **Data trace:** `P03/F-OR-005` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-OR-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-14 Order detail and tracking (`/orders/:id`); S-CUST-16 Invoice (`/orders/:id/invoice`)
- **Journeys:** J8
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button, DataTable, PermissionMatrix, AuditDiff.
- **API/data handles:** `P04/F-OR-005`; `P03/F-OR-005`.
- **Verification handles:** F-OR-005-HAPPY, F-OR-005-NEGATIVE, F-OR-005-AUTHZ, F-OR-005-EMPTY-ERROR, F-OR-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-OR-006 — Cancellation and refund flow

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Reason picker; 'Admin and vendor have been notified'; refund tracker requested/approved/completed.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refunded; partial fulfilment; failed delivery; window closed (24h).
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-006`. **Data trace:** `P03/F-OR-006` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-OR-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-14 Order detail and tracking (`/orders/:id`); S-CUST-15 Cancel / refund request (`/orders/:id/refund`)
- **Journeys:** J8
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button, DataTable, PermissionMatrix, AuditDiff.
- **API/data handles:** `P04/F-OR-006`; `P03/F-OR-006`.
- **Verification handles:** F-OR-006-HAPPY, F-OR-006-NEGATIVE, F-OR-006-AUTHZ, F-OR-006-EMPTY-ERROR, F-OR-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-OR-007 — Partial fulfilment and substitution

### Requirement and scope
- **Roles:** Customer, Vendor. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Vendor marks item unavailable; bill updated; customer notified.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refunded; partial fulfilment; failed delivery; refund requested.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-007`. **Data trace:** `P03/F-OR-007` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Restrict operations to the listed roles (Customer, Vendor); apply customer authentication/ownership, vendor or provider ownership and approval, rider assignment, and admin city/area/module scope only for the corresponding role and operation (BR-06/12/21).

### Acceptance criteria
1. **Happy path — F-OR-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-14 Order detail and tracking (`/orders/:id`); S-VEND-04 Vendor order detail (`/vendor/orders/:id`)
- **Journeys:** J8
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button.
- **API/data handles:** `P04/F-OR-007`; `P03/F-OR-007`.
- **Verification handles:** F-OR-007-HAPPY, F-OR-007-NEGATIVE, F-OR-007-AUTHZ, F-OR-007-EMPTY-ERROR, F-OR-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-OR-008 — Dispute visibility

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** CK, RD, 07 state machines. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Case status visible to customer.
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
- **Business rules:** BR-03, BR-04, BR-05, BR-20.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; cancelled; refunded; partial fulfilment; failed delivery.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Order, OrderItem, Payment, DeliveryJob, Refund needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) orders, delivery, payments, notifications; handle `P04/F-OR-008`. **Data trace:** `P03/F-OR-008` (Order, OrderItem, Payment, DeliveryJob, Refund); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-OR-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-OR-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-OR-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-OR-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-OR-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-14 Order detail and tracking (`/orders/:id`)
- **Journeys:** J8
- **Shared components:** OrderCard, Timeline, DeliveryCard, Button.
- **API/data handles:** `P04/F-OR-008`; `P03/F-OR-008`.
- **Verification handles:** F-OR-008-HAPPY, F-OR-008-NEGATIVE, F-OR-008-AUTHZ, F-OR-008-EMPTY-ERROR, F-OR-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-OR-001 | S-CUST-13, S-CUST-14 | J1 | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button, FilterPanel, SubcategoryMultiSelect, ActiveFilterChips | F-OR-001-HAPPY, F-OR-001-NEGATIVE, F-OR-001-AUTHZ, F-OR-001-EMPTY-ERROR, F-OR-001-I18N-HI-LONG |
| F-OR-002 | S-CUST-14 | J1 | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button | F-OR-002-HAPPY, F-OR-002-NEGATIVE, F-OR-002-AUTHZ, F-OR-002-EMPTY-ERROR, F-OR-002-I18N-HI-LONG |
| F-OR-003 | S-CUST-14 | J1 | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button, PhoneInput, OtpInput, Sheet | F-OR-003-HAPPY, F-OR-003-NEGATIVE, F-OR-003-AUTHZ, F-OR-003-EMPTY-ERROR, F-OR-003-I18N-HI-LONG |
| F-OR-004 | S-CUST-14 | None specified | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button, MapView, AddressForm | F-OR-004-HAPPY, F-OR-004-NEGATIVE, F-OR-004-AUTHZ, F-OR-004-EMPTY-ERROR, F-OR-004-I18N-HI-LONG |
| F-OR-005 | S-CUST-14, S-CUST-16 | J8 | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button, DataTable, PermissionMatrix, AuditDiff | F-OR-005-HAPPY, F-OR-005-NEGATIVE, F-OR-005-AUTHZ, F-OR-005-EMPTY-ERROR, F-OR-005-I18N-HI-LONG |
| F-OR-006 | S-CUST-14, S-CUST-15 | J8 | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button, DataTable, PermissionMatrix, AuditDiff | F-OR-006-HAPPY, F-OR-006-NEGATIVE, F-OR-006-AUTHZ, F-OR-006-EMPTY-ERROR, F-OR-006-I18N-HI-LONG |
| F-OR-007 | S-CUST-14, S-VEND-04 | J8 | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button | F-OR-007-HAPPY, F-OR-007-NEGATIVE, F-OR-007-AUTHZ, F-OR-007-EMPTY-ERROR, F-OR-007-I18N-HI-LONG |
| F-OR-008 | S-CUST-14 | J8 | orders, delivery, payments, notifications | Order, OrderItem, Payment, DeliveryJob, Refund | OrderCard, Timeline, DeliveryCard, Button | F-OR-008-HAPPY, F-OR-008-NEGATIVE, F-OR-008-AUTHZ, F-OR-008-EMPTY-ERROR, F-OR-008-I18N-HI-LONG |
