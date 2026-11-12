# 07 — Screens, Routes, Sitemap

**Purpose:** Every production route, its screen ID, entry points, key components and states.
**Audience:** Frontend engineers, `developer-frontend`, `architect` in specification mode.
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [03-feature-catalog.md](./03-feature-catalog.md) · [08-design-system.md](./08-design-system.md) · [06-user-journeys.md](./06-user-journeys.md)
**Last updated:** 2026-11-09
**Owner:** Frontend

Routes below are the **production** routes to implement (the prototype
used hash routes — do not carry that forward). Screen IDs are
`S-<area>-<n>` and are referenced from
[03-feature-catalog.md](./03-feature-catalog.md) and
[13-traceability-matrix.md](./13-traceability-matrix.md).

## 1. Customer-facing screens

| Screen ID | Role(s) | Production route | Entry points | Key components | States |
|---|---|---|---|---|---|
| S-AU-1 | guest | `/login` | Login-required prompt (BR-21), header | 6-box OTP input, resend timer | default, error (invalid/expired OTP), locked (attempt limit) |
| S-HM-1 | customer, guest | `/` | App open, logo tap | Location bar, search, hero carousel, category tiles, shop cards | default, skeleton, empty (no nearby shops), offline |
| S-LC-1 | customer, guest | location picker (modal/sheet, no own route) | Location bar tap | Map/list toggle, radius slider, saved locations | default, GPS denied, GPS off, outside service area |
| S-EX-1 | customer, guest | `/explore?tab=&category=&subcategory=`, `/services` | Category tiles, "View all", nav | Tabs, filter panel (EX6 services filter), result grid | default, skeleton, empty per tab, error, map/list |
| S-SR-1 | customer, guest | `/search?q=` | Search bar | Tabs, grouped autocomplete, result groups | default, no-results, loading |
| S-CAT-1 | customer, guest | `/category/:slug` | Category tile, breadcrumb | Same as S-EX-1, category pre-applied | same as S-EX-1 |
| S-PF-1 | customer, guest | `/shop/:slug`, `/provider/:slug` (tabs via `?tab=`) | Shop/service cards, search results | Tabs (About/Products & Services/Offers/Gallery/Videos/Reviews/Contact), action bar | default, not-live, closed, outside range, no services yet |
| S-PD-1 | customer, guest | `/product/:slug` | Product card, related products | Carousel, offer banner, Add to cart/Buy now | default, out-of-stock, offer expired, low stock |
| S-SV-1 | customer, guest | `/service/:slug` | Service card, search results | Carousel, Send Enquiry form | default, no provider experience data |
| S-CK-1 | customer | `/cart` | Cart icon, Add to cart | Grouped-by-shop lines, price breakdown, coupon field | default, empty, item removed (stock change) |
| S-CK-2 | customer | `/checkout` | Cart "Checkout" | Per-shop delivery/pickup choice, address book, payment methods | default, out-of-range, payment failed |
| S-OF-1 | customer, guest | `/offers` | Offer card, home "Offers" | Filters, offer cards | default, empty, expired |
| S-OR-1 | customer | `/orders` | Account, order-success | Active/completed/cancelled filters | default, empty |
| S-OR-2 | customer | `/orders/:id` | Orders list | Timeline, live tracking (OTP), pickup code, actions | default, cancelled, refund-tracker, dispute |
| S-OR-3 | customer | `/orders/:id/invoice` | Order detail "Download invoice" | Printable tax invoice | default |
| S-RV-1 | customer | `/reviews/new?target=` | Order detail, profile | Star rating, text, photos, tags | default, not-eligible |
| S-RV-2 | customer | `/my-reviews` | Account | Review list, edit/delete | default, empty |
| S-NT-1 | customer, vendor, provider, rider, admin | `/notifications` | Bell icon | Read/unread list, per-role feed | default, empty |
| S-EG-1 | customer | `/saved` | Bell/heart interactions, nav | Tabs Shops/Services/Photos & Videos | default, empty per tab |
| S-RL-1 | customer, guest | `/videos`, `/videos/:id` | Play icon, linked-product strip, deep link | Vertical snap feed, overlay, linked items strip | default, empty Following, no videos nearby, skeleton, failed, offline, removed |
| S-AC-1 | customer | `/account`, `/account/profile` | Account nav | Profile edit form | default |
| S-AC-2 | customer | `/account/addresses` | Account nav, checkout | Address book | default, empty |
| S-AC-3 | customer | `/account/preferences` | Account nav | Language/theme, notification preferences | default |
| S-AC-4 | all | `/help`, `/terms`, `/privacy`, `/refund-policy`, `/about` | Footer, account | Static content | default |
| S-SYS-1 | all | `/404`, `/500`, `/offline`, `/maintenance` | Error conditions | System page templates (X9) | n/a |

## 2. Vendor dashboard (`/vendor/...`)

| Screen ID | Route | Covers |
|---|---|---|
| S-VD-1 | `/vendor/overview` | VD2 KPIs, charts, alerts |
| S-VD-2 | `/vendor/orders`, `/vendor/orders/:id` | VD8 orders |
| S-VD-3 | `/vendor/products`, `/vendor/products/:id` | VD4, VD5, VD13 products + media sorter |
| S-VD-4 | `/vendor/services` | VD14 services manager |
| S-VD-5 | `/vendor/profile` | VD3 profile editor |
| S-VD-6 | `/vendor/media` | VD12 gallery + videos/reels manager |
| S-VD-7 | `/vendor/offers`, `/vendor/inventory`, `/vendor/reviews`, `/vendor/followers`, `/vendor/qr`, `/vendor/earnings` | VD6, VD7, VD9, VD10, VD11, VD15, VD16, VD17 |
| S-VD-8 | `/vendor/account`, `/vendor/notifications` | VD18 account |

## 3. Provider dashboard (`/provider/...`)

| Screen ID | Route | Covers |
|---|---|---|
| S-PV-1 | `/provider/overview`, `/provider/enquiries`, `/provider/enquiries/:id` | PV4 enquiries inbox |
| S-PV-2 | `/provider/services`, `/provider/products`, `/provider/orders` | PV3, PV5 |
| S-PV-3 | `/provider/profile`, `/provider/media`, `/provider/account`, `/provider/notifications` | PV2, PV6 |
| S-PV-4 | `/provider/reviews`, `/provider/followers`, `/provider/qr`, `/provider/analytics` | PV6 |
| S-PV-5 | `/provider/billing` | PV8 Provider Premium billing |

## 4. Rider PWA (`/rider/...`)

| Screen ID | Route | Covers |
|---|---|---|
| S-RD-1 | `/rider/home` | RD2 online/offline, today's summary |
| S-RD-2 | `/rider/requests` | RD3 new request + countdown |
| S-RD-3 | active delivery (no own route; modal/flow from S-RD-2) | RD4 active delivery flow |
| S-RD-4 | `/rider/history`, `/rider/earnings` | RD5, RD6 |
| S-RD-5 | `/rider/feedback`, `/rider/profile` | RD7, RD8 |

## 5. Admin console (`/admin/...`)

| Screen ID | Route | Covers |
|---|---|---|
| S-AD-1 | `/admin/overview` | AD1 |
| S-AD-2 | `/admin/approvals`, `/admin/approvals/:id` | AD2 |
| S-AD-3 | `/admin/listings` | AD3 |
| S-AD-4 | `/admin/users` | AD4 |
| S-AD-5 | `/admin/categories`, `/admin/subcategory-suggestions` | AD5, AD6 |
| S-AD-6 | `/admin/orders`, `/admin/orders/:id` | AD7 |
| S-AD-7 | `/admin/live` | AD8 live deliveries map |
| S-AD-8 | `/admin/reviews` | AD9 |
| S-AD-9 | `/admin/videos` | AD10 |
| S-AD-10 | `/admin/promotions` | AD11 |
| S-AD-11 | `/admin/communications` | AD12 |
| S-AD-12 | `/admin/reports` | AD13 |
| S-AD-13 | `/admin/keywords` | AD15 |
| S-AD-14 | `/admin/audit`, `/admin/profile` | AD14 |

## 6. Super admin console (`/super-admin/...`)

| Screen ID | Route | Covers |
|---|---|---|
| S-SA-1 | `/super-admin/overview` | SA1 graph-only chart with accessible table |
| S-SA-2 | `/super-admin/admins` | SA2 admins and areas |
| S-SA-3 | `/super-admin/roles` | SA3 roles and permissions |
| S-SA-4 | `/super-admin/cities`, `/super-admin/cities/:id` | SA4 cities and zones |
| S-SA-5 | `/super-admin/settings` | SA5 global settings |
| S-SA-6 | `/super-admin/analytics` | SA6 platform analytics |
| S-SA-7 | `/super-admin/activity` | SA7 activity monitor |
| S-SA-8 | (within `/super-admin/categories`, super_admin only) | SA8 main-category management |

## 7. URL parameter contract

| Screen | Params | Values |
|---|---|---|
| S-EX-1 | `tab` | `products` \| `shops` \| `services` |
| S-EX-1 | `category` | one or more category slugs, comma-separated |
| S-EX-1 | `subcategory` | one or more subcategory slugs, comma-separated (services tab only) |
| S-SR-1 | `q` | search query string |
| S-PF-1 | `tab` | `about` \| `products-services` \| `offers` \| `gallery` \| `videos` \| `reviews` \| `contact` |
| S-RL-1 | `/videos/:id` | starts the feed at that video id (ranking frozen per session, BR — see RL9) |

## 8. Screen state checklist

Every screen must cover, where applicable (X7): **default, skeleton,
empty, error (with retry), no-permission, offline, success.** Screens
with additional special states: S-LC-1 (outside service area), S-PD-1
(expired offer, out-of-stock), S-RL-1 (unavailable/removed video),
S-CK-2 (payment failed), S-PF-1 (listing not live).
