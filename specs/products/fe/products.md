# FE: products

## Contents

- [Routes and rendering](#routes-and-rendering)
- [Screens](#screens)
- [Feature components and ownership](#feature-components-and-ownership)
- [i18n and analytics](#i18n-and-analytics)
- [Verification](#verification)

Features: F-PD-001, F-PD-002, F-PD-003, F-PD-006, F-PD-008, F-PD-009, F-VD-004, F-VD-005, F-VD-009, F-PV-005 (product list/editor only) | Screens: S-CUST-08, S-VEND-05, S-VEND-06, S-VEND-08, S-PROV-06, S-PROV-07 | Flows: J1, J4, J7

Backend counterpart: [BE products](../be/products.md) · [Feature inventory](../../../docs/design-context/01-feature-inventory.md)

Image Uploaders and linked-video panels follow the shared
[Cloudinary/embed contract](../../_foundation/media-and-maps.md): API multipart
uploads and canonical asset paths, not browser Cloudinary SDKs or video files.

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/product/[slug]` | S-CUST-08 | ISR with product/business tag revalidation; client islands for viewer, quantity, bookmark and cart actions | Public browse; gated writes | Self canonical while published/public; noindex when unavailable, unpublished or removed; out-of-stock state remains visible |
| `/vendor/products` | S-VEND-05 | SSR owner/role gate and initial page; client search, filters, selection and import form | Approved vendor, own business | Noindex |
| `/vendor/products/[id]` | S-VEND-06 | SSR owner gate; editor/media sorter client island | Approved vendor, own business | Noindex |
| `/vendor/inventory` | S-VEND-08 | SSR owner gate; stock adjustments client island | Approved vendor, own business | Noindex |
| `/provider/products` | S-PROV-06 | SSR owner/role gate and initial page; client search/filter | Approved provider, own business | Noindex |
| `/provider/products/[id]` | S-PROV-07 | SSR owner gate; shared product editor client island | Approved provider, own business | Noindex |

There is no provider inventory route in the screen inventory. Provider product screens share stock fields/actions in the product list/editor; a separate provider inventory screen remains open under Q-45.

## Screens

Shared UX states come from `frontend-shared.md`; use the screen-specific states below. Match the screenshots and prototype CSS; all statuses use icon + text + colour.

### S-CUST-08 — Product details

- Screenshots: `d-customer-prod-p1.jpg`, `d-customer-prod-p45.jpg`, `d-customer-prod-p46.jpg`, `d-customer-prod-p50.jpg`; mobile equivalents; `d-dark-customer-prod-p1.jpg`, `m-dark-customer-prod-p1.jpg`, `d-hindi-customer-prod-p1.jpg`, `m-hindi-customer-prod-p1.jpg`.
- Layout: mobile stacks breadcrumb, offer (offers-owned), 1:1 media, details and sticky purchase actions; desktop uses two columns. Use `Breadcrumbs`, `MediaCarousel`, `FullScreenViewer`, `QuantityStepper`, `OfferBanner`, `RatingBreakdown`, `ReviewForm`, `ProductCard`, `ShareSheet`.
- Data: `GET /products/{slug}` and `/products/{slug}/related`; seller/delivery from businesses; offer from offers; product-linked videos from media-videos; ratings/reviews from reviews; bookmark/heart from engagement; cart from cart-checkout.
- Special states: out of stock with `products.stock.outOfStock` and notify-me; low stock `products.stock.onlyLeft`; outside delivery range with pickup information; offer expired/out-of-stock from offers; unavailable/unpublished product; no reviews or related products; hide the product-linked videos section when it has no approved videos; media embed fallback.
- Interactions: breadcrumb links Home/category/product; select an active variant only when variants exist, otherwise send `variantId:null` and omit the selector; quantity is 1–min(10, stock). Add to cart/Buy now require login and return to product (BR-21); viewer supports swipe, previous/next, arrows, counter, close/Esc, pinch/double-tap zoom, focus trap and heart; “View all” routes to Explore Products with the same category/subcategory; share uses native share or copy; bookmark is engagement-owned. “Notify me” follows Q-48 and must not claim subscription until confirmed.
- Rules: BR-01/02/04/06/16/21/22; related products use same category and subcategory; out-of-stock disables purchase; delegated offer/review/video/bookmark content is never fabricated.
- Given a public product has stock, when the customer selects a variant and quantity then adds it, then the selected item reaches cart with the server-validated price and quantity.
- Given a product has no variants, when the customer buys it, then purchase remains available without a fabricated variant selection.
- Given the product is out of stock or unavailable, when its detail loads, then the correct special state appears, purchase actions are unavailable and the page does not claim an unconfirmed notification subscription.
- Given a guest opens the viewer, bookmarks, or starts purchase, when login is required, then the action returns to the same product and overlay/action context where applicable.

### S-VEND-05 — Products

- Screenshots: `d-vendor-vproducts.jpg`, `m-vendor-vproducts.jpg`.
- Layout: dashboard shell; desktop table, mobile labelled cards; search/stock filter, bulk action bar, category manager. Use `DashboardShell`, `DataTable`, `Input`, `Select`, `Checkbox`, `StatusBadge`, `Sheet`.
- Data: `GET /businesses/me/products`; bulk operations and import use BE products; taxonomy suggestions route to catalog.
- Special states: empty; CSV/XLSX row errors with no false success; no matching search results; stale selection/version conflict.
- Interactions: search name/SKU; filter all/low/out-of-stock; select rows and bulk mark in/out of stock or delete; import CSV/XLSX with row errors; manage product subcategory pills (reorder, localized rename, hide); suggest subcategory via catalog. Keyboard selection and clear/reset retain focus.
- Rules: F-VD-004/005; main categories stay fixed (BR-07); mutations are owner-scoped and atomic.
- Given an owner imports valid rows, when import completes, then the list refreshes with created products and a truthful count.
- Given an import has invalid rows, when errors return, then row numbers and localized corrections are shown without a success-shaped partial import.
- Given a different business ID is submitted in a bulk action, when the server evaluates the request, then the action is denied and no selected record changes.

### S-VEND-06 — Product editor

- Screenshots: `d-vendor-vprod-new.jpg`, `d-vendor-vprod-p1.jpg`, `m-vendor-vprod-new.jpg`, `m-vendor-vprod-p1.jpg`.
- Layout: desktop two-column form/media and consent cards; mobile stacked sections. Use `Input`, `Select`, `Uploader`, `MediaSorter`, `Toggle`, `Button`.
- Data: POST/PATCH `/businesses/me/products` uses the explicit product DTO; submit inventory's separate expected version whenever stock fields change. Images use ready Media asset IDs; product-linked video add/moderation uses media-videos; gallery default comes from businesses.
- Special states: validation errors; image rejected/preview failed; stale edit version; add/edit; Premium expired with retained-but-inactive featured selection.
- Interactions: EN name required; HI name, description, subcategory, brand, INR price/MRP, unit, SKU, stock threshold, variants, tags, specs, image sort, availability, Premium featured selection and per-item gallery toggle; a stored selection remains visible but inactive after Premium expiry and automatically becomes effective after a verified renewal; changing selection requires active Premium entitlement; video links use media-videos and appear only after approval; save preserves image order; generate/copy/share product link.
- Rules: BR-01/04/06/10/16; price is displayed in INR but submitted as integer paise; max five photo items; no direct user URL embed.
- Given valid product fields and media, when the owner saves, then the product is saved once and its stable public URL is available.
- Given MRP is below price, an invalid taxonomy pair or a non-owned image asset is submitted, when save runs, then field errors appear and no product update is persisted.
- Given no active Premium entitlement exists, when the owner edits featuring, then the control cannot save a new selection and the product remains unfeatured.
- Given a selected product's Premium entitlement expires and is later renewed, when its public projection is read, then the selection remains stored, the product is not featured during the gap, and it becomes featured again only after verified renewal and current listing eligibility.
- Given Hindi is selected or longer copy is entered, when the form renders at 360 px and desktop, then labels wrap without clipping and all controls remain keyboard accessible.

### S-VEND-08 — Inventory

- Screenshots: `d-vendor-vinv.jpg`, `m-vendor-vinv.jpg`.
- Layout: desktop responsive table; mobile labelled cards with stock stepper and availability action. Use `DataTable`, `QuantityStepper`, `StatusBadge`, `Button`.
- Data: GET/PATCH `/businesses/me/inventory`; restock-low uses the products endpoint.
- Special states: low stock, zero stock, empty inventory, version conflict.
- Interactions: show product, on-hand, low alert, adjust +/- without going below zero, mark in/out of stock; “Restock all low items to 20” updates only rows at/below threshold. “Mark in stock” sets zero stock to 10 as observed in the prototype (Q-49).
- Rules: BR-04/06/22; no stock change may overwrite a newer version or permit purchase at zero stock.
- Given concurrent owners edit the same stock row, when the older version submits, then it receives a conflict and refresh path rather than overwriting the newer value.
- Given stock reaches zero, when save succeeds, then the item is out of stock and cannot be purchased; marking it in stock follows the observed quantity-10 behavior until Q-49 is resolved.
- Given restock-low succeeds, when the list refreshes, then only low-threshold rows have stock 20 and availability enabled.

### S-PROV-06 — Provider products

- Screenshots: `d-provider-sproducts.jpg`, `m-provider-sproducts.jpg`.
- Layout: same product list as S-VEND-05 inside provider DashboardShell.
- Data: same products endpoints, scoped to the provider business.
- Special states: empty; no matching results; import/media errors as shown by shared product controls.
- Interactions: list/search/filter/edit own products; no vendor-only navigation. Stock is visible/editable in the shared product list/editor; there is no separate provider inventory route pending Q-45.
- Rules: F-PV-005 product-listing portion, BR-06; orders are orders-owned.
- Given an approved provider opens products, when records load, then only that provider's products and stock are shown.
- Given a provider submits a product ID owned by a vendor, when it is edited, then the request is denied without revealing vendor data.
- Given the provider has no products, when the page loads, then the shared empty state offers the documented Add product action.

### S-PROV-07 — Provider product editor

- Screenshots: `d-provider-sprod-new.jpg`, `d-provider-sprod-p48.jpg`, `m-provider-sprod-new.jpg`, `m-provider-sprod-p48.jpg`.
- Layout: same responsive editor as S-VEND-06 inside provider DashboardShell.
- Data: same products API; provider business and approval are session-scoped.
- Special states: validation errors; media errors; version conflict.
- Interactions: same fields and media ordering as vendor editor; provider products may be ordered as specified by F-PV-005; order management is not implemented here.
- Rules: BR-01/04/06/16; no booking/service action is added to product editor.
- Given an approved provider saves a valid product, when the save succeeds, then it appears only under that provider and on its public product route.
- Given a provider's business is not approved, when the editor submits a saleable product, then the action is blocked with the approval state.
- Given the provider edits product media, when an asset is not owned by that business, then it is rejected and existing media order remains unchanged.

## Feature components and ownership

- Product-specific: `ProductDetails`, `ProductEditor`, `ProductList`, `InventoryTable`, `ProductPillManager`, `ProductMediaSorter`.
- Shared: `Breadcrumbs`, `ProductCard`, `QuantityStepper`, `MediaCarousel`, `FullScreenViewer`, `OfferBanner`, `RatingBreakdown`, `ReviewForm`, `DataTable`, `StatusBadge`, `ShareSheet`, `Skeleton`, `EmptyState`, `ErrorState`.
- Offers owns PD4; media-videos owns PD5 and video moderation; reviews owns PD7 and review submission; businesses owns seller/delivery data; engagement owns bookmark/heart; cart-checkout owns cart mutations. This module composes those contracts only.

## i18n and analytics

- Key prefixes: `products.detail.*`, `products.stock.*`, `products.editor.*`, `products.list.*`, `products.inventory.*`, `products.pills.*`.
- Reuse EN/HI catalogue copy; add missing keys to both locales. Never truncate meaningful Hindi names; check dark/light and 360px layouts.
- Analytics names only: `product_view` (detail visible), `product_add_to_cart` (cart confirms), `product_buy_now` (cart confirms), `product_share` (share invoked), `inventory_update` (save succeeds). Do not add product analytics payload beyond the event plan in Q-11.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Editor adds optional configured `taxCode` selection and displays orderability/setup-required status; never accepts raw rates/tax amounts. Missing tax configuration does not hide a public product but prevents purchasing. Use [Media's public-image policy](../../media-videos/be/media-videos.md#public-image-policy), maximum five ready assets, responsive variants and prior-image retention on failure. Manually verify wrong-purpose assets, invalid classifications, Hindi messages and truthful out-of-stock metadata under the shared public URL policy.

- Manual UI: variant and quantity bounds, stock state, media viewer keyboard/gestures/focus, row errors, localized editor validation, category pills.
- Manual journey: J1 browse-to-order product path; J4 reel-linked product to cart; J7 vendor first product; verify provider list/editor and owner-scope denial.
- Visual/a11y: required product screenshots at 360px/desktop, light/dark, EN/HI; keyboard-only carousel and forms; manual WCAG 2.2 AA.
