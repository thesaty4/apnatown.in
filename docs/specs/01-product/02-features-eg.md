# EG — Engagement (save, follow, like, heart) feature specification

## Contents

- [F-EG-001 — Saved page](#f-eg-001--saved-page)
- [F-EG-002 — Heart on photos/videos/reels](#f-eg-002--heart-on-photos-videos-reels)
- [F-EG-003 — Follow/unfollow with bell](#f-eg-003--follow-unfollow-with-bell)
- [F-EG-004 — Like on videos](#f-eg-004--like-on-videos)
- [F-EG-005 — Comments (moderated)](#f-eg-005--comments-moderated)
- [F-EG-006 — Share sheet](#f-eg-006--share-sheet)
- [F-EG-007 — Bookmarks](#f-eg-007--bookmarks)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-EG-001, F-EG-002, F-EG-003, F-EG-004, F-EG-005, F-EG-006, F-EG-007 (7).
- **Area dependency:** platform foundations
- **API modules:** engagement, media-videos
- **Data concepts:** Follow, Like, Heart
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-EG-001 — Saved page

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Tabs Shops / Services / Photos & Videos; filters Photos/Videos/Reels; remove.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest login prompt.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Follow, Like, Heart needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) engagement, media-videos; handle `P04/F-EG-001`. **Data trace:** `P03/F-EG-001` (Follow, Like, Heart); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EG-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EG-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EG-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EG-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EG-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-19 Saved (`/saved`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, FilterPanel, SubcategoryMultiSelect.
- **API/data handles:** `P04/F-EG-001`; `P03/F-EG-001`.
- **Verification handles:** F-EG-001-HAPPY, F-EG-001-NEGATIVE, F-EG-001-AUTHZ, F-EG-001-EMPTY-ERROR, F-EG-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EG-002 — Heart on photos/videos/reels

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Save with animation and reduced-motion alternative; guest prompts login.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest login prompt.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Follow, Like, Heart needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) engagement, media-videos; handle `P04/F-EG-002`. **Data trace:** `P03/F-EG-002` (Follow, Like, Heart); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EG-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EG-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EG-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EG-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EG-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-19 Saved (`/saved`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, PhoneInput, OtpInput.
- **API/data handles:** `P04/F-EG-002`; `P03/F-EG-002`.
- **Verification handles:** F-EG-002-HAPPY, F-EG-002-NEGATIVE, F-EG-002-AUTHZ, F-EG-002-EMPTY-ERROR, F-EG-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EG-003 — Follow/unfollow with bell

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Confirmation on unfollow; bell toggles notifications.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; listing not live; closed; outside delivery range; no services yet; empty Following; no nearby; skeleton; failed+retry; removed; data-saver.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Follow, Like, Heart needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) engagement, media-videos; handle `P04/F-EG-003`. **Data trace:** `P03/F-EG-003` (Follow, Like, Heart); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EG-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EG-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EG-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EG-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EG-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-06 Shop profile (`/shop/:slug`); S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, NotificationCard, Toggle.
- **API/data handles:** `P04/F-EG-003`; `P03/F-EG-003`.
- **Verification handles:** F-EG-003-HAPPY, F-EG-003-NEGATIVE, F-EG-003-AUTHZ, F-EG-003-EMPTY-ERROR, F-EG-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-EG-004 — Like on videos

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Toggle with count.
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
- **Read:** Follow, Like, Heart needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) engagement, media-videos; handle `P04/F-EG-004`. **Data trace:** `P03/F-EG-004` (Follow, Like, Heart); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EG-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EG-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EG-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EG-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EG-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, MediaCarousel, GalleryGrid.
- **API/data handles:** `P04/F-EG-004`; `P03/F-EG-004`.
- **Verification handles:** F-EG-004-HAPPY, F-EG-004-NEGATIVE, F-EG-004-AUTHZ, F-EG-004-EMPTY-ERROR, F-EG-004-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EG-005 — Comments (moderated)

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Add comment; 'awaiting moderation' shown to author.
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
- **Read:** Follow, Like, Heart needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) engagement, media-videos; handle `P04/F-EG-005`. **Data trace:** `P03/F-EG-005` (Follow, Like, Heart); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EG-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EG-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EG-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EG-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EG-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet.
- **API/data handles:** `P04/F-EG-005`; `P03/F-EG-005`.
- **Verification handles:** F-EG-005-HAPPY, F-EG-005-NEGATIVE, F-EG-005-AUTHZ, F-EG-005-EMPTY-ERROR, F-EG-005-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-EG-006 — Share sheet

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** WhatsApp, copy link, native share.
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
- **Read:** Follow, Like, Heart needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) engagement, media-videos; handle `P04/F-EG-006`. **Data trace:** `P03/F-EG-006` (Follow, Like, Heart); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EG-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EG-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EG-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EG-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EG-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-21 Videos / Reels feed (`/videos, /videos/:id`)
- **Journeys:** J4
- **Shared components:** BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, MediaCarousel, GalleryGrid.
- **API/data handles:** `P04/F-EG-006`; `P03/F-EG-006`.
- **Verification handles:** F-EG-006-HAPPY, F-EG-006-NEGATIVE, F-EG-006-AUTHZ, F-EG-006-EMPTY-ERROR, F-EG-006-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).

---

## F-EG-007 — Bookmarks

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Shops, providers, services.
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
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; guest login prompt.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Follow, Like, Heart needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) engagement, media-videos; handle `P04/F-EG-007`. **Data trace:** `P03/F-EG-007` (Follow, Like, Heart); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-EG-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-EG-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-EG-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-EG-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-EG-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-19 Saved (`/saved`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, ServiceCard, EnquiryForm.
- **API/data handles:** `P04/F-EG-007`; `P03/F-EG-007`.
- **Verification handles:** F-EG-007-HAPPY, F-EG-007-NEGATIVE, F-EG-007-AUTHZ, F-EG-007-EMPTY-ERROR, F-EG-007-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** S (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-EG-001 | S-CUST-19 | None specified | engagement, media-videos | Follow, Like, Heart | BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, FilterPanel, SubcategoryMultiSelect | F-EG-001-HAPPY, F-EG-001-NEGATIVE, F-EG-001-AUTHZ, F-EG-001-EMPTY-ERROR, F-EG-001-I18N-HI-LONG |
| F-EG-002 | S-CUST-19 | None specified | engagement, media-videos | Follow, Like, Heart | BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, PhoneInput, OtpInput | F-EG-002-HAPPY, F-EG-002-NEGATIVE, F-EG-002-AUTHZ, F-EG-002-EMPTY-ERROR, F-EG-002-I18N-HI-LONG |
| F-EG-003 | S-CUST-06, S-CUST-21 | J4 | engagement, media-videos | Follow, Like, Heart | BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, NotificationCard, Toggle | F-EG-003-HAPPY, F-EG-003-NEGATIVE, F-EG-003-AUTHZ, F-EG-003-EMPTY-ERROR, F-EG-003-I18N-HI-LONG |
| F-EG-004 | S-CUST-21 | J4 | engagement, media-videos | Follow, Like, Heart | BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, MediaCarousel, GalleryGrid | F-EG-004-HAPPY, F-EG-004-NEGATIVE, F-EG-004-AUTHZ, F-EG-004-EMPTY-ERROR, F-EG-004-I18N-HI-LONG |
| F-EG-005 | S-CUST-21 | J4 | engagement, media-videos | Follow, Like, Heart | BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet | F-EG-005-HAPPY, F-EG-005-NEGATIVE, F-EG-005-AUTHZ, F-EG-005-EMPTY-ERROR, F-EG-005-I18N-HI-LONG |
| F-EG-006 | S-CUST-21 | J4 | engagement, media-videos | Follow, Like, Heart | BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, MediaCarousel, GalleryGrid | F-EG-006-HAPPY, F-EG-006-NEGATIVE, F-EG-006-AUTHZ, F-EG-006-EMPTY-ERROR, F-EG-006-I18N-HI-LONG |
| F-EG-007 | S-CUST-19 | None specified | engagement, media-videos | Follow, Like, Heart | BookmarkCard, HeartButton, FollowButton, LikeButton, ShareSheet, ServiceCard, EnquiryForm | F-EG-007-HAPPY, F-EG-007-NEGATIVE, F-EG-007-AUTHZ, F-EG-007-EMPTY-ERROR, F-EG-007-I18N-HI-LONG |
