# 03 — Feature Catalog

**Purpose:** Every feature ID (X1-SA8), its behaviour, applicable business rules, entities and screens.
**Audience:** Everyone building or reviewing a feature; the primary lookup table (`spec-writer`, `code-reviewer`).
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [04-business-rules.md](./04-business-rules.md) · [05-domain-model.md](./05-domain-model.md) · [07-screens-routes-sitemap.md](./07-screens-routes-sitemap.md) · [13-traceability-matrix.md](./13-traceability-matrix.md)
**Last updated:** 2026-11-09
**Owner:** Product

Roles, Rules(BR) and Entities are **area-level defaults** shown once per area heading, plus any feature-specific BR tags detected in that feature's own description (kept per-row so nothing specific is lost). Screens are per-area unless a more specific screen ID applies (vendor/provider/rider/admin/super-admin areas reference [07-screens-routes-sitemap.md](./07-screens-routes-sitemap.md) per item).


## X. Cross-cutting

Roles: all roles. Default rules: none area-wide — see per-row. Entities: Setting, FeatureFlag.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| X1 | English/Hindi toggle | English/Hindi toggle | n/a (no specific rule; see area default) | S-SYS-1 |
| X2 | theme light/dark/auto | theme light/dark/auto | n/a (no specific rule; see area default) | S-SYS-1 |
| X3 | responsive 360/tablet/desktop | responsive 360/tablet/desktop | n/a (no specific rule; see area default) | S-SYS-1 |
| X4 | accessibility | accessibility (keyboard, focus, ARIA, reduced motion) | BR-22 | S-SYS-1 |
| X5 | offline banner | offline banner | n/a (no specific rule; see area default) | S-SYS-1 |
| X6 | slow-connection/lite mode | slow-connection/lite mode | n/a (no specific rule; see area default) | S-SYS-1 |
| X7 | five UX states on every screen | five UX states on every screen (default, skeleton, empty, error with retry, no-permission) | n/a (no specific rule; see area default) | S-SYS-1 |
| X8 | cookie consent and WhatsApp opt-in components | cookie consent and WhatsApp opt-in components | BR-11 | S-SYS-1 |
| X9 | system pages | system pages: 404, 500, offline, maintenance, session expired, account deleted | n/a (no specific rule; see area default) | S-SYS-1 |
| X10 | SEO page templates for business | SEO page templates for business, product, service, category with readable URLs, breadcrumbs, structured data | n/a (no specific rule; see area default) | S-SYS-1 |
| X11 | print templates | print templates: QR poster / table-tent / sticker, invoice, order slip | n/a (no specific rule; see area default) | S-SYS-1 |
| X12 | notification templates | notification templates (in-app, email, WhatsApp) for key events | n/a (no specific rule; see area default) | S-SYS-1 |
| X13 | Indian formatting utilities | Indian formatting utilities (INR from paise, IST 12-hour, distance km, phone) | n/a (no specific rule; see area default) | S-SYS-1 |
| X14 | audit trail for admin and sensitive actions | audit trail for admin and sensitive actions (before/after) | BR-12 | S-SYS-1 |
| X15 | rider PWA | rider PWA | n/a (no specific rule; see area default) | S-SYS-1 |

## AU. Auth and onboarding

Roles: R-01 customer, R-02 vendor, R-03 provider, R-04 rider, R-05 admin, R-06 super_admin. Default rules: BR-05, BR-21. Entities: User, Consent.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| AU1 | splash and language choice | splash and language choice | BR-05, BR-21 | S-AU-1 |
| AU2 | location primer with manual fallback | location primer with manual fallback (never mandatory) | BR-05, BR-21 | S-AU-1 |
| AU3 | browse as guest | browse as guest | BR-05, BR-21 | S-AU-1 |
| AU4 | mobile OTP login | mobile OTP login (6-box input, auto-advance, paste support, resend timer 30 s, attempt limits), optional email/Google | BR-05, BR-21 | S-AU-1 |
| AU5 | profile completion | profile completion (name, optional email) | BR-05, BR-21 | S-AU-1 |
| AU6 | login-required prompt that returns the user to the same page/video aft | login-required prompt that returns the user to the same page/video after login | BR-05, BR-21 | S-AU-1 |
| AU7 | logout and session expiry | logout and session expiry | BR-05, BR-21 | S-AU-1 |
| AU8 | account deletion and personal-data download | account deletion and personal-data download | BR-05, BR-21 | S-AU-1 |

## HM. Home

Roles: R-01 customer. Default rules: none area-wide — see per-row. Entities: Product, Service, Offer, Owner.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| HM1 | sticky location selector | sticky location selector, search with voice icon, bell, cart, play icon | n/a (no specific rule; see area default) | S-HM-1 |
| HM2 | hero banner carousel | hero banner carousel | n/a (no specific rule; see area default) | S-HM-1 |
| HM3 | "Shop by category" tiles open Explore with that category pre-applied | "Shop by category" tiles open Explore with that category pre-applied | n/a (no specific rule; see area default) | S-HM-1 |
| HM4 | "Local services" tiles open Explore Services with that category pre-ap | "Local services" tiles open Explore Services with that category pre-applied | n/a (no specific rule; see area default) | S-HM-1 |
| HM5 | offers and deals | offers and deals (card opens product/service/filtered list) | n/a (no specific rule; see area default) | S-HM-1 |
| HM6 | nearby shops using the responsive shop card | nearby shops using the responsive shop card (image on top, details at bottom; 1 column small mobile, 2 large mobile/tablet, 3-4 desktop; lazy image with skeleton; "View all shops" -> Explore Shops sorted by distance) | n/a (no specific rule; see area default) | S-HM-1 |
| HM7 | featured businesses | featured businesses ("View all businesses" -> Explore Shops, Featured) | n/a (no specific rule; see area default) | S-HM-1 |
| HM8 | popular businesses | popular businesses | n/a (no specific rule; see area default) | S-HM-1 |
| HM9 | featured products | featured products ("View all products" -> Explore Products, Featured) | n/a (no specific rule; see area default) | S-HM-1 |
| HM10 | popular service providers | popular service providers | n/a (no specific rule; see area default) | S-HM-1 |
| HM11 | local promotions | local promotions | n/a (no specific rule; see area default) | S-HM-1 |
| HM12 | recently viewed | recently viewed | n/a (no specific rule; see area default) | S-HM-1 |
| HM13 | bookmarks quick access | bookmarks quick access | n/a (no specific rule; see area default) | S-HM-1 |
| HM14 | desktop footer | desktop footer | n/a (no specific rule; see area default) | S-HM-1 |

## LC. Location and discovery

Roles: R-01 customer. Default rules: none area-wide — see per-row. Entities: Address, Zone, City.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| LC1 | GPS detection | GPS detection, manual area/locality/PIN, saved locations | n/a (no specific rule; see area default) | S-LC-1 |
| LC2 | map and list views with pins | map and list views with pins, radius slider, "you are here" | n/a (no specific rule; see area default) | S-LC-1 |
| LC3 | directions | directions (opens the maps app) | n/a (no specific rule; see area default) | S-LC-1 |
| LC4 | clear distinction between "Nearby | clear distinction between "Nearby (distance)" and "Delivers to your address" (badge/message) | n/a (no specific rule; see area default) | S-LC-1 |
| LC5 | states | states: permission denied, GPS off, outside service area ("We are not in your city yet" + notify-me with phone) | n/a (no specific rule; see area default) | S-LC-1 |

## EX. Explore

Roles: R-01 customer. Default rules: BR-15, BR-18. Entities: Category, Subcategory, Product, Service, Owner.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| EX1 | tabs Products | Shops | Services with result counts | tabs Products \| Shops \| Services with result counts (e.g. Products 124 \| Shops 18 \| Services 6) | BR-15, BR-18 | S-EX-1 |
| EX2 | category pre-applied from home as a removable | category pre-applied from home as a removable, changeable pill; applied across all three tabs (related service category when one exists) | BR-15, BR-18 | S-EX-1 |
| EX3 | per-tab filters remembered when switching tabs | per-tab filters remembered when switching tabs | BR-15, BR-18 | S-EX-1 |
| EX4 | Products filters | Products filters: price range (slider + min/max), rating (4+/3+), category + subcategory, brand, offers/discount, in stock, delivery/pickup, distance, sort (relevance, price low-high, price high-low, rating, newest) | BR-15, BR-18 | S-EX-1 |
| EX5 | Shops filters | Shops filters: category, distance/radius, rating, open now, delivers to my address, offers, verified, featured, sort (relevance, distance, rating, newest) | BR-15, BR-18 | S-EX-1 |
| EX6 | Services filter panel | Services filter panel: Category multi-select (home category pre-checked) and Subcategory multi-select (required) shown below Category and dependent on it: lists subcategories of the selected categories grouped under category headings; checkboxes with a result count per item; "Select all / Clear" per group; inner search when a group has more than 8 items; "Show more" collapse for long lists; if a category is selected and none ticked, show all services in it; ticking narrows with OR logic; removing a category auto-removes its ticked subcategories; with no category selected, show all categories' subcategories as grouped collapsed sections; zero-result subcategories disabled with count 0 (not hidden); selected subcategories as removable chips above results (for example "Wedding & Events x  DJ & Sound x  Tent & Lighting x") with "Clear all"; loading skeleton while counts update; long Hindi labels wrap; keyboard and screen-reader support (grouped checkbox list with labels). Other services filters: distance, rating, price range or "Price on enquiry", open now/available today, has offers, verified providers, sort (relevance, distance, rating, price) | BR-15, BR-18 | S-EX-1 |
| EX7 | filter UI | filter UI: bottom sheet on mobile with sticky "Show N results" and Reset/Apply; left sidebar on desktop with live results; horizontal filter bar with a "Filters" button and active-count badge on tablet | BR-15, BR-18 | S-EX-1 |
| EX8 | shareable URL | shareable URL: `/explore?tab=products&category=electronics` and `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting` (slugs, comma-separated multi values) | BR-15, BR-18 | S-EX-1 |
| EX9 | browser Back returns to the previous page | browser Back returns to the previous page (for example Home) with scroll position preserved | BR-15, BR-18 | S-EX-1 |
| EX10 | empty state per tab with "Clear category" and suggestions | empty state per tab with "Clear category" and suggestions | BR-15, BR-18 | S-EX-1 |
| EX11 | Map/List toggle | Map/List toggle | BR-15, BR-18 | S-EX-1 |
| EX12 | The same filter component is reused on Search | The same filter component is reused on Search (Services tab) and on service category pages | BR-15, BR-18 | S-EX-1 |

## SR. Search

Roles: R-01 customer. Default rules: BR-15, BR-18. Entities: Keyword, Product, Service, Owner, Video.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| SR1 | tabs All | Products | Shops | Services | Videos | tabs All \| Products \| Shops \| Services \| Videos | BR-15, BR-18 | S-SR-1 |
| SR2 | keywords connect to categories | keywords connect to categories, subcategories, product tags, shops, services and videos (examples: "AC" -> products with AC in name/tags, shops of the related category (AC -> Electronics -> Home Appliances), services AC Installation / AC Repair / AC Gas Refill shown as service cards, related videos; "iPhone 15" -> matching products, shops in Mobile category, services Mobile Repair and Screen Replacement; "DJ", "tent", "plumber" -> matching services, their providers' businesses, related products) | BR-15, BR-18 | S-SR-1 |
| SR3 | Hindi/Hinglish and typo tolerance | Hindi/Hinglish and typo tolerance ("ac", "एसी", "mobile repair", "plumbr") | BR-15, BR-18 | S-SR-1 |
| SR4 | grouped autocomplete | grouped autocomplete (Products, Shops, Services, Categories, Subcategories, Related searches) | BR-15, BR-18 | S-SR-1 |
| SR5 | recent and popular searches | recent and popular searches | BR-15, BR-18 | S-SR-1 |
| SR6 | All tab shows grouped sections each with "See all" and an explanation  | All tab shows grouped sections each with "See all" and an explanation label such as "Related services for AC" | BR-15, BR-18 | S-SR-1 |
| SR7 | per-tab filters | per-tab filters; Services tab uses the EX6 component so a search for "AC" lets the user tick "AC Repair" and "AC Installation" | BR-15, BR-18 | S-SR-1 |
| SR8 | sort | sort (relevance, distance, rating, price, newest) | BR-15, BR-18 | S-SR-1 |
| SR9 | no-results state with related-category suggestions | no-results state with related-category suggestions | BR-15, BR-18 | S-SR-1 |
| SR10 | Search keeps its own filter state separate from Explore | Search keeps its own filter state separate from Explore | BR-15, BR-18 | S-SR-1 |

## PF. Business and provider profile

Roles: R-01 customer, R-02 vendor, R-03 provider. Default rules: BR-16, BR-08. Entities: Owner, Product, Service, Video.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| PF1 | cover | cover, logo, name, category, verified badge, rating summary, open/closed with today's hours, distance | BR-08, BR-16 | S-PF-1 |
| PF2 | sticky action bar | sticky action bar: Call, WhatsApp, Directions, Share, Save | BR-08, BR-16 | S-PF-1 |
| PF3 | tabs | tabs: About \| Products & Services \| Offers \| Gallery \| Videos/Reels \| Reviews \| Contact & Location | BR-08, BR-16 | S-PF-1 |
| PF4 | Products & Services section | Products & Services section: segmented switch Products \| Services (show only what applies, both if both); Products: category pills (All + each category with item count) sticky on scroll, horizontally scrollable, overflow and Hindi long-text safe; Services: service category pills then a second row of subcategory pills when a category is selected; empty state "This business has not added any services yet" | BR-08, BR-16 | S-PF-1 |
| PF5 | a provider's "expert in" subcategories visible on the card and the pro | a provider's "expert in" subcategories visible on the card and the profile | BR-08, BR-16 | S-PF-1 |
| PF6 | weekly opening-hours table | weekly opening-hours table (holidays, temporarily closed), delivery and pickup info (mode, radius, fee, minimum order, pickup instructions), eligibility for the user's address | BR-08, BR-16 | S-PF-1 |
| PF7 | map and directions | map and directions, QR (view/share), report listing, share (WhatsApp/copy link) | BR-08, BR-16 | S-PF-1 |
| PF8 | follow/unfollow with notification bell | follow/unfollow with notification bell | BR-08, BR-16 | S-PF-1 |
| PF9 | Gallery | Gallery: grid with filters All \| Photos \| Videos \| By product \| By service, lightbox with swipe, captions, linked product/service chip, heart on each item, report media | BR-08, BR-16 | S-PF-1 |
| PF10 | Videos/Reels tab | Videos/Reels tab: grid with view count and follow button | BR-08, BR-16 | S-PF-1 |
| PF11 | any profile can show Add to cart | any profile can show Add to cart (products) and Send Enquiry (services) | BR-08, BR-16 | S-PF-1 |
| PF12 | owner-only "Add product / Add service" prompts | owner-only "Add product / Add service" prompts | BR-08, BR-16 | S-PF-1 |
| PF13 | states | states: listing not live (pending/suspended), closed, outside delivery range | BR-08, BR-16 | S-PF-1 |

## PD. Product details

Roles: R-01 customer. Default rules: BR-17, BR-01. Entities: Product, Offer, Review.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| PD1 | breadcrumbs | breadcrumbs (Home / Category / Product) | BR-01, BR-17 | S-PD-1 |
| PD2 | media carousel with images and embedded videos | media carousel with images and embedded videos (YouTube/Instagram) with play badge; full-screen viewer with previous/next, swipe, arrow keys, counter ("3 / 8"), close, pinch/double-tap zoom for images, heart, focus trap and labels | BR-01, BR-17 | S-PD-1 |
| PD3 | price | price, MRP, discount, variants, stock states (in stock, low stock "Only N left", out of stock with notify-me), quantity, Add to cart, Buy now | BR-01, BR-17 | S-PD-1 |
| PD4 | offer banner at the top with offer badge | offer banner at the top with offer badge, discounted price, validity date and terms; states expired and out-of-stock offer | BR-01, BR-17 | S-PD-1 |
| PD5 | "Videos & Reels" section | "Videos & Reels" section (hidden if none; tapping opens the Reels viewer at that video; linked product strip returns to this product) | BR-01, BR-17 | S-PD-1 |
| PD6 | seller card with delivery/pickup info and link to profile | seller card with delivery/pickup info and link to profile | BR-01, BR-17 | S-PD-1 |
| PD7 | specs | specs, reviews with breakdown, write-review | BR-01, BR-17 | S-PD-1 |
| PD8 | related products with "View all" -> Explore Products filtered to the s | related products with "View all" -> Explore Products filtered to the same category and subcategory | BR-01, BR-17 | S-PD-1 |
| PD9 | share link and bookmark | share link and bookmark | BR-01, BR-17 | S-PD-1 |

## SV. Services

Roles: R-01 customer, R-03 provider. Default rules: BR-08, BR-18. Entities: Service, Owner, Enquiry.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| SV1 | service card | service card: image/thumbnail, service name, subcategory tag, provider name + logo (+ verified), starting price or "Price on enquiry" (₹ Indian formatting), rating and review count, location with distance, availability/open-now badge, offer badge if any, quick actions Call / WhatsApp / Bookmark; used in Search, Explore Services, business profile and category pages | BR-08, BR-18 | S-SV-1 |
| SV2 | service details page | service details page (`/service/:slug`): image carousel and gallery, title, subcategory, price or range with unit (per hour / per day / per event / per sq ft) or "On enquiry", description, included and excluded, service area, availability and working hours, provider experience | BR-08, BR-18 | S-SV-1 |
| SV3 | provider card | provider card (profile link, follow, verified, rating) and Call / WhatsApp / Directions | BR-08, BR-18 | S-SV-1 |
| SV4 | reference videos/reels and previous-work gallery | reference videos/reels and previous-work gallery | BR-08, BR-18 | S-SV-1 |
| SV5 | Send Enquiry form | Send Enquiry form (name, phone, message, preferred date, success state) as the primary CTA; booking/payment = future placeholder | BR-08, BR-18 | S-SV-1 |
| SV6 | offers on the service | offers on the service, ratings and reviews (breakdown, form), FAQs, related services and similar providers, unique readable URL, share, bookmark | BR-08, BR-18 | S-SV-1 |
| SV7 | breadcrumbs Services > Category > Subcategory > Service | breadcrumbs Services > Category > Subcategory > Service | BR-08, BR-18 | S-SV-1 |
| SV8 | each service has exactly one subcategory | each service has exactly one subcategory; a provider can be "expert in" several | BR-08, BR-18 | S-SV-1 |

## OF. Offers

Roles: R-01 customer, R-02 vendor, R-03 provider, R-05 admin. Default rules: BR-17. Entities: Offer, Product, Service.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| OF1 | offers page with filters by business and category | offers page with filters by business and category; offer detail with terms | BR-17 | S-OF-1 |
| OF2 | clicking an offer card | clicking an offer card (home or Offers page) goes to: the product details page for a single-product offer; the service details page for a service offer; a filtered product listing for a multi-product offer; the shop page for a shop-wide offer | BR-17 | S-OF-1 |
| OF3 | states | states: active, pending admin approval, paused, ended/expired, out-of-stock | BR-17 | S-OF-1 |
| OF4 | featured offers on the home page | featured offers on the home page | BR-17 | S-OF-1 |
| OF5 | vendor lifecycle `pending -> active -> paused -> ended` | vendor lifecycle `pending -> active -> paused -> ended`, admin approval before going live | BR-17 | S-OF-1 |

## CK. Cart and checkout

Roles: R-01 customer. Default rules: BR-01, BR-03, BR-19. Entities: Cart, CartLine, Address, Coupon.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| CK1 | cart grouped by business with quantity stepper | cart grouped by business with quantity stepper, remove, save for later, price breakdown, delivery fee, taxes/charges, coupon/offer field | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK2 | one checkout is split into one order per shop with a clear notice | one checkout is split into one order per shop with a clear notice ("Your order will be split into 2 shops") | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK3 | per shop choose Home Delivery or Self-Pickup | per shop choose Home Delivery or Self-Pickup | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK4 | address book | address book: add/edit/delete, map pin, landmark, PIN code, labels (Home/Work/Other), default | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK5 | delivery charge display | delivery charge display, delivery range and minimum-order checks, "out of delivery range" message | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK6 | payments | payments: UPI, cards, net banking, wallets, COD / pay-at-pickup | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK7 | payment failure and retry | payment failure and retry (pay on delivery instead) | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK8 | order success with an order id per shop | order success with an order id per shop | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |
| CK9 | coupons | coupons: flat or percent, minimum, cap; discount distributed proportionally across shop orders | BR-01, BR-03, BR-19 | S-CK-1, S-CK-2 |

## OR. Orders and tracking

Roles: R-01 customer, R-04 rider, R-02 vendor, R-03 provider, R-05 admin. Default rules: BR-03, BR-04, BR-05, BR-20. Entities: Order, OrderItem, Payment, DeliveryJob, Refund.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| OR1 | orders list filters | orders list filters (active, completed, cancelled) and detail | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |
| OR2 | timelines | timelines: delivery `placed -> accepted -> preparing -> ready -> out_for_delivery -> delivered`; pickup `placed -> accepted -> ready -> picked_up`; plus `cancelled`, `refunded` | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |
| OR3 | live tracking | live tracking: rider name, phone, rating, status, ETA, delivery OTP shown to the customer | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |
| OR4 | pickup | pickup: shop address, directions, instructions, pickup code | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |
| OR5 | actions | actions: cancel, request refund, report a problem, contact shop, contact rider, reorder, download invoice | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |
| OR6 | cancellation/refund | cancellation/refund: customer picks a reason; message "Admin and vendor have been notified and will contact you to resolve it"; refund tracker `requested -> approved -> completed` | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |
| OR7 | partial fulfilment/substitution when a vendor marks an item unavailabl | partial fulfilment/substitution when a vendor marks an item unavailable (bill updated, customer notified) | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |
| OR8 | dispute case visible to the customer with status | dispute case visible to the customer with status | BR-03, BR-04, BR-05, BR-20 | S-OR-1, S-OR-2, S-OR-3 |

## RV. Reviews

Roles: R-01 customer, R-02 vendor, R-03 provider, R-04 rider. Default rules: BR-09. Entities: Review.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| RV1 | separate flows for Business | separate flows for Business, Product, Service provider/service, Rider | BR-09 | S-RV-1, S-RV-2 |
| RV2 | eligibility | eligibility: only verified purchasers or enquirers; otherwise an explanatory message | BR-09 | S-RV-1, S-RV-2 |
| RV3 | star rating | star rating, text, photos, tags | BR-09 | S-RV-1, S-RV-2 |
| RV4 | edit/delete own review | edit/delete own review; "My reviews" | BR-09 | S-RV-1, S-RV-2 |
| RV5 | helpful and report | helpful and report | BR-09 | S-RV-1, S-RV-2 |
| RV6 | moderation | moderation: reviews containing links or abusive words are held `pending` | BR-09 | S-RV-1, S-RV-2 |
| RV7 | vendor/provider reply | vendor/provider reply; report abusive review | BR-09 | S-RV-1, S-RV-2 |

## EG. Engagement

Roles: R-01 customer. Default rules: none area-wide — see per-row. Entities: Follow, Like, Heart.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| EG1 | Saved page tabs in this order | Saved page tabs in this order: Shops \| Services \| Photos & Videos (filters Photos / Videos / Reels, remove) | n/a (no specific rule; see area default) | S-EG-1 |
| EG2 | heart on any photo | heart on any photo, video, reel (with reduced-motion alternative) | n/a (no specific rule; see area default) | S-EG-1 |
| EG3 | follow/unfollow business or provider with unfollow confirmation and a  | follow/unfollow business or provider with unfollow confirmation and a notification bell | n/a (no specific rule; see area default) | S-EG-1 |
| EG4 | like on videos with count | like on videos with count | n/a (no specific rule; see area default) | S-EG-1 |
| EG5 | comments | comments (moderated; "awaiting moderation" shown to author) | n/a (no specific rule; see area default) | S-EG-1 |
| EG6 | share sheet | share sheet (WhatsApp, copy link, more) | n/a (no specific rule; see area default) | S-EG-1 |
| EG7 | bookmarks for businesses | bookmarks for businesses, providers and services | n/a (no specific rule; see area default) | S-EG-1 |

## RL. Videos and reels

Roles: R-01 customer, R-02 vendor, R-03 provider. Default rules: BR-10, BR-16, BR-21. Entities: Video, VideoComment, Follow, Like.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| RL1 | a play icon in the top app bar | a play icon in the top app bar (mobile, beside bell and cart), in the desktop main nav and in the bottom navigation opens the full-screen experience | BR-10, BR-16, BR-21 | S-RL-1 |
| RL2 | top pills | top pills (horizontally scrollable): For You \| Following \| Nearby (my area) \| Offers \| Products \| Services, plus category pills (Electronics, Fashion, Food, Wedding, Mobile, Repair). Following shows only followed owners; Nearby uses businesses near the selected location | BR-10, BR-16, BR-21 | S-RL-1 |
| RL3 | vertical full-screen snap feed | vertical full-screen snap feed: autoplay when in view, tap to pause/play, mute toggle, progress bar, captions, data-saver mode ("Tap to play" poster), lazy loading | BR-10, BR-16, BR-21 | S-RL-1 |
| RL4 | desktop | desktop: centred vertical player with a side panel (comments, linked products) and up/down arrow navigation | BR-10, BR-16, BR-21 | S-RL-1 |
| RL5 | per-video overlay | per-video overlay: owner avatar, name, verified badge, Follow/Following + bell; like with count; comment; share; caption; hashtags; distance and open/closed; overflow with "Report video" | BR-10, BR-16, BR-21 | S-RL-1 |
| RL6 | linked products/services strip | linked products/services strip (image, name, price, Add to cart / Enquire / View) and a "Shop this video" bottom sheet listing all linked items | BR-10, BR-16, BR-21 | S-RL-1 |
| RL7 | a guest who likes | a guest who likes, follows or comments sees the login prompt (mobile OTP) and returns to the same video | BR-05, BR-10, BR-16, BR-21 | S-RL-1 |
| RL8 | states | states: empty Following ("Follow shops to see their videos here"), no videos nearby, skeleton, video failed to load with retry, offline, removed/unavailable | BR-10, BR-16, BR-21 | S-RL-1 |
| RL9 | deep link `/videos/ | deep link `/videos/:id` starts at that video; ranking is frozen per session so ids resolve reliably | BR-10, BR-16, BR-21 | S-RL-1 |
| RL10 | videos are YouTube/Instagram links or uploads | videos are YouTube/Instagram links or uploads; embed URLs are rebuilt server-side from allow-listed hosts; "Open in YouTube/Instagram" fallback always available | BR-10, BR-16, BR-21 | S-RL-1 |

## NT. Notifications

Roles: all roles. Default rules: BR-11. Entities: Notification, NotificationPreference.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| NT1 | notification centre with read/unread and per-role feeds | notification centre with read/unread and per-role feeds (order, offer, review, approval, enquiry, job, admin, system) | BR-11 | S-NT-1 |
| NT2 | preferences per channel | preferences per channel (in-app, email, WhatsApp for orders / offers / enquiries) with consent text and easy unsubscribe | BR-11 | S-NT-1 |
| NT3 | owners can announce new offers/videos to followers | owners can announce new offers/videos to followers | BR-11 | S-NT-1 |
| NT4 | notification bell with badge | notification bell with badge | BR-11 | S-NT-1 |

## AC. Account

Roles: R-01 customer. Default rules: BR-14. Entities: User, Address, Consent.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| AC1 | profile edit | profile edit | BR-14 | S-AC-1, S-AC-2, S-AC-3, S-AC-4 |
| AC2 | saved addresses | saved addresses | BR-14 | S-AC-1, S-AC-2, S-AC-3, S-AC-4 |
| AC3 | payment methods | payment methods | BR-14 | S-AC-1, S-AC-2, S-AC-3, S-AC-4 |
| AC4 | language and theme | language and theme | BR-14 | S-AC-1, S-AC-2, S-AC-3, S-AC-4 |
| AC5 | privacy | privacy: download or delete my data | BR-14 | S-AC-1, S-AC-2, S-AC-3, S-AC-4 |
| AC6 | help | help, FAQs, contact support (call, WhatsApp, message) | BR-14 | S-AC-1, S-AC-2, S-AC-3, S-AC-4 |
| AC7 | legal pages | legal pages (terms, privacy, refund & cancellation policy), about us | BR-14 | S-AC-1, S-AC-2, S-AC-3, S-AC-4 |

## VD. Vendor dashboard

Roles: R-02 vendor. Default rules: BR-06, BR-07, BR-16. Entities: Owner, Product, Service, Offer, Order, Video.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| VD1 | signup wizard | signup wizard (mobile OTP, business type shop vs service, basics, location, hours and delivery, documents (optional), review and submit) with save-draft and progress; approval states as in 2.2 | BR-05, BR-06, BR-07, BR-16 | n/a (onboarding wizard, see J7) |
| VD2 | overview | overview: KPI cards (today's orders, revenue, profile views, QR scans, enquiries, new reviews), charts, low-stock alerts, pending actions | BR-06, BR-07, BR-16 | S-VD-1 |
| VD3 | business profile editor | business profile editor: logo, cover, name (EN/HI), description, category, phone, WhatsApp, email, socials, address, map pin picker, opening hours per day, temporarily-closed toggle, delivery settings (own vs ApnaTown rider, radius, fee, minimum order), pickup settings, live public preview | BR-06, BR-07, BR-16 | S-VD-5 |
| VD4 | products | products: list with search/filter/bulk actions, CSV/Excel import, add/edit (name EN/HI, description, subcategory, brand, price, MRP, unit, SKU, stock, low-stock threshold, variants, tags, availability, featured), media sorter (images + YouTube/Instagram embeds; add, reorder, preview, remove), shareable product link | BR-06, BR-07, BR-16 | S-VD-3 |
| VD5 | product category pills manager | product category pills manager (reorder, rename, hide) | BR-06, BR-07, BR-16 | S-VD-3 |
| VD6 | subcategory suggestion form with duplicate detection | subcategory suggestion form with duplicate detection ("Similar subcategory already exists: Mobile Repair") and "my suggestions" with status | BR-06, BR-07, BR-16 | S-VD-7 |
| VD7 | offers manager | offers manager: create/edit/pause/end, discount type, validity, applicable products, banner, featured toggle (appears in offers section), performance (views, uses), submitted for admin approval | BR-06, BR-07, BR-16 | S-VD-7 |
| VD8 | orders | orders: new-order alert, list/detail, accept/reject with reason, preparing, ready, request/assign rider (or own delivery with customer OTP), pickup handover with pickup code, print order slip, mark item unavailable, refund-request handling (approve/decline -> escalate) | BR-05, BR-06, BR-07, BR-16 | S-VD-2 |
| VD9 | inventory | inventory: stock levels, thresholds, quick toggles, restock, bulk update | BR-06, BR-07, BR-16 | S-VD-7 |
| VD10 | reviews | reviews: list, filter, reply, report abusive | BR-06, BR-07, BR-16 | S-VD-7 |
| VD11 | QR and links | QR and links: business QR with logo, poster/table-tent/sticker templates, profile/product links, share | BR-06, BR-07, BR-16 | S-VD-7 |
| VD12 | gallery manager | gallery manager (gallery-only photos, ordering, default media-consent setting) and videos & reels manager: add YouTube/Instagram link or upload, thumbnail picker, caption, hashtags, link products/services, visibility toggles "Show in Gallery" and "Show in Reels feed", approval status (pending/approved/rejected with reason/removed), analytics (views, likes, shares, followers gained, taps on linked items) | BR-06, BR-07, BR-11, BR-16 | S-VD-6 |
| VD13 | media-consent toggle on every product/service media upload | media-consent toggle on every product/service media upload: "Also show this in my business Gallery / Videos & Reels" with explanation and a default from settings | BR-06, BR-07, BR-11, BR-16 | S-VD-3 |
| VD14 | services manager | services manager: title, category, one subcategory, description, price type (from/fixed/range/on enquiry) + amount + unit, inclusions/exclusions, service area, images, video link, active/pause toggle, shareable link | BR-06, BR-07, BR-08, BR-16 | S-VD-4 |
| VD15 | followers | followers: count, growth chart, announce to followers | BR-06, BR-07, BR-16 | S-VD-7 |
| VD16 | enquiries inbox | enquiries inbox (same as PV4) | BR-06, BR-07, BR-16 | S-VD-7 |
| VD17 | earnings and payout summary | earnings and payout summary, plan and commission, promotion purchase (featured listing, banner ads), invoices | BR-06, BR-07, BR-16 | S-VD-7 |
| VD18 | account | account: owner details, payout UPI/bank, staff access list, security (OTP, optional password), language, help | BR-05, BR-06, BR-07, BR-16 | S-VD-8 |

## PV. Provider dashboard

Roles: R-03 provider. Default rules: BR-06, BR-08. Entities: Owner, Service, Enquiry, Video.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| PV1 | onboarding same as vendor | onboarding same as vendor | BR-06, BR-08 | n/a (onboarding, see J11-style flow) |
| PV2 | profile | profile: name/business, logo, category, "expert in" multi-select subcategories, description, contact, WhatsApp, location and service area, images/gallery, videos, working hours, socials | BR-06, BR-08 | S-PV-3 |
| PV3 | services manager | services manager (as VD14) | BR-06, BR-08 | S-PV-2 |
| PV4 | enquiries inbox | enquiries inbox: list/detail, statuses `new -> contacted -> converted -> closed`, call and WhatsApp reply, filters and search | BR-06, BR-08 | S-PV-1 |
| PV5 | can list products and handle orders | can list products and handle orders | BR-06, BR-08 | S-PV-2 |
| PV6 | reviews | reviews, QR and share link, analytics (profile views, enquiries, conversion), followers, videos/reels and gallery managers, notifications, account | BR-06, BR-08 | S-PV-4 |
| PV7 | placeholders for booking/appointment/quotation/payment | placeholders for booking/appointment/quotation/payment (feature flag off) | BR-06, BR-08 | n/a (feature flag off) |

## RD. Rider (mobile-first PWA)

Roles: R-04 rider. Default rules: BR-05, BR-06. Entities: Rider, DeliveryJob.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| RD1 | signup and verification | signup and verification: profile, selfie, vehicle (type, number), driving licence, ID proof, RC book, bank/UPI, document upload, approval states | BR-05, BR-06 | n/a (onboarding, see J11) |
| RD2 | home | home: online/offline toggle, today's deliveries and earnings | BR-05, BR-06 | S-RD-1 |
| RD3 | new request | new request: pickup shop, drop, distance, estimated earning, countdown (60 s), accept/reject | BR-05, BR-06 | S-RD-2 |
| RD4 | active delivery | active delivery: accepted -> reached shop -> items check -> picked up -> navigation -> reached drop -> collect cash if COD -> enter customer OTP -> delivered; or failed (customer unreachable, wrong address, customer cancelled, vehicle problem) with reason; masked customer call | BR-05, BR-06 | S-RD-3 |
| RD5 | history with filters | history with filters (all/today/week) and detail | BR-05, BR-06 | S-RD-4 |
| RD6 | earnings | earnings: per-ride base + per-km, daily/weekly totals, payout status | BR-05, BR-06 | S-RD-4 |
| RD7 | feedback and ratings | feedback and ratings | BR-05, BR-06 | S-RD-5 |
| RD8 | profile | profile, documents, payout details, language, support, dispute report | BR-05, BR-06 | S-RD-5 |

## AD. Admin

Roles: R-05 admin. Default rules: BR-12, BR-07. Entities: Admin, AuditLog, SubcategorySuggestion, Review, Video, Campaign.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| AD1 | overview | overview: KPIs, approvals queue, live orders, alerts | BR-07, BR-12 | S-AD-1 |
| AD2 | approvals | approvals (business, provider, rider queues): document viewer, approve / reject / request changes with reason, history log, notification to applicant | BR-07, BR-12 | S-AD-2 |
| AD3 | listings | listings: create, edit status/details, remove; view products of a business and unpublish | BR-07, BR-12 | S-AD-3 |
| AD4 | users | users: customers, vendors, riders; search, profile, order history, suspend and reactivate | BR-07, BR-12 | S-AD-4 |
| AD5 | categories | categories: view fixed main categories (edit only for super admin), subcategory tree with service types, keywords, and a preview of the subcategory filter | BR-07, BR-12, BR-18 | S-AD-5 |
| AD6 | subcategory suggestion queue | subcategory suggestion queue (Pending/Approved/Rejected/Merged): approve, reject with reason, merge into existing, duplicate warning, notification to the suggester | BR-07, BR-12 | S-AD-5 |
| AD7 | orders and disputes | orders and disputes: all orders, disputed/refund/failed-delivery cases, resolution workflow (open -> in review -> resolved) with notes, refund approval/completion, rider assign/reassign | BR-07, BR-12 | S-AD-6 |
| AD8 | live deliveries | live deliveries: map with city filter (All cities by default with cluster pins and per-city counts; selecting a city zooms and filters; searchable when long), side list (order id, rider, status, ETA), empty state "No live deliveries in <city>" | BR-07, BR-12 | S-AD-7 |
| AD9 | review moderation | review moderation: reported, pending, removed; approve, hide, delete | BR-07, BR-12 | S-AD-8 |
| AD10 | video moderation queue | video moderation queue: pending, approved, rejected (reason), removed, reported (reasons); engagement report | BR-07, BR-12 | S-AD-9 |
| AD11 | promotions | promotions: homepage banners, featured businesses, vendor offer approvals | BR-07, BR-12 | S-AD-10 |
| AD12 | communications | communications: audience is a searchable combobox (customers, shops, service providers; recent items; keyboard); scope Overall / City-wise (one or more cities) / Zone-wise (one or more zones), permission-aware; template picker (offer, new product, festival greeting, delay apology); channels WhatsApp Business, in-app, email; consent-aware recipient counts (opted-in vs excluded); preview; schedule; review-before-send summary (scope, audience, count, channels, schedule); delivery report (sent, delivered, failed, opt-outs) | BR-07, BR-11, BR-12 | S-AD-11 |
| AD13 | reports | reports: orders, revenue, vendor performance, rider performance, enquiries; CSV export | BR-07, BR-12 | S-AD-12 |
| AD14 | audit log with search and before/after | audit log with search and before/after | BR-07, BR-12 | S-AD-14 |
| AD15 | search keyword mapping tool | search keyword mapping tool: link a keyword and its synonyms (including Hindi/Hinglish) to shop categories, service subcategories and product tags; preview of search results | BR-07, BR-12 | S-AD-13 |
| AD16 | permission-aware UI everywhere | permission-aware UI everywhere | BR-07, BR-12 | n/a (cross-cutting UI rule across all S-AD-*) |

## SA. Super admin

Roles: R-06 super_admin. Default rules: BR-12, BR-13, BR-07. Entities: Admin, Role, City, Zone, Setting, Category.

| ID | Feature | Key behaviour / acceptance hints | Rules (BR) | Screens |
|---|---|---|---|---|
| SA1 | overview with KPIs and a tabbed chart card | overview with KPIs and a tabbed chart card (Graph view and Candle view in the same card; shared date range, metric orders/revenue/deliveries, and city filter; candle shows open/high/low/close with legend and tooltip; up = filled, down = hollow, tooltip says "Up"/"Down"; skeleton, empty (non-live city) and error states) | BR-07, BR-12, BR-13 | S-SA-1 |
| SA2 | admins and areas | admins and areas: collapsible cards (collapsed: name, role, city/area chips, status badge, chevron; expanded: phone, email, assigned cities and zones, permissions summary, last active, audit shortcut, actions); search by name/phone/email; filters city, area/zone, role, status (Active/Inactive); removable chips, result count, Clear all, no-results; filters in a bottom sheet on mobile and toolbar on desktop; activate/deactivate with a confirmation dialog naming who is affected and the impact (for example "will lose access immediately"), text-labelled confirm button, success toast; area assignment; per-admin permission matrix | BR-07, BR-12, BR-13 | S-SA-2 |
| SA3 | roles and permissions | roles and permissions: create, edit (name, description, modules x actions matrix, "unsaved changes" indicator, before/after summary on save), duplicate, delete (blocked with "Reassign N admins first" and a reassign picker; system roles locked) | BR-07, BR-12, BR-13 | S-SA-3 |
| SA4 | cities and zones | cities and zones: city cards (status Enabled/Disabled/Coming soon, zones, areas, admins, waitlist); enable/disable with confirmation; add city; city detail with the "Service area & delivery zones" map and polygon drawing/editing (add corners, drag, remove), zone list (name, fee slabs, status), assigned admins, empty state "No zones yet, draw your first zone" | BR-07, BR-12, BR-13 | S-SA-4 |
| SA5 | global settings | global settings: branding, delivery fee slabs, rider earning rule, commission, subscription plans, promotion fees, payments (online/COD, gateway), refund and cancellation window, review rules, notification and WhatsApp/SMS/email integration, SEO defaults, feature flags, legal pages | BR-07, BR-12, BR-13 | S-SA-5 |
| SA6 | platform analytics | platform analytics (GMV, orders, average order value, repeat customers, orders by category, delivery vs pickup, top vendors) | BR-07, BR-12, BR-13 | S-SA-6 |
| SA7 | activity monitor | activity monitor: audit trail with filters, before/after diff, export | BR-07, BR-12, BR-13 | S-SA-7 |
| SA8 | main-category management | main-category management (only super admin) and the category tree with keyword/synonym mapping | BR-07, BR-12, BR-13 | S-SA-8 |