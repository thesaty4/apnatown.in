# 01 Feature inventory

- **Purpose:** Every feature with a unique ID. Specs, code and verification evidence must reference these IDs.
- **Audience:** Copilot agents and developers
- **Related:** 02-screen-inventory.md, 03-user-flows.md, 07-state-machines-and-business-rules.md
- **Last updated:** 2026-11-10
- **Source:** extracted from the finished ApnaTown design (interactive prototype and its source code)

**Total features: 206** across 22 areas. Priority: P0 = launch-critical, P1 = launch-desirable, P2 = later. Dependencies are listed per area.

## X - Cross-cutting platform

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-X-001 | English/Hindi language toggle | All roles | Switch EN/HI anywhere (top bar, footer, account, splash). Every user-facing string has both; long Hindi labels wrap, never truncate. Choice persisted. | P0 |
| F-X-002 | Theme light/dark/auto | All roles | Light is default; dark and auto (system) supported through tokens. All colours from tokens; status never by colour alone. | P0 |
| F-X-003 | Responsive layouts 360/tablet/desktop | All roles | Mobile-first 360px base; tablet >=600px; desktop >=900px, container max 1200px. Tables collapse to labelled cards on mobile; filters become sheet/bar/sidebar. | P0 |
| F-X-004 | Accessibility (WCAG 2.2 AA) | All roles | Keyboard operation, visible 3px focus ring, 48px touch targets, ARIA only where needed, focus trap in dialogs/sheets/viewer, reduced-motion alternatives, labels on icon buttons. | P0 |
| F-X-005 | Offline banner | All roles | Banner when offline with retry; cached shells still render; reels show offline state. | P0 |
| F-X-006 | Slow-connection / data-saver mode | All roles | Lite mode: no autoplay, lazy media, smaller images, 'Tap to play' posters. Toggle in demo/settings and honours the browser Save-Data hint. | P0 |
| F-X-007 | Five UX states on every screen | All roles | Default, loading skeleton, empty (helpful + one action), error (with retry), no-permission. Plus offline/success where relevant. | P0 |
| F-X-008 | Consent components | Customer | Cookie consent banner and WhatsApp opt-in with explicit text; consent recorded with timestamp and purpose; easy opt-out. | P0 |
| F-X-009 | System pages | All roles | 404, 500 ('hit a snag'), offline, maintenance, session expired, account deleted ('bye'), each with a clear action. | P0 |
| F-X-010 | SEO page templates | Customer | Server-rendered business, product, service, category pages with readable URLs, breadcrumbs, metadata, JSON-LD and canonical rules. | P0 |
| F-X-011 | Print templates | Vendor, Provider, Admin | Printable QR poster / table-tent / sticker, invoice, order slip (browser print to PDF). | P0 |
| F-X-012 | Notification templates | All roles | In-app, email and WhatsApp templates for order placed, out for delivery, delivered, cancelled/refund, approval decision, new enquiry, subcategory/video/offer decisions, rider assigned, refund approved, follower announcements. EN+HI. | P0 |
| F-X-013 | Indian formatting utilities | All roles | INR from integer paise with Indian grouping, IST 12-hour time, '7 Nov 2026' dates, distance in km, +91 phone formatting. One shared implementation. | P0 |
| F-X-014 | Audit trail | Admin, Super admin | Append-only log of admin and sensitive actions with actor, action, before/after, time; searchable; exportable. | P0 |
| F-X-015 | Rider PWA behaviour | Rider | Installable, mobile-first, large controls, works on weak networks, background-safe request countdown. | P0 |

## AU - Auth and onboarding

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-AU-001 | Splash and language choice | Customer | First launch: brand splash, language picker EN/HI, 'Browse as guest' and 'Log in'. | P0 |
| F-AU-002 | Location primer with manual fallback | Customer | Explains why location helps; 'Use my location' or choose area/PIN manually; never mandatory. | P0 |
| F-AU-003 | Browse as guest | Customer | Browse everything without login; login prompt only for order, bookmark, review, like, follow, comment. | P0 |
| F-AU-004 | Mobile OTP login | Customer | Phone +91 input, 6-box OTP with auto-advance and paste, 30-second resend timer, attempt limits, error states; optional email/Google. | P0 |
| F-AU-005 | Profile completion | Customer | Name (and optional email) after first login; skip allowed. | P0 |
| F-AU-006 | Login prompt returns to origin | Customer | Login-required actions open a sheet; after login the user returns to the same page/video and the action completes. | P0 |
| F-AU-007 | Logout and session expiry | All roles | Logout from account; 'session expired' page with re-login returning to origin. | P0 |
| F-AU-008 | Account deletion and data download | Customer | Self-service request to download or delete personal data (DPDP); confirmation and 'bye' page. | P0 |

## HM - Home

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-HM-001 | Sticky header with location, search, bell, cart, play icon | Customer | Location selector, search field with voice icon, notification bell with badge, cart with count, Play icon to Videos. | P0 |
| F-HM-002 | Hero banner carousel | Customer | Admin-managed banners with swipe/arrows, dots, auto-advance (paused on hover/focus), reduced-motion safe. | P0 |
| F-HM-003 | Shop by category tiles | Customer | Ten product categories; tile opens Explore Products with that category pre-applied (all three tabs). | P0 |
| F-HM-004 | Local services tiles | Customer | Seven service categories; tile opens Explore Services with that category pre-selected. | P0 |
| F-HM-005 | Offers and deals | Customer | Offer cards (badge, shop, validity) open product/service/filtered list/shop page according to the offer target. | P0 |
| F-HM-006 | Nearby shops grid with shop card | Customer | Responsive shop card (image top, details bottom; 1/2/3-4 columns; lazy image + skeleton); 'View all shops' opens Explore Shops sorted by distance. | P0 |
| F-HM-007 | Featured businesses | Customer | Featured shops with 'View all businesses' to Explore Shops (Featured). | P0 |
| F-HM-008 | Popular businesses | Customer | Top-rated/most-viewed shops. | P0 |
| F-HM-009 | Featured products | Customer | Featured product cards with 'View all products' to Explore Products (Featured). | P0 |
| F-HM-010 | Popular service providers | Customer | Top providers with service cards. | P0 |
| F-HM-011 | Local promotions | Customer | Promotional blocks from the Promotions module. | P0 |
| F-HM-012 | Recently viewed | Customer | Last viewed products/shops/services stored per user/device. | P0 |
| F-HM-013 | Bookmarks quick access | Customer | Shortcut to Saved with counts. | P0 |
| F-HM-014 | Desktop footer | Customer | About, Contact & help, Vendor signup, Rider signup, List your service, Terms, Privacy, Refund policy, language switcher. | P0 |

## LC - Location and discovery

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-LC-001 | GPS detection and manual location | Customer | Detect position, or choose area/locality/PIN; saved locations; stored in session. | P0 |
| F-LC-002 | Map and list views | Customer | Schematic map with shop pins, radius slider (1-12 km, default 6), 'you are here'; list toggle. | P0 |
| F-LC-003 | Directions | Customer | Opens the device maps app with the destination. | P0 |
| F-LC-004 | Nearby vs Delivers-to-me distinction | Customer | Badges and messages separate 'Nearby (distance)' from 'Delivers to your address'. | P0 |
| F-LC-005 | Location states | Customer | Permission denied, GPS off, outside service area ('We are not in your city yet' + notify-me with phone). | P0 |

## EX - Explore

Depends on: AU, HM, LC, 07 rules BR-15/BR-18

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-EX-001 | Explore tabs with counts | Customer | Products / Shops / Services with result counts per tab for the applied category/filters. | P0 |
| F-EX-002 | Category pill pre-applied | Customer | Category chosen on Home is shown as removable, changeable pill and applied in all three tabs (related service category where one exists). | P0 |
| F-EX-003 | Per-tab filters remembered | Customer | Switching tabs keeps each tab's filters; Reset per tab. | P0 |
| F-EX-004 | Products filters | Customer | Price range (slider + min/max), rating 4+/3+, category + subcategory, brand, offers, in stock, delivery/pickup, distance, sort (relevance, price low-high, high-low, rating, newest). | P0 |
| F-EX-005 | Shops filters | Customer | Category, distance, rating, open now, delivers to my address, offers, verified, featured, sort (relevance, distance, rating, newest). | P0 |
| F-EX-006 | Services filter with subcategory multi-select | Customer | Category multi-select + Subcategory multi-select grouped under category headings, checkbox counts, Select all/Clear per group, inner search above 8 items, Show more, disabled when count 0, OR logic, removing a category removes its subcategories, grouped collapsed sections when no category, chips + Clear all, skeleton while counts update, long-Hindi safe, keyboard and screen-reader support. Other filters: distance, rating, price or 'Price on enquiry', open now/available today, has offers, verified, sort (relevance, distance, rating, price). | P0 |
| F-EX-007 | Filter surfaces | Customer | Mobile bottom sheet with sticky 'Show N results' and Reset/Apply; desktop left sidebar with live results; tablet horizontal bar with Filters button and active-count badge. | P0 |
| F-EX-008 | Shareable URL state | Customer | /explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting (slugs, comma-separated). Parsed and validated; copy-link action. | P0 |
| F-EX-009 | Back button restores page and scroll | Customer | Back from Explore returns to previous page with scroll position preserved (handles query-string history entries). | P0 |
| F-EX-010 | Per-tab empty state | Customer | Friendly message, 'Clear category' and suggested categories with counts. | P0 |
| F-EX-011 | Map/List toggle | Customer | Switch result view; map pins for shops (and owners of services). | P0 |
| F-EX-012 | Reusable filter component | Customer | Same Services filter on Explore, Search (separate state) and service category pages. | P0 |

## SR - Search

Depends on: EX (shared filter component), admin keyword mapping AD15

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-SR-001 | Search tabs | Customer | All / Products / Shops / Services / Videos with counts. | P0 |
| F-SR-002 | Keyword to category mapping | Customer | Keywords map to shop categories, service subcategories and product tags (AC, iPhone 15, DJ, tent, plumber, mobile repair, electrician, catering). | P0 |
| F-SR-003 | Hindi/Hinglish/typo tolerance | Customer | 'एसी', 'ac', 'plumbr', 'mobile repair' resolve to the right results. | P0 |
| F-SR-004 | Grouped autocomplete | Customer | Groups: Products, Shops, Services, Categories, Subcategories, Related searches. | P0 |
| F-SR-005 | Recent and popular searches | Customer | Chips for recent (per user) and popular (platform). | P0 |
| F-SR-006 | All tab grouped sections | Customer | Each group shows a few items, 'See all', and an explanation label such as 'Related services for AC'. | P0 |
| F-SR-007 | Per-tab filters in Search | Customer | Products and Shops use the filter sheet; Services uses the Explore services filter component with its own state. | P0 |
| F-SR-008 | Sort | Customer | Relevance, distance, rating, price, newest. | P0 |
| F-SR-009 | No-results state | Customer | Message with related categories and popular searches. | P0 |
| F-SR-010 | Separate filter state from Explore | Customer | Search filters never change Explore and vice versa. | P0 |

## PF - Business and provider profile

Depends on: VD/PV data, OF, RL, EG

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-PF-001 | Profile header | Customer | Cover, logo, name, category, verified, rating, open/closed with today's hours, distance. | P0 |
| F-PF-002 | Sticky action bar | Customer | Call, WhatsApp, Directions, Share, Save. | P0 |
| F-PF-003 | Profile tabs | Customer | About / Products & Services / Offers / Gallery / Videos/Reels / Reviews / Contact & Location. | P0 |
| F-PF-004 | Products & Services section | Customer | Segmented switch (only applicable ones); products: sticky scrollable category pills with counts; services: category pills then subcategory pills; empty state 'This business has not added any services yet'. | P0 |
| F-PF-005 | Expert-in subcategories | Customer | Provider's expert-in subcategories visible on service cards and profile. | P0 |
| F-PF-006 | Hours, delivery and pickup info | Customer | Weekly table with holidays/temporarily closed; delivery mode, radius, fee, minimum order; pickup instructions; eligibility for user's address. | P0 |
| F-PF-007 | Map, directions, QR, report, share | Customer | Location map; QR view/share; report listing; WhatsApp/copy-link share. | P0 |
| F-PF-008 | Follow with bell | Customer | Follow/Following, unfollow confirmation, notification bell. | P0 |
| F-PF-009 | Gallery with filters and lightbox | Customer | Filters All/Photos/Videos/By product/By service; lightbox with swipe, captions, linked-item chip, hearts, report media. | P0 |
| F-PF-010 | Videos/Reels tab | Customer | Grid with view counts and follow button; opens Reels at that video. | P0 |
| F-PF-011 | Cart and enquiry on any profile | Customer | Add to cart for products and Send Enquiry for services on the same profile. | P0 |
| F-PF-012 | Owner-only prompts | Vendor, Provider | 'Add product / Add service' prompts when viewing own profile. | P0 |
| F-PF-013 | Profile states | Customer | Listing not live (pending/suspended), closed, outside delivery range. | P0 |

## PD - Product details

Depends on: PF, OF, RL

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-PD-001 | Breadcrumbs | Customer | Home / Category / Product. | P0 |
| F-PD-002 | Media carousel and full-screen viewer | Customer | Images and embedded YouTube/Instagram with play badge; viewer with prev/next, swipe, arrow keys, counter, close, pinch/double-tap zoom, heart, focus trap. | P0 |
| F-PD-003 | Price, variants, stock, purchase actions | Customer | Price, MRP, discount, variants, stock states (in stock, low 'Only N left', out of stock with notify-me), quantity, Add to cart, Buy now. | P0 |
| F-PD-004 | Offer banner | Customer | Badge, discounted price, validity date, terms at the top; expired and out-of-stock-offer states. | P0 |
| F-PD-005 | Videos & Reels section | Customer | Below the details; hidden if none; opens Reels at that video; linked strip returns to the product. | P0 |
| F-PD-006 | Seller card | Customer | Delivery/pickup info and link to profile. | P0 |
| F-PD-007 | Specs and reviews | Customer | Specs table, rating breakdown, review list and form. | P0 |
| F-PD-008 | Related products | Customer | 'View all' opens Explore Products with the same category and subcategory. | P0 |
| F-PD-009 | Share and bookmark | Customer | Share link and bookmark. | P0 |

## SV - Services

Depends on: PF, OF, RL, VD14

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-SV-001 | Service card | Customer | Image, name, subcategory tag, provider with logo/verified, price or 'Price on enquiry', rating, distance, open/availability badge, offer badge, Call/WhatsApp/Save; used in Search, Explore, profile, category pages. | P0 |
| F-SV-002 | Service details page | Customer | /service/:slug with carousel, title, subcategory, price type and unit (per hour/day/event/sq ft or enquiry), description, included/excluded, area, hours, experience. | P0 |
| F-SV-003 | Provider card on service | Customer | Profile link, follow, verified, rating, Call/WhatsApp/Directions. | P0 |
| F-SV-004 | Reference videos and previous work | Customer | Embedded videos tagged to the service; gallery of previous work. | P0 |
| F-SV-005 | Send Enquiry form | Customer | Name, phone, message, preferred date, success state; primary CTA. Booking/payment is a future placeholder (feature flag off). | P0 |
| F-SV-006 | Offers, reviews, FAQs, related | Customer | Service offers, ratings with breakdown and form, FAQs, related services, similar providers, share, bookmark. | P0 |
| F-SV-007 | Service breadcrumbs | Customer | Services > Category > Subcategory > Service, each linking to Explore Services with filters. | P0 |
| F-SV-008 | One subcategory per service | Vendor, Provider, Admin | Each service has exactly one subcategory; provider can be expert in several. | P0 |

## OF - Offers

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-OF-001 | Offers page | Customer | List with filters by business and category; offer detail with terms. | P0 |
| F-OF-002 | Offer deep links | Customer | Single product -> product page; service offer -> service page; multi-product -> filtered Explore Products; shop-wide -> shop page. | P0 |
| F-OF-003 | Offer states | Customer | Active, pending approval, paused, ended/expired, out-of-stock. | P0 |
| F-OF-004 | Featured offers on home | Customer | Featured offers surface on Home. | P0 |
| F-OF-005 | Offer lifecycle | Vendor, Admin | Vendor creates/edits/pauses/ends; admin approves before live. | P0 |
| F-OF-006 | Coupon management | Admin, Vendor, Provider, Customer | Scoped creator ownership and approval; product checkout coupons remain unavailable until redemption policy is resolved; provider service coupons are enquiry-display only. | P0 |

## CK - Cart and checkout

Depends on: AU4, PD, LC, 07 BR-03/BR-19

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-CK-001 | Cart grouped by business | Customer | Quantity stepper, remove, save for later, price breakdown, delivery fee, charges, coupon field. | P0 |
| F-CK-002 | One checkout, one order per shop | Customer | Clear notice when order splits into several shops; each order has own id, mode, payment record, OTP/pickup code. | P0 |
| F-CK-003 | Per-shop delivery or pickup choice | Customer | Choose Home Delivery or Self-Pickup per shop. | P0 |
| F-CK-004 | Address book | Customer | Add/edit/delete, map pin, landmark, PIN, labels Home/Work/Other, default. | P0 |
| F-CK-005 | Delivery range and minimum order checks | Customer | Delivery charge display; out-of-range and below-minimum messages. | P0 |
| F-CK-006 | Payment methods | Customer | UPI, cards, net banking, wallets, COD / pay-at-pickup. | P0 |
| F-CK-007 | Payment failure and retry | Customer | Failure state with retry or pay-on-delivery. | P0 |
| F-CK-008 | Order success | Customer | Order id per shop, summary, track link. | P0 |
| F-CK-009 | Coupons | Customer | Flat or percent, minimum, cap; discount distributed proportionally across shop orders. | P0 |

## OR - Orders and tracking

Depends on: CK, RD, 07 state machines

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-OR-001 | Orders list and detail | Customer | Active/completed/cancelled filters; detail with items, amounts, address, shop. | P0 |
| F-OR-002 | Order timelines | Customer | Delivery: placed, accepted, preparing, ready, out for delivery, delivered; pickup: placed, accepted, ready, picked up; plus cancelled, refunded. | P0 |
| F-OR-003 | Live tracking with delivery OTP | Customer | Rider name, phone, rating, status, ETA; delivery OTP shown to customer. | P0 |
| F-OR-004 | Pickup with code | Customer | Shop address, directions, instructions, pickup code. | P0 |
| F-OR-005 | Order actions | Customer | Cancel, request refund, report a problem, contact shop/rider, reorder, download invoice. | P0 |
| F-OR-006 | Cancellation and refund flow | Customer | Reason picker; 'Admin and vendor have been notified'; refund tracker requested/approved/completed. | P0 |
| F-OR-007 | Partial fulfilment and substitution | Customer, Vendor | Vendor marks item unavailable; bill updated; customer notified. | P0 |
| F-OR-008 | Dispute visibility | Customer | Case status visible to customer. | P0 |
| F-OR-009 | Master checkout summary | Customer, Admin | One immutable non-tax summary per checkout links the per-shop orders and legal invoices; vendors see only their own invoice. | P0 |

## RV - Reviews

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-RV-001 | Review flows by target | Customer | Business, product, service/provider, rider; separate forms. | P0 |
| F-RV-002 | Eligibility | Customer | Verified purchasers or enquirers only; otherwise explanatory message. | P0 |
| F-RV-003 | Rating, text, photos, tags | Customer | Star input, text, photos, quick tags per target type. | P0 |
| F-RV-004 | Edit/delete and My reviews | Customer | Manage own reviews. | P0 |
| F-RV-005 | Helpful and report | Customer | Mark helpful; report review. | P0 |
| F-RV-006 | Moderation of risky content | Admin | Links/abusive words held pending; approve/hide/delete. | P0 |
| F-RV-007 | Owner reply and report | Vendor, Provider | Reply to reviews; report abusive reviews. | P0 |

## EG - Engagement (save, follow, like, heart)

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-EG-001 | Saved page | Customer | Tabs Shops / Services / Photos & Videos; filters Photos/Videos/Reels; remove. | P0 |
| F-EG-002 | Heart on photos/videos/reels | Customer | Save with animation and reduced-motion alternative; guest prompts login. | P0 |
| F-EG-003 | Follow/unfollow with bell | Customer | Confirmation on unfollow; bell toggles notifications. | P0 |
| F-EG-004 | Like on videos | Customer | Toggle with count. | P0 |
| F-EG-005 | Comments (moderated) | Customer | Add comment; 'awaiting moderation' shown to author. | P0 |
| F-EG-006 | Share sheet | Customer | WhatsApp, copy link, native share. | P0 |
| F-EG-007 | Bookmarks | Customer | Shops, providers, services. | P0 |

## RL - Videos and reels

Depends on: AD10 moderation, EG, VD12

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-RL-001 | Entry points | Customer | Play icon in mobile top bar, desktop nav, bottom navigation. | P0 |
| F-RL-002 | Feed pills | Customer | For You / Following / Nearby / Offers / Products / Services + category pills (Electronics, Fashion, Food, Wedding, Mobile, Repair). | P0 |
| F-RL-003 | Vertical snap feed | Customer | Provider-supported autoplay in view, pause/play, mute, progress and captions; Instagram native controls; data-saver 'Tap to play', lazy loading (G-22). | P0 |
| F-RL-004 | Desktop layout | Customer | Centred player, side panel (comments, linked products), up/down arrow keys. | P0 |
| F-RL-005 | Video overlay | Customer | Owner avatar/name/verified, Follow/Following + bell, like count, comments, share, caption, hashtags, distance, open/closed, overflow with Report. | P0 |
| F-RL-006 | Linked products/services strip | Customer | Image, name, price, Add to cart / Enquire / View; 'Shop this video' sheet. | P0 |
| F-RL-007 | Guest actions and return | Customer | Like/follow/comment prompts login and returns to same video. | P0 |
| F-RL-008 | Reels states | Customer | Empty Following, no videos nearby, skeleton, failed with retry, offline, removed/unavailable. | P0 |
| F-RL-009 | Deep link and stable ranking | Customer | /videos/:id starts at that video; ranking frozen per session. | P0 |
| F-RL-010 | Video sources and safety | Customer, Vendor, Provider | YouTube/Instagram links only; typed playback rebuilt server-side from allow-listed hosts/IDs; safe Open fallback. Direct video upload disabled. | P0 |

## NT - Notifications

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-NT-001 | Notification centre | All roles | Read/unread, per-role feeds (order, offer, review, approval, enquiry, job, admin, system), bell with badge. | P0 |
| F-NT-002 | Notification preferences | Customer | Per channel (in-app, email, WhatsApp for orders/offers/enquiries) with consent text and unsubscribe. | P0 |
| F-NT-003 | Follower announcements | Vendor, Provider | Owners announce new offers/videos to followers. | P0 |

## AC - Customer account and legal

Depends on: platform foundations

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-AC-001 | Profile and addresses | Customer | Edit profile; saved addresses. | P1 |
| F-AC-002 | Payment methods | Customer | Saved methods list. | P1 |
| F-AC-003 | Language and theme preferences | Customer | Account-level settings. | P1 |
| F-AC-004 | Privacy controls | Customer | Download/delete my data; consent management. | P1 |
| F-AC-005 | Help and support | Customer | FAQs, call, WhatsApp, message. | P1 |
| F-AC-006 | Legal and about pages | Customer | Terms, Privacy, Refund & cancellation policy, About us. | P1 |

## VD - Vendor dashboard

Depends on: AD2 approval

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-VD-001 | Vendor signup wizard | Vendor | Mobile OTP, business type, basics, location, hours and delivery, documents (optional), review; save draft; approval states. | P0 |
| F-VD-002 | Vendor overview | Vendor | KPI cards, charts, low-stock alerts, pending actions. | P0 |
| F-VD-003 | Business profile editor | Vendor | Logo, cover, EN/HI name, hours per day, temporarily closed, delivery settings, pickup, map pin, live preview. | P0 |
| F-VD-004 | Products management | Vendor | List, search, filter, bulk actions, CSV import, add/edit with variants, SKU, stock, tags, media sorter (images + YouTube/Instagram), shareable link. | P0 |
| F-VD-005 | Product category pills manager | Vendor | Reorder, rename, hide. | P0 |
| F-VD-006 | Subcategory suggestion | Vendor | Form with duplicate detection and 'my suggestions' status. | P0 |
| F-VD-007 | Offers manager | Vendor | Create/edit/pause/end, discount type, validity, products, banner, featured, performance; admin approval. | P0 |
| F-VD-008 | Vendor orders | Vendor | New-order alert, accept/reject with reason, preparing, ready, request/assign rider or own delivery with OTP, pickup handover with code, print slip, mark item unavailable, refund handling. | P0 |
| F-VD-009 | Inventory | Vendor | Stock levels, thresholds, quick toggles, restock, bulk update. | P0 |
| F-VD-010 | Vendor reviews | Vendor | List, filter, reply, report. | P0 |
| F-VD-011 | QR and links | Vendor | Business QR with logo, poster/table-tent/sticker templates, links, share. | P0 |
| F-VD-012 | Gallery manager and videos/reels manager | Vendor | Gallery-only photos, default consent setting, YouTube/Instagram video links (file upload disabled), thumbnail, caption, hashtags, link items, 'Show in Gallery'/'Show in Reels', approval status, analytics. | P0 |
| F-VD-013 | Media-consent toggle | Vendor | On every product/service media upload: 'Also show this in my business Gallery / Videos & Reels' with explanation and default. | P0 |
| F-VD-014 | Services manager | Vendor | Title, category, one subcategory, price type/amount/unit, inclusions, exclusions, area, images, video, active/pause, shareable link. | P0 |
| F-VD-015 | Followers | Vendor | Count, growth chart, announce to followers. | P0 |
| F-VD-016 | Enquiries inbox | Vendor | Statuses new/contacted/converted/closed. | P0 |
| F-VD-017 | Earnings, plan, promotions, invoices | Vendor | Payout summary, plan and commission, buy promotions, invoices. | P0 |
| F-VD-018 | Vendor account | Vendor | Owner details, payout UPI/bank, staff access list, security, language. | P0 |

## PV - Service provider dashboard

Depends on: AD2 approval

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-PV-001 | Provider onboarding | Provider | Same wizard as vendor. | P0 |
| F-PV-002 | Provider profile with expert-in | Provider | Category, expert-in multi-select, description, contact, location and service area, gallery, hours. | P0 |
| F-PV-003 | Provider services manager | Provider | As vendor services manager. | P0 |
| F-PV-004 | Enquiries inbox | Provider | List/detail, statuses new -> contacted -> converted -> closed, call/WhatsApp reply, filters. | P0 |
| F-PV-005 | Provider products and orders | Provider | A provider can also list products and handle orders. | P0 |
| F-PV-006 | Provider reviews, QR, analytics, followers, media | Provider | Reviews, QR/share link, analytics (views, enquiries, conversion), followers, videos/gallery managers, notifications, account. | P0 |
| F-PV-007 | Booking placeholders | Provider | Booking/appointment/quotation/payment behind feature flag (off). | P0 |
| F-PV-008 | Provider Premium billing | Provider | Buy and manually renew configured Premium plans, cancel at paid expiry, view plan status/expiry and issued invoices. | P0 |

## RD - Rider app

Depends on: AD2 approval, OR

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-RD-001 | Rider signup and verification | Rider | Profile, selfie, vehicle, licence, ID, RC, bank/UPI, documents, approval states. | P0 |
| F-RD-002 | Rider home | Rider | Online/offline toggle, today's deliveries and earnings. | P0 |
| F-RD-003 | Delivery request with countdown | Rider | Pickup shop, drop, distance, estimated earning, 60 s countdown, accept/reject. | P0 |
| F-RD-004 | Active delivery flow | Rider | Accepted, reached shop, items check, picked up, navigation, reached drop, collect cash if COD, customer OTP, delivered; or failed with reason; masked call. | P0 |
| F-RD-005 | Rider history | Rider | Filters all/today/week; detail. | P0 |
| F-RD-006 | Rider earnings | Rider | Per-ride base + per-km, daily/weekly totals, payout status. | P0 |
| F-RD-007 | Rider feedback | Rider | Ratings and comments. | P0 |
| F-RD-008 | Rider profile and support | Rider | Documents, payout, language, support, dispute report. | P0 |

## AD - Admin

Depends on: SA3 roles and permissions

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-AD-001 | Admin overview | Admin | KPIs, approvals queue, live orders, alerts. | P0 |
| F-AD-002 | Approvals | Admin | Business/provider/rider queues, document viewer, approve/reject/request changes with reason, history, notification. | P0 |
| F-AD-003 | Listings management | Admin | Create, edit status/details, remove; unpublish products. | P0 |
| F-AD-004 | Users management | Admin | Customers, vendors, riders; search, profile, order history, suspend/reactivate. | P0 |
| F-AD-005 | Categories and tree preview | Admin | View fixed main categories; subcategory tree with service types, keywords, filter preview. | P0 |
| F-AD-006 | Subcategory suggestion queue | Admin | Pending/Approved/Rejected/Merged; approve, reject with reason, merge, duplicate warning, notify suggester. | P0 |
| F-AD-007 | Orders and disputes | Admin | All orders, disputed/refund/failed cases, workflow open -> in review -> resolved, notes, refund approval/completion, rider assign/reassign. | P0 |
| F-AD-008 | Live deliveries map | Admin | City filter (All with cluster pins/one city), side list, empty state. | P0 |
| F-AD-009 | Review moderation | Admin | Reported/pending/removed; approve, hide, delete. | P0 |
| F-AD-010 | Video moderation queue | Admin | Pending/approved/rejected/removed/reported, reasons, engagement report. | P0 |
| F-AD-011 | Promotions | Admin | Homepage banners, featured businesses, offer approvals. | P0 |
| F-AD-012 | Communications | Admin | Searchable audience combobox, scope Overall/City/Zone (permission-aware), templates, channels WhatsApp/in-app/email, consent-aware counts, preview, schedule, review-before-send summary, delivery report with opt-outs. | P0 |
| F-AD-013 | Reports | Admin | Orders, revenue, vendor and rider performance, enquiries; CSV export. | P0 |
| F-AD-014 | Audit log | Admin | Search and before/after. | P0 |
| F-AD-015 | Search keyword mapping tool | Admin | Keyword + synonyms (Hindi/Hinglish) to categories, subcategories, tags; results preview. | P0 |
| F-AD-016 | Permission-aware UI | Admin | Sections without permission show 'You don't have permission' state. | P0 |

## SA - Super admin

Depends on: X14 audit

| ID | Feature | Roles | Description | Pri |
|---|---|---|---|---|
| F-SA-001 | Super admin overview with chart | Super admin | KPIs and Graph chart with shared metric/date-range/city filters, accessible table, skeleton, empty and error states; Candle/OHLC removed per G-18. | P0 |
| F-SA-002 | Admins and areas | Super admin | Collapsible cards, search, filters (city, area/zone, role, status) with chips, count, clear all; activate/deactivate with impact confirmation; area assignment; per-admin permission matrix. | P0 |
| F-SA-003 | Roles and permissions | Super admin | Create, edit with unsaved indicator and before/after summary, duplicate, delete blocked with reassign picker, system roles locked. | P0 |
| F-SA-004 | Cities and zones | Super admin | City cards (Enabled/Disabled/Coming soon), enable/disable confirm, add city, city detail with polygon editor, zones with fee slabs, assigned admins, empty state. | P0 |
| F-SA-005 | Global settings | Super admin | Branding, delivery slabs, rider earning, commission, plans, promotion fees, payments, refund window, review rules, integrations, SEO defaults, feature flags, legal pages. | P0 |
| F-SA-006 | Platform analytics | Super admin | GMV, orders, AOV, repeat customers, orders by category, delivery vs pickup, top vendors. | P0 |
| F-SA-007 | Activity monitor | Super admin | Audit trail with filters, before/after diff, export. | P0 |
| F-SA-008 | Main-category management and tree | Super admin | Only super admin edits main categories; category tree with keyword/synonym mapping. | P0 |
