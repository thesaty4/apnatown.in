# PD — Product details feature specification

## Contents

- [F-PD-001 — Breadcrumbs](#f-pd-001--breadcrumbs)
- [F-PD-002 — Media carousel and full-screen viewer](#f-pd-002--media-carousel-and-full-screen-viewer)
- [F-PD-003 — Price, variants, stock, purchase actions](#f-pd-003--price-variants-stock-purchase-actions)
- [F-PD-004 — Offer banner](#f-pd-004--offer-banner)
- [F-PD-005 — Videos & Reels section](#f-pd-005--videos-reels-section)
- [F-PD-006 — Seller card](#f-pd-006--seller-card)
- [F-PD-007 — Specs and reviews](#f-pd-007--specs-and-reviews)
- [F-PD-008 — Related products](#f-pd-008--related-products)
- [F-PD-009 — Share and bookmark](#f-pd-009--share-and-bookmark)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-PD-001, F-PD-002, F-PD-003, F-PD-004, F-PD-005, F-PD-006, F-PD-007, F-PD-008, F-PD-009 (9).
- **Area dependency:** PF, OF, RL
- **API modules:** products, offers, reviews, media-videos, engagement
- **Data concepts:** Product, Offer, Review
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-PD-001 — Breadcrumbs

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Home / Category / Product.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-001`. **Data trace:** `P03/F-PD-001` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** J1
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, FilterPanel.
- **API/data handles:** `P04/F-PD-001`; `P03/F-PD-001`.
- **Verification handles:** F-PD-001-HAPPY, F-PD-001-NEGATIVE, F-PD-001-AUTHZ, F-PD-001-EMPTY-ERROR, F-PD-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PD-002 — Media carousel and full-screen viewer

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Images and embedded YouTube/Instagram with play badge; viewer with prev/next, swipe, arrow keys, counter, close, pinch/double-tap zoom, heart, focus trap.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-002`. **Data trace:** `P03/F-PD-002` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** J1
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, GalleryGrid.
- **API/data handles:** `P04/F-PD-002`; `P03/F-PD-002`.
- **Verification handles:** F-PD-002-HAPPY, F-PD-002-NEGATIVE, F-PD-002-AUTHZ, F-PD-002-EMPTY-ERROR, F-PD-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PD-003 — Price, variants, stock, purchase actions

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Price, MRP, discount, variants, stock states (in stock, low 'Only N left', out of stock with notify-me), quantity, Add to cart, Buy now.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-003`. **Data trace:** `P03/F-PD-003` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** J1
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, ProductCard.
- **API/data handles:** `P04/F-PD-003`; `P03/F-PD-003`.
- **Verification handles:** F-PD-003-HAPPY, F-PD-003-NEGATIVE, F-PD-003-AUTHZ, F-PD-003-EMPTY-ERROR, F-PD-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PD-004 — Offer banner

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Badge, discounted price, validity date, terms at the top; expired and out-of-stock-offer states.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-004`. **Data trace:** `P03/F-PD-004` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** J3
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, OfferCard.
- **API/data handles:** `P04/F-PD-004`; `P03/F-PD-004`.
- **Verification handles:** F-PD-004-HAPPY, F-PD-004-NEGATIVE, F-PD-004-AUTHZ, F-PD-004-EMPTY-ERROR, F-PD-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PD-005 — Videos & Reels section

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Below the details; hidden if none; opens Reels at that video; linked strip returns to the product.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-005`. **Data trace:** `P03/F-PD-005` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, GalleryGrid.
- **API/data handles:** `P04/F-PD-005`; `P03/F-PD-005`.
- **Verification handles:** F-PD-005-HAPPY, F-PD-005-NEGATIVE, F-PD-005-AUTHZ, F-PD-005-EMPTY-ERROR, F-PD-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PD-006 — Seller card

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Delivery/pickup info and link to profile.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-006`. **Data trace:** `P03/F-PD-006` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, OrderCard.
- **API/data handles:** `P04/F-PD-006`; `P03/F-PD-006`.
- **Verification handles:** F-PD-006-HAPPY, F-PD-006-NEGATIVE, F-PD-006-AUTHZ, F-PD-006-EMPTY-ERROR, F-PD-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-PD-007 — Specs and reviews

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Specs table, rating breakdown, review list and form.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-007`. **Data trace:** `P03/F-PD-007` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, RatingBreakdown.
- **API/data handles:** `P04/F-PD-007`; `P03/F-PD-007`.
- **Verification handles:** F-PD-007-HAPPY, F-PD-007-NEGATIVE, F-PD-007-AUTHZ, F-PD-007-EMPTY-ERROR, F-PD-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-PD-008 — Related products

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** 'View all' opens Explore Products with the same category and subcategory.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-008`. **Data trace:** `P03/F-PD-008` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, FilterPanel.
- **API/data handles:** `P04/F-PD-008`; `P03/F-PD-008`.
- **Verification handles:** F-PD-008-HAPPY, F-PD-008-NEGATIVE, F-PD-008-AUTHZ, F-PD-008-EMPTY-ERROR, F-PD-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-PD-009 — Share and bookmark

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** PF, OF, RL. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Share link and bookmark.
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
- **Business rules:** BR-01, BR-17.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Product, Offer, Review needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) products, offers, reviews, media-videos, engagement; handle `P04/F-PD-009`. **Data trace:** `P03/F-PD-009` (Product, Offer, Review); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-PD-009-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-PD-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-PD-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-PD-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-PD-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, GalleryGrid.
- **API/data handles:** `P04/F-PD-009`; `P03/F-PD-009`.
- **Verification handles:** F-PD-009-HAPPY, F-PD-009-NEGATIVE, F-PD-009-AUTHZ, F-PD-009-EMPTY-ERROR, F-PD-009-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-PD-001 | S-CUST-08 | J1 | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, FilterPanel | F-PD-001-HAPPY, F-PD-001-NEGATIVE, F-PD-001-AUTHZ, F-PD-001-EMPTY-ERROR, F-PD-001-I18N-HI-LONG |
| F-PD-002 | S-CUST-08 | J1 | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, GalleryGrid | F-PD-002-HAPPY, F-PD-002-NEGATIVE, F-PD-002-AUTHZ, F-PD-002-EMPTY-ERROR, F-PD-002-I18N-HI-LONG |
| F-PD-003 | S-CUST-08 | J1 | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, ProductCard | F-PD-003-HAPPY, F-PD-003-NEGATIVE, F-PD-003-AUTHZ, F-PD-003-EMPTY-ERROR, F-PD-003-I18N-HI-LONG |
| F-PD-004 | S-CUST-08 | J3 | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, OfferCard | F-PD-004-HAPPY, F-PD-004-NEGATIVE, F-PD-004-AUTHZ, F-PD-004-EMPTY-ERROR, F-PD-004-I18N-HI-LONG |
| F-PD-005 | S-CUST-08 | None specified | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, GalleryGrid | F-PD-005-HAPPY, F-PD-005-NEGATIVE, F-PD-005-AUTHZ, F-PD-005-EMPTY-ERROR, F-PD-005-I18N-HI-LONG |
| F-PD-006 | S-CUST-06, S-CUST-08 | None specified | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, OrderCard | F-PD-006-HAPPY, F-PD-006-NEGATIVE, F-PD-006-AUTHZ, F-PD-006-EMPTY-ERROR, F-PD-006-I18N-HI-LONG |
| F-PD-007 | S-CUST-08 | None specified | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, RatingBreakdown | F-PD-007-HAPPY, F-PD-007-NEGATIVE, F-PD-007-AUTHZ, F-PD-007-EMPTY-ERROR, F-PD-007-I18N-HI-LONG |
| F-PD-008 | S-CUST-08 | None specified | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, FilterPanel | F-PD-008-HAPPY, F-PD-008-NEGATIVE, F-PD-008-AUTHZ, F-PD-008-EMPTY-ERROR, F-PD-008-I18N-HI-LONG |
| F-PD-009 | S-CUST-08 | None specified | products, offers, reviews, media-videos, engagement | Product, Offer, Review | Breadcrumbs, MediaCarousel, FullScreenViewer, OfferBanner, LinkedItemsStrip, ReviewForm, GalleryGrid | F-PD-009-HAPPY, F-PD-009-NEGATIVE, F-PD-009-AUTHZ, F-PD-009-EMPTY-ERROR, F-PD-009-I18N-HI-LONG |
