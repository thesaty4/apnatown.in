# RL — Videos and reels feature specification

## Contents

- [F-RL-001 — Entry points](#f-rl-001--entry-points)
- [F-RL-002 — Feed pills](#f-rl-002--feed-pills)
- [F-RL-003 — Vertical snap feed](#f-rl-003--vertical-snap-feed)
- [F-RL-004 — Desktop layout](#f-rl-004--desktop-layout)
- [F-RL-005 — Video overlay](#f-rl-005--video-overlay)
- [F-RL-006 — Linked products/services strip](#f-rl-006--linked-products-services-strip)
- [F-RL-007 — Guest actions and return](#f-rl-007--guest-actions-and-return)
- [F-RL-008 — Reels states](#f-rl-008--reels-states)
- [F-RL-009 — Deep link and stable ranking](#f-rl-009--deep-link-and-stable-ranking)
- [F-RL-010 — Video sources and safety](#f-rl-010--video-sources-and-safety)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-RL-001, F-RL-002, F-RL-003, F-RL-004, F-RL-005, F-RL-006, F-RL-007, F-RL-008, F-RL-009, F-RL-010 (10).
- **Area dependency:** AD10 moderation, EG, VD12
- **API modules:** media-videos, engagement, products, services
- **Data concepts:** Video, VideoComment, Follow, Like
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-RL-001 — Entry points

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Play icon in mobile top bar, desktop nav, bottom navigation.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-001`. **Data trace:** `P03/F-RL-001` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet.
- **API/data handles:** `P04/F-RL-001`; `P03/F-RL-001`.
- **Verification handles:** F-RL-001-HAPPY, F-RL-001-NEGATIVE, F-RL-001-AUTHZ, F-RL-001-EMPTY-ERROR, F-RL-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RL-002 — Feed pills

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** For You / Following / Nearby / Offers / Products / Services + category pills (Electronics, Fashion, Food, Wedding, Mobile, Repair).
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
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-002`. **Data trace:** `P03/F-RL-002` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-RL-002`; `P03/F-RL-002`.
- **Verification handles:** F-RL-002-HAPPY, F-RL-002-NEGATIVE, F-RL-002-AUTHZ, F-RL-002-EMPTY-ERROR, F-RL-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RL-003 — Vertical snap feed

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Autoplay in view, tap pause/play, mute, progress, captions, data-saver 'Tap to play', lazy loading.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-003`. **Data trace:** `P03/F-RL-003` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet.
- **API/data handles:** `P04/F-RL-003`; `P03/F-RL-003`.
- **Verification handles:** F-RL-003-HAPPY, F-RL-003-NEGATIVE, F-RL-003-AUTHZ, F-RL-003-EMPTY-ERROR, F-RL-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RL-004 — Desktop layout

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Centred player, side panel (comments, linked products), up/down arrow keys.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-004`. **Data trace:** `P03/F-RL-004` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, ProductCard, QuantityStepper.
- **API/data handles:** `P04/F-RL-004`; `P03/F-RL-004`.
- **Verification handles:** F-RL-004-HAPPY, F-RL-004-NEGATIVE, F-RL-004-AUTHZ, F-RL-004-EMPTY-ERROR, F-RL-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-RL-005 — Video overlay

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Owner avatar/name/verified, Follow/Following + bell, like count, comments, share, caption, hashtags, distance, open/closed, overflow with Report.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-005`. **Data trace:** `P03/F-RL-005` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MapView, AddressForm.
- **API/data handles:** `P04/F-RL-005`; `P03/F-RL-005`.
- **Verification handles:** F-RL-005-HAPPY, F-RL-005-NEGATIVE, F-RL-005-AUTHZ, F-RL-005-EMPTY-ERROR, F-RL-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RL-006 — Linked products/services strip

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Image, name, price, Add to cart / Enquire / View; 'Shop this video' sheet.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-006`. **Data trace:** `P03/F-RL-006` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MediaCarousel, GalleryGrid.
- **API/data handles:** `P04/F-RL-006`; `P03/F-RL-006`.
- **Verification handles:** F-RL-006-HAPPY, F-RL-006-NEGATIVE, F-RL-006-AUTHZ, F-RL-006-EMPTY-ERROR, F-RL-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RL-007 — Guest actions and return

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Like/follow/comment prompts login and returns to same video.
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
- **Business rules:** BR-05, BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-007`. **Data trace:** `P03/F-RL-007` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, PhoneInput, OtpInput.
- **API/data handles:** `P04/F-RL-007`; `P03/F-RL-007`.
- **Verification handles:** F-RL-007-HAPPY, F-RL-007-NEGATIVE, F-RL-007-AUTHZ, F-RL-007-EMPTY-ERROR, F-RL-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RL-008 — Reels states

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Empty Following, no videos nearby, skeleton, failed with retry, offline, removed/unavailable.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-008`. **Data trace:** `P03/F-RL-008` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MediaCarousel, GalleryGrid.
- **API/data handles:** `P04/F-RL-008`; `P03/F-RL-008`.
- **Verification handles:** F-RL-008-HAPPY, F-RL-008-NEGATIVE, F-RL-008-AUTHZ, F-RL-008-EMPTY-ERROR, F-RL-008-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RL-009 — Deep link and stable ranking

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** /videos/:id starts at that video; ranking frozen per session.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-009`. **Data trace:** `P03/F-RL-009` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-RL-009-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, PhoneInput, OtpInput.
- **API/data handles:** `P04/F-RL-009`; `P03/F-RL-009`.
- **Verification handles:** F-RL-009-HAPPY, F-RL-009-NEGATIVE, F-RL-009-AUTHZ, F-RL-009-EMPTY-ERROR, F-RL-009-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-RL-010 — Video sources and safety

### Requirement and scope
- **Roles:** Customer, Vendor, Provider. **Priority:** P0.
- **Area dependencies:** AD10 moderation, EG, VD12. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** YouTube/Instagram links or uploads; embed URLs rebuilt server-side from allow-listed hosts; Open-in fallback.
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
- **Business rules:** BR-10, BR-16, BR-21.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; out of stock + notify-me; offer expired; offer out of stock; unavailable; empty Following; no nearby; skeleton; failed+retry; removed; data-saver; pending; rejected with reason; removed.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Video, VideoComment, Follow, Like needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) media-videos, engagement, products, services; handle `P04/F-RL-010`. **Data trace:** `P03/F-RL-010` (Video, VideoComment, Follow, Like); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Restrict operations to the listed roles (Customer, Vendor, Provider); apply customer authentication/ownership, vendor or provider ownership and approval, rider assignment, and admin city/area/module scope only for the corresponding role and operation (BR-06/12/21).

### Acceptance criteria
1. **Happy path — F-RL-010-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-RL-010-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-RL-010-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-RL-010-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-RL-010-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-08 Product details (`/product/:slug`); S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`); S-VEND-11 Gallery and videos manager (`/vendor/media`)
- **Journeys:** J6
- **Shared components:** ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MediaCarousel, GalleryGrid.
- **API/data handles:** `P04/F-RL-010`; `P03/F-RL-010`.
- **Verification handles:** F-RL-010-HAPPY, F-RL-010-NEGATIVE, F-RL-010-AUTHZ, F-RL-010-EMPTY-ERROR, F-RL-010-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-RL-001 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet | F-RL-001-HAPPY, F-RL-001-NEGATIVE, F-RL-001-AUTHZ, F-RL-001-EMPTY-ERROR, F-RL-001-I18N-HI-LONG |
| F-RL-002 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, FilterPanel, SubcategoryMultiSelect | F-RL-002-HAPPY, F-RL-002-NEGATIVE, F-RL-002-AUTHZ, F-RL-002-EMPTY-ERROR, F-RL-002-I18N-HI-LONG |
| F-RL-003 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet | F-RL-003-HAPPY, F-RL-003-NEGATIVE, F-RL-003-AUTHZ, F-RL-003-EMPTY-ERROR, F-RL-003-I18N-HI-LONG |
| F-RL-004 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, ProductCard, QuantityStepper | F-RL-004-HAPPY, F-RL-004-NEGATIVE, F-RL-004-AUTHZ, F-RL-004-EMPTY-ERROR, F-RL-004-I18N-HI-LONG |
| F-RL-005 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MapView, AddressForm | F-RL-005-HAPPY, F-RL-005-NEGATIVE, F-RL-005-AUTHZ, F-RL-005-EMPTY-ERROR, F-RL-005-I18N-HI-LONG |
| F-RL-006 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MediaCarousel, GalleryGrid | F-RL-006-HAPPY, F-RL-006-NEGATIVE, F-RL-006-AUTHZ, F-RL-006-EMPTY-ERROR, F-RL-006-I18N-HI-LONG |
| F-RL-007 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, PhoneInput, OtpInput | F-RL-007-HAPPY, F-RL-007-NEGATIVE, F-RL-007-AUTHZ, F-RL-007-EMPTY-ERROR, F-RL-007-I18N-HI-LONG |
| F-RL-008 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MediaCarousel, GalleryGrid | F-RL-008-HAPPY, F-RL-008-NEGATIVE, F-RL-008-AUTHZ, F-RL-008-EMPTY-ERROR, F-RL-008-I18N-HI-LONG |
| F-RL-009 | S-CUST-21 | J4 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, PhoneInput, OtpInput | F-RL-009-HAPPY, F-RL-009-NEGATIVE, F-RL-009-AUTHZ, F-RL-009-EMPTY-ERROR, F-RL-009-I18N-HI-LONG |
| F-RL-010 | S-CUST-08, S-CUST-21, S-VEND-11 | J6 | media-videos, engagement, products, services | Video, VideoComment, Follow, Like | ReelsPlayer, VideoCard, LinkedItemsStrip, FollowButton, ShareSheet, MediaCarousel, GalleryGrid | F-RL-010-HAPPY, F-RL-010-NEGATIVE, F-RL-010-AUTHZ, F-RL-010-EMPTY-ERROR, F-RL-010-I18N-HI-LONG |
