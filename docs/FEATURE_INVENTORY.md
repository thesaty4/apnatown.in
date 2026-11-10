# ApnaTown Feature Inventory

Every feature ID from the product brief is listed here as a **spec-status
tracker** (BE/FE spec path + status); for the full behaviour description
of each feature, see `docs/project/03-feature-catalog.md` (the product
knowledge base's richer, canonical feature catalog — don't duplicate its
text here).
Status starts at `not started` for all rows and is updated by the `spec-writer` agent and developers 
as specs and implementations land. BE/FE spec paths are placeholders the `spec-writer` agent fills in; 
see `specs/_templates/`.

Role(s), BE module(s), and FE route/screen are constant per area and stated once in that area's 
heading below (not repeated per row) — see `docs/architecture.md` for the authoritative module map.


## X. Cross-cutting

Roles: all roles. Backend module(s): `notifications, audit`. Frontend route/screen: `n/a (cross-cutting; implemented in packages/shared and packages/ui)`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| X1 | English/Hindi toggle | `specs/notifications/be/x1-english-hindi-toggle.md` | `specs/notifications/fe/x1-english-hindi-toggle.md` | not started |
| X2 | theme light/dark/auto | `specs/notifications/be/x2-theme-light-dark-auto.md` | `specs/notifications/fe/x2-theme-light-dark-auto.md` | not started |
| X3 | responsive 360/tablet/desktop | `specs/notifications/be/x3-responsive-360-tablet-desktop.md` | `specs/notifications/fe/x3-responsive-360-tablet-desktop.md` | not started |
| X4 | accessibility (keyboard, focus, ARIA, reduced motion) | `specs/notifications/be/x4-accessibility.md` | `specs/notifications/fe/x4-accessibility.md` | not started |
| X5 | offline banner | `specs/notifications/be/x5-offline-banner.md` | `specs/notifications/fe/x5-offline-banner.md` | not started |
| X6 | slow-connection/lite mode | `specs/notifications/be/x6-slow-connection-lite-mode.md` | `specs/notifications/fe/x6-slow-connection-lite-mode.md` | not started |
| X7 | five UX states on every screen (default, skeleton, empty, error+retry, no-permission) | `specs/notifications/be/x7-five-ux-states-on-every-screen.md` | `specs/notifications/fe/x7-five-ux-states-on-every-screen.md` | not started |
| X8 | cookie consent and WhatsApp opt-in components | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| X9 | system pages (404, 500, offline, maintenance, session expired, account deleted) | `specs/notifications/be/x9-system-pages.md` | `specs/notifications/fe/x9-system-pages.md` | not started |
| X10 | SEO page templates (business, product, service, category) with readable URLs, breadcrumbs, structured data | `specs/notifications/be/x10-seo-page-templates.md` | `specs/notifications/fe/x10-seo-page-templates.md` | not started |
| X11 | print templates (QR poster/table-tent/sticker, invoice, order slip) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| X12 | notification templates (in-app, email, WhatsApp) for key events (order placed, out for delivery, delivered, cancelled/refund, approval decision, new enquiry) | `specs/notifications/be/x12-notification-templates.md` | `specs/notifications/fe/x12-notification-templates.md` | not started |
| X13 | Indian formatting utilities (INR paise, IST 12-hour, distance, phone) | `specs/notifications/be/x13-indian-formatting-utilities.md` | `specs/notifications/fe/x13-indian-formatting-utilities.md` | not started |
| X14 | audit trail for admin actions (before/after) | `specs/notifications/be/x14-audit-trail-for-admin-actions.md` | `specs/notifications/fe/x14-audit-trail-for-admin-actions.md` | not started |
| X15 | PWA for rider | `specs/notifications/be/x15-pwa-for-rider.md` | `specs/notifications/fe/x15-pwa-for-rider.md` | not started |

## AU. Auth and onboarding

Roles: customer, vendor, provider, rider, admin, super_admin. Backend module(s): `auth, users`. Frontend route/screen: `/login, /onboarding`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| AU1 | splash and language choice | `specs/auth/be/au1-splash-and-language-choice.md` | `specs/auth/fe/au1-splash-and-language-choice.md` | not started |
| AU2 | location primer with manual fallback (location never mandatory) | `specs/auth/be/au2-location-primer-with-manual-fallback.md` | `specs/auth/fe/au2-location-primer-with-manual-fallback.md` | not started |
| AU3 | browse as guest | `specs/auth/be/au3-browse-as-guest.md` | `specs/auth/fe/au3-browse-as-guest.md` | not started |
| AU4 | mobile OTP login (6-box input, auto-advance, paste, resend timer, attempt limits), optional email/Google | `specs/auth/be/auth.md` | `specs/auth/fe/auth.md` | spec written |
| AU5 | profile completion | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| AU6 | login-required prompt that returns the user to the same page/video after login | `specs/auth/be/auth.md` | `specs/auth/fe/auth.md` | spec written |
| AU7 | logout and session expiry | `specs/auth/be/auth.md` | `specs/auth/fe/auth.md` | spec written |
| AU8 | account deletion and personal-data download | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |

## HM. Home

Roles: customer. Backend module(s): `search` (home composition), `catalog` (category taxonomy), businesses, products, services, offers, engagement. Frontend route/screen: `/`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| HM1 | sticky location selector, search with voice icon, bell, cart, play (videos) icon | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM2 | hero banner carousel | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM3 | "Shop by category" tiles open Explore with category pre-applied | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| HM4 | "Local services" tiles open Explore Services with category pre-applied | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| HM5 | offers and deals (card opens product/service/filtered list) | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM6 | nearby shops with responsive shop card (image top, details bottom; 1/2/3-4 columns; "View all shops") | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM7 | featured businesses ("View all businesses" -> Explore Shops featured) | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM8 | popular businesses | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM9 | featured products ("View all products" -> Explore Products featured) | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM10 | popular providers | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM11 | local promotions | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM12 | recently viewed | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM13 | bookmarks quick access | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |
| HM14 | desktop footer (About, Contact, Vendor/Rider/Provider signup, legal, language) | `specs/search/be/search.md` | `specs/search/fe/search.md` | not started |

## LC. Location and discovery

Roles: customer. Backend module(s): `geo`. Frontend route/screen: `/location`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| LC1 | GPS detect, manual area/locality/PIN, saved locations | `specs/geo/be/geo.md` | `specs/geo/fe/geo.md` | spec written |
| LC2 | map and list views with pins, radius slider, "you are here" | `specs/geo/be/geo.md` | `specs/geo/fe/geo.md` | spec written |
| LC3 | directions (opens maps app) | `specs/geo/be/geo.md` | `specs/geo/fe/geo.md` | spec written |
| LC4 | clear distinction between "Nearby (distance)" and "Delivers to your address" | `specs/geo/be/geo.md` | `specs/geo/fe/geo.md` | spec written |
| LC5 | states: denied, GPS off, outside service area ("We are not in your city yet" + notify-me) | `specs/geo/be/geo.md` | `specs/geo/fe/geo.md` | spec written |

## EX. Explore

Roles: customer. Backend module(s): `search, catalog, products, services, businesses`. Frontend route/screen: `/explore`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| EX1 | tabs Products \| Shops \| Services with result counts | `specs/search/be/ex1-tabs-products-shops-services-with-re.md` | `specs/search/fe/ex1-tabs-products-shops-services-with-re.md` | not started |
| EX2 | category pre-applied from home as removable pill, changeable | `specs/search/be/ex2-category-pre-applied-from-home-as-re.md` | `specs/search/fe/ex2-category-pre-applied-from-home-as-re.md` | not started |
| EX3 | per-tab filters remembered when switching tabs | `specs/search/be/ex3-per-tab-filters-remembered-when-swit.md` | `specs/search/fe/ex3-per-tab-filters-remembered-when-swit.md` | not started |
| EX4 | Products filters (price range, rating, category+subcategory, brand, offers, in stock, delivery/pickup, distance, sort) | `specs/search/be/ex4-products-filters.md` | `specs/search/fe/ex4-products-filters.md` | not started |
| EX5 | Shops filters (category, distance, rating, open now, delivers to me, offers, verified, sort) | `specs/search/be/ex5-shops-filters.md` | `specs/search/fe/ex5-shops-filters.md` | not started |
| EX6 | Services filter: Category multi-select + Subcategory multi-select grouped under category headings, checkboxes with counts, Select all/Clear per group, inner search when >8, "Show more", disabled when count 0, OR logic, removing a category removes its subcategories, removable chips + Clear all, loading skeleton, long-Hindi-safe, keyboard/screen-reader grouped list | `specs/search/be/ex6-services-filter-category-multi-selec.md` | `specs/search/fe/ex6-services-filter-category-multi-selec.md` | not started |
| EX7 | filter UI: bottom sheet (mobile, sticky "Show N results"), left sidebar (desktop, live results), horizontal filter bar with count badge (tablet) | `specs/search/be/ex7-filter-ui-bottom-sheet.md` | `specs/search/fe/ex7-filter-ui-bottom-sheet.md` | not started |
| EX8 | shareable URL `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting` | `specs/search/be/ex8-shareable-url-explore-tab-services-c.md` | `specs/search/fe/ex8-shareable-url-explore-tab-services-c.md` | not started |
| EX9 | browser Back restores previous page and scroll | `specs/search/be/ex9-browser-back-restores-previous-page-.md` | `specs/search/fe/ex9-browser-back-restores-previous-page-.md` | not started |
| EX10 | empty state per tab with "Clear category" and suggestions | `specs/search/be/ex10-empty-state-per-tab-with-clear-cate.md` | `specs/search/fe/ex10-empty-state-per-tab-with-clear-cate.md` | not started |
| EX11 | map/list toggle; same filter component reused on Search (Services tab) and service category pages | `specs/search/be/ex11-map-list-toggle-same-filter-compone.md` | `specs/search/fe/ex11-map-list-toggle-same-filter-compone.md` | not started |

## SR. Search

Roles: customer. Backend module(s): `search`. Frontend route/screen: `/search`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| SR1 | tabs All \| Products \| Shops \| Services \| Videos | `specs/search/be/sr1-tabs-all-products-shops-services-vid.md` | `specs/search/fe/sr1-tabs-all-products-shops-services-vid.md` | not started |
| SR2 | keyword -> category/subcategory/product-tag mapping (e.g. "AC" -> AC products, electronics shops, AC services, videos; "iPhone 15" -> products, mobile shops, mobile-repair services) | `specs/search/be/sr2-keyword-category-subcategory-product.md` | `specs/search/fe/sr2-keyword-category-subcategory-product.md` | not started |
| SR3 | Hindi/Hinglish and typo tolerance ("एसी", "plumbr") | `specs/search/be/sr3-hindi-hinglish-and-typo-tolerance.md` | `specs/search/fe/sr3-hindi-hinglish-and-typo-tolerance.md` | not started |
| SR4 | grouped autocomplete (Products, Shops, Services, Categories, Subcategories, related searches) | `specs/search/be/sr4-grouped-autocomplete.md` | `specs/search/fe/sr4-grouped-autocomplete.md` | not started |
| SR5 | recent and popular searches | `specs/search/be/sr5-recent-and-popular-searches.md` | `specs/search/fe/sr5-recent-and-popular-searches.md` | not started |
| SR6 | All tab grouped sections with "See all" and "Related services for AC" | `specs/search/be/sr6-all-tab-grouped-sections-with-see-al.md` | `specs/search/fe/sr6-all-tab-grouped-sections-with-see-al.md` | not started |
| SR7 | per-tab filters (Services reuses the EX6 component) | `specs/search/be/sr7-per-tab-filters.md` | `specs/search/fe/sr7-per-tab-filters.md` | not started |
| SR8 | sort (relevance, distance, rating, price, newest) | `specs/search/be/sr8-sort.md` | `specs/search/fe/sr8-sort.md` | not started |
| SR9 | no-results with related categories | `specs/search/be/sr9-no-results-with-related-categories.md` | `specs/search/fe/sr9-no-results-with-related-categories.md` | not started |
| SR10 | Search keeps its own filter state, separate from Explore | `specs/search/be/sr10-search-keeps-its-own-filter-state.md` | `specs/search/fe/sr10-search-keeps-its-own-filter-state.md` | not started |

## PF. Business and provider profile

Roles: customer, vendor, provider. Backend module(s): `businesses, products, services, media-videos, reviews, engagement, admin`. Frontend route/screen: `/shop/:slug, /provider/:slug`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| PF1 | cover, logo, name, category, verified, rating, open/closed with today's hours, distance | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF2 | sticky action bar (Call, WhatsApp, Directions, Share, Save) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF3 | tabs About \| Products & Services \| Offers \| Gallery \| Videos/Reels \| Reviews \| Contact & Location | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF4 | Products & Services section with segmented switch (only applicable ones), products: sticky horizontally scrollable category pills with counts; services: category pills then subcategory pills | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF5 | provider's "expert in" subcategories visible on card and profile | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF6 | weekly hours table, delivery/pickup info and eligibility | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF7 | map and directions, QR, report listing, share | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF8 | follow/unfollow with notification bell | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | not started |
| PF9 | Gallery with filters (All \| Photos \| Videos \| By product \| By service), lightbox with swipe, captions, linked-item chip, hearts, report media | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| PF10 | Videos/Reels tab (grid, views, follow) | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| PF11 | any profile can show Add to cart (products) and Send Enquiry (services) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF12 | owner-only "Add product/Add service" prompts | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PF13 | states: unavailable listing (pending/suspended), closed, outside delivery range, no services yet | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |

## PD. Product details

Roles: customer. Backend module(s): `products, offers, reviews`. Frontend route/screen: `/product/:slug`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| PD1 | breadcrumbs | `specs/products/be/pd1-breadcrumbs.md` | `specs/products/fe/pd1-breadcrumbs.md` | not started |
| PD2 | media carousel with images and embedded videos (play badge), full-screen viewer (prev/next, swipe, arrow keys, counter, close, pinch/double-tap zoom, heart, focus trap) | `specs/products/be/pd2-media-carousel-with-images-and-embed.md` | `specs/products/fe/pd2-media-carousel-with-images-and-embed.md` | not started |
| PD3 | price, MRP, discount, variants, stock (out-of-stock with notify-me, low stock), quantity, Add to cart, Buy now | `specs/products/be/pd3-price.md` | `specs/products/fe/pd3-price.md` | not started |
| PD4 | offer banner at top (badge, discounted price, validity date, terms; expired and out-of-stock-offer states) | `specs/products/be/pd4-offer-banner-at-top.md` | `specs/products/fe/pd4-offer-banner-at-top.md` | not started |
| PD5 | Videos & Reels section (hidden if none; opens the Reels viewer at that video) | `specs/products/be/pd5-videos-reels-section.md` | `specs/products/fe/pd5-videos-reels-section.md` | not started |
| PD6 | seller card with delivery/pickup info | `specs/products/be/pd6-seller-card-with-delivery-pickup-inf.md` | `specs/products/fe/pd6-seller-card-with-delivery-pickup-inf.md` | not started |
| PD7 | specs, reviews with breakdown and review form | `specs/products/be/pd7-specs.md` | `specs/products/fe/pd7-specs.md` | not started |
| PD8 | related products with "View all" -> Explore Products filtered to same category and subcategory | `specs/products/be/pd8-related-products-with-view-all-explo.md` | `specs/products/fe/pd8-related-products-with-view-all-explo.md` | not started |
| PD9 | share link and bookmark | `specs/products/be/pd9-share-link-and-bookmark.md` | `specs/products/fe/pd9-share-link-and-bookmark.md` | not started |

## SV. Services

Roles: customer, provider. Backend module(s): `services, offers, reviews`. Frontend route/screen: `/service/:slug`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| SV1 | service card (image, name, subcategory tag, provider with logo, price/"Price on enquiry", rating, distance, open/availability badge, offer badge, Call/WhatsApp/Save) | `specs/services/be/sv1-service-card.md` | `specs/services/fe/sv1-service-card.md` | not started |
| SV2 | service details page `/service/:slug`: carousel, title, subcategory, price type (from/fixed/range/on enquiry) + unit (per hour/day/event/sq ft), description, included/excluded, service area, hours, provider experience | `specs/services/be/sv2-service-details-page-service-slug-ca.md` | `specs/services/fe/sv2-service-details-page-service-slug-ca.md` | not started |
| SV3 | provider card with follow, verified, rating, Call/WhatsApp/Directions | `specs/services/be/sv3-provider-card-with-follow.md` | `specs/services/fe/sv3-provider-card-with-follow.md` | not started |
| SV4 | reference videos and previous-work gallery | `specs/services/be/sv4-reference-videos-and-previous-work-g.md` | `specs/services/fe/sv4-reference-videos-and-previous-work-g.md` | not started |
| SV5 | Send Enquiry form (name, phone, message, preferred date, success state) as primary CTA; booking/payment is a future placeholder | `specs/services/be/sv5-send-enquiry-form.md` | `specs/services/fe/sv5-send-enquiry-form.md` | not started |
| SV6 | offers, reviews (breakdown, form), FAQs, related services, similar providers, share, bookmark | `specs/services/be/sv6-offers.md` | `specs/services/fe/sv6-offers.md` | not started |
| SV7 | breadcrumbs Services > Category > Subcategory > Service | `specs/services/be/sv7-breadcrumbs-services-category-subcat.md` | `specs/services/fe/sv7-breadcrumbs-services-category-subcat.md` | not started |
| SV8 | each service has exactly one subcategory; a provider can be "expert in" several | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |

## OF. Offers

Roles: customer, vendor, provider, admin. Backend module(s): `offers`. Frontend route/screen: `/offers`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| OF1 | offers page with filters | `specs/offers/be/of1-offers-page-with-filters.md` | `specs/offers/fe/of1-offers-page-with-filters.md` | not started |
| OF2 | offer card -> product page (single product), service page (service offer), filtered product list (several products), shop page (shop-wide) | `specs/offers/be/of2-offer-card-product-page.md` | `specs/offers/fe/of2-offer-card-product-page.md` | not started |
| OF3 | states: active, pending admin approval, paused, ended/expired, out-of-stock | `specs/offers/be/of3-states-active.md` | `specs/offers/fe/of3-states-active.md` | not started |
| OF4 | featured offers on home | `specs/offers/be/of4-featured-offers-on-home.md` | `specs/offers/fe/of4-featured-offers-on-home.md` | not started |
| OF5 | vendor offer lifecycle pending -> active -> paused -> ended; admin approval | `specs/offers/be/of5-vendor-offer-lifecycle-pending-activ.md` | `specs/offers/fe/of5-vendor-offer-lifecycle-pending-activ.md` | not started |

## CK. Cart and checkout

Roles: customer. Backend module(s): `cart-checkout`. Frontend route/screen: `/cart, /checkout`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| CK1 | cart grouped by business, quantity stepper, remove, save for later, price breakdown, delivery fee, taxes/charges, coupon | `specs/cart-checkout/be/ck1-cart-grouped-by-business.md` | `specs/cart-checkout/fe/ck1-cart-grouped-by-business.md` | not started |
| CK2 | one checkout splits into one order per shop with clear notice | `specs/cart-checkout/be/ck2-one-checkout-splits-into-one-order-p.md` | `specs/cart-checkout/fe/ck2-one-checkout-splits-into-one-order-p.md` | not started |
| CK3 | per shop choose home delivery or self-pickup | `specs/cart-checkout/be/ck3-per-shop-choose-home-delivery-or-sel.md` | `specs/cart-checkout/fe/ck3-per-shop-choose-home-delivery-or-sel.md` | not started |
| CK4 | address book (add/edit/delete, map pin, landmark, PIN, labels, default) | `specs/cart-checkout/be/ck4-address-book.md` | `specs/cart-checkout/fe/ck4-address-book.md` | not started |
| CK5 | delivery range and minimum-order checks, out-of-range message | `specs/cart-checkout/be/ck5-delivery-range-and-minimum-order-che.md` | `specs/cart-checkout/fe/ck5-delivery-range-and-minimum-order-che.md` | not started |
| CK6 | payments: UPI, cards, net banking, wallets, COD / pay-at-pickup | `specs/cart-checkout/be/ck6-payments-upi.md` | `specs/cart-checkout/fe/ck6-payments-upi.md` | not started |
| CK7 | payment failure and retry | `specs/cart-checkout/be/ck7-payment-failure-and-retry.md` | `specs/cart-checkout/fe/ck7-payment-failure-and-retry.md` | not started |
| CK8 | order success with an order id per shop | `specs/cart-checkout/be/ck8-order-success-with-an-order-id-per-s.md` | `specs/cart-checkout/fe/ck8-order-success-with-an-order-id-per-s.md` | not started |
| CK9 | coupons (flat/percent, minimum, discount distributed proportionally across shop orders) | `specs/cart-checkout/be/ck9-coupons.md` | `specs/cart-checkout/fe/ck9-coupons.md` | not started |

## OR. Orders and tracking

Roles: customer, rider, vendor, provider, admin. Backend module(s): `orders, delivery, payments`. Frontend route/screen: `/orders`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| OR1 | orders list (active/completed/cancelled) and detail | `specs/orders/be/or1-orders-list.md` | `specs/orders/fe/or1-orders-list.md` | not started |
| OR2 | timeline: delivery `placed -> accepted -> preparing -> ready -> out_for_delivery -> delivered`; pickup `placed -> accepted -> ready -> picked_up`; plus `cancelled`, `refunded` | `specs/orders/be/or2-timeline-delivery-placed-accepted-pr.md` | `specs/orders/fe/or2-timeline-delivery-placed-accepted-pr.md` | not started |
| OR3 | live tracking: rider name, phone, rating, status, ETA, delivery OTP | `specs/orders/be/or3-live-tracking-rider-name.md` | `specs/orders/fe/or3-live-tracking-rider-name.md` | not started |
| OR4 | pickup: address, directions, pickup code | `specs/orders/be/or4-pickup-address.md` | `specs/orders/fe/or4-pickup-address.md` | not started |
| OR5 | actions: cancel, request refund, report problem, contact shop/rider, reorder, download invoice | `specs/orders/be/or5-actions-cancel.md` | `specs/orders/fe/or5-actions-cancel.md` | not started |
| OR6 | cancellation/refund flow with reasons, message "Admin and vendor have been notified and will contact you", refund tracker `requested -> approved -> completed` | `specs/orders/be/or6-cancellation-refund-flow-with-reason.md` | `specs/orders/fe/or6-cancellation-refund-flow-with-reason.md` | not started |
| OR7 | partial fulfilment/substitution (vendor marks item unavailable) | `specs/orders/be/or7-partial-fulfilment-substitution.md` | `specs/orders/fe/or7-partial-fulfilment-substitution.md` | not started |
| OR8 | dispute case workflow visible to customer | `specs/orders/be/or8-dispute-case-workflow-visible-to-cus.md` | `specs/orders/fe/or8-dispute-case-workflow-visible-to-cus.md` | not started |

## RV. Reviews

Roles: customer, vendor, provider, rider. Backend module(s): `reviews`. Frontend route/screen: `/reviews`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| RV1 | separate flows for business, product, service, rider | `specs/reviews/be/rv1-separate-flows-for-business.md` | `specs/reviews/fe/rv1-separate-flows-for-business.md` | not started |
| RV2 | eligibility only for verified purchasers or enquirers, with clear message | `specs/reviews/be/rv2-eligibility-only-for-verified-purcha.md` | `specs/reviews/fe/rv2-eligibility-only-for-verified-purcha.md` | not started |
| RV3 | star rating, text, photos, tags | `specs/reviews/be/rv3-star-rating.md` | `specs/reviews/fe/rv3-star-rating.md` | not started |
| RV4 | edit/delete own review, "My reviews" | `specs/reviews/be/rv4-edit-delete-own-review.md` | `specs/reviews/fe/rv4-edit-delete-own-review.md` | not started |
| RV5 | helpful and report | `specs/reviews/be/rv5-helpful-and-report.md` | `specs/reviews/fe/rv5-helpful-and-report.md` | not started |
| RV6 | moderation: links/abusive words go to pending moderation | `specs/reviews/be/rv6-moderation-links-abusive-words-go-to.md` | `specs/reviews/fe/rv6-moderation-links-abusive-words-go-to.md` | not started |
| RV7 | vendor/provider reply and report abusive review | `specs/reviews/be/rv7-vendor-provider-reply-and-report-abu.md` | `specs/reviews/fe/rv7-vendor-provider-reply-and-report-abu.md` | not started |

## EG. Engagement

Roles: customer. Backend module(s): `engagement`. Frontend route/screen: `/saved`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| EG1 | Saved: tabs Shops \| Services \| Photos & Videos (filters Photos/Videos/Reels, remove) | `specs/engagement/be/eg1-saved-tabs-shops-services-photos-vid.md` | `specs/engagement/fe/eg1-saved-tabs-shops-services-photos-vid.md` | not started |
| EG2 | heart on any photo/video/reel | `specs/engagement/be/eg2-heart-on-any-photo-video-reel.md` | `specs/engagement/fe/eg2-heart-on-any-photo-video-reel.md` | not started |
| EG3 | follow/unfollow with confirmation and bell | `specs/engagement/be/eg3-follow-unfollow-with-confirmation-an.md` | `specs/engagement/fe/eg3-follow-unfollow-with-confirmation-an.md` | not started |
| EG4 | like on videos | `specs/engagement/be/eg4-like-on-videos.md` | `specs/engagement/fe/eg4-like-on-videos.md` | not started |
| EG5 | comments (moderated, "awaiting moderation") | `specs/engagement/be/eg5-comments.md` | `specs/engagement/fe/eg5-comments.md` | not started |
| EG6 | share sheet (WhatsApp, copy link, native share) | `specs/engagement/be/eg6-share-sheet.md` | `specs/engagement/fe/eg6-share-sheet.md` | not started |
| EG7 | bookmarks of businesses/providers/services | `specs/engagement/be/eg7-bookmarks-of-businesses-providers-se.md` | `specs/engagement/fe/eg7-bookmarks-of-businesses-providers-se.md` | not started |

## RL. Videos and reels

Roles: customer, vendor, provider. Backend module(s): `media-videos, engagement`. Frontend route/screen: `/videos/:id`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| RL1 | play icon in top bar, desktop nav and bottom navigation opens full-screen feed | `specs/media-videos/be/rl1-play-icon-in-top-bar.md` | `specs/media-videos/fe/rl1-play-icon-in-top-bar.md` | not started |
| RL2 | pills: For You \| Following \| Nearby \| Offers \| Products \| Services + category pills | `specs/media-videos/be/rl2-pills-for-you-following-nearby-offer.md` | `specs/media-videos/fe/rl2-pills-for-you-following-nearby-offer.md` | not started |
| RL3 | vertical snap feed, autoplay on view, tap pause/play, mute, progress bar, captions, data-saver "Tap to play", lazy loading | `specs/media-videos/be/rl3-vertical-snap-feed.md` | `specs/media-videos/fe/rl3-vertical-snap-feed.md` | not started |
| RL4 | desktop: centred player + side panel (comments, linked products) + up/down arrow keys | `specs/media-videos/be/rl4-desktop-centred-player-side-panel.md` | `specs/media-videos/fe/rl4-desktop-centred-player-side-panel.md` | not started |
| RL5 | overlay: owner avatar/name/verified + Follow/Following/bell, like with count, comments, share, caption, hashtags, distance, open/closed, overflow menu with Report | `specs/media-videos/be/rl5-overlay-owner-avatar-name-verified-f.md` | `specs/media-videos/fe/rl5-overlay-owner-avatar-name-verified-f.md` | not started |
| RL6 | linked products/services strip with Add to cart / Enquire / View and "Shop this video" sheet | `specs/media-videos/be/rl6-linked-products-services-strip-with-.md` | `specs/media-videos/fe/rl6-linked-products-services-strip-with-.md` | not started |
| RL7 | guest like/follow/comment -> login prompt -> back to the same video | `specs/media-videos/be/rl7-guest-like-follow-comment-login-prom.md` | `specs/media-videos/fe/rl7-guest-like-follow-comment-login-prom.md` | not started |
| RL8 | states: empty Following, no videos nearby, skeleton, failed to load with retry, offline, removed/unavailable | `specs/media-videos/be/rl8-states-empty-following.md` | `specs/media-videos/fe/rl8-states-empty-following.md` | not started |
| RL9 | deep link `/videos/:id` starts at that video; ranking frozen per session | `specs/media-videos/be/rl9-deep-link-videos-id-starts-at-that-v.md` | `specs/media-videos/fe/rl9-deep-link-videos-id-starts-at-that-v.md` | not started |
| RL10 | videos are YouTube/Instagram links or uploads; embed URLs rebuilt server-side from allow-listed hosts with "Open in YouTube/Instagram" fallback | `specs/media-videos/be/rl10-videos-are-youtube-instagram-links-.md` | `specs/media-videos/fe/rl10-videos-are-youtube-instagram-links-.md` | not started |

## NT. Notifications

Roles: all roles. Backend module(s): `notifications`. Frontend route/screen: `/notifications`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| NT1 | notification centre with read/unread | `specs/notifications/be/nt1-notification-centre-with-read-unread.md` | `specs/notifications/fe/nt1-notification-centre-with-read-unread.md` | not started |
| NT2 | preferences per channel (in-app, email, WhatsApp orders/offers/enquiries) with consent text and easy unsubscribe | `specs/notifications/be/nt2-preferences-per-channel.md` | `specs/notifications/fe/nt2-preferences-per-channel.md` | not started |
| NT3 | follower announcements from owners | `specs/notifications/be/nt3-follower-announcements-from-owners.md` | `specs/notifications/fe/nt3-follower-announcements-from-owners.md` | not started |
| NT4 | per-role notification feeds (order, review, approval, enquiry, job, admin) | `specs/notifications/be/nt4-per-role-notification-feeds.md` | `specs/notifications/fe/nt4-per-role-notification-feeds.md` | not started |

## AC. Account

Roles: customer. Backend module(s): `users, settings`. Frontend route/screen: `/account`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| AC1 | profile edit | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| AC2 | saved addresses | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| AC3 | payment methods | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| AC4 | language/theme | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| AC5 | privacy (download/delete my data) | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| AC6 | help, FAQs, contact support | `specs/users/be/ac6-help.md` | `specs/users/fe/ac6-help.md` | not started |
| AC7 | legal pages (terms, privacy, refund policy), about us | `specs/users/be/ac7-legal-pages.md` | `specs/users/fe/ac7-legal-pages.md` | not started |

## VD. Vendor dashboard

Roles: vendor. Backend module(s): `businesses, products, services, offers, orders, media-videos, engagement, settings`. Frontend route/screen: `/vendor`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| VD1 | signup wizard (mobile OTP, business type, basics, location, hours and delivery, documents, review) with save-draft and approval states (pending limited access, approved, rejected with reason and re-submit, suspended, inactive) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| VD2 | overview KPIs, charts, low-stock alerts, pending actions | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| VD3 | profile editor (logo, cover, hours per day, temporarily closed, delivery self vs rider, radius, fee, minimum order, pickup, map pin, live preview) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| VD4 | products (list, search, filter, bulk edit, CSV import, add/edit with variants, SKU, stock, media sorter with images + YouTube/Instagram embeds, shareable link) | `specs/businesses/be/vd4-products.md` | `specs/businesses/fe/vd4-products.md` | not started |
| VD5 | product category pills manager (reorder, rename, hide) | `specs/businesses/be/vd5-product-category-pills-manager.md` | `specs/businesses/fe/vd5-product-category-pills-manager.md` | not started |
| VD6 | subcategory suggestion with duplicate detection and "my suggestions" status | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| VD7 | offers manager | `specs/businesses/be/vd7-offers-manager.md` | `specs/businesses/fe/vd7-offers-manager.md` | not started |
| VD8 | orders (new-order alert, accept/reject, preparing, ready, request/assign rider, self-delivery with OTP, pickup code, print slip, mark item unavailable, refund request handling) | `specs/businesses/be/vd8-orders.md` | `specs/businesses/fe/vd8-orders.md` | not started |
| VD9 | inventory (stock, thresholds, quick toggles, restock) | `specs/businesses/be/vd9-inventory.md` | `specs/businesses/fe/vd9-inventory.md` | not started |
| VD10 | reviews (reply/report) | `specs/businesses/be/vd10-reviews.md` | `specs/businesses/fe/vd10-reviews.md` | not started |
| VD11 | QR and links (poster/table-tent/sticker, share) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| VD12 | gallery manager (gallery-only photos, default media-consent setting) and videos/reels manager (link/upload, thumbnail, caption, hashtags, link products/services, "Show in Gallery"/"Show in Reels", approval status, analytics: views, likes, shares, followers gained, taps on linked items) | `specs/businesses/be/vd12-gallery-manager.md` | `specs/businesses/fe/vd12-gallery-manager.md` | not started |
| VD13 | media-consent toggle on every product/service upload | `specs/businesses/be/vd13-media-consent-toggle-on-every-produ.md` | `specs/businesses/fe/vd13-media-consent-toggle-on-every-produ.md` | not started |
| VD14 | services manager (title, category, one subcategory, price type/unit/amount, inclusions/exclusions, area, images, videos, active/pause, shareable link) | `specs/businesses/be/vd14-services-manager.md` | `specs/businesses/fe/vd14-services-manager.md` | not started |
| VD15 | followers (count, growth chart, announce to followers) | `specs/businesses/be/vd15-followers.md` | `specs/businesses/fe/vd15-followers.md` | not started |
| VD16 | enquiries inbox | `specs/businesses/be/vd16-enquiries-inbox.md` | `specs/businesses/fe/vd16-enquiries-inbox.md` | not started |
| VD17 | earnings, plan/commission, promotions purchase, invoices | `specs/businesses/be/vd17-earnings.md` | `specs/businesses/fe/vd17-earnings.md` | not started |
| VD18 | account (owner, payout UPI/bank, staff, security) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |

## PV. Provider dashboard

Roles: provider. Backend module(s): `businesses, services, engagement`. Frontend route/screen: `/provider`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| PV1 | onboarding same as vendor | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PV2 | profile with category, "expert in" multi-select subcategories, service area, hours | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PV3 | services manager (as VD14) | `specs/businesses/be/pv3-services-manager.md` | `specs/businesses/fe/pv3-services-manager.md` | not started |
| PV4 | enquiries inbox with statuses `new -> contacted -> converted -> closed`, call/WhatsApp reply | `specs/businesses/be/pv4-enquiries-inbox-with-statuses-new-co.md` | `specs/businesses/fe/pv4-enquiries-inbox-with-statuses-new-co.md` | not started |
| PV5 | can also list products and handle orders | `specs/businesses/be/pv5-can-also-list-products-and-handle-or.md` | `specs/businesses/fe/pv5-can-also-list-products-and-handle-or.md` | not started |
| PV6 | reviews, QR, analytics (views, enquiries, conversion), followers, videos/reels and gallery managers | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PV7 | placeholders for booking/quotation/payment (feature flag off) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |

## RD. Rider (mobile-first PWA)

Roles: rider. Backend module(s): `delivery, users`. Frontend route/screen: `/rider`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| RD1 | signup and verification (profile, selfie, vehicle, licence, ID, bank/UPI) with approval states | `specs/delivery/be/rd1-signup-and-verification.md` | `specs/delivery/fe/rd1-signup-and-verification.md` | not started |
| RD2 | online/offline toggle, today's deliveries and earnings | `specs/delivery/be/rd2-online-offline-toggle.md` | `specs/delivery/fe/rd2-online-offline-toggle.md` | not started |
| RD3 | delivery request with pickup, drop, distance, estimated earning and countdown accept/reject | `specs/delivery/be/rd3-delivery-request-with-pickup.md` | `specs/delivery/fe/rd3-delivery-request-with-pickup.md` | not started |
| RD4 | active delivery flow: accepted -> reached shop -> items check -> picked up -> reached drop -> customer OTP -> delivered, or failed/cancel with reason; cash collection notice; navigation button; masked call | `specs/delivery/be/rd4-active-delivery-flow-accepted-reache.md` | `specs/delivery/fe/rd4-active-delivery-flow-accepted-reache.md` | not started |
| RD5 | history with filters and detail | `specs/delivery/be/rd5-history-with-filters-and-detail.md` | `specs/delivery/fe/rd5-history-with-filters-and-detail.md` | not started |
| RD6 | earnings (per-ride base + per-km, daily/weekly, payout status) | `specs/delivery/be/rd6-earnings.md` | `specs/delivery/fe/rd6-earnings.md` | not started |
| RD7 | feedback and ratings | `specs/delivery/be/rd7-feedback-and-ratings.md` | `specs/delivery/fe/rd7-feedback-and-ratings.md` | not started |
| RD8 | profile, documents, language, support, dispute report | `specs/delivery/be/rd8-profile.md` | `specs/delivery/fe/rd8-profile.md` | not started |

## AD. Admin

Roles: admin. Backend module(s): `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo`. Frontend route/screen: `/admin`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| AD1 | overview KPIs, approvals queue, live orders, alerts | `specs/admin/be/ad1-overview-kpis.md` | `specs/admin/fe/ad1-overview-kpis.md` | not started |
| AD2 | approvals for businesses, providers, riders with document viewer, approve/reject/request changes with reason and history | `specs/admin/be/ad2-approvals-for-businesses.md` | `specs/admin/fe/ad2-approvals-for-businesses.md` | not started |
| AD3 | listings CRUD (create, edit status/details, remove) and product moderation (unpublish) | `specs/admin/be/ad3-listings-crud.md` | `specs/admin/fe/ad3-listings-crud.md` | not started |
| AD4 | users (customers, vendors, riders: search, profile, order history, suspend/reactivate) | `specs/admin/be/ad4-users.md` | `specs/admin/fe/ad4-users.md` | not started |
| AD5 | categories (view fixed main categories; subcategory tree, types, keywords, filter preview) | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| AD6 | subcategory suggestion queue (approve, reject with reason, merge into existing, duplicate warning, notification to suggester) | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| AD7 | orders and disputes (case workflow open -> in review -> resolved, notes, refund approval/completion, rider assign/reassign) | `specs/admin/be/ad7-orders-and-disputes.md` | `specs/admin/fe/ad7-orders-and-disputes.md` | not started |
| AD8 | live deliveries map with city filter (All cities cluster pins/one city), side list (order id, rider, status, ETA), empty state | `specs/admin/be/ad8-live-deliveries-map-with-city-filter.md` | `specs/admin/fe/ad8-live-deliveries-map-with-city-filter.md` | not started |
| AD9 | review moderation (reported/pending/removed; approve/hide/delete) | `specs/admin/be/ad9-review-moderation.md` | `specs/admin/fe/ad9-review-moderation.md` | not started |
| AD10 | video moderation queue (pending/approved/rejected/removed/reported, reasons, engagement report) | `specs/admin/be/ad10-video-moderation-queue.md` | `specs/admin/fe/ad10-video-moderation-queue.md` | not started |
| AD11 | promotions (homepage banners, featured businesses, offer approval) | `specs/admin/be/ad11-promotions.md` | `specs/admin/fe/ad11-promotions.md` | not started |
| AD12 | communications (searchable audience combobox; scope Overall/City-wise/Zone-wise; template picker; channels WhatsApp/in-app/email; consent-aware recipient counts; preview; schedule; review-before-send summary; delivery report with opt-outs; permission-aware scopes) | `specs/admin/be/ad12-communications.md` | `specs/admin/fe/ad12-communications.md` | not started |
| AD13 | reports (orders, revenue, vendor, rider, enquiries; CSV export) | `specs/admin/be/ad13-reports.md` | `specs/admin/fe/ad13-reports.md` | not started |
| AD14 | audit log with search | `specs/admin/be/ad14-audit-log-with-search.md` | `specs/admin/fe/ad14-audit-log-with-search.md` | not started |
| AD15 | search keyword mapping tool with preview | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| AD16 | permission-aware UI (hidden/disabled with "You don't have permission") | `specs/admin/be/ad16-permission-aware-ui.md` | `specs/admin/fe/ad16-permission-aware-ui.md` | not started |

## SA. Super admin

Roles: super_admin. Backend module(s): `admin, geo, settings, audit, catalog`. Frontend route/screen: `/super-admin`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| SA1 | overview with KPIs and tabbed Graph/Candle chart (shared date range, metric orders/revenue/deliveries, city filter; candles differ by fill/hollow + words "Up/Down" in tooltip; skeleton/empty/error) | `specs/admin/be/sa1-overview-with-kpis-and-tabbed-graph-.md` | `specs/admin/fe/sa1-overview-with-kpis-and-tabbed-graph-.md` | not started |
| SA2 | admins and areas (collapsible cards, search by name/phone/email, filters city/area-zone/role/status with removable chips and count, activate/deactivate with confirmation naming the impact, area assignment, per-admin permission matrix) | `specs/admin/be/sa2-admins-and-areas.md` | `specs/admin/fe/sa2-admins-and-areas.md` | not started |
| SA3 | roles and permissions (create, edit with unsaved indicator and before/after summary, duplicate, delete blocked while admins assigned with reassign picker, system roles locked) | `specs/admin/be/sa3-roles-and-permissions.md` | `specs/admin/fe/sa3-roles-and-permissions.md` | not started |
| SA4 | cities and zones (city cards, enable/disable with confirmation, city detail with polygon editor, zone list with delivery fee slabs, assigned admins, add city, waitlist) | `specs/geo/be/geo.md` | `specs/geo/fe/geo.md` | spec written |
| SA5 | global settings (branding, delivery slabs, rider earning rule, commission and plans, promotions fees, payments, refund/cancellation window, review rules, WhatsApp/SMS/email integration, SEO defaults, feature flags, legal pages) | `specs/admin/be/sa5-global-settings.md` | `specs/admin/fe/sa5-global-settings.md` | not started |
| SA6 | platform analytics | `specs/admin/be/sa6-platform-analytics.md` | `specs/admin/fe/sa6-platform-analytics.md` | not started |
| SA7 | activity monitor (audit with before/after and export) | `specs/admin/be/sa7-activity-monitor.md` | `specs/admin/fe/sa7-activity-monitor.md` | not started |
| SA8 | main-category management (only super admin) and category tree with keyword/synonym mapping | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |

---

Total features tracked: **207**.
