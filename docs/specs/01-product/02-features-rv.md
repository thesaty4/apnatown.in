# RV — Reviews feature specification

## Contents

- [F-RV-001 — Review flows by target](#f-rv-001--review-flows-by-target)
- [F-RV-002 — Eligibility](#f-rv-002--eligibility)
- [F-RV-003 — Rating, text, photos, tags](#f-rv-003--rating-text-photos-tags)
- [F-RV-004 — Edit/delete and My reviews](#f-rv-004--edit-delete-and-my-reviews)
- [F-RV-005 — Helpful and report](#f-rv-005--helpful-and-report)
- [F-RV-006 — Moderation of risky content](#f-rv-006--moderation-of-risky-content)
- [F-RV-007 — Owner reply and report](#f-rv-007--owner-reply-and-report)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-RV-001, F-RV-002, F-RV-003, F-RV-004, F-RV-005, F-RV-006, F-RV-007 (7).
- **Area dependency:** platform foundations
- **API modules:** reviews, media-videos
- **Data concepts:** Review
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-RV-001 — Review flows by target

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Business, product, service/provider, rider; separate forms.
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
- **Business rules:** BR-09.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; not eligible.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) reviews, media-videos; handle `P04/F-RV-001`. **Data trace:** `P03/F-RV-001` (Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RV-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RV-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RV-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RV-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RV-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-18 Write a review (`/reviews/new?target=`)
- **Journeys:** J1
- **Shared components:** ReviewForm, RatingBreakdown, ReviewCard, Button, OrderCard, Timeline, DeliveryCard.
- **API/data handles:** `P04/F-RV-001`; `P03/F-RV-001`.
- **Test handles:** F-RV-001-HAPPY, F-RV-001-NEGATIVE, F-RV-001-AUTHZ, F-RV-001-EMPTY-ERROR, F-RV-001-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-RV-002 — Eligibility

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Verified purchasers or enquirers only; otherwise explanatory message.
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
- **Business rules:** BR-09.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; not eligible.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) reviews, media-videos; handle `P04/F-RV-002`. **Data trace:** `P03/F-RV-002` (Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RV-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RV-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RV-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RV-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RV-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-18 Write a review (`/reviews/new?target=`)
- **Journeys:** J1, J14
- **Shared components:** ReviewForm, RatingBreakdown, ReviewCard, Button, ServiceCard, EnquiryForm.
- **API/data handles:** `P04/F-RV-002`; `P03/F-RV-002`.
- **Test handles:** F-RV-002-HAPPY, F-RV-002-NEGATIVE, F-RV-002-AUTHZ, F-RV-002-EMPTY-ERROR, F-RV-002-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RV-003 — Rating, text, photos, tags

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Star input, text, photos, quick tags per target type.
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
- **Business rules:** BR-09.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; not eligible.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) reviews, media-videos; handle `P04/F-RV-003`. **Data trace:** `P03/F-RV-003` (Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RV-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RV-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RV-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RV-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RV-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-18 Write a review (`/reviews/new?target=`)
- **Journeys:** J1
- **Shared components:** ReviewForm, RatingBreakdown, ReviewCard, Button, MediaCarousel, GalleryGrid, ReelsPlayer.
- **API/data handles:** `P04/F-RV-003`; `P03/F-RV-003`.
- **Test handles:** F-RV-003-HAPPY, F-RV-003-NEGATIVE, F-RV-003-AUTHZ, F-RV-003-EMPTY-ERROR, F-RV-003-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RV-004 — Edit/delete and My reviews

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Manage own reviews.
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
- **Business rules:** BR-09.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) reviews, media-videos; handle `P04/F-RV-004`. **Data trace:** `P03/F-RV-004` (Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RV-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RV-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RV-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RV-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RV-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-17 My reviews (`/my-reviews`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ReviewForm, RatingBreakdown, ReviewCard, Button.
- **API/data handles:** `P04/F-RV-004`; `P03/F-RV-004`.
- **Test handles:** F-RV-004-HAPPY, F-RV-004-NEGATIVE, F-RV-004-AUTHZ, F-RV-004-EMPTY-ERROR, F-RV-004-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-RV-005 — Helpful and report

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Mark helpful; report review.
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
- **Business rules:** BR-09.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; out of stock + notify-me; offer expired; offer out of stock; unavailable; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) reviews, media-videos; handle `P04/F-RV-005`. **Data trace:** `P03/F-RV-005` (Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RV-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RV-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RV-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RV-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RV-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-08 Product details (`/product/:slug`); S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ReviewForm, RatingBreakdown, ReviewCard, Button, DataTable, PermissionMatrix, AuditDiff.
- **API/data handles:** `P04/F-RV-005`; `P03/F-RV-005`.
- **Test handles:** F-RV-005-HAPPY, F-RV-005-NEGATIVE, F-RV-005-AUTHZ, F-RV-005-EMPTY-ERROR, F-RV-005-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-RV-006 — Moderation of risky content

### Requirement and scope
- **Roles:** Admin. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Links/abusive words held pending; approve/hide/delete.
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
- **Business rules:** BR-09.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) reviews, media-videos; handle `P04/F-RV-006`. **Data trace:** `P03/F-RV-006` (Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Admin only; each request requires the granted module action and assigned city/area/zone, with sensitive changes audited (BR-12).

### Acceptance criteria
1. **Happy path — F-RV-006-HAPPY**

   Given an authorized Admin and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RV-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RV-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RV-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RV-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-ADMN-10 Review moderation (`/admin/reviews`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ReviewForm, RatingBreakdown, ReviewCard, Button.
- **API/data handles:** `P04/F-RV-006`; `P03/F-RV-006`.
- **Test handles:** F-RV-006-HAPPY, F-RV-006-NEGATIVE, F-RV-006-AUTHZ, F-RV-006-EMPTY-ERROR, F-RV-006-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RV-007 — Owner reply and report

### Requirement and scope
- **Roles:** Vendor, Provider. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Reply to reviews; report abusive reviews.
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
- **Business rules:** BR-09.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) reviews, media-videos; handle `P04/F-RV-007`. **Data trace:** `P03/F-RV-007` (Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Restrict operations to the listed roles (Vendor, Provider); apply customer authentication/ownership, vendor or provider ownership and approval, rider assignment, and admin city/area/module scope only for the corresponding role and operation (BR-06/12/21).

### Acceptance criteria
1. **Happy path — F-RV-007-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RV-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RV-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RV-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RV-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-09 Reviews (`/vendor/reviews`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ReviewForm, RatingBreakdown, ReviewCard, Button, DataTable, PermissionMatrix, AuditDiff.
- **API/data handles:** `P04/F-RV-007`; `P03/F-RV-007`.
- **Test handles:** F-RV-007-HAPPY, F-RV-007-NEGATIVE, F-RV-007-AUTHZ, F-RV-007-EMPTY-ERROR, F-RV-007-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Test IDs |
|---|---|---|---|---|---|---|
| F-RV-001 | S-CUST-18 | J1 | reviews, media-videos | Review | ReviewForm, RatingBreakdown, ReviewCard, Button, OrderCard, Timeline, DeliveryCard | F-RV-001-HAPPY, F-RV-001-NEGATIVE, F-RV-001-AUTHZ, F-RV-001-EMPTY-ERROR, F-RV-001-I18N-HI-LONG |
| F-RV-002 | S-CUST-18 | J1, J14 | reviews, media-videos | Review | ReviewForm, RatingBreakdown, ReviewCard, Button, ServiceCard, EnquiryForm | F-RV-002-HAPPY, F-RV-002-NEGATIVE, F-RV-002-AUTHZ, F-RV-002-EMPTY-ERROR, F-RV-002-I18N-HI-LONG |
| F-RV-003 | S-CUST-18 | J1 | reviews, media-videos | Review | ReviewForm, RatingBreakdown, ReviewCard, Button, MediaCarousel, GalleryGrid, ReelsPlayer | F-RV-003-HAPPY, F-RV-003-NEGATIVE, F-RV-003-AUTHZ, F-RV-003-EMPTY-ERROR, F-RV-003-I18N-HI-LONG |
| F-RV-004 | S-CUST-17 | None specified | reviews, media-videos | Review | ReviewForm, RatingBreakdown, ReviewCard, Button | F-RV-004-HAPPY, F-RV-004-NEGATIVE, F-RV-004-AUTHZ, F-RV-004-EMPTY-ERROR, F-RV-004-I18N-HI-LONG |
| F-RV-005 | S-CUST-06, S-CUST-08, S-CUST-09 | None specified | reviews, media-videos | Review | ReviewForm, RatingBreakdown, ReviewCard, Button, DataTable, PermissionMatrix, AuditDiff | F-RV-005-HAPPY, F-RV-005-NEGATIVE, F-RV-005-AUTHZ, F-RV-005-EMPTY-ERROR, F-RV-005-I18N-HI-LONG |
| F-RV-006 | S-ADMN-10 | None specified | reviews, media-videos | Review | ReviewForm, RatingBreakdown, ReviewCard, Button | F-RV-006-HAPPY, F-RV-006-NEGATIVE, F-RV-006-AUTHZ, F-RV-006-EMPTY-ERROR, F-RV-006-I18N-HI-LONG |
| F-RV-007 | S-VEND-09 | None specified | reviews, media-videos | Review | ReviewForm, RatingBreakdown, ReviewCard, Button, DataTable, PermissionMatrix, AuditDiff | F-RV-007-HAPPY, F-RV-007-NEGATIVE, F-RV-007-AUTHZ, F-RV-007-EMPTY-ERROR, F-RV-007-I18N-HI-LONG |
