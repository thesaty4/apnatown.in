# 01 — Product Overview

**Purpose:** What ApnaTown is, who it's for, and the design principles every feature must follow.
**Audience:** Everyone (product, design, engineering, AI agents).
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [02-users-roles-permissions.md](./02-users-roles-permissions.md) · [03-feature-catalog.md](./03-feature-catalog.md) · [08-design-system.md](./08-design-system.md)
**Last updated:** 2026-11-09
**Owner:** Product

## 1. What ApnaTown is

A **hyperlocal marketplace and local business discovery platform**. Shops,
vendors and service providers create profiles and list **products** and
**services**. Customers discover them by location, order products (**home
delivery or self-pickup**), send enquiries for services, watch short
**videos/reels**, follow businesses, and rate and review everything.

**Launch city:** Padrauna, Kushinagar, Uttar Pradesh, India. The system
must scale to more cities — city, area and zone management is a
first-class feature (see [SA4](./03-feature-catalog.md#sa-super-admin)).

## 2. Audience and feel

- **Audience:** first-time online shoppers on mid-range Android phones
  with slow 3G/4G; vendors are often non-technical shopkeepers.
- **Feel:** "my town's bazaar, digitised" — warm, trustworthy, local,
  simple.
- **Tagline options** *(sample/default, confirm)*: "Apna Shehar, Apni
  Dukaan", "Padrauna ka apna bazaar".

## 3. Design principles

- Mobile-first (360px base) with tablet/desktop layouts; very low
  learning curve — big touch targets (min 48px), clear icons with
  labels, minimal typing.
- Bilingual **English + Hindi (Devanagari)** with long-label tolerance
  (see [09-content-i18n-notifications.md](./09-content-i18n-notifications.md)).
- Performance-aware: skeletons, lazy media, pagination with "Load more"
  fallback, data-saver mode.
- Accessible: WCAG 2.2 AA, visible focus, screen-reader labels, status
  never conveyed by colour alone (BR-22,
  [04-business-rules.md](./04-business-rules.md)).
- Light mode primary, dark mode supported.

## 4. India patterns

UPI, COD/pay-at-pickup, WhatsApp, mobile-number OTP login, 6-digit PIN
code, landmark-based addresses, INR with Indian numbering
(`₹1,25,000`), IST 12-hour times.

## 5. Launch data *(sample/default, confirm)*

- **City:** Padrauna.
- **Areas/localities:** Padrauna Chauraha, Bus Stand, Station Road,
  Hata Road, Ramkola Road, Tehsil Road, Collectorate Chauraha.
- **Planned cities:** Kasia (Kushinagar) "coming soon"; Deoria and
  Gorakhpur planned.
- Sample shops/providers/riders: see
  [11-config-settings-integrations.md](./11-config-settings-integrations.md).

## 6. Categories *(fixed lists — see BR-07, super_admin only)*

**Product categories (10, fixed, Super Admin only):** Grocery, Medical,
Electronics, Mobile, Food & Sweets, Clothing, Hardware, Stationery,
Furniture, Jewellery.

**Service categories (7, fixed):** Wedding & Events, Home Construction
(shown as "Home Builders" in the prototype), Mechanic & Repair,
Coaching & Education, Electrician, Plumber, Other Services.

**Service subcategories** *(examples; admin-managed; vendor-suggested
— see AD6/VD6)*:

| Category | Example subcategories |
|---|---|
| Wedding & Events | Tent & Lighting, DJ & Sound, Catering, Photography & Video, Decoration, Mehndi & Makeup, Band & Baraat, Invitation Cards, Bridal Wear Rental |
| Home Construction | Mason, Painter, Plumber, Electrician |
| Mechanic & Repair | Two-wheeler, Four-wheeler, AC Repair, AC Installation, Mobile Repair, Appliance Repair |
| Coaching & Education | School Coaching, Spoken English, Computer Classes |
| Electrician | House Wiring, Inverter & Battery, Appliance Repair |
| Plumber | Leakage Repair, Bathroom Fitting, Tank Cleaning |

## 7. Out of scope now / future placeholders

- Booking, quotations and online payment for services (SV5, PV7 —
  enquiry-only for now; see D-05 in
  [12-decisions-assumptions-open-questions.md](./12-decisions-assumptions-open-questions.md)).
- Donations (feature flag off).
- Hosting of uploaded videos beyond link-based (decide later — Q-03).
