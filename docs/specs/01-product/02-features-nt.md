# NT — Notifications feature specification

## Contents

- [F-NT-001 — Notification centre](#f-nt-001--notification-centre)
- [F-NT-002 — Notification preferences](#f-nt-002--notification-preferences)
- [F-NT-003 — Follower announcements](#f-nt-003--follower-announcements)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-NT-001, F-NT-002, F-NT-003 (3).
- **Area dependency:** platform foundations
- **API modules:** notifications, communications
- **Data concepts:** Notification, NotificationPreference
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-NT-001 — Notification centre

### Requirement and scope
- **Roles:** All roles. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Read/unread, per-role feeds (order, offer, review, approval, enquiry, job, admin, system), bell with badge.
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
- **Business rules:** BR-11.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Notification, NotificationPreference needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) notifications, communications; handle `P04/F-NT-001`. **Data trace:** `P03/F-NT-001` (Notification, NotificationPreference); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Enforce the authenticated role and module scope for each operation; guest access is limited to public customer reads, and customer gated actions require sign-in (BR-21).

### Acceptance criteria
1. **Happy path — F-NT-001-HAPPY**

   Given an authorized actor in any listed role and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-NT-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-NT-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-NT-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-NT-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-22 Notifications (`/notifications`); S-VEND-17 Vendor notifications (`/vendor/notifications`); S-PROV-15 Provider notifications (`/provider/notifications`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** NotificationCard, Toggle, Badge, ReviewForm, RatingBreakdown, ReviewCard, OfferCard.
- **API/data handles:** `P04/F-NT-001`; `P03/F-NT-001`.
- **Verification handles:** F-NT-001-HAPPY, F-NT-001-NEGATIVE, F-NT-001-AUTHZ, F-NT-001-EMPTY-ERROR, F-NT-001-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-NT-002 — Notification preferences

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Per channel (in-app, email, WhatsApp for orders/offers/enquiries) with consent text and unsubscribe.
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
- **Business rules:** BR-11.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Notification, NotificationPreference needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) notifications, communications; handle `P04/F-NT-002`. **Data trace:** `P03/F-NT-002` (Notification, NotificationPreference); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-NT-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-NT-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-NT-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-NT-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-NT-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-23 Notification preferences (`/account/preferences`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** NotificationCard, Toggle, Badge, OfferCard, OfferBanner, OrderCard, Timeline.
- **API/data handles:** `P04/F-NT-002`; `P03/F-NT-002`.
- **Verification handles:** F-NT-002-HAPPY, F-NT-002-NEGATIVE, F-NT-002-AUTHZ, F-NT-002-EMPTY-ERROR, F-NT-002-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-NT-003 — Follower announcements

### Requirement and scope
- **Roles:** Vendor, Provider. **Priority:** P0.
- **Area dependencies:** platform foundations. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Owners announce new offers/videos to followers.
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
- **Business rules:** BR-11.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Notification, NotificationPreference needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) notifications, communications; handle `P04/F-NT-003`. **Data trace:** `P03/F-NT-003` (Notification, NotificationPreference); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Restrict operations to the listed roles (Vendor, Provider); apply customer authentication/ownership, vendor or provider ownership and approval, rider assignment, and admin city/area/module scope only for the corresponding role and operation (BR-06/12/21).

### Acceptance criteria
1. **Happy path — F-NT-003-HAPPY**

   Given an authorized Vendor and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-NT-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-NT-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-NT-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-NT-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-VEND-15 Followers (`/vendor/followers`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** NotificationCard, Toggle, Badge, OfferCard, OfferBanner, MediaCarousel, GalleryGrid.
- **API/data handles:** `P04/F-NT-003`; `P03/F-NT-003`.
- **Verification handles:** F-NT-003-HAPPY, F-NT-003-NEGATIVE, F-NT-003-AUTHZ, F-NT-003-EMPTY-ERROR, F-NT-003-I18N-HI-LONG; P10 records manual verification evidence under the repository verification policy.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Verification IDs |
|---|---|---|---|---|---|---|
| F-NT-001 | S-CUST-22, S-VEND-17, S-PROV-15 | None specified | notifications, communications | Notification, NotificationPreference | NotificationCard, Toggle, Badge, ReviewForm, RatingBreakdown, ReviewCard, OfferCard | F-NT-001-HAPPY, F-NT-001-NEGATIVE, F-NT-001-AUTHZ, F-NT-001-EMPTY-ERROR, F-NT-001-I18N-HI-LONG |
| F-NT-002 | S-CUST-23 | None specified | notifications, communications | Notification, NotificationPreference | NotificationCard, Toggle, Badge, OfferCard, OfferBanner, OrderCard, Timeline | F-NT-002-HAPPY, F-NT-002-NEGATIVE, F-NT-002-AUTHZ, F-NT-002-EMPTY-ERROR, F-NT-002-I18N-HI-LONG |
| F-NT-003 | S-VEND-15 | None specified | notifications, communications | Notification, NotificationPreference | NotificationCard, Toggle, Badge, OfferCard, OfferBanner, MediaCarousel, GalleryGrid | F-NT-003-HAPPY, F-NT-003-NEGATIVE, F-NT-003-AUTHZ, F-NT-003-EMPTY-ERROR, F-NT-003-I18N-HI-LONG |
