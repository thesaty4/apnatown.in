# FE: offers

Features: F-OF-001, F-OF-002, F-OF-003, F-OF-004, F-OF-005, F-PD-004, F-VD-007, F-AD-011 | Screens: S-CUST-20, S-VEND-07, S-ADMN-12 | Flows: J3

Backend contract: [BE offers](../be/offers.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/offers` | S-CUST-20 | ISR; revalidate on offer publish/pause/end/expiry | Public | Index landing; filtered query combinations are `noindex,follow` |
| `/vendor/offers` | S-VEND-07 | SSR owner/approval gate; manager and editor are client islands | Approved vendor, own business | Noindex |
| `/admin/promotions` | S-ADMN-12 | SSR role/permission/scope gate; queue and decision controls are client islands | Admin with `promos:view/edit` in assigned area; super admin platform-wide | Noindex |

No provider offer screen/production route appears in the screen inventory; the prototype route is tracked in Q-61. Shared UX states come from [frontend-shared.md](../../_foundation/frontend-shared.md). Status is text + icon + color (BR-22).

## Screens

### S-CUST-20 — Offers

- Screenshots: `d-customer-offers.jpg`, `m-customer-offers.jpg`.
- Layout: localized offer list with business/category filters and shared `OfferCard`; detail terms use a sheet/owned public detail contract.
- Data: `GET /offers`; cards include the offer-owning business, validity and eligible target summary. The page never reads vendor-only metrics.
- Special states: no matching offers; expired and out-of-stock details are visibly distinct; empty list has a clear next action.
- Interactions: filters update the page query; offer card follows F-OF-002 deep-link target: one product → product detail, service → service detail, multiple products → Explore Products with offer filter, business-wide → shop profile. Offer terms are rendered as text; no state change is possible from this public screen.
- Rules: F-OF-001–004, BR-17; expired or unavailable offers never show an active discount.
- Acceptance:
  - Given a customer filters by business/category, when the list updates, then only eligible public offers remain and the empty state is actionable.
  - Given a card targets one product, one service, several products, or a whole business, when selected, then it opens the corresponding F-OF-002 destination.
  - Given an offer is expired or out of stock, when its detail is opened, then its distinct state and regular-price behavior are shown without claiming the discount is active.
  - Given Hindi or dark mode is active, when offer terms and validity render, then localized text wraps without clipping and uses design tokens.

### S-VEND-07 — Vendor offers

- Screenshots: `d-vendor-voffers.jpg`, `m-vendor-voffers.jpg`.
- Layout: `DashboardShell` with responsive `DataTable`/mobile cards, status badges and a create/edit sheet; use shared `Input`, `Select`, `Uploader`, `Toggle`, `Button` and `ConfirmDialog`.
- Data: owner-scoped `GET /businesses/me/offers`, create/edit/status APIs; performance counters are returned by Offers and their semantics remain Q-65.
- Special states: pending approval; no offers; stale version conflict; rejected/ended with reason when supplied.
- Interactions: create/edit title, discount type/value, validity, target products/services, banner asset and featured flag; submit enters pending approval. Active offers can pause/end; paused offers can resume before expiry. Banner upload uses StoragePort-approved assets; exact limits Q-66. Terms authoring remains open Q-63.
- Rules: F-VD-007/F-OF-005, BR-06/12/17. Only own approved business offers are manageable. The API supports provider-owned service offers as in the prototype, but no provider production route/screen is defined; resolve Q-61 before adding one.
- Acceptance:
  - Given an owner creates an offer, when submitted, then it appears as pending and cannot be applied publicly or in checkout.
  - Given an active offer is edited, when the versioned save succeeds, then the edited record returns to pending and the old discount is no longer applied.
  - Given an owner pauses, resumes or ends an offer, when the server accepts the transition, then the UI reflects the authoritative state and invalid transitions show a localized error.
  - Given a stale edit version or another business's offer is submitted, when the API rejects it, then the form retains user input and no foreign data is exposed.

### S-ADMN-12 — Promotions

- Screenshots: `d-admin-apromos.jpg`, `m-admin-apromos.jpg`.
- Layout: promotions page with three panels: offer approval queue, homepage banners and featured businesses. The latter two use their confirmed owner contracts; no Offers-owned tables or speculative endpoints are added (Q-57/Q-60).
- Data: scoped `GET /admin/promotions/offers`; decisions use `POST /admin/promotions/offers/{offerId}/decision`. Banner and business placement mutations remain pending their owning-module contracts.
- Special states: no permission, empty pending queue, approval decision conflict.
- Interactions: area admin reviews only offers whose business is in assigned city/area; approve/reject actions are disabled/hidden without `promos:edit` and show the shared no-permission message. Super admin is platform-wide. Offer decisions are audited with before/after.
- Rules: F-AD-011 offer-approval slice, BR-12. Admin permission keys are `promos:view` and `promos:edit` from [08-permissions-matrix.md](../../../docs/design-context/08-permissions-matrix.md).
- Acceptance:
  - Given an area admin views Promotions, when the queue loads, then only offers in assigned scope appear.
  - Given an admin lacks `promos:edit` or is outside the offer's area, when they attempt a decision, then the server denies it and the UI presents no success state.
  - Given an authorized admin decides a pending offer, when the decision succeeds, then the queue and status update and an audit record is present.

### Offer integrations (owner screen layouts remain in their specs)

- Product detail `S-CUST-08` uses the shared `OfferBanner` (see [FE products](../../products/fe/products.md)); shop profile `S-CUST-06` uses its Offers tab ([FE businesses](../../businesses/fe/businesses.md)); service detail `S-CUST-09` uses the same offer read contract ([FE services](../../services/fe/services.md)).
- The product/service owner screens render active, expired and out-of-stock offer states; Offers supplies no duplicate page layout or independent product/service data.

## Feature components and shared components

- Feature-local: `OffersList`, `OfferEditor`, `OfferApprovalQueue`; no duplicate card, banner or state-view component.
- Shared: `OfferCard`, `OfferBanner`, `DataTable`, `StatusBadge`, `Input`, `Select`, `Uploader`, `Toggle`, `ConfirmDialog`, standard state views and `DashboardShell`.

## i18n and analytics

- Key prefixes: `offers.*`, `admin.promotions.*`; EN/HI for titles, discount labels, terms when supplied, validity, statuses, validation, approval decisions and empty/error copy.
- Analytics: `offers.list_view` (page visible), `offers.select` (card opened), `offers.create` (submit), `offers.edit` (save), `admin.offer_decision` (decision succeeds). Do not send raw coupon codes, private business data or customer identifiers.

## Tests

- Component: offer filters/cards, expired and out-of-stock states, vendor editor validation and pending state, scoped admin queue, no-permission state, long Hindi and dark mode.
- Journey: J3 offer → product/service/filtered Explore/shop destination; vendor create → pending approval → admin decision → public listing; rejected/expired offers never appear as active.
