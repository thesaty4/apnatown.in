# SV — Services feature specification

## Contents

- [F-SV-001 — Service card](#f-sv-001--service-card)
- [F-SV-002 — Service details page](#f-sv-002--service-details-page)
- [F-SV-003 — Provider card on service](#f-sv-003--provider-card-on-service)
- [F-SV-004 — Reference videos and previous work](#f-sv-004--reference-videos-and-previous-work)
- [F-SV-005 — Send Enquiry form](#f-sv-005--send-enquiry-form)
- [F-SV-006 — Offers, reviews, FAQs, related](#f-sv-006--offers-reviews-faqs-related)
- [F-SV-007 — Service breadcrumbs](#f-sv-007--service-breadcrumbs)
- [F-SV-008 — One subcategory per service](#f-sv-008--one-subcategory-per-service)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, F-SV-008 (8).
- **Area dependency:** PF, OF, RL, VD14
- **API modules:** services, businesses, offers, reviews, media-videos, engagement
- **Data concepts:** Service, Owner, Enquiry
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-SV-001 — Service card

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Image, name, subcategory tag, provider with logo/verified, price or 'Price on enquiry', rating, distance, open/availability badge, offer badge, Call/WhatsApp/Save; used in Search, Explore, profile, category pages.
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-001`. **Data trace:** `P03/F-SV-001` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SV-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-04 Services home (`/services`); S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** J2
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-SV-001`; `P03/F-SV-001`.
- **Verification handles:** F-SV-001-HAPPY, F-SV-001-NEGATIVE, F-SV-001-AUTHZ, F-SV-001-EMPTY-ERROR, F-SV-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SV-002 — Service details page

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** /service/:slug with carousel, title, subcategory, price type and unit (per hour/day/event/sq ft or enquiry), description, included/excluded, area, hours, experience.
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-002`. **Data trace:** `P03/F-SV-002` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SV-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** J2
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-SV-002`; `P03/F-SV-002`.
- **Verification handles:** F-SV-002-HAPPY, F-SV-002-NEGATIVE, F-SV-002-AUTHZ, F-SV-002-EMPTY-ERROR, F-SV-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-SV-003 — Provider card on service

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Profile link, follow, verified, rating, Call/WhatsApp/Directions.
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-003`. **Data trace:** `P03/F-SV-003` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SV-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** J2
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, MapView, AddressForm.
- **API/data handles:** `P04/F-SV-003`; `P03/F-SV-003`.
- **Verification handles:** F-SV-003-HAPPY, F-SV-003-NEGATIVE, F-SV-003-AUTHZ, F-SV-003-EMPTY-ERROR, F-SV-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-SV-004 — Reference videos and previous work

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Embedded videos tagged to the service; gallery of previous work.
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-004`. **Data trace:** `P03/F-SV-004` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SV-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** J2
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, GalleryGrid, ReelsPlayer.
- **API/data handles:** `P04/F-SV-004`; `P03/F-SV-004`.
- **Verification handles:** F-SV-004-HAPPY, F-SV-004-NEGATIVE, F-SV-004-AUTHZ, F-SV-004-EMPTY-ERROR, F-SV-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SV-005 — Send Enquiry form

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Name, phone, message, preferred date, success state; primary CTA. Booking/payment is a future placeholder (feature flag off).
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-005`. **Data trace:** `P03/F-SV-005` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SV-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** J2, J14
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, ProductCard, QuantityStepper.
- **API/data handles:** `P04/F-SV-005`; `P03/F-SV-005`.
- **Verification handles:** F-SV-005-HAPPY, F-SV-005-NEGATIVE, F-SV-005-AUTHZ, F-SV-005-EMPTY-ERROR, F-SV-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SV-006 — Offers, reviews, FAQs, related

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Service offers, ratings with breakdown and form, FAQs, related services, similar providers, share, bookmark.
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-006`. **Data trace:** `P03/F-SV-006` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SV-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** J2
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, RatingBreakdown, ReviewCard.
- **API/data handles:** `P04/F-SV-006`; `P03/F-SV-006`.
- **Verification handles:** F-SV-006-HAPPY, F-SV-006-NEGATIVE, F-SV-006-AUTHZ, F-SV-006-EMPTY-ERROR, F-SV-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SV-007 — Service breadcrumbs

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Services > Category > Subcategory > Service, each linking to Explore Services with filters.
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-007`. **Data trace:** `P03/F-SV-007` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-SV-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-09 Service details (`/service/:slug`)
- **Journeys:** J2
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-SV-007`; `P03/F-SV-007`.
- **Verification handles:** F-SV-007-HAPPY, F-SV-007-NEGATIVE, F-SV-007-AUTHZ, F-SV-007-EMPTY-ERROR, F-SV-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-SV-008 — One subcategory per service

### Requirement and scope
- **Roles:** Vendor, Provider, Admin. **Priority:** P0.
- **Area dependencies:** PF, OF, RL, VD14. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Each service has exactly one subcategory; provider can be expert in several.
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
- **Business rules:** BR-08, BR-18.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; no services; enquiry success; no videos; service paused.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Service, Owner, Enquiry needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) services, businesses, offers, reviews, media-videos, engagement; handle `P04/F-SV-008`. **Data trace:** `P03/F-SV-008` (Service, Owner, Enquiry); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Restrict operations to the listed roles (Vendor, Provider, Admin); apply customer authentication/ownership, vendor or provider ownership and approval, rider assignment, and admin city/area/module scope only for the corresponding role and operation (BR-06/12/21).

### Acceptance criteria
1. **Happy path — F-SV-008-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-SV-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-SV-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-SV-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-SV-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-07 Service provider profile (`/provider/:slug`); S-CUST-09 Service details (`/service/:slug`); S-VEND-13 Services manager (`/vendor/services`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-SV-008`; `P03/F-SV-008`.
- **Verification handles:** F-SV-008-HAPPY, F-SV-008-NEGATIVE, F-SV-008-AUTHZ, F-SV-008-EMPTY-ERROR, F-SV-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-SV-001 | S-CUST-04, S-CUST-09 | J2 | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect | F-SV-001-HAPPY, F-SV-001-NEGATIVE, F-SV-001-AUTHZ, F-SV-001-EMPTY-ERROR, F-SV-001-I18N-HI-LONG |
| F-SV-002 | S-CUST-09 | J2 | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect | F-SV-002-HAPPY, F-SV-002-NEGATIVE, F-SV-002-AUTHZ, F-SV-002-EMPTY-ERROR, F-SV-002-I18N-HI-LONG |
| F-SV-003 | S-CUST-09 | J2 | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, MapView, AddressForm | F-SV-003-HAPPY, F-SV-003-NEGATIVE, F-SV-003-AUTHZ, F-SV-003-EMPTY-ERROR, F-SV-003-I18N-HI-LONG |
| F-SV-004 | S-CUST-09 | J2 | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, GalleryGrid, ReelsPlayer | F-SV-004-HAPPY, F-SV-004-NEGATIVE, F-SV-004-AUTHZ, F-SV-004-EMPTY-ERROR, F-SV-004-I18N-HI-LONG |
| F-SV-005 | S-CUST-09 | J2, J14 | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, ProductCard, QuantityStepper | F-SV-005-HAPPY, F-SV-005-NEGATIVE, F-SV-005-AUTHZ, F-SV-005-EMPTY-ERROR, F-SV-005-I18N-HI-LONG |
| F-SV-006 | S-CUST-09 | J2 | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, RatingBreakdown, ReviewCard | F-SV-006-HAPPY, F-SV-006-NEGATIVE, F-SV-006-AUTHZ, F-SV-006-EMPTY-ERROR, F-SV-006-I18N-HI-LONG |
| F-SV-007 | S-CUST-09 | J2 | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect | F-SV-007-HAPPY, F-SV-007-NEGATIVE, F-SV-007-AUTHZ, F-SV-007-EMPTY-ERROR, F-SV-007-I18N-HI-LONG |
| F-SV-008 | S-CUST-07, S-CUST-09, S-VEND-13 | None specified | services, businesses, offers, reviews, media-videos, engagement | Service, Owner, Enquiry | ServiceCard, MediaCarousel, EnquiryForm, FollowButton, ReviewForm, FilterPanel, SubcategoryMultiSelect | F-SV-008-HAPPY, F-SV-008-NEGATIVE, F-SV-008-AUTHZ, F-SV-008-EMPTY-ERROR, F-SV-008-I18N-HI-LONG |
