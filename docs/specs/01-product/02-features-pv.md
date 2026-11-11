# PV — Service provider dashboard feature specification

## Contents

- [F-PV-001 — Provider onboarding](#f-pv-001--provider-onboarding)
- [F-PV-002 — Provider profile with expert-in](#f-pv-002--provider-profile-with-expert-in)
- [F-PV-003 — Provider services manager](#f-pv-003--provider-services-manager)
- [F-PV-004 — Enquiries inbox](#f-pv-004--enquiries-inbox)
- [F-PV-005 — Provider products and orders](#f-pv-005--provider-products-and-orders)
- [F-PV-006 — Provider reviews, QR, analytics, followers, media](#f-pv-006--provider-reviews-qr-analytics-followers-media)
- [F-PV-007 — Booking placeholders](#f-pv-007--booking-placeholders)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-PV-001, F-PV-002, F-PV-003, F-PV-004, F-PV-005, F-PV-006, F-PV-007 (7).
- **Area dependency:** AD2 approval
- **API modules:** users, businesses, services, orders, reviews, media-videos, engagement
- **Data concepts:** Owner, Service, Enquiry, Video
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-PV-001 — Provider onboarding

### Requirement and scope
- **Roles:** Provider. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Same wizard as vendor.
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
- **Business rules:** BR-06, BR-08.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; pending; rejected; suspended.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Service, Enquiry, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, services, orders, reviews, media-videos, engagement; handle `P04/F-PV-001`. **Data trace:** `P03/F-PV-001` (Owner, Service, Enquiry, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Provider, restricted to the owner’s own profile and records; approval is required for selling capabilities (BR-06).

### Acceptance criteria
1. **Happy path — F-PV-001-HAPPY**

   Given an authorized Provider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PV-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PV-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PV-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PV-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-PROV-01 Provider signup wizard (`/provider/onboarding`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle.
- **API/data handles:** `P04/F-PV-001`; `P03/F-PV-001`.
- **Test handles:** F-PV-001-HAPPY, F-PV-001-NEGATIVE, F-PV-001-AUTHZ, F-PV-001-EMPTY-ERROR, F-PV-001-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PV-002 — Provider profile with expert-in

### Requirement and scope
- **Roles:** Provider. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Category, expert-in multi-select, description, contact, location and service area, gallery, hours.
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
- **Business rules:** BR-06, BR-08.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Service, Enquiry, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, services, orders, reviews, media-videos, engagement; handle `P04/F-PV-002`. **Data trace:** `P03/F-PV-002` (Owner, Service, Enquiry, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Provider, restricted to the owner’s own profile and records; approval is required for selling capabilities (BR-06).

### Acceptance criteria
1. **Happy path — F-PV-002-HAPPY**

   Given an authorized Provider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PV-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PV-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PV-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PV-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-PROV-09 Provider profile editor (`/provider/profile`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, FilterPanel.
- **API/data handles:** `P04/F-PV-002`; `P03/F-PV-002`.
- **Test handles:** F-PV-002-HAPPY, F-PV-002-NEGATIVE, F-PV-002-AUTHZ, F-PV-002-EMPTY-ERROR, F-PV-002-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PV-003 — Provider services manager

### Requirement and scope
- **Roles:** Provider. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** As vendor services manager.
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
- **Business rules:** BR-06, BR-08.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Service, Enquiry, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, services, orders, reviews, media-videos, engagement; handle `P04/F-PV-003`. **Data trace:** `P03/F-PV-003` (Owner, Service, Enquiry, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Provider, restricted to the owner’s own profile and records; approval is required for selling capabilities (BR-06).

### Acceptance criteria
1. **Happy path — F-PV-003-HAPPY**

   Given an authorized Provider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PV-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PV-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PV-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PV-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-PROV-08 Provider services manager (`/provider/services`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle.
- **API/data handles:** `P04/F-PV-003`; `P03/F-PV-003`.
- **Test handles:** F-PV-003-HAPPY, F-PV-003-NEGATIVE, F-PV-003-AUTHZ, F-PV-003-EMPTY-ERROR, F-PV-003-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PV-004 — Enquiries inbox

### Requirement and scope
- **Roles:** Provider. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** List/detail, statuses new -> contacted -> converted -> closed, call/WhatsApp reply, filters.
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
- **Business rules:** BR-06, BR-08.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Service, Enquiry, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, services, orders, reviews, media-videos, engagement; handle `P04/F-PV-004`. **Data trace:** `P03/F-PV-004` (Owner, Service, Enquiry, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Provider, restricted to the owner’s own profile and records; approval is required for selling capabilities (BR-06).

### Acceptance criteria
1. **Happy path — F-PV-004-HAPPY**

   Given an authorized Provider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PV-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PV-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PV-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PV-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-PROV-03 Provider enquiries (`/provider/enquiries(/:id)`)
- **Journeys:** J14
- **Shared components:** DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, FilterPanel.
- **API/data handles:** `P04/F-PV-004`; `P03/F-PV-004`.
- **Test handles:** F-PV-004-HAPPY, F-PV-004-NEGATIVE, F-PV-004-AUTHZ, F-PV-004-EMPTY-ERROR, F-PV-004-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PV-005 — Provider products and orders

### Requirement and scope
- **Roles:** Provider. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** A provider can also list products and handle orders.
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
- **Business rules:** BR-06, BR-08.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Service, Enquiry, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, services, orders, reviews, media-videos, engagement; handle `P04/F-PV-005`. **Data trace:** `P03/F-PV-005` (Owner, Service, Enquiry, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Provider, restricted to the owner’s own profile and records; approval is required for selling capabilities (BR-06).

### Acceptance criteria
1. **Happy path — F-PV-005-HAPPY**

   Given an authorized Provider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PV-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PV-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PV-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PV-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-PROV-04 Provider orders (`/provider/orders`); S-PROV-05 Provider order detail (`/provider/orders/:id`); S-PROV-06 Provider products (`/provider/products`); S-PROV-07 Provider product editor (`/provider/products/:id`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, OrderCard.
- **API/data handles:** `P04/F-PV-005`; `P03/F-PV-005`.
- **Test handles:** F-PV-005-HAPPY, F-PV-005-NEGATIVE, F-PV-005-AUTHZ, F-PV-005-EMPTY-ERROR, F-PV-005-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PV-006 — Provider reviews, QR, analytics, followers, media

### Requirement and scope
- **Roles:** Provider. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Reviews, QR/share link, analytics (views, enquiries, conversion), followers, videos/gallery managers, notifications, account.
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
- **Business rules:** BR-06, BR-08.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Service, Enquiry, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, services, orders, reviews, media-videos, engagement; handle `P04/F-PV-006`. **Data trace:** `P03/F-PV-006` (Owner, Service, Enquiry, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Provider, restricted to the owner’s own profile and records; approval is required for selling capabilities (BR-06).

### Acceptance criteria
1. **Happy path — F-PV-006-HAPPY**

   Given an authorized Provider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PV-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PV-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PV-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PV-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-PROV-02 Provider overview (`/provider/overview`); S-PROV-10 Provider reviews (`/provider/reviews`); S-PROV-11 Provider followers (`/provider/followers`); S-PROV-12 Provider media (`/provider/media`); S-PROV-13 Provider QR (`/provider/qr`); S-PROV-14 Provider analytics (`/provider/analytics`); S-PROV-16 Provider account (`/provider/account`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, ReviewForm.
- **API/data handles:** `P04/F-PV-006`; `P03/F-PV-006`.
- **Test handles:** F-PV-006-HAPPY, F-PV-006-NEGATIVE, F-PV-006-AUTHZ, F-PV-006-EMPTY-ERROR, F-PV-006-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PV-007 — Booking placeholders

### Requirement and scope
- **Roles:** Provider. **Priority:** P0.
- **Area dependencies:** AD2 approval. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Booking/appointment/quotation/payment behind feature flag (off).
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
- **Business rules:** BR-06, BR-08.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Owner, Service, Enquiry, Video needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) users, businesses, services, orders, reviews, media-videos, engagement; handle `P04/F-PV-007`. **Data trace:** `P03/F-PV-007` (Owner, Service, Enquiry, Video); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Authenticated Provider, restricted to the owner’s own profile and records; approval is required for selling capabilities (BR-06).

### Acceptance criteria
1. **Happy path — F-PV-007-HAPPY**

   Given an authorized Provider and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PV-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PV-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PV-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PV-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-PROV-08 Provider services manager (`/provider/services`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, ProductCard.
- **API/data handles:** `P04/F-PV-007`; `P03/F-PV-007`.
- **Test handles:** F-PV-007-HAPPY, F-PV-007-NEGATIVE, F-PV-007-AUTHZ, F-PV-007-EMPTY-ERROR, F-PV-007-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Test IDs |
|---|---|---|---|---|---|---|
| F-PV-001 | S-PROV-01 | None specified | users, businesses, services, orders, reviews, media-videos, engagement | Owner, Service, Enquiry, Video | DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle | F-PV-001-HAPPY, F-PV-001-NEGATIVE, F-PV-001-AUTHZ, F-PV-001-EMPTY-ERROR, F-PV-001-I18N-HI-LONG |
| F-PV-002 | S-PROV-09 | None specified | users, businesses, services, orders, reviews, media-videos, engagement | Owner, Service, Enquiry, Video | DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, FilterPanel | F-PV-002-HAPPY, F-PV-002-NEGATIVE, F-PV-002-AUTHZ, F-PV-002-EMPTY-ERROR, F-PV-002-I18N-HI-LONG |
| F-PV-003 | S-PROV-08 | None specified | users, businesses, services, orders, reviews, media-videos, engagement | Owner, Service, Enquiry, Video | DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle | F-PV-003-HAPPY, F-PV-003-NEGATIVE, F-PV-003-AUTHZ, F-PV-003-EMPTY-ERROR, F-PV-003-I18N-HI-LONG |
| F-PV-004 | S-PROV-03 | J14 | users, businesses, services, orders, reviews, media-videos, engagement | Owner, Service, Enquiry, Video | DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, FilterPanel | F-PV-004-HAPPY, F-PV-004-NEGATIVE, F-PV-004-AUTHZ, F-PV-004-EMPTY-ERROR, F-PV-004-I18N-HI-LONG |
| F-PV-005 | S-PROV-04, S-PROV-05, S-PROV-06, S-PROV-07 | None specified | users, businesses, services, orders, reviews, media-videos, engagement | Owner, Service, Enquiry, Video | DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, OrderCard | F-PV-005-HAPPY, F-PV-005-NEGATIVE, F-PV-005-AUTHZ, F-PV-005-EMPTY-ERROR, F-PV-005-I18N-HI-LONG |
| F-PV-006 | S-PROV-02, S-PROV-10, S-PROV-11, S-PROV-12, S-PROV-13, S-PROV-14, S-PROV-16 | None specified | users, businesses, services, orders, reviews, media-videos, engagement | Owner, Service, Enquiry, Video | DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, ReviewForm | F-PV-006-HAPPY, F-PV-006-NEGATIVE, F-PV-006-AUTHZ, F-PV-006-EMPTY-ERROR, F-PV-006-I18N-HI-LONG |
| F-PV-007 | S-PROV-08 | None specified | users, businesses, services, orders, reviews, media-videos, engagement | Owner, Service, Enquiry, Video | DashboardShell, DataTable, Input, ServiceCard, EnquiryForm, MediaConsentToggle, ProductCard | F-PV-007-HAPPY, F-PV-007-NEGATIVE, F-PV-007-AUTHZ, F-PV-007-EMPTY-ERROR, F-PV-007-I18N-HI-LONG |
