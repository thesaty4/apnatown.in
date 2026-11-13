# 00 Product summary

- **Purpose:** One-page truth about what ApnaTown is, who uses it, the PRD decisions and the scope.
- **Audience:** Copilot agents and developers
- **Related:** 01-feature-inventory.md, 02-screen-inventory.md, 07-state-machines-and-business-rules.md, 11-open-issues-and-assumptions.md
- **Last updated:** 2026-11-10

## Vision
ApnaTown.in is a **hyperlocal marketplace and local business discovery platform**. Local shops, vendors and service providers create profiles and list products and services. Customers discover them by location, order products (home delivery or self-pickup), send enquiries for services, watch short videos/reels, follow businesses and rate and review everything. **Launch city: Padrauna, Kushinagar, Uttar Pradesh.** The system scales to more cities (Kasia coming soon; Deoria and Gorakhpur planned) through city, area and zone management.

Feel: "my town's bazaar, digitised": warm, trustworthy, simple. Brand: ApnaTown, tagline "Apna Shehar, Apni Dukaan". Users are first-time online shoppers on mid-range Android phones with slow 3G/4G; vendors are often non-technical shopkeepers. Mobile-first (360px), bilingual English + Hindi, light and dark mode, accessible (WCAG 2.2 AA).

## Roles (6)
Customer, Vendor (shop), Service Provider, Rider, Admin (area- and module-scoped), Super Admin. Details: `08-permissions-matrix.md`.

## PRD decisions (authoritative)
1. **Account required to order** (mobile OTP). Guests can browse everything; actions that need login (order, bookmark, review, like, follow, comment) prompt login and return the user to where they were.
2. **Payments:** online (UPI, cards, net banking, wallets) **and** COD / pay-at-pickup.
3. **One checkout is split into one order per business (shop)**; each has its own status, mode, payment record, delivery OTP or pickup code.
4. **Delivery:** by the vendor (own delivery) **or** by an ApnaTown rider, chosen per shop/order. Self-pickup also available. Fees by distance slab.
5. **Services are enquiry-only for now.** Booking, quotation and online payment are future placeholders behind a feature flag (off).
6. **Revenue:** subscription plans + commission + promotion fees (featured listing, homepage banner).
7. **Rider pay per ride by distance:** base amount + per-km amount (admin-configurable).
8. **Padrauna first**, multi-city ready.
9. **Refunds and cancellations notify admin and vendor**; admin resolves disputes.
10. Main categories are fixed and managed only by Super Admin; subcategories are suggested by vendors/providers/admins and approved by admins (duplicate detection, merge).
11. Each service has exactly one subcategory; providers can be "expert in" several.
12. Videos are YouTube/Instagram links, publicly visible only after admin approval; direct video uploads are disabled by the 2026-11-12 user decision.
13. Media added to a product/service appears in the business Gallery/Reels only if the vendor allows it.
14. Location is never mandatory; WhatsApp messaging only with recorded opt-in consent.

## Scope and phases
- **Phase 1 (launch, P0):** discovery (Home, Explore, Search, profiles, product, service pages), cart/checkout/orders/tracking, vendor + provider dashboards, rider app, admin + super admin, notifications, reels with moderation, EN/HI, SEO foundation.
- **Phase 2 (P1):** richer analytics, advanced promotions, staff roles for vendors, saved payment methods.
- **Phase 3 (P2):** service booking/quotation/payment, wallet, loyalty, more cities.
- **Out of scope now:** donations (flag off), direct video upload/hosting (link-only launch confirmed).

Public images use Cloudinary; maps use Leaflet/OSM with Geoman Free. Private
documents stay separate. See the [integration contract](../../specs/_foundation/media-and-maps.md)
for security, configuration, free-service limits and remaining operational gates.

## Numbers at a glance (from the design)
206 features in 22 areas; 105 screens (customer 38, vendor 18, provider 16, rider 8, admin 17, super admin 8); 6 roles; 10 product categories; 7 service categories (29 seeded subcategories); 16 status models; 22 business rules.
