# CK — Cart and checkout feature specification

## Contents

- [F-CK-001 — Cart grouped by business](#f-ck-001--cart-grouped-by-business)
- [F-CK-002 — One checkout, one order per shop](#f-ck-002--one-checkout-one-order-per-shop)
- [F-CK-003 — Per-shop delivery or pickup choice](#f-ck-003--per-shop-delivery-or-pickup-choice)
- [F-CK-004 — Address book](#f-ck-004--address-book)
- [F-CK-005 — Delivery range and minimum order checks](#f-ck-005--delivery-range-and-minimum-order-checks)
- [F-CK-006 — Payment methods](#f-ck-006--payment-methods)
- [F-CK-007 — Payment failure and retry](#f-ck-007--payment-failure-and-retry)
- [F-CK-008 — Order success](#f-ck-008--order-success)
- [F-CK-009 — Coupons](#f-ck-009--coupons)
- [Area coverage matrix](#area-coverage-matrix)

## Area contract

- **Feature IDs:** F-CK-001, F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-008, F-CK-009 (9).
- **Area dependency:** AU4, PD, LC, 07 BR-03/BR-19
- **API modules:** cart-checkout, products, businesses, payments, orders
- **Data concepts:** Cart, CartLine, Address, Coupon
- **Sources:** [feature inventory](../../design-context/01-feature-inventory.md), [screen inventory](../../design-context/02-screen-inventory.md), [rules/states](../../design-context/07-state-machines-and-business-rules.md), [flows](../../design-context/03-user-flows.md), and prototype source.

## F-CK-001 — Cart grouped by business

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Quantity stepper, remove, save for later, price breakdown, delivery fee, charges, coupon field.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty cart; below minimum order; out of range.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-001`. **Data trace:** `P03/F-CK-001` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-001-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-001-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-001-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-001-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-001-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-10 Cart (`/cart`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OfferCard, OfferBanner.
- **API/data handles:** `P04/F-CK-001`; `P03/F-CK-001`.
- **Test handles:** F-CK-001-HAPPY, F-CK-001-NEGATIVE, F-CK-001-AUTHZ, F-CK-001-EMPTY-ERROR, F-CK-001-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-CK-002 — One checkout, one order per shop

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Clear notice when order splits into several shops; each order has own id, mode, payment record, OTP/pickup code.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty cart; below minimum order; out of range; payment failed; out of delivery range; login required.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-002`. **Data trace:** `P03/F-CK-002` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-002-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-002-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-002-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-002-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-002-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-10 Cart (`/cart`); S-CUST-11 Checkout (`/checkout`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, PhoneInput, OtpInput.
- **API/data handles:** `P04/F-CK-002`; `P03/F-CK-002`.
- **Test handles:** F-CK-002-HAPPY, F-CK-002-NEGATIVE, F-CK-002-AUTHZ, F-CK-002-EMPTY-ERROR, F-CK-002-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-CK-003 — Per-shop delivery or pickup choice

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Choose Home Delivery or Self-Pickup per shop.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty cart; below minimum order; out of range; payment failed; out of delivery range; login required.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-003`. **Data trace:** `P03/F-CK-003` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-003-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-003-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-003-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-003-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-003-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-10 Cart (`/cart`); S-CUST-11 Checkout (`/checkout`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline.
- **API/data handles:** `P04/F-CK-003`; `P03/F-CK-003`.
- **Test handles:** F-CK-003-HAPPY, F-CK-003-NEGATIVE, F-CK-003-AUTHZ, F-CK-003-EMPTY-ERROR, F-CK-003-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-CK-004 — Address book

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Add/edit/delete, map pin, landmark, PIN, labels Home/Work/Other, default.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; payment failed; out of delivery range; login required.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-004`. **Data trace:** `P03/F-CK-004` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-004-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-004-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-004-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-004-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-004-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-11 Checkout (`/checkout`); S-CUST-26 Addresses (`/account/addresses`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, MapView.
- **API/data handles:** `P04/F-CK-004`; `P03/F-CK-004`.
- **Test handles:** F-CK-004-HAPPY, F-CK-004-NEGATIVE, F-CK-004-AUTHZ, F-CK-004-EMPTY-ERROR, F-CK-004-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** M (relative scope only; not a delivery commitment).

---

## F-CK-005 — Delivery range and minimum order checks

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Delivery charge display; out-of-range and below-minimum messages.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty cart; below minimum order; out of range; payment failed; out of delivery range; login required.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-005`. **Data trace:** `P03/F-CK-005` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-005-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-005-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-005-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-005-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-005-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-10 Cart (`/cart`); S-CUST-11 Checkout (`/checkout`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline.
- **API/data handles:** `P04/F-CK-005`; `P03/F-CK-005`.
- **Test handles:** F-CK-005-HAPPY, F-CK-005-NEGATIVE, F-CK-005-AUTHZ, F-CK-005-EMPTY-ERROR, F-CK-005-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-CK-006 — Payment methods

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** UPI, cards, net banking, wallets, COD / pay-at-pickup.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; payment failed; out of delivery range; login required.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-006`. **Data trace:** `P03/F-CK-006` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-006-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-006-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-006-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-006-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-006-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-11 Checkout (`/checkout`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, ProductCard.
- **API/data handles:** `P04/F-CK-006`; `P03/F-CK-006`.
- **Test handles:** F-CK-006-HAPPY, F-CK-006-NEGATIVE, F-CK-006-AUTHZ, F-CK-006-EMPTY-ERROR, F-CK-006-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-CK-007 — Payment failure and retry

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Failure state with retry or pay-on-delivery.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; payment failed; out of delivery range; login required.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-007`. **Data trace:** `P03/F-CK-007` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-007-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-007-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-007-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-007-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-007-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-11 Checkout (`/checkout`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline.
- **API/data handles:** `P04/F-CK-007`; `P03/F-CK-007`.
- **Test handles:** F-CK-007-HAPPY, F-CK-007-NEGATIVE, F-CK-007-AUTHZ, F-CK-007-EMPTY-ERROR, F-CK-007-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-CK-008 — Order success

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Order id per shop, summary, track link.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; payment failed; out of delivery range; login required.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-008`. **Data trace:** `P03/F-CK-008` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-008-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-008-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-008-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-008-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-008-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-11 Checkout (`/checkout`); S-CUST-12 Order placed (`/checkout/success`)
- **Journeys:** J1
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline.
- **API/data handles:** `P04/F-CK-008`; `P03/F-CK-008`.
- **Test handles:** F-CK-008-HAPPY, F-CK-008-NEGATIVE, F-CK-008-AUTHZ, F-CK-008-EMPTY-ERROR, F-CK-008-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).

---

## F-CK-009 — Coupons

### Requirement and scope
- **Roles:** Customer. **Priority:** P0.
- **Area dependencies:** AU4, PD, LC, 07 BR-03/BR-19. No additional feature dependency is stated in the source pack.
- **Source requirement (preserved):** Flat or percent, minimum, cap; discount distributed proportionally across shop orders.
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
- **Business rules:** BR-01, BR-03, BR-19.
- **States:** default; loading skeleton; empty; error with retry; no permission; offline; empty cart; below minimum order; out of range.
- **Lifecycle:** where a modeled state changes, use [04-state-machines.md](./04-state-machines.md); otherwise add no lifecycle.
- **Visual/i18n contract:** match prototype tokens and EN/HI catalogue; Hindi text wraps, status is icon + text + colour.

### Data, API, events and analytics
- **Read:** Cart, CartLine, Address, Coupon needed to render the source behaviour; disclose only fields appropriate to the actor scope.
- **Write:** only fields/state changes explicitly named in the source; read-only features write none. Physical schemas are deferred to P03.
- **API trace:** owner module(s) cart-checkout, products, businesses, payments, orders; handle `P04/F-CK-009`. **Data trace:** `P03/F-CK-009` (Cart, CartLine, Address, Coupon); endpoint/physical table names are assigned by P03/P04, not guessed here.
- **Domain event/notification:** only events explicitly required by the linked journey or bilingual notification template; otherwise none is specified and P04 must not infer one.
- **Analytics:** no feature-specific event is prescribed unless a metric appears in the source description; dashboard outputs remain read-only. Event taxonomy is deferred to P10/Q-11.

### Authorization
Customer public reads may be available to guests; gated actions require an authenticated Customer and own-record scope (BR-21).

### Acceptance criteria
1. **Happy path — F-CK-009-HAPPY**

   Given an authorized Customer and the stated preconditions, when the actor performs the described interaction, then the complete source requirement is satisfied on the linked screen(s).
2. **Validation / negative — F-CK-009-NEGATIVE**

   Given invalid input, unsupported state, or unavailable required data, when the actor submits or attempts the action, then the server rejects an invalid mutation without partial writes and the UI presents the applicable error/recovery state; it never fabricates success.
3. **Authorization — F-CK-009-AUTHZ**

   Given a user outside the listed roles or outside ownership/city/area/module scope, when that user requests the protected operation, then the server denies it, returns a stable authorization error and makes no data change.
4. **Empty/error — F-CK-009-EMPTY-ERROR**

   Given no eligible records or a failed dependency, when the linked screen loads, then the defined empty or retryable error state and applicable action are rendered without presenting stale data as current success.
5. **Hindi/long text — F-CK-009-I18N-HI-LONG**

   Given Hindi is selected and translated text is about 30% longer, when the feature renders at 360 px and desktop widths, then bilingual text wraps without clipping/truncation and keyboard/screen-reader access remains available.

### Traceability
- **Screens/routes:** S-CUST-10 Cart (`/cart`)
- **Journeys:** None explicitly linked in the source pack.
- **Shared components:** QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OfferCard, OfferBanner.
- **API/data handles:** `P04/F-CK-009`; `P03/F-CK-009`.
- **Test handles:** F-CK-009-HAPPY, F-CK-009-NEGATIVE, F-CK-009-AUTHZ, F-CK-009-EMPTY-ERROR, F-CK-009-I18N-HI-LONG; P10 assigns executable suites.
- **Estimate:** L (relative scope only; not a delivery commitment).


## Area coverage matrix

| Feature ID | Screen IDs | Journey IDs | API owner modules | Data concepts (P03) | Shared component refs | Test IDs |
|---|---|---|---|---|---|---|
| F-CK-001 | S-CUST-10 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OfferCard, OfferBanner | F-CK-001-HAPPY, F-CK-001-NEGATIVE, F-CK-001-AUTHZ, F-CK-001-EMPTY-ERROR, F-CK-001-I18N-HI-LONG |
| F-CK-002 | S-CUST-10, S-CUST-11 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, PhoneInput, OtpInput | F-CK-002-HAPPY, F-CK-002-NEGATIVE, F-CK-002-AUTHZ, F-CK-002-EMPTY-ERROR, F-CK-002-I18N-HI-LONG |
| F-CK-003 | S-CUST-10, S-CUST-11 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline | F-CK-003-HAPPY, F-CK-003-NEGATIVE, F-CK-003-AUTHZ, F-CK-003-EMPTY-ERROR, F-CK-003-I18N-HI-LONG |
| F-CK-004 | S-CUST-11, S-CUST-26 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, MapView | F-CK-004-HAPPY, F-CK-004-NEGATIVE, F-CK-004-AUTHZ, F-CK-004-EMPTY-ERROR, F-CK-004-I18N-HI-LONG |
| F-CK-005 | S-CUST-10, S-CUST-11 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline | F-CK-005-HAPPY, F-CK-005-NEGATIVE, F-CK-005-AUTHZ, F-CK-005-EMPTY-ERROR, F-CK-005-I18N-HI-LONG |
| F-CK-006 | S-CUST-11 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, ProductCard | F-CK-006-HAPPY, F-CK-006-NEGATIVE, F-CK-006-AUTHZ, F-CK-006-EMPTY-ERROR, F-CK-006-I18N-HI-LONG |
| F-CK-007 | S-CUST-11 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline | F-CK-007-HAPPY, F-CK-007-NEGATIVE, F-CK-007-AUTHZ, F-CK-007-EMPTY-ERROR, F-CK-007-I18N-HI-LONG |
| F-CK-008 | S-CUST-11, S-CUST-12 | J1 | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OrderCard, Timeline | F-CK-008-HAPPY, F-CK-008-NEGATIVE, F-CK-008-AUTHZ, F-CK-008-EMPTY-ERROR, F-CK-008-I18N-HI-LONG |
| F-CK-009 | S-CUST-10 | None specified | cart-checkout, products, businesses, payments, orders | Cart, CartLine, Address, Coupon | QuantityStepper, AddressForm, PaymentMethodPicker, CouponField, Button, OfferCard, OfferBanner | F-CK-009-HAPPY, F-CK-009-NEGATIVE, F-CK-009-AUTHZ, F-CK-009-EMPTY-ERROR, F-CK-009-I18N-HI-LONG |
