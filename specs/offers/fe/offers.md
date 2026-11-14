# FE: offers

Features: F-OF-001, F-OF-002, F-OF-003, F-OF-004, F-OF-005, F-OF-006, F-PD-004, F-VD-007, F-AD-011 | Screens: S-CUST-20, S-VEND-07, S-PROV-17, S-ADMN-12 | Flows: J3

Backend contract: [BE offers](../be/offers.md) · [Feature inventory](../../../docs/design-context/01-feature-inventory.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/offers` | S-CUST-20 | ISR; revalidate on offer publish/pause/end/expiry | Public | Index landing; filtered query combinations are `noindex,follow` |
| `/vendor/offers` | S-VEND-07 | SSR owner/approval gate; manager and editor are client islands | Approved vendor, own business | Noindex |
| `/provider/offers` | S-PROV-17 | SSR owner gate; shared Coupons tab/client island only | Approved provider, own business | Noindex |
| `/admin/promotions` | S-ADMN-12 | SSR role/permission/scope gate; queue and decision controls are client islands | Admin with `promos:view/edit` in assigned area; super admin platform-wide | Noindex |

Provider coupon management reuses the owner UI and `Offers` APIs; this does not add provider service-targeted offer CRUD, which remains Q-61. Shared UX states come from [frontend-shared.md](../../_foundation/frontend-shared.md). Status is text + icon + color (BR-22). API errors use the flat foundation contract; JSON money is safe-integer paise, formatted by shared utilities.

## Screens

### S-CUST-20 — Offers

- Screenshots: `d-customer-offers.jpg`, `m-customer-offers.jpg`.
- Layout: localized offer list with business/category filters and shared `OfferCard`; detail terms use a sheet/owned public detail contract.
- Data: `GET /offers` and `GET /offers/{offerId}` use `OfferPublicDTO`; target pages use `GET /offers/targets/{targetKind}/{targetId}?offerId=` even when opened directly. Cache tags include offer and target; expiry time limits cache freshness independently of event delivery.
- Special states: no matching offers; expired and out-of-stock details are visibly distinct; empty list has a clear next action.
- Interactions: filters update the page query; use BE `destination`, not guessed routes: `/product/{slug}?offerId={id}`, `/service/{slug}?offerId={id}`, `/explore?tab=products&offerId={id}`, or the business's canonical shop/provider path with `offerId`. Explore's removable offer chip survives refresh/Back; removing it must not alter Search's filters.
- Rules: F-OF-001, F-OF-002, F-OF-003, F-OF-004, BR-17; terms render as text. Expired/out-of-stock/policy-unavailable offers never claim an applicable discount; pending/rejected offers are not public.
- Acceptance:
  - Given a customer filters by business/category, when the list updates, then only eligible public offers remain and the empty state is actionable.
  - Given a card targets one product, one service, several products, or a whole business, when selected, then it opens the corresponding F-OF-002 destination.
  - Given an offer is expired or out of stock, when its detail is opened, then its distinct state and regular-price behavior are shown without claiming the discount is active.
  - Given Hindi or dark mode is active, when offer terms and validity render, then localized text wraps without clipping and uses design tokens.
  - Given a product is opened directly after offer expiry, when its target-state read completes, then the expired banner/regular price appears without a previous card click.
  - Given an expired multi-product link or unavailable pricing policy, when opened, then the state is explicit and the UI neither broadens to unrelated products nor calculates an invented discount.
  - Given an approved service-enquiry coupon targets a visible service, when its detail is rendered, then only its informational terms/code and the normal enquiry action appear; no price deduction, booking or payment is offered.

### S-VEND-07 — Vendor offers

- Screenshots: `d-vendor-voffers.jpg`, `m-vendor-voffers.jpg`.
- Layout: `DashboardShell` with responsive `DataTable`/mobile cards, status badges and a create/edit sheet; use shared `Input`, `Select`, `Uploader`, `Toggle`, `Button` and `ConfirmDialog`.
- Data: owner-scoped `GET /businesses/me/offers`, create/edit/status APIs; performance counters use Offers' resolved reporting-v1 definitions.
- Special states: pending approval; no offers; stale version conflict; rejected/ended with reason when supplied.
- Interactions: create/edit title, discount type/value, validity, targets, `bannerAssetId` and featured flag through versioned commands; submit enters pending approval. Active offers can pause/end; paused offers can resume before expiry. Media `/media/uploads` uses `purpose='offer_banner'` and the resolved public-image policy; attach only a synchronous validated/durable ready asset ID. Progress is local request state, not asset polling. Terms authoring remains Q-63.
- Rules: F-VD-007/F-OF-005, BR-06/12/17. Only own approved business offers are manageable. The API supports provider-owned service offers as in the prototype, but no provider production route/screen is defined; resolve Q-61 before adding one.
- Acceptance:
  - Given an owner creates an offer, when submitted, then it appears as pending and cannot be applied publicly or in checkout.
  - Given an active offer is edited, when the versioned save succeeds, then the edited record returns to pending and the old discount is no longer applied.
  - Given an owner pauses, resumes or ends an offer, when the server accepts the transition, then the UI reflects the authoritative state and invalid transitions show a localized error.
  - Given a stale edit version or another business's offer is submitted, when the API rejects it, then the form retains user input and no foreign data is exposed.
  - Given the Coupons tab opens, when a coupon is created/edited, then draft/pending/active/paused/ended/rejected match the server; live owner edits await reapproval. Only active eligible product coupons can discount checkout.

- Implemented (2026-11-13): `/vendor/offers` → `features/offers/owner` — URL `?status=` chips, offer cards (title, discount, IST validity, status badge incl. Expired/Rejected + reason, views/uses), create/edit sheet (EN/HI title, percent/flat/free delivery, IST date range; save re-queues approval), pause/resume and End with confirm, Load more. Keys `offers.owner.*`.
- Implemented (2026-11-14): the public profile Offers tab reads `GET /offers?businessId={id}` and renders the shared `OfferCard` (same public projection as `/offers`).
- Coupon scope decision (Q-67): coupons target **particular products or the whole business** for product checkout, and **particular services** for enquiry display — never product categories. Coupon tables, owner/admin management, moderation, service display and checkout reservation/redemption remain the unbuilt slice in [BE offers](../be/offers.md#launch-coupon-and-offer-policy); do not add a simplified variant outside that policy.

### S-PROV-17 — Provider coupon manager (`/provider/offers`)
- Reuse the vendor manager's shared responsive form/table and expose the Coupons tab only. Provider identity/business scope is server-derived. Provider service coupons require a selected owned service target and remain enquiry-display only; product-checkout coupons can target eligible products.
- States and validation match S-VEND-07. Pending owner coupons have no public discount. Active product coupons follow the finite-limit one-code checkout policy; approved service coupons remain informational and never alter price or create booking/payment.
- Acceptance: Given a provider attempts to target another provider's service/product or another business, when saved, then the server rejects it; given a provider submits a service coupon, when approved and valid, then it appears only on the matching public service.

### S-ADMN-12 — Promotions

- Screenshots: `d-admin-apromos.jpg`, `m-admin-apromos.jpg`.
- Layout: offer queue, homepage banners (title/subtitle, Add and Show toggle), featured businesses (Featured toggle), and a Coupons panel. Reuse shared editor/table patterns; do not add a Search/Payments admin.
- Data: `/admin/promotions/offers` + decision API; `/admin/promotions/placements` GET/POST and `/{id}` PATCH/DELETE; `/{id}/status` for activate/pause/end. Use `PlacementAdminDTO`, expected version and idempotency key.
- Special states: empty queue/placements, disabled/expired placement, missing activation/content configuration, stale version, target no longer approved, no permission.
- Interactions: banner editor uses plain localized title/subtitle, internal destination picker and the existing Media `bannerAssetId` field to upload, replace or remove a background; no second banner system is added. Image upload uses the existing `offer_banner` purpose and configured Media validation; unconfigured limits disable upload. Text-only fallback remains. Scope controls expose only permitted cities/areas; global placement is super-admin-only. Show/Featured toggles call authoritative commands, not local business flags; deletion confirms and removes public placement, not financial evidence.
- Responsive treatment: use the existing token-backed banner image/overlay treatment, preserve the configured title/subtitle locale, crop responsively without distortion, and retain readable text over image and fallback. Supply dimensions and responsive sizes; prioritize only when the banner is the actual LCP image, otherwise lazy-load.
- Coupons panel creates platform-eligible codes within the admin's geography, edits with expected version, and activates/pauses/ends through Offers. Pending vendor/provider coupons use the same scoped approval queue; creator cannot approve their own pending coupon. Mutations are audited. Require finite limits, percent cap and platform budget before activation.
- Rules: full F-AD-011, BR-06, BR-12. Permissions are `promos:view`/`promos:edit`; server checks old/new scope and target business and audits before/after. Paid placement rows cannot mark a payment successful or renew a period through a toggle.
- Acceptance:
  - Given an area admin views Promotions, when the queue loads, then only offers in assigned scope appear.
  - Given an admin lacks `promos:edit` or is outside the offer's area, when they attempt a decision, then the server denies it and the UI presents no success state.
  - Given an authorized admin decides a pending offer, when the decision succeeds, then the queue and status update and an audit record is present.
  - Given a scoped admin creates/edits a banner or toggles a featured business, when the command succeeds, then only approved, in-window public content changes and refresh preserves it.
  - Given an authorized scoped admin removes a banner background, when the versioned edit commits, then the text-only banner remains visible and the public Home tag is revalidated; invalid upload/replacement preserves the previous image.
  - Given another admin edits the placement or expiry wins a race, when a stale save/toggle arrives, then it conflicts and refetches without reviving it.
  - Given a suspended target, foreign asset, or different assigned area in the same city, when activation is attempted, then the panel shows rejection, not success.
  - Given an area admin creates/edits/approves a coupon, when eligible businesses or coupon ownership cross the assigned area, then the server denies the mutation; a platform-wide super_admin action remains explicit and audited.

### Offer integrations (owner screen layouts remain in their specs)

The shared Coupon editor uses BE-normalized codes, server eligible-target previews, IST validity dates, total/per-customer limits (defaults 1000/1), mandatory percent cap and platform budget where applicable. Explain one code after item offers and no restored use after cancellation/refund in EN/HI. Code/redemption mode lock after first submission/activation. Service-enquiry coupons hide financial redemption/usage controls. Save errors retain input; exhausted/changed eligibility never receives an optimistic success.

- Product detail `S-CUST-08` uses the shared `OfferBanner` (see [FE products](../../products/fe/products.md)); shop profile `S-CUST-06` uses its Offers tab ([FE businesses](../../businesses/fe/businesses.md)); service detail `S-CUST-09` uses the same offer read contract ([FE services](../../services/fe/services.md)).
- The product/service owner screens render active, expired and out-of-stock offer states; Offers supplies no duplicate page layout or independent product/service data.
- Home F-HM-002, F-HM-006, F-HM-007 / S-CUST-01 consumes Search's composition of `OffersDiscoveryPort.homePlacements({cityId?,areaId?,at})` (banners, featuredBusinesses, promotions); Home offers use `OffersReadPort.list` with featured=true. Direct `/promotions/placements` shares eligibility; Search owns no placement flags/table or guessed popular ranking.
- Billing F-VD-017 / S-VEND-16 ([FE payments](../../payments/fe/payments.md)) shows Offers' `purchaseStatus`. Buy remains unavailable until prepared placement, approval, `payments_online` and period/content policy permit activation. Verified charge does not mean placement live.

## Feature components and shared components

- Feature-local: `OffersList`, `OfferEditor`, `OfferApprovalQueue`, `PromotionPlacementEditor`, `PromotionPlacementPanel`; no duplicate card, banner or state-view component.
- Shared: `OfferCard`, `OfferBanner`, `DataTable`, `StatusBadge`, `Input`, `Select`, `Uploader`, `Toggle`, `ConfirmDialog`, standard state views and `DashboardShell`.

## i18n and analytics

- Key prefixes: `offers.*`, `admin.promotions.*`; EN/HI for titles, discount labels, terms when supplied, validity, statuses, validation, approval decisions and empty/error copy.
- Analytics: `offers.list_view` (page visible), `offers.select` (card opened), `offers.create` (submit), `offers.edit` (save), `admin.offer_decision` (decision succeeds). Do not send raw coupon codes, private business data or customer identifiers.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

- Manual UI: offer filters/cards, expired and out-of-stock states, vendor editor validation and pending state, scoped admin queue, no-permission state, long Hindi and dark mode.
- Journey: J3 offer → product/service/filtered Explore/shop destination; vendor create → pending approval → admin decision → public listing; rejected/expired offers never appear as active.
- Map every acceptance bullet to component/contract/manual journey scenarios: direct expired target read, removable offer URL, same-city/wrong-area placement CRUD, duplicate paid activation, stale toggle/expiry, foreign/private asset and malicious destination rejection. Accessibility inspection, keyboard-only editor/confirmation focus, long Hindi, dark mode and reduced motion cover all three panels.

## Open questions

The [BE policy gates](../be/offers.md#open-questions-and-handoff) govern provider service-offer routing, pricing/stacking, dates/terms/metrics, banner limits, coupon checkout redemption and paid periods. No disabled branch is replaced with sample values or another module's speculative control.
