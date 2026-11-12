# ApnaTown Feature Inventory

Every feature ID from the product brief is listed here as a **spec-status
tracker** (BE/FE spec path + status); for the full behaviour description
of each feature, see `docs/project/03-feature-catalog.md` (the product
knowledge base's richer, canonical feature catalog — don't duplicate its
text here).
Status starts at `not started` and is updated by developers as implementations
land. `architect` writes linked BE/FE specs and updates inventory paths/status
when requested; spec-only work does not imply tracker upkeep. See `specs/_templates/`.

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
| AU4 | mobile OTP login (6-box input, auto-advance, paste, resend timer, attempt limits), optional email/Google | `specs/auth/be/auth.md` | `specs/auth/fe/auth.md` | backend local slice; runtime/provider gates pending |
| AU5 | profile completion | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |
| AU6 | login-required prompt that returns the user to the same page/video after login | `specs/auth/be/auth.md` | `specs/auth/fe/auth.md` | spec written |
| AU7 | logout and session expiry | `specs/auth/be/auth.md` | `specs/auth/fe/auth.md` | backend local slice; runtime verification pending |
| AU8 | account deletion and personal-data download | `specs/users/be/users.md` | `specs/users/fe/users.md` | spec written |

## HM. Home

Roles: customer. Backend module(s): `search` (home composition), `catalog` (category taxonomy), businesses, products, services, offers, engagement. Frontend route/screen: `/`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| HM1 | sticky location selector, search with voice icon, bell, cart, play (videos) icon | `specs/search/be/search.md` | `specs/search/fe/search.md` | partial: sticky header with logo, desktop menu, language pill, Videos/Saved/Account icons and mobile bottom tabs, plus sticky Home location bar; search, bell and cart wait for their modules |
| HM2 | hero banner carousel | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM3 | "Shop by category" tiles open Explore with category pre-applied | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | implemented: Home tiles via ISR taxonomy; dedicated/curated Catalog sections composed by `GET /search/home` |
| HM4 | "Local services" tiles open Explore Services with category pre-applied | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | implemented: Home Local services tiles open `/services` |
| HM5 | offers and deals (card opens product/service/filtered list) | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM6 | nearby shops with responsive shop card (image top, details bottom; 1/2/3-4 columns; "View all shops") | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM7 | featured businesses ("View all businesses" -> Explore Shops featured) | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM8 | popular businesses | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM9 | featured products ("View all products" -> Explore Products featured) | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM10 | popular providers | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM11 | local promotions | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM12 | recently viewed | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| HM13 | bookmarks quick access | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: signed-in customers see the first four followed shops with See all -> `/saved` |
| HM14 | desktop footer (About, Contact, Vendor/Rider/Provider signup, legal, language) | `specs/search/be/search.md` | `specs/search/fe/search.md` | partial: brand + tagline, Company, Legal and language switch; vendor/rider/provider signup links wait for onboarding routes |

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
| EX1 | tabs Products \| Shops \| Services with result counts | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: real owner listing projections, tab-specific counts, signed keyset pages |
| EX2 | category pre-applied from home as removable pill, changeable | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: shared context, related-category initialization, change/clear controls |
| EX3 | per-tab filters remembered when switching tabs | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: complete inactive `<tab>.*` namespaces and explicit clear markers |
| EX4 | Products filters (price range, rating, category+subcategory, brand, offers, in stock, delivery/pickup, distance, sort) | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: typed URL controls, SQL predicates/facets and actual inventory/pricing signals |
| EX5 | Shops filters (category, distance, rating, open now, delivers to me, offers, verified, sort) | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: full filters over eligible shops, authoritative geo and opening hours |
| EX6 | Services filter: Category multi-select + Subcategory multi-select grouped under category headings, checkboxes with counts, Select all/Clear per group, inner search when >8, "Show more", disabled when count 0, OR logic, removing a category removes its subcategories, removable chips + Clear all, loading skeleton, long-Hindi-safe, keyboard/screen-reader grouped list | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: shared `ServiceCategoryFilter` with real facets and individual Services results |
| EX7 | filter UI: bottom sheet (mobile, sticky "Show N results"), left sidebar (desktop, live results), horizontal filter bar with count badge (tablet) | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: draft-only sheet/preview/Apply/Cancel/Reset, live sidebar and filter-count bar |
| EX8 | shareable URL `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting` | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: complete validated URL state and Copy link; precise location is excluded |
| EX9 | browser Back restores previous page and scroll | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: bounded URL scroll history and cached Load-more pages survive SSR return |
| EX10 | empty state per tab with "Clear category" and suggestions | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: clear/reset actions and real category-count suggestions |
| EX11 | map/list toggle with pins for shops and service providers | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: shared Leaflet, radius, loaded-page pins, Directions and list fallback; Products pins deduplicate owning shops |
| EX12 | reusable Services filter on Explore, Search Services tab and service category pages | `specs/search/be/search.md` | `specs/search/fe/search.md` | implemented: `ExploreResults` composition with independent query families on all three surfaces |

Explore evidence: affected builds and security re-review passed; migrations
are authored but unapplied. Runtime data/performance, responsive/a11y and
browser Back/map/bookmark acceptance remain deferred, as recorded in the
[FE verification notes](../specs/search/fe/search.md#s-cust-02--explore).
This does not mark full Search, listing managers, checkout or full detail
flows complete.

## SR. Search

Roles: customer. Backend module(s): `search`. Frontend route/screen: `/search`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| SR1 | tabs All \| Products \| Shops \| Services \| Videos | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR2 | keyword -> category/subcategory/product-tag mapping (e.g. "AC" -> AC products, electronics shops, AC services, videos; "iPhone 15" -> products, mobile shops, mobile-repair services) | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR3 | Hindi/Hinglish and typo tolerance ("एसी", "plumbr") | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR4 | grouped autocomplete (Products, Shops, Services, Categories, Subcategories, related searches) | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR5 | recent and popular searches | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR6 | All tab grouped sections with "See all" and "Related services for AC" | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR7 | per-tab filters (Services reuses the EX6 component) | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR8 | sort (relevance, distance, rating, price, newest) | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR9 | no-results with related categories | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |
| SR10 | Search keeps its own filter state, separate from Explore | `specs/search/be/search.md` | `specs/search/fe/search.md` | spec written |

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
| PD1 | breadcrumbs | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| PD2 | media carousel with images and embedded videos (play badge), full-screen viewer (prev/next, swipe, arrow keys, counter, close, pinch/double-tap zoom, heart, focus trap) | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| PD3 | price, MRP, discount, variants, stock (out-of-stock with notify-me, low stock), quantity, Add to cart, Buy now | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| PD4 | offer banner at top (badge, discounted price, validity date, terms; expired and out-of-stock-offer states) | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| PD5 | Videos & Reels section (hidden if none; opens the Reels viewer at that video) | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| PD6 | seller card with delivery/pickup info | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| PD7 | specs, reviews with breakdown and review form | `specs/reviews/be/reviews.md` | `specs/reviews/fe/reviews.md` | not started |
| PD8 | related products with "View all" -> Explore Products filtered to same category and subcategory | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| PD9 | share link and bookmark | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |

## SV. Services

Roles: customer, vendor, provider. Backend module(s): `services, offers, reviews`. Frontend route/screen: `/service/:slug`, vendor/provider services and enquiries.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| SV1 | service card (image, name, subcategory tag, provider with logo, price/"Price on enquiry", rating, distance, open/availability badge, offer badge, Call/WhatsApp/Save) | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| SV2 | service details page `/service/:slug`: carousel, title, subcategory, price type (from/fixed/range/on enquiry) + unit (per hour/day/event/sq ft), description, included/excluded, service area, hours, provider experience | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| SV3 | provider card with follow, verified, rating, Call/WhatsApp/Directions | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| SV4 | reference videos and previous-work gallery | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| SV5 | Send Enquiry form (name, phone, message, preferred date, success state) as primary CTA; booking/payment is a future placeholder | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| SV6 | offers, reviews (breakdown, form), FAQs, related services, similar providers, share, bookmark | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| SV7 | breadcrumbs Services > Category > Subcategory > Service | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| SV8 | each service has exactly one subcategory; a provider can be "expert in" several | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |

## OF. Offers

Roles: customer, vendor, provider, admin. Backend module(s): `offers`. Frontend route/screen: `/offers`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| OF1 | offers page with filters | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| OF2 | offer card -> product page (single product), service page (service offer), filtered product list (several products), shop page (shop-wide) | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| OF3 | states: active, pending admin approval, paused, ended/expired, out-of-stock | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| OF4 | featured offers on home | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| OF5 | vendor offer lifecycle pending -> active -> paused -> ended; admin approval | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| OF6 | admin/vendor/provider coupons with scoped eligibility, moderation, service-enquiry display and gated checkout redemption | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written; redemption policy open |

## CK. Cart and checkout

Roles: customer. Backend module(s): `cart-checkout`. Frontend route/screen: `/cart, /checkout`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| CK1 | cart grouped by business, quantity stepper, remove, save for later, price breakdown, delivery fee, taxes/charges, coupon | `specs/cart-checkout/be/cart-checkout.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK2 | one checkout splits into one order per shop with clear notice | `specs/cart-checkout/be/cart-checkout.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK3 | per shop choose home delivery or self-pickup | `specs/cart-checkout/be/cart-checkout.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK4 | address book (add/edit/delete, map pin, landmark, PIN, labels, default) | `specs/users/be/users.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK5 | delivery range and minimum-order checks, out-of-range message | `specs/cart-checkout/be/cart-checkout.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK6 | payments: UPI, cards, net banking, wallets, COD / pay-at-pickup | `specs/payments/be/payments.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK7 | payment failure and retry | `specs/payments/be/payments.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK8 | order success with an order id per shop | `specs/cart-checkout/be/cart-checkout.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |
| CK9 | coupons (flat/percent, minimum, discount distributed proportionally across shop orders) | `specs/cart-checkout/be/cart-checkout.md` | `specs/cart-checkout/fe/cart-checkout.md` | spec written |

## OR. Orders and tracking

Roles: customer, rider, vendor, provider, admin. Backend module(s): `orders, delivery, payments`. Frontend route/screen: `/orders`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| OR1 | orders list (active/completed/cancelled) and detail | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR2 | timeline: delivery `placed -> accepted -> preparing -> ready -> out_for_delivery -> delivered`; pickup `placed -> accepted -> ready -> picked_up`; plus `cancelled`, `refunded` | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR3 | live tracking: rider name, phone, rating, status, ETA, delivery OTP | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR4 | pickup: address, directions, pickup code | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR5 | actions: cancel, request refund, report problem, contact shop/rider, reorder, download invoice | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR6 | cancellation/refund flow with reasons, message "Admin and vendor have been notified and will contact you", refund tracker `requested -> approved -> completed` | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR7 | partial fulfilment/substitution (vendor marks item unavailable) | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR8 | dispute case workflow visible to customer | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| OR9 | one non-tax master checkout summary links each per-shop order and legal invoice | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |

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
| EG1 | Saved: tabs Following \| Services \| Photos & Videos (filters Photos/Videos/Reels, remove) | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | DB/API/SSR + React Query for Following, Services and saved Videos/Reels; cursor pagination, unavailable-item removal and URL filters; Photos deferred; builds/security review passed, migrations/runtime pending |
| EG2 | heart on any photo/video/reel | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | implemented for videos: DB/API/React Query HeartButton on video detail; photo/gallery hearts pending |
| EG3 | follow/unfollow with confirmation and bell | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | implemented on video detail: DB/API/React Query FollowButton with bell + unfollow confirmation; profiles, Reels feed and notification fan-out remain pending |
| EG4 | like on videos | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | implemented on video detail: DB/API/React Query LikeButton; Reels feed remains separate |
| EG5 | comments (moderated, "awaiting moderation") | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | implemented: moderated comments and admin queue on video detail/admin videos |
| EG6 | share sheet (WhatsApp, copy link, native share) | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | implemented for videos: DB/API/React Query ShareSheet on video detail; other targets remain pending |
| EG7 | bookmarks of businesses/providers/services | `specs/engagement/be/engagement.md` | `specs/engagement/fe/engagement.md` | service Save/Saved integrated on Explore and service detail; own-customer batch state and mutations, export/erasure contribution; businesses/providers retain canonical Follow, not duplicate bookmarks; runtime pending |

## RL. Videos and reels

Roles: customer, vendor, provider. Backend module(s): `media-videos, engagement`. Frontend route/screen: `/videos/:id`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| RL1 | play icon in top bar and desktop navigation opens the full-screen feed | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | top/desktop Videos entry now has the play icon; mobile bottom tab awaits the customer AppShell |
| RL2 | pills: For You \| Following \| Nearby \| Offers \| Products \| Services + category pills | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| RL3 | vertical snap feed, autoplay on view, tap pause/play, mute, progress bar, captions, data-saver "Tap to play", lazy loading | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | partial: localized Tap to play gate for Save-Data, 2G/slow-2G, and reduced motion; automatic in-view autoplay remains pending viewer-consent gating, as do provider controls, progress, and captions |
| RL4 | desktop: centred player + side panel (comments, linked products) + up/down arrow keys | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| RL5 | overlay: owner avatar/name/verified + Follow/Following/bell, like with count, comments, share, caption, hashtags, distance, open/closed, overflow menu with Report | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| RL6 | linked products/services strip with Add to cart / Enquire / View and "Shop this video" sheet | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| RL7 | guest like/follow/comment -> login prompt -> back to the same video | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| RL8 | states: empty Following, no videos nearby, skeleton, failed to load with retry, offline, removed/unavailable | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | not started |
| RL9 | deep link `/videos/:id` starts at that video; ranking frozen per session | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | implemented for supported feed filters; shared/API/OpenAPI/web builds and generated checks pass; runtime/browser verification pending |
| RL10 | YouTube/Instagram links only; typed safe playback and Open fallback; direct video uploads disabled | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | complete — safe owner link submission/list and approved detail playback; Reels feed remains separate; AD10 moderation is in progress |

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
| AC1 | profile edit | `specs/users/be/users.md` | `specs/users/fe/users.md` | BE profile + saved addresses implemented offline; runtime/security gates pending |
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
| VD4 | products (list, search, filter, bulk edit, CSV import, add/edit with variants, SKU, stock, media sorter with images + YouTube/Instagram embeds, shareable link) | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| VD5 | product category pills manager (reorder, rename, hide) | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| VD6 | subcategory suggestion with duplicate detection and "my suggestions" status | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| VD7 | offers manager | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| VD8 | orders (new-order alert, accept/reject, preparing, ready, request/assign rider, self-delivery with OTP, pickup code, print slip, mark item unavailable, refund request handling) | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| VD9 | inventory (stock, thresholds, quick toggles, restock) | `specs/products/be/products.md` | `specs/products/fe/products.md` | spec written |
| VD10 | reviews (reply/report) | `specs/businesses/be/vd10-reviews.md` | `specs/businesses/fe/vd10-reviews.md` | not started |
| VD11 | QR and links (poster/table-tent/sticker, share) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| VD12 | gallery manager (photos, default consent) and link-only videos/reels manager (thumbnail, caption, hashtags, linked items, Gallery/Reels visibility, approval status and analytics) | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | spec written |
| VD13 | media-consent toggle on every product/service upload | `specs/businesses/be/vd13-media-consent-toggle-on-every-produ.md` | `specs/businesses/fe/vd13-media-consent-toggle-on-every-produ.md` | not started |
| VD14 | services manager (title, category, one subcategory, price type/unit/amount, inclusions/exclusions, area, images, videos, active/pause, shareable link) | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| VD15 | followers (count, growth chart, announce to followers) | `specs/businesses/be/vd15-followers.md` | `specs/businesses/fe/vd15-followers.md` | not started |
| VD16 | enquiries inbox | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| VD17 | earnings, plan/commission, promotions purchase, invoices | `specs/payments/be/payments.md` | `specs/payments/fe/payments.md` | spec written |
| VD18 | account (owner, payout UPI/bank, staff, security) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |

## PV. Provider dashboard

Roles: provider. Backend module(s): `businesses, services, engagement, payments`. Frontend route/screen: `/provider, /provider/billing`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| PV1 | onboarding same as vendor | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PV2 | profile with category, "expert in" multi-select subcategories, service area, hours | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PV3 | services manager (as VD14) | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| PV4 | enquiries inbox with statuses `new -> contacted -> converted/closed`, call/WhatsApp reply | `specs/services/be/services.md` | `specs/services/fe/services.md` | spec written |
| PV5 | can also list products and handle orders | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| PV6 | reviews, QR, analytics (views, enquiries, conversion), followers, videos/reels and gallery managers | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PV7 | placeholders for booking/quotation/payment (feature flag off) | `specs/businesses/be/businesses.md` | `specs/businesses/fe/businesses.md` | spec written |
| PV8 | Premium billing, manual plan renewal, cancellation at paid expiry, status and invoices | `specs/payments/be/payments.md` | `specs/payments/fe/payments.md` | spec written |

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
| AD7 | orders and disputes (case workflow open -> in review -> resolved, notes, refund approval/completion, rider assign/reassign) | `specs/orders/be/orders.md` | `specs/orders/fe/orders.md` | spec written |
| AD8 | live deliveries map with city filter (All cities cluster pins/one city), side list (order id, rider, status, ETA), empty state | `specs/admin/be/ad8-live-deliveries-map-with-city-filter.md` | `specs/admin/fe/ad8-live-deliveries-map-with-city-filter.md` | not started |
| AD9 | review moderation (reported/pending/removed; approve/hide/delete) | `specs/admin/be/ad9-review-moderation.md` | `specs/admin/fe/ad9-review-moderation.md` | not started |
| AD10 | video moderation queue (pending/approved/rejected/removed/reported, reasons, engagement report) | `specs/media-videos/be/media-videos.md` | `specs/media-videos/fe/media-videos.md` | in progress — scoped status and video-report queues with audited decisions; photo reports, comments, Engagement analytics and owner notifications remain |
| AD11 | promotions (homepage banners, featured businesses, offer approval) | `specs/offers/be/offers.md` | `specs/offers/fe/offers.md` | spec written |
| AD12 | communications (searchable audience combobox; scope Overall/City-wise/Zone-wise; template picker; channels WhatsApp/in-app/email; consent-aware recipient counts; preview; schedule; review-before-send summary; delivery report with opt-outs; permission-aware scopes) | `specs/admin/be/ad12-communications.md` | `specs/admin/fe/ad12-communications.md` | not started |
| AD13 | reports (orders, revenue, vendor, rider, enquiries; CSV export) | `specs/admin/be/ad13-reports.md` | `specs/admin/fe/ad13-reports.md` | not started |
| AD14 | audit log with search | `specs/admin/be/ad14-audit-log-with-search.md` | `specs/admin/fe/ad14-audit-log-with-search.md` | not started |
| AD15 | search keyword mapping tool with preview | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | spec written |
| AD16 | permission-aware UI (hidden/disabled with "You don't have permission") | `specs/admin/be/ad16-permission-aware-ui.md` | `specs/admin/fe/ad16-permission-aware-ui.md` | not started |

## SA. Super admin

Roles: super_admin. Backend module(s): `admin, geo, settings, audit, catalog`. Frontend route/screen: `/super-admin`.

| ID | Feature | BE spec path | FE spec path | Status |
|---|---|---|---|---|
| SA1 | overview with KPIs and Graph chart (orders/revenue/deliveries, date range and city filters; accessible table; skeleton/empty/error; no Candle/OHLC) | `specs/admin/be/admin.md` | `specs/admin/fe/admin.md` | spec written |
| SA2 | admins and areas (collapsible cards, search by name/phone/email, filters city/area-zone/role/status with removable chips and count, activate/deactivate with confirmation naming the impact, area assignment, per-admin permission matrix) | `specs/admin/be/sa2-admins-and-areas.md` | `specs/admin/fe/sa2-admins-and-areas.md` | not started |
| SA3 | roles and permissions (create, edit with unsaved indicator and before/after summary, duplicate, delete blocked while admins assigned with reassign picker, system roles locked) | `specs/admin/be/sa3-roles-and-permissions.md` | `specs/admin/fe/sa3-roles-and-permissions.md` | not started |
| SA4 | cities and zones (city cards, enable/disable with confirmation, city detail with polygon editor, zone list with delivery fee slabs, assigned admins, add city, waitlist) | `specs/geo/be/geo.md` | `specs/geo/fe/geo.md` | spec written |
| SA5 | global settings (branding, delivery slabs, rider earning rule, commission and plans, promotions fees, payments, refund/cancellation window, review rules, WhatsApp/SMS/email integration, SEO defaults, feature flags, legal pages) | `specs/admin/be/sa5-global-settings.md` | `specs/admin/fe/sa5-global-settings.md` | not started |
| SA6 | platform analytics | `specs/admin/be/sa6-platform-analytics.md` | `specs/admin/fe/sa6-platform-analytics.md` | not started |
| SA7 | activity monitor (audit with before/after and export) | `specs/admin/be/sa7-activity-monitor.md` | `specs/admin/fe/sa7-activity-monitor.md` | not started |
| SA8 | main-category management (only super admin) and category tree with keyword/synonym mapping | `specs/catalog/be/catalog.md` | `specs/catalog/fe/catalog.md` | in progress — taxonomy image upload transport pending generated Media operation |

---

Total features tracked: **207**.
