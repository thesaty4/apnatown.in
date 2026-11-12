# AC — Customer account and legal feature specification

## Contents

- [F-AC-001 — Profile and addresses](#f-ac-001--profile-and-addresses)
- [F-AC-002 — Payment methods](#f-ac-002--payment-methods)
- [F-AC-003 — Language and theme preferences](#f-ac-003--language-and-theme-preferences)
- [F-AC-004 — Privacy controls](#f-ac-004--privacy-controls)
- [F-AC-005 — Help and support](#f-ac-005--help-and-support)
- [F-AC-006 — Legal and about pages](#f-ac-006--legal-and-about-pages)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-AC-001, F-AC-002, F-AC-003, F-AC-004, F-AC-005, F-AC-006 (6).
- **Area dependency:** platform foundations
- **API modules:** users, auth, geo
- **Data concepts:** User, Address, Consent
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-AC-001 — Profile and addresses

### Requirement and scope
- **Roles:** Customer. **Priority:** P1.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Edit profile; saved addresses.
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
- **Business rules:** BR-14.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** User, Address, Consent needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, auth, geo; handle `P04/F-AC-001`. **Data trace:** `P03/F-AC-001` (User, Address, Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-AC-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AC-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AC-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AC-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AC-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-24 Account (`/account`); S-CUST-25 Profile (`/account/profile`); S-CUST-26 Addresses (`/account/addresses`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Input, AddressForm, Toggle, Button, MapView.
- **API/data handles:** `P04/F-AC-001`; `P03/F-AC-001`.
- **Verification handles:** F-AC-001-HAPPY, F-AC-001-NEGATIVE, F-AC-001-AUTHZ, F-AC-001-EMPTY-ERROR, F-AC-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-AC-002 — Payment methods

### Requirement and scope
- **Roles:** Customer. **Priority:** P1.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Saved methods list.
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
- **Business rules:** BR-14.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** User, Address, Consent needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, auth, geo; handle `P04/F-AC-002`. **Data trace:** `P03/F-AC-002` (User, Address, Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-AC-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AC-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AC-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AC-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AC-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-24 Account (`/account`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Input, AddressForm, Toggle, Button, ProductCard, QuantityStepper, PaymentMethodPicker.
- **API/data handles:** `P04/F-AC-002`; `P03/F-AC-002`.
- **Verification handles:** F-AC-002-HAPPY, F-AC-002-NEGATIVE, F-AC-002-AUTHZ, F-AC-002-EMPTY-ERROR, F-AC-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AC-003 — Language and theme preferences

### Requirement and scope
- **Roles:** Customer. **Priority:** P1.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Account-level settings.
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
- **Business rules:** BR-14.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** User, Address, Consent needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, auth, geo; handle `P04/F-AC-003`. **Data trace:** `P03/F-AC-003` (User, Address, Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-AC-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AC-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AC-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AC-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AC-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-24 Account (`/account`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Input, AddressForm, Toggle, Button, NotificationCard.
- **API/data handles:** `P04/F-AC-003`; `P03/F-AC-003`.
- **Verification handles:** F-AC-003-HAPPY, F-AC-003-NEGATIVE, F-AC-003-AUTHZ, F-AC-003-EMPTY-ERROR, F-AC-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-AC-004 — Privacy controls

### Requirement and scope
- **Roles:** Customer. **Priority:** P1.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Download/delete my data; consent management.
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
- **Business rules:** BR-14.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** User, Address, Consent needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, auth, geo; handle `P04/F-AC-004`. **Data trace:** `P03/F-AC-004` (User, Address, Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-AC-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AC-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AC-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AC-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AC-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-24 Account (`/account`); S-CUST-33 Privacy policy (`/privacy`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Input, AddressForm, Toggle, Button, NotificationCard.
- **API/data handles:** `P04/F-AC-004`; `P03/F-AC-004`.
- **Verification handles:** F-AC-004-HAPPY, F-AC-004-NEGATIVE, F-AC-004-AUTHZ, F-AC-004-EMPTY-ERROR, F-AC-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-AC-005 — Help and support

### Requirement and scope
- **Roles:** Customer. **Priority:** P1.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** FAQs, call, WhatsApp, message.
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
- **Business rules:** BR-14.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** User, Address, Consent needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, auth, geo; handle `P04/F-AC-005`. **Data trace:** `P03/F-AC-005` (User, Address, Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-AC-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AC-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AC-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AC-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AC-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-24 Account (`/account`); S-CUST-30 Help and support (`/help`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Input, AddressForm, Toggle, Button.
- **API/data handles:** `P04/F-AC-005`; `P03/F-AC-005`.
- **Verification handles:** F-AC-005-HAPPY, F-AC-005-NEGATIVE, F-AC-005-AUTHZ, F-AC-005-EMPTY-ERROR, F-AC-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-AC-006 — Legal and about pages

### Requirement and scope
- **Roles:** Customer. **Priority:** P1.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Terms, Privacy, Refund & cancellation policy, About us.
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
- **Business rules:** BR-14.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** User, Address, Consent needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, auth, geo; handle `P04/F-AC-006`. **Data trace:** `P03/F-AC-006` (User, Address, Consent); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-AC-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-AC-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-AC-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-AC-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-AC-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-24 Account (`/account`); S-CUST-31 About us (`/about`); S-CUST-32 Terms (`/terms`); S-CUST-33 Privacy policy (`/privacy`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Input, AddressForm, Toggle, Button, OrderCard, Timeline, DeliveryCard.
- **API/data handles:** `P04/F-AC-006`; `P03/F-AC-006`.
- **Verification handles:** F-AC-006-HAPPY, F-AC-006-NEGATIVE, F-AC-006-AUTHZ, F-AC-006-EMPTY-ERROR, F-AC-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-AC-001 | S-CUST-24, S-CUST-25, S-CUST-26 | None specified | users, auth, geo | User, Address, Consent | Input, AddressForm, Toggle, Button, MapView | F-AC-001-HAPPY, F-AC-001-NEGATIVE, F-AC-001-AUTHZ, F-AC-001-EMPTY-ERROR, F-AC-001-I18N-HI-LONG |
| F-AC-002 | S-CUST-24 | None specified | users, auth, geo | User, Address, Consent | Input, AddressForm, Toggle, Button, ProductCard, QuantityStepper, PaymentMethodPicker | F-AC-002-HAPPY, F-AC-002-NEGATIVE, F-AC-002-AUTHZ, F-AC-002-EMPTY-ERROR, F-AC-002-I18N-HI-LONG |
| F-AC-003 | S-CUST-24 | None specified | users, auth, geo | User, Address, Consent | Input, AddressForm, Toggle, Button, NotificationCard | F-AC-003-HAPPY, F-AC-003-NEGATIVE, F-AC-003-AUTHZ, F-AC-003-EMPTY-ERROR, F-AC-003-I18N-HI-LONG |
| F-AC-004 | S-CUST-24, S-CUST-33 | None specified | users, auth, geo | User, Address, Consent | Input, AddressForm, Toggle, Button, NotificationCard | F-AC-004-HAPPY, F-AC-004-NEGATIVE, F-AC-004-AUTHZ, F-AC-004-EMPTY-ERROR, F-AC-004-I18N-HI-LONG |
| F-AC-005 | S-CUST-24, S-CUST-30 | None specified | users, auth, geo | User, Address, Consent | Input, AddressForm, Toggle, Button | F-AC-005-HAPPY, F-AC-005-NEGATIVE, F-AC-005-AUTHZ, F-AC-005-EMPTY-ERROR, F-AC-005-I18N-HI-LONG |
| F-AC-006 | S-CUST-24, S-CUST-31, S-CUST-32, S-CUST-33 | None specified | users, auth, geo | User, Address, Consent | Input, AddressForm, Toggle, Button, OrderCard, Timeline, DeliveryCard | F-AC-006-HAPPY, F-AC-006-NEGATIVE, F-AC-006-AUTHZ, F-AC-006-EMPTY-ERROR, F-AC-006-I18N-HI-LONG |
