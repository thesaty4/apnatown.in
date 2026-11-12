# 02 Screen inventory

- **Purpose:** Every screen with route, role, purpose, data, components, actions and states.
- **Audience:** Copilot agents and developers
- **Related:** 01-feature-inventory.md, 06-component-catalogue.md, screenshots/
- **Last updated:** 2026-11-10
- **Source:** extracted from the finished ApnaTown design (interactive prototype and its source code)

**Total screens: 105.** Prototype hash routes are shown for reference; **build the production routes**. Reference screenshots: `screenshots/<m|d>-<role>-<view>.jpg` (m = 390px mobile, d = 1280px desktop). The runnable prototype is `reference/apnatown-prototype.html` (open in a browser; the Demo button switches role, language, theme and simulated states).

Standard states for every screen: default; loading (skeleton); empty; error (retry); no-permission; offline. 'Special states' below are in addition.

## Customer screens

| Screen ID | Name | Production route | Prototype route | Purpose, data, components, actions | Special states | Features | Screenshot |
|---|---|---|---|---|---|---|---|
| S-CUST-01 | Home | `/` | `#home` | Sticky header (location, search, bell, cart, play); hero carousel; Shop by category tiles; Local services tiles; offers; nearby shops grid; featured/popular businesses; featured products; popular providers; promotions; recently viewed; bookmarks; footer. | outside service area banner; location denied | F-HM-001, F-HM-002, F-HM-003, F-HM-004, F-HM-005, F-HM-006, F-HM-007, F-HM-008, F-HM-009, F-HM-010, F-HM-011, F-HM-012 ... | `d-customer-home.jpg`, `m-customer-home.jpg` |
| S-CUST-02 | Explore | `/explore?tab=&category=&subcategory=` | `#explore` | Tabs Products/Shops/Services with counts; category pill; per-tab filters (sheet/sidebar/tablet bar); services subcategory multi-select; chips; map/list toggle; sort. | empty per tab with Clear category; loading skeleton while counts update | F-EX-001, F-EX-002, F-EX-003, F-EX-004, F-EX-005, F-EX-006, F-EX-007, F-EX-008, F-EX-009, F-EX-010, F-EX-011, F-EX-012 ... | `d-customer-explore.jpg`, `m-customer-explore.jpg` |
| S-CUST-03 | Search | `/search?q=` | `#search` | Search bar with grouped autocomplete, recent/popular chips; tabs All/Products/Shops/Services/Videos; grouped sections with See all; per-tab filters; sort. | no results with related categories | F-SR-001, F-SR-002, F-SR-003, F-SR-004, F-SR-005, F-SR-006, F-SR-007, F-SR-008, F-SR-009, F-SR-010, F-EX-012 | `d-customer-search.jpg`, `m-customer-search.jpg` |
| S-CUST-04 | Services home | `/services` | `#services` | Service categories grid and featured providers; entry to Explore Services. | empty | F-HM-004, F-SV-001 | `d-customer-services.jpg`, `m-customer-services.jpg` |
| S-CUST-05 | Category page | `/category/:slug` | `#cat-:id` | Product category: products and shops; service category: service filter component (fixed category) and 'Explore Services' CTA. | empty; no subcategory match | F-HM-003, F-HM-004, F-EX-012, F-X-010 | `d-customer-cat-grocery.jpg`, `d-customer-cat-wedding.jpg`, `m-customer-cat-grocery.jpg`, `m-customer-cat-wedding.jpg` |
| S-CUST-06 | Shop profile | `/shop/:slug` | `#biz-:id` | Unified profile: header, action bar, tabs About/Products & Services/Offers/Gallery/Videos/Reels/Reviews/Contact; sticky category pills; segmented Products/Services; follow. | listing not live; closed; outside delivery range; no services yet | F-PF-001, F-PF-002, F-PF-003, F-PF-004, F-PF-005, F-PF-006, F-PF-007, F-PF-008, F-PF-009, F-PF-010, F-PF-011, F-PF-012 ... | `d-customer-biz-b1.jpg`, `d-customer-biz-b3.jpg`, `d-customer-biz-b4.jpg`, `d-customer-biz-b5.jpg` |
| S-CUST-07 | Service provider profile | `/provider/:slug` | `#svc-:id` | Same unified profile layout for providers with expert-in subcategories and services section. | listing not live; no services | F-PF-001, F-PF-002, F-PF-003, F-PF-004, F-PF-005, F-PF-006, F-PF-007, F-PF-008, F-PF-009, F-PF-010, F-PF-011, F-PF-012 ... | `d-customer-svc-s1.jpg`, `d-customer-svc-s3.jpg`, `d-customer-svc-s5.jpg`, `m-customer-svc-s1.jpg` |
| S-CUST-08 | Product details | `/product/:slug` | `#prod-:id` | Breadcrumbs; media carousel + viewer; price, variants, stock; offer banner; Add to cart/Buy now; seller card; specs; Videos & Reels section; reviews; related. | out of stock + notify-me; offer expired; offer out of stock; unavailable | F-PD-001, F-PD-002, F-PD-003, F-PD-004, F-PD-005, F-PD-006, F-PD-007, F-PD-008, F-PD-009, F-OF-002, F-OF-003, F-RL-010 ... | `d-customer-prod-p1.jpg`, `d-customer-prod-p45.jpg`, `d-customer-prod-p46.jpg`, `d-customer-prod-p50.jpg` |
| S-CUST-09 | Service details | `/service/:slug` | `#service-:id` | Breadcrumbs Services>Category>Subcategory>Service; carousel; price type/unit; included/excluded; area; hours; provider card with follow; reference videos; previous work; Send Enquiry; offers; reviews; FAQs; related. | enquiry success; no videos; service paused | F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, F-SV-008, F-LC-003, F-X-010, F-RV-005 | `d-customer-service-b4-sv2.jpg`, `d-customer-service-s11-sv1.jpg`, `d-customer-service-s7-sv0.jpg`, `m-customer-service-b4-sv2.jpg` |
| S-CUST-10 | Cart | `/cart` | `#cart` | Lines grouped by business; stepper; save for later; coupon; breakdown; split-order notice; proceed to checkout. | empty cart; below minimum order; out of range | F-CK-001, F-CK-002, F-CK-003, F-CK-005, F-CK-009 | `d-customer-cart.jpg`, `m-customer-cart.jpg` |
| S-CUST-11 | Checkout | `/checkout` | `#checkout` | Per-shop delivery/pickup choice; address selection with map pin; payment methods; place order; payment failure/retry; success with per-shop order ids. | payment failed; out of delivery range; login required | F-CK-002, F-CK-003, F-CK-004, F-CK-005, F-CK-006, F-CK-007, F-CK-008, F-AU-006 | `d-customer-checkout.jpg`, `m-customer-checkout.jpg` |
| S-CUST-12 | Order placed | `/checkout/success` | `#done` | Per-shop order ids, summary, track links. | - | F-CK-008 | `d-customer-done.jpg`, `m-customer-done.jpg` |
| S-CUST-13 | My orders | `/orders` | `#orders` | Filters active/completed/cancelled; order cards. | empty; login required | F-OR-001 | `d-customer-orders.jpg`, `m-customer-orders.jpg` |
| S-CUST-14 | Order detail and tracking | `/orders/:id` | `#order-:id` | Timeline (delivery or pickup), rider card, delivery OTP or pickup code, items, amounts, actions (cancel, refund, problem, contact, reorder, invoice), refund tracker, dispute status. | cancelled; refunded; partial fulfilment; failed delivery | F-OR-001, F-OR-002, F-OR-003, F-OR-004, F-OR-005, F-OR-006, F-OR-007, F-OR-008 | `d-customer-order-AT10177.jpg`, `d-customer-order-AT10198.jpg`, `d-customer-order-AT10231.jpg`, `d-customer-order-AT10232.jpg` |
| S-CUST-15 | Cancel / refund request | `/orders/:id/refund` | `#refund-:id` | Reason picker; notice that admin and vendor are notified; submit. | window closed (24h) | F-OR-006 | `d-customer-refund.jpg`, `m-customer-refund.jpg` |
| S-CUST-16 | Invoice | `/orders/:id/invoice` | `#invoice-:id` | Printable tax invoice. | - | F-X-011, F-OR-005 | `d-customer-invoice-AT10198.jpg`, `m-customer-invoice-AT10198.jpg` |
| S-CUST-17 | My reviews | `/my-reviews` | `#reviews` | List, edit, delete. | empty | F-RV-004 | `d-customer-reviews.jpg`, `m-customer-reviews.jpg` |
| S-CUST-18 | Write a review | `/reviews/new?target=` | `#rev-:id` | Star rating, text, photos, tags by target type; eligibility check. | not eligible | F-RV-001, F-RV-002, F-RV-003 | `d-customer-rev-b1.jpg`, `d-customer-rev-p1.jpg`, `d-customer-rev-s5.jpg`, `m-customer-rev-b1.jpg` |
| S-CUST-19 | Saved | `/saved` | `#bookmarks` | Tabs Shops/Services/Photos & Videos with filters and remove. | empty; guest login prompt | F-EG-001, F-EG-002, F-EG-007 | `d-customer-bookmarks.jpg`, `m-customer-bookmarks.jpg` |
| S-CUST-20 | Offers | `/offers` | `#offers` | Offer list with filters; card opens target by offer deep link. | empty; expired | F-OF-001, F-OF-002, F-OF-003, F-OF-004 | `d-customer-offers.jpg`, `m-customer-offers.jpg` |
| S-CUST-21 | Videos / Reels feed | `/videos, /videos/:id` | `#videos(-:id)` | Full-screen vertical feed; pills; overlay actions; linked strip; Shop this video; side panel on desktop. | empty Following; no nearby; skeleton; failed+retry; offline; removed; data-saver | F-RL-001, F-RL-002, F-RL-003, F-RL-004, F-RL-005, F-RL-006, F-RL-007, F-RL-008, F-RL-009, F-RL-010, F-EG-003, F-EG-004 ... | `d-customer-videos-m13.jpg`, `d-customer-videos-m5.jpg`, `d-customer-videos-m99.jpg`, `d-customer-videos.jpg` |
| S-CUST-22 | Notifications | `/notifications` | `#notifications` | Read/unread list; per-role feed. | empty | F-NT-001, F-X-012 | `d-customer-notifications.jpg`, `m-customer-notifications.jpg` |
| S-CUST-23 | Notification preferences | `/account/preferences` | `#prefs` | Channel toggles with consent text; unsubscribe. | - | F-NT-002, F-X-008 | `d-customer-prefs.jpg`, `m-customer-prefs.jpg` |
| S-CUST-24 | Account | `/account` | `#account` | Menu to profile, addresses, payment methods, preferences, language/theme, privacy, help, logout. | guest | F-AC-001, F-AC-002, F-AC-003, F-AC-004, F-AC-005, F-AC-006 | `d-customer-account.jpg`, `m-customer-account.jpg` |
| S-CUST-25 | Profile | `/account/profile` | `#profile` | Edit name, email. | - | F-AC-001, F-AU-005 | `d-customer-profile.jpg`, `m-customer-profile.jpg` |
| S-CUST-26 | Addresses | `/account/addresses` | `#addresses` | Add/edit/delete with map pin, landmark, PIN, label, default. | empty | F-CK-004, F-AC-001 | `d-customer-addresses.jpg`, `m-customer-addresses.jpg` |
| S-CUST-27 | Login | `/login` | `#login` | Phone, 6-box OTP, resend timer, errors, optional email/Google. | wrong OTP; locked; resend wait | F-AU-004 | `d-customer-login.jpg`, `m-customer-login.jpg` |
| S-CUST-28 | Session expired | `/session-expired` | `#session` | Re-login returning to origin. | - | F-AU-007, F-X-009 | `d-customer-session.jpg`, `m-customer-session.jpg` |
| S-CUST-29 | Account deleted | `/goodbye` | `#bye` | Confirmation after deletion. | - | F-AU-008, F-X-009 | `d-customer-bye.jpg`, `m-customer-bye.jpg` |
| S-CUST-30 | Help and support | `/help` | `#help` | FAQs, call, WhatsApp, message. | - | F-AC-005 | `d-customer-help.jpg`, `m-customer-help.jpg` |
| S-CUST-31 | About us | `/about` | `#about` | Brand story. | - | F-AC-006 | `d-customer-about.jpg`, `m-customer-about.jpg` |
| S-CUST-32 | Terms | `/terms` | `#terms` | Legal text. | - | F-AC-006 | `d-customer-terms.jpg`, `m-customer-terms.jpg` |
| S-CUST-33 | Privacy policy | `/privacy` | `#privacy` | Legal text; DPDP rights. | - | F-AC-006, F-AC-004 | `d-customer-privacy.jpg`, `m-customer-privacy.jpg` |
| S-CUST-34 | Not found | `/404` | `#nf` | Friendly 404 with search/home actions. | - | F-X-009 | `d-customer-nf.jpg`, `m-customer-nf.jpg` |
| S-CUST-35 | Server error | `/500` | `#err500` | 'We hit a snag' with retry. | - | F-X-009 | `d-customer-err500.jpg`, `m-customer-err500.jpg` |
| S-CUST-36 | Offline | `/offline` | `#offline` | Offline page with retry. | - | F-X-005, F-X-009 | `d-customer-offline.jpg`, `m-customer-offline.jpg` |
| S-CUST-37 | Maintenance | `/maintenance` | `#maintenance` | Planned downtime page. | - | F-X-009 | `d-customer-maintenance.jpg`, `m-customer-maintenance.jpg` |
| S-CUST-38 | Design system and checklists | `(internal) /design-system` | `#design` | Tokens, components, flows, inventory, update checklists, data model. | - | F-X-001, F-X-002, F-X-003, F-X-004 | `d-customer-design.jpg`, `m-customer-design.jpg` |

## Vendor screens

| Screen ID | Name | Production route | Prototype route | Purpose, data, components, actions | Special states | Features | Screenshot |
|---|---|---|---|---|---|---|---|
| S-VEND-01 | Vendor signup wizard | `/vendor/onboarding` | `#vonboard` | Steps: OTP, business type, basics, location, hours and delivery, documents, review; save draft; approval states. | pending; rejected with reason; suspended; inactive | F-VD-001 | `d-vendor-vonboard.jpg`, `m-vendor-vonboard.jpg` |
| S-VEND-02 | Vendor overview | `/vendor/overview` | `#vhome` | KPIs, charts, low-stock alerts, pending actions. | not approved limited access | F-VD-002 | `d-vendor-vhome.jpg`, `m-vendor-vhome.jpg` |
| S-VEND-03 | Vendor orders | `/vendor/orders` | `#vorders` | Tabs/filters; new-order alert; list. | empty | F-VD-008 | `d-vendor-vorders.jpg`, `m-vendor-vorders.jpg` |
| S-VEND-04 | Vendor order detail | `/vendor/orders/:id` | `#vorder-:id` | Accept/reject with reason, preparing, ready, assign rider or own delivery with OTP, pickup handover with code, print slip, mark item unavailable, refund handling. | cancelled; refund requested | F-VD-008, F-OR-007 | `d-vendor-vorder-AT10231.jpg`, `d-vendor-vorder-AT10236.jpg`, `d-vendor-vorder-AT10240.jpg`, `m-vendor-vorder-AT10231.jpg` |
| S-VEND-05 | Products | `/vendor/products` | `#vproducts` | List, search, filter, bulk actions, CSV import, category pills manager, subcategory suggestion. | empty; import errors | F-VD-004, F-VD-005, F-VD-006 | `d-vendor-vproducts.jpg`, `m-vendor-vproducts.jpg` |
| S-VEND-06 | Product editor | `/vendor/products/:id` | `#vprod-:id` | All product fields, variants, media sorter with embeds, media-consent toggle, shareable link. | validation errors | F-VD-004, F-VD-013 | `d-vendor-vprod-new.jpg`, `d-vendor-vprod-p1.jpg`, `m-vendor-vprod-new.jpg`, `m-vendor-vprod-p1.jpg` |
| S-VEND-07 | Offers | `/vendor/offers` | `#voffers` | Create/edit/pause/end; performance. | pending approval | F-VD-007, F-OF-005 | `d-vendor-voffers.jpg`, `m-vendor-voffers.jpg` |
| S-VEND-08 | Inventory | `/vendor/inventory` | `#vinv` | Stock levels, thresholds, quick toggles, restock, bulk update. | low stock | F-VD-009 | `d-vendor-vinv.jpg`, `m-vendor-vinv.jpg` |
| S-VEND-09 | Reviews | `/vendor/reviews` | `#vreviews` | List, filter, reply, report. | empty | F-VD-010, F-RV-007 | `d-vendor-vreviews.jpg`, `m-vendor-vreviews.jpg` |
| S-VEND-10 | QR and links | `/vendor/qr` | `#vqr` | QR with logo; poster/table-tent/sticker print templates; links; share. | - | F-VD-011, F-X-011 | `d-vendor-vqr.jpg`, `m-vendor-vqr.jpg` |
| S-VEND-11 | Gallery and videos manager | `/vendor/media` | `#vmedia` | Tabs Videos & Reels / Gallery; add video link (file upload disabled); image thumbnail; caption; hashtags; link items; toggles; status; analytics; default consent setting. | pending; rejected with reason; removed | F-VD-012, F-VD-013, F-RL-010 | `d-vendor-vmedia.jpg`, `m-vendor-vmedia.jpg` |
| S-VEND-12 | Business profile editor | `/vendor/profile` | `#vprofile` | All profile fields with live preview. | - | F-VD-003 | `d-vendor-vprofile.jpg`, `m-vendor-vprofile.jpg` |
| S-VEND-13 | Services manager | `/vendor/services` | `#vservices` | List with active toggle; add/edit sheet with one subcategory; copy link; delete. | empty | F-VD-014, F-SV-008 | `d-vendor-vservices.jpg`, `m-vendor-vservices.jpg` |
| S-VEND-14 | Enquiries | `/vendor/enquiries(/:id)` | `#venq(-:id)` | Inbox and detail; statuses; call/WhatsApp reply. | empty | F-VD-016 | `d-vendor-venq-e1.jpg`, `d-vendor-venq.jpg`, `m-vendor-venq-e1.jpg`, `m-vendor-venq.jpg` |
| S-VEND-15 | Followers | `/vendor/followers` | `#vfollow` | Count, growth chart, announce to followers. | - | F-VD-015, F-NT-003 | `d-vendor-vfollow.jpg`, `m-vendor-vfollow.jpg` |
| S-VEND-16 | Earnings and plan | `/vendor/earnings` | `#vearn` | Payout summary, plan/commission, promotions, invoices. | - | F-VD-017 | `d-vendor-vearn.jpg`, `m-vendor-vearn.jpg` |
| S-VEND-17 | Vendor notifications | `/vendor/notifications` | `#vnotif` | Feed. | empty | F-NT-001 | `d-vendor-vnotif.jpg`, `m-vendor-vnotif.jpg` |
| S-VEND-18 | Vendor account | `/vendor/account` | `#vaccount` | Owner, payout, staff list, security, language. | - | F-VD-018 | `d-vendor-vaccount.jpg`, `m-vendor-vaccount.jpg` |

## Service provider screens

| Screen ID | Name | Production route | Prototype route | Purpose, data, components, actions | Special states | Features | Screenshot |
|---|---|---|---|---|---|---|---|
| S-PROV-01 | Provider signup wizard | `/provider/onboarding` | `#sonboard` | Same as vendor with service area and expert-in. | pending; rejected; suspended | F-PV-001 | `d-provider-sonboard.jpg`, `m-provider-sonboard.jpg` |
| S-PROV-02 | Provider overview | `/provider/overview` | `#shome` | KPIs: views, enquiries, conversion. | - | F-PV-006 | `d-provider-shome.jpg`, `m-provider-shome.jpg` |
| S-PROV-03 | Provider enquiries | `/provider/enquiries(/:id)` | `#senq(-:id)` | Inbox, detail, statuses, reply. | empty | F-PV-004 | `d-provider-senq-e1.jpg`, `d-provider-senq.jpg`, `m-provider-senq-e1.jpg`, `m-provider-senq.jpg` |
| S-PROV-04 | Provider orders | `/provider/orders` | `#sorders` | Orders for provider products. | empty | F-PV-005 | `d-provider-sorders.jpg`, `m-provider-sorders.jpg` |
| S-PROV-05 | Provider order detail | `/provider/orders/:id` | `#sorder-:id` | Same as vendor order detail. | - | F-PV-005 | `d-provider-sorder-AT10231.jpg`, `m-provider-sorder-AT10231.jpg` |
| S-PROV-06 | Provider products | `/provider/products` | `#sproducts` | Same as vendor products. | empty | F-PV-005 | `d-provider-sproducts.jpg`, `m-provider-sproducts.jpg` |
| S-PROV-07 | Provider product editor | `/provider/products/:id` | `#sprod-:id` | Same as vendor editor. | - | F-PV-005 | `d-provider-sprod-new.jpg`, `d-provider-sprod-p48.jpg`, `m-provider-sprod-new.jpg`, `m-provider-sprod-p48.jpg` |
| S-PROV-08 | Provider services manager | `/provider/services` | `#sservices` | Same as vendor services manager. | empty | F-PV-003, F-PV-007 | `d-provider-sservices.jpg`, `m-provider-sservices.jpg` |
| S-PROV-09 | Provider profile editor | `/provider/profile` | `#sprofile` | Profile with expert-in multi-select. | - | F-PV-002 | `d-provider-sprofile.jpg`, `m-provider-sprofile.jpg` |
| S-PROV-10 | Provider reviews | `/provider/reviews` | `#sreviews` | List, reply, report. | empty | F-PV-006 | `d-provider-sreviews.jpg`, `m-provider-sreviews.jpg` |
| S-PROV-11 | Provider followers | `/provider/followers` | `#sfollow` | As vendor followers. | - | F-PV-006 | `d-provider-sfollow.jpg`, `m-provider-sfollow.jpg` |
| S-PROV-12 | Provider media | `/provider/media` | `#smedia` | As vendor media manager. | - | F-PV-006 | `d-provider-smedia.jpg`, `m-provider-smedia.jpg` |
| S-PROV-13 | Provider QR | `/provider/qr` | `#sqr` | QR and share link. | - | F-PV-006 | `d-provider-sqr.jpg`, `m-provider-sqr.jpg` |
| S-PROV-14 | Provider analytics | `/provider/analytics` | `#sanalytics` | Views, enquiries, conversion charts. | empty | F-PV-006 | `d-provider-sanalytics.jpg`, `m-provider-sanalytics.jpg` |
| S-PROV-15 | Provider notifications | `/provider/notifications` | `#snotif` | Feed. | empty | F-NT-001 | `d-provider-snotif.jpg`, `m-provider-snotif.jpg` |
| S-PROV-16 | Provider account | `/provider/account` | `#saccount` | Owner, payout, security, language. | - | F-PV-006 | `d-provider-saccount.jpg`, `m-provider-saccount.jpg` |
| S-PROV-17 | Provider coupons | `/provider/offers` | New shared Coupons tab; no separate prototype screen | Shared coupon manager, provider-owned product coupons and service-targeted enquiry-only coupons. | empty; pending approval; policy unavailable | F-OF-006 | Reuses vendor coupon manager |
| S-PROV-18 | Provider Billing and Premium | `/provider/billing` | New requested screen; reuse subscription components from vendor earnings | Plan status/expiry, configured purchase or renewal, cancel at paid expiry, issued plan invoices. | unavailable; active; cancellation scheduled; expired; pending/failure | F-PV-008 | No prototype screenshot; follows S-VEND-16 components |

## Rider screens

| Screen ID | Name | Production route | Prototype route | Purpose, data, components, actions | Special states | Features | Screenshot |
|---|---|---|---|---|---|---|---|
| S-RIDE-01 | Rider signup | `/rider/onboarding` | `#ronboard` | Profile, selfie, vehicle, licence, ID, RC, bank/UPI, documents; approval states. | pending; rejected; suspended | F-RD-001 | `d-rider-ronboard.jpg`, `m-rider-ronboard.jpg` |
| S-RIDE-02 | Rider home | `/rider/home` | `#rhome` | Online toggle; today's deliveries and earnings. | offline; not approved | F-RD-002, F-X-015 | `d-rider-rhome.jpg`, `m-rider-rhome.jpg` |
| S-RIDE-03 | Delivery requests | `/rider/requests` | `#rreq` | Request card with pickup, drop, distance, earning, 60 s countdown, accept/reject. | no requests; expired | F-RD-003 | `d-rider-rreq.jpg`, `m-rider-rreq.jpg` |
| S-RIDE-04 | Active delivery | `/rider/active` | `#ractive` | Step flow to OTP delivery; failed with reasons; navigation; masked call; COD cash notice. | wrong OTP; failed delivery | F-RD-004 | `d-rider-ractive.jpg`, `m-rider-ractive.jpg` |
| S-RIDE-05 | History | `/rider/history` | `#rhistory` | Filters all/today/week. | empty | F-RD-005 | `d-rider-rhistory.jpg`, `m-rider-rhistory.jpg` |
| S-RIDE-06 | Earnings | `/rider/earnings` | `#rearn` | Per-ride base + per-km, daily/weekly, payout status. | - | F-RD-006 | `d-rider-rearn.jpg`, `m-rider-rearn.jpg` |
| S-RIDE-07 | Feedback | `/rider/feedback` | `#rfeedback` | Ratings and comments. | empty | F-RD-007 | `d-rider-rfeedback.jpg`, `m-rider-rfeedback.jpg` |
| S-RIDE-08 | Rider profile | `/rider/profile` | `#rprofile` | Documents, payout, language, support, dispute report. | - | F-RD-008 | `d-rider-rprofile.jpg`, `m-rider-rprofile.jpg` |

## Admin screens

| Screen ID | Name | Production route | Prototype route | Purpose, data, components, actions | Special states | Features | Screenshot |
|---|---|---|---|---|---|---|---|
| S-ADMN-01 | Admin overview | `/admin/overview` | `#ahome` | KPIs, approvals queue, live orders, alerts. | no permission modules hidden/disabled | F-AD-001, F-AD-016 | `d-admin-ahome.jpg`, `m-admin-ahome.jpg` |
| S-ADMN-02 | Approvals | `/admin/approvals(/:id)` | `#aappr(-:id)` | Business/provider/rider queues; document viewer; approve/reject/request changes; history. | no permission; empty | F-AD-002 | `d-admin-aappr-ap1.jpg`, `d-admin-aappr.jpg`, `m-admin-aappr-ap1.jpg`, `m-admin-aappr.jpg` |
| S-ADMN-03 | Listings | `/admin/listings` | `#alistings` | Create/edit status/details/remove; unpublish products. | no permission | F-AD-003 | `d-admin-alistings.jpg`, `m-admin-alistings.jpg` |
| S-ADMN-04 | Users | `/admin/users` | `#ausers` | Search, profile, order history, suspend/reactivate. | no permission | F-AD-004 | `d-admin-ausers.jpg`, `m-admin-ausers.jpg` |
| S-ADMN-05 | Categories | `/admin/categories` | `#acats` | Fixed main categories (edit only super admin); subcategory tree with types and keywords; filter preview; add subcategory. | no permission | F-AD-005, F-SA-008 | `d-admin-acats.jpg`, `m-admin-acats.jpg` |
| S-ADMN-06 | Subcategory suggestions | `/admin/subcategory-suggestions` | `#asubs` | Queue tabs Pending/Approved/Rejected/Merged; approve, reject with reason, merge with duplicate warning. | empty | F-AD-006 | `d-admin-asubs.jpg`, `m-admin-asubs.jpg` |
| S-ADMN-07 | Orders and disputes | `/admin/orders` | `#aorders` | All orders; case filters. | no permission | F-AD-007 | `d-admin-aorders.jpg`, `m-admin-aorders.jpg` |
| S-ADMN-08 | Case detail | `/admin/orders/:id` | `#aorder-:id` | Workflow open->in review->resolved; notes; refund approval/completion; rider reassign. | resolved | F-AD-007 | `d-admin-aorder-AT10177.jpg`, `d-admin-aorder-AT10231.jpg`, `m-admin-aorder-AT10177.jpg`, `m-admin-aorder-AT10231.jpg` |
| S-ADMN-09 | Live deliveries | `/admin/live` | `#alive` | City combobox; All-cities cluster pins; list; empty state. | empty city | F-AD-008 | `d-admin-alive.jpg`, `m-admin-alive.jpg` |
| S-ADMN-10 | Review moderation | `/admin/reviews` | `#areviews` | Reported/pending/removed; approve/hide/delete. | no permission; empty | F-AD-009, F-RV-006 | `d-admin-areviews.jpg`, `m-admin-areviews.jpg` |
| S-ADMN-11 | Videos and moderation | `/admin/videos` | `#avideos` | Tabs Pending/Approved/Rejected/Removed/Reported/Engagement; approve/reject with reason/remove. | no permission; empty | F-AD-010 | `d-admin-avideos.jpg`, `m-admin-avideos.jpg` |
| S-ADMN-12 | Promotions | `/admin/promotions` | `#apromos` | Banners, featured businesses, offer approvals. | no permission | F-AD-011 | `d-admin-apromos.jpg`, `m-admin-apromos.jpg` |
| S-ADMN-13 | Communications | `/admin/communications` | `#acomms` | Audience combobox; scope; template; channels; consent counts; preview; schedule; review-before-send; delivery report. | no permission; scope not allowed | F-AD-012 | `d-admin-acomms.jpg`, `m-admin-acomms.jpg` |
| S-ADMN-14 | Reports | `/admin/reports` | `#areports` | Orders, revenue, vendor/rider performance, enquiries; CSV export. | no permission | F-AD-013 | `d-admin-areports.jpg`, `m-admin-areports.jpg` |
| S-ADMN-15 | Search keywords | `/admin/keywords` | `#akeys` | List/edit keyword mappings; results preview; add/delete. | no permission | F-AD-015 | `d-admin-akeys.jpg`, `m-admin-akeys.jpg` |
| S-ADMN-16 | Audit log | `/admin/audit` | `#aaudit` | Search; before/after. | no permission | F-AD-014, F-X-014 | `d-admin-aaudit.jpg`, `m-admin-aaudit.jpg` |
| S-ADMN-17 | Admin profile | `/admin/profile` | `#aprofile` | Own details, areas, permissions summary. | - | F-AD-016 | `d-admin-aprofile.jpg`, `m-admin-aprofile.jpg` |

## Super admin screens

| Screen ID | Name | Production route | Prototype route | Purpose, data, components, actions | Special states | Features | Screenshot |
|---|---|---|---|---|---|---|---|
| S-SUPR-01 | Super admin overview | `/super-admin/overview` | `#xhome` | KPIs; Graph chart and accessible table with metric/date/city controls; no Candle view. | chart skeleton/empty/error | F-SA-001 | `d-super-xhome.jpg`, `m-super-xhome.jpg` |
| S-SUPR-02 | Admins and areas | `/super-admin/admins` | `#xadmins` | Collapsible cards; search; filters with chips; activate/deactivate confirm; area assignment; permissions. | no results | F-SA-002 | `d-super-xadmins.jpg`, `m-super-xadmins.jpg` |
| S-SUPR-03 | Roles and permissions | `/super-admin/roles` | `#xroles` | Create/edit/duplicate/delete; unsaved indicator; before/after; reassign picker; system roles locked. | delete blocked | F-SA-003 | `d-super-xroles.jpg`, `m-super-xroles.jpg` |
| S-SUPR-04 | Cities | `/super-admin/cities` | `#xgeo` | City cards; enable/disable confirm; add city. | empty | F-SA-004 | `d-super-xgeo.jpg`, `m-super-xgeo.jpg` |
| S-SUPR-05 | City detail and zones | `/super-admin/cities/:id` | `#xcity-:id` | Polygon editor; zones with fee slabs; assigned admins. | no zones yet | F-SA-004 | `d-super-xcity-kasia.jpg`, `d-super-xcity-padrauna.jpg`, `m-super-xcity-kasia.jpg`, `m-super-xcity-padrauna.jpg` |
| S-SUPR-06 | Global settings | `/super-admin/settings` | `#xsettings` | Branding, slabs, rider earning, commission, plans, promotions, payments, refund window, integrations, SEO, flags, legal. | - | F-SA-005 | `d-super-xsettings.jpg`, `m-super-xsettings.jpg` |
| S-SUPR-07 | Platform analytics | `/super-admin/analytics` | `#xanalytics` | GMV, orders, AOV, repeat customers, by category, delivery vs pickup, top vendors. | empty | F-SA-006 | `d-super-xanalytics.jpg`, `m-super-xanalytics.jpg` |
| S-SUPR-08 | Activity monitor | `/super-admin/activity` | `#xactivity` | Audit trail with filters, diff, export. | empty | F-SA-007, F-X-014 | `d-super-xactivity.jpg`, `m-super-xactivity.jpg` |

### Feature to screen map

| Feature | Screens |
|---|---|
| F-AC-001 | S-CUST-24, S-CUST-25, S-CUST-26 |
| F-AC-002 | S-CUST-24 |
| F-AC-003 | S-CUST-24 |
| F-AC-004 | S-CUST-24, S-CUST-33 |
| F-AC-005 | S-CUST-24, S-CUST-30 |
| F-AC-006 | S-CUST-24, S-CUST-31, S-CUST-32, S-CUST-33 |
| F-AD-001 | S-ADMN-01 |
| F-AD-002 | S-ADMN-02 |
| F-AD-003 | S-ADMN-03 |
| F-AD-004 | S-ADMN-04 |
| F-AD-005 | S-ADMN-05 |
| F-AD-006 | S-ADMN-06 |
| F-AD-007 | S-ADMN-07, S-ADMN-08 |
| F-AD-008 | S-ADMN-09 |
| F-AD-009 | S-ADMN-10 |
| F-AD-010 | S-ADMN-11 |
| F-AD-011 | S-ADMN-12 |
| F-AD-012 | S-ADMN-13 |
| F-AD-013 | S-ADMN-14 |
| F-AD-014 | S-ADMN-16 |
| F-AD-015 | S-ADMN-15 |
| F-AD-016 | S-ADMN-01, S-ADMN-17 |
| F-AU-001 | S-CUST-01 |
| F-AU-002 | S-CUST-01 |
| F-AU-003 | S-CUST-01 |
| F-AU-004 | S-CUST-27 |
| F-AU-005 | S-CUST-25 |
| F-AU-006 | S-CUST-11 |
| F-AU-007 | S-CUST-28 |
| F-AU-008 | S-CUST-29 |
| F-CK-001 | S-CUST-10 |
| F-CK-002 | S-CUST-10, S-CUST-11 |
| F-CK-003 | S-CUST-10, S-CUST-11 |
| F-CK-004 | S-CUST-11, S-CUST-26 |
| F-CK-005 | S-CUST-10, S-CUST-11 |
| F-CK-006 | S-CUST-11 |
| F-CK-007 | S-CUST-11 |
| F-CK-008 | S-CUST-11, S-CUST-12 |
| F-CK-009 | S-CUST-10 |
| F-EG-001 | S-CUST-19 |
| F-EG-002 | S-CUST-19 |
| F-EG-003 | S-CUST-06, S-CUST-21 |
| F-EG-004 | S-CUST-21 |
| F-EG-005 | S-CUST-21 |
| F-EG-006 | S-CUST-21 |
| F-EG-007 | S-CUST-19 |
| F-EX-001 | S-CUST-02 |
| F-EX-002 | S-CUST-02 |
| F-EX-003 | S-CUST-02 |
| F-EX-004 | S-CUST-02 |
| F-EX-005 | S-CUST-02 |
| F-EX-006 | S-CUST-02 |
| F-EX-007 | S-CUST-02 |
| F-EX-008 | S-CUST-02 |
| F-EX-009 | S-CUST-02 |
| F-EX-010 | S-CUST-02 |
| F-EX-011 | S-CUST-02 |
| F-EX-012 | S-CUST-02, S-CUST-03, S-CUST-05 |
| F-HM-001 | S-CUST-01 |
| F-HM-002 | S-CUST-01 |
| F-HM-003 | S-CUST-01, S-CUST-05 |
| F-HM-004 | S-CUST-01, S-CUST-04, S-CUST-05 |
| F-HM-005 | S-CUST-01 |
| F-HM-006 | S-CUST-01 |
| F-HM-007 | S-CUST-01 |
| F-HM-008 | S-CUST-01 |
| F-HM-009 | S-CUST-01 |
| F-HM-010 | S-CUST-01 |
| F-HM-011 | S-CUST-01 |
| F-HM-012 | S-CUST-01 |
| F-HM-013 | S-CUST-01 |
| F-HM-014 | S-CUST-01 |
| F-LC-001 | S-CUST-01 |
| F-LC-002 | S-CUST-02 |
| F-LC-003 | S-CUST-06, S-CUST-07, S-CUST-09 |
| F-LC-004 | S-CUST-02 |
| F-LC-005 | S-CUST-01 |
| F-NT-001 | S-CUST-22, S-VEND-17, S-PROV-15 |
| F-NT-002 | S-CUST-23 |
| F-NT-003 | S-VEND-15 |
| F-OF-001 | S-CUST-20 |
| F-OF-002 | S-CUST-08, S-CUST-20 |
| F-OF-003 | S-CUST-08, S-CUST-20 |
| F-OF-004 | S-CUST-20 |
| F-OF-005 | S-VEND-07 |
| F-OR-001 | S-CUST-13, S-CUST-14 |
| F-OR-002 | S-CUST-14 |
| F-OR-003 | S-CUST-14 |
| F-OR-004 | S-CUST-14 |
| F-OR-005 | S-CUST-14, S-CUST-16 |
| F-OR-006 | S-CUST-14, S-CUST-15 |
| F-OR-007 | S-CUST-14, S-VEND-04 |
| F-OR-008 | S-CUST-14 |
| F-OR-009 | S-CUST-12 |
| F-OF-006 | S-VEND-07, S-PROV-17, S-ADMN-12, S-CUST-09 |
| F-PD-001 | S-CUST-08 |
| F-PD-002 | S-CUST-08 |
| F-PD-003 | S-CUST-08 |
| F-PD-004 | S-CUST-08 |
| F-PD-005 | S-CUST-08 |
| F-PD-006 | S-CUST-06, S-CUST-08 |
| F-PD-007 | S-CUST-08 |
| F-PD-008 | S-CUST-08 |
| F-PD-009 | S-CUST-08 |
| F-PF-001 | S-CUST-06, S-CUST-07 |
| F-PF-002 | S-CUST-06, S-CUST-07 |
| F-PF-003 | S-CUST-06, S-CUST-07 |
| F-PF-004 | S-CUST-06, S-CUST-07 |
| F-PF-005 | S-CUST-06, S-CUST-07 |
| F-PF-006 | S-CUST-06, S-CUST-07 |
| F-PF-007 | S-CUST-06, S-CUST-07 |
| F-PF-008 | S-CUST-06, S-CUST-07 |
| F-PF-009 | S-CUST-06, S-CUST-07 |
| F-PF-010 | S-CUST-06, S-CUST-07 |
| F-PF-011 | S-CUST-06, S-CUST-07 |
| F-PF-012 | S-CUST-06, S-CUST-07 |
| F-PF-013 | S-CUST-06, S-CUST-07 |
| F-PV-001 | S-PROV-01 |
| F-PV-002 | S-PROV-09 |
| F-PV-003 | S-PROV-08 |
| F-PV-004 | S-PROV-03 |
| F-PV-005 | S-PROV-04, S-PROV-05, S-PROV-06, S-PROV-07 |
| F-PV-006 | S-PROV-02, S-PROV-10, S-PROV-11, S-PROV-12, S-PROV-13, S-PROV-14, S-PROV-16 |
| F-PV-007 | S-PROV-08 |
| F-PV-008 | S-PROV-18 |
| F-RD-001 | S-RIDE-01 |
| F-RD-002 | S-RIDE-02 |
| F-RD-003 | S-RIDE-03 |
| F-RD-004 | S-RIDE-04 |
| F-RD-005 | S-RIDE-05 |
| F-RD-006 | S-RIDE-06 |
| F-RD-007 | S-RIDE-07 |
| F-RD-008 | S-RIDE-08 |
| F-RL-001 | S-CUST-21 |
| F-RL-002 | S-CUST-21 |
| F-RL-003 | S-CUST-21 |
| F-RL-004 | S-CUST-21 |
| F-RL-005 | S-CUST-21 |
| F-RL-006 | S-CUST-21 |
| F-RL-007 | S-CUST-21 |
| F-RL-008 | S-CUST-21 |
| F-RL-009 | S-CUST-21 |
| F-RL-010 | S-CUST-08, S-CUST-21, S-VEND-11 |
| F-RV-001 | S-CUST-18 |
| F-RV-002 | S-CUST-18 |
| F-RV-003 | S-CUST-18 |
| F-RV-004 | S-CUST-17 |
| F-RV-005 | S-CUST-06, S-CUST-08, S-CUST-09 |
| F-RV-006 | S-ADMN-10 |
| F-RV-007 | S-VEND-09 |
| F-SA-001 | S-SUPR-01 |
| F-SA-002 | S-SUPR-02 |
| F-SA-003 | S-SUPR-03 |
| F-SA-004 | S-SUPR-04, S-SUPR-05 |
| F-SA-005 | S-SUPR-06 |
| F-SA-006 | S-SUPR-07 |
| F-SA-007 | S-SUPR-08 |
| F-SA-008 | S-ADMN-05 |
| F-SR-001 | S-CUST-03 |
| F-SR-002 | S-CUST-03 |
| F-SR-003 | S-CUST-03 |
| F-SR-004 | S-CUST-03 |
| F-SR-005 | S-CUST-03 |
| F-SR-006 | S-CUST-03 |
| F-SR-007 | S-CUST-03 |
| F-SR-008 | S-CUST-03 |
| F-SR-009 | S-CUST-03 |
| F-SR-010 | S-CUST-03 |
| F-SV-001 | S-CUST-04, S-CUST-09 |
| F-SV-002 | S-CUST-09 |
| F-SV-003 | S-CUST-09 |
| F-SV-004 | S-CUST-09 |
| F-SV-005 | S-CUST-09 |
| F-SV-006 | S-CUST-09 |
| F-SV-007 | S-CUST-09 |
| F-SV-008 | S-CUST-07, S-CUST-09, S-VEND-13 |
| F-VD-001 | S-VEND-01 |
| F-VD-002 | S-VEND-02 |
| F-VD-003 | S-VEND-12 |
| F-VD-004 | S-VEND-05, S-VEND-06 |
| F-VD-005 | S-VEND-05 |
| F-VD-006 | S-VEND-05 |
| F-VD-007 | S-VEND-07 |
| F-VD-008 | S-VEND-03, S-VEND-04 |
| F-VD-009 | S-VEND-08 |
| F-VD-010 | S-VEND-09 |
| F-VD-011 | S-VEND-10 |
| F-VD-012 | S-VEND-11 |
| F-VD-013 | S-VEND-06, S-VEND-11 |
| F-VD-014 | S-VEND-13 |
| F-VD-015 | S-VEND-15 |
| F-VD-016 | S-VEND-14 |
| F-VD-017 | S-VEND-16 |
| F-VD-018 | S-VEND-18 |
| F-X-001 | S-CUST-01, S-CUST-38 |
| F-X-002 | S-CUST-01, S-CUST-38 |
| F-X-003 | S-CUST-01, S-CUST-38 |
| F-X-004 | S-CUST-38 |
| F-X-005 | S-CUST-36 |
| F-X-006 | S-CUST-21 |
| F-X-007 | S-CUST-01 |
| F-X-008 | S-CUST-23 |
| F-X-009 | S-CUST-28, S-CUST-29, S-CUST-34, S-CUST-35, S-CUST-36, S-CUST-37 |
| F-X-010 | S-CUST-05, S-CUST-06, S-CUST-07, S-CUST-08, S-CUST-09 |
| F-X-011 | S-CUST-16, S-VEND-10 |
| F-X-012 | S-CUST-22 |
| F-X-013 | S-CUST-08 |
| F-X-014 | S-ADMN-16, S-SUPR-08 |
| F-X-015 | S-RIDE-02 |
