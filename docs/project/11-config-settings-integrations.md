# 11 — Config, Settings, Integrations

**Purpose:** Global settings and feature flags, integration ports, and sample seed data for Padrauna.
**Audience:** Backend engineers, `integrations.instructions.md` users, QA (seed data).
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [04-business-rules.md](./04-business-rules.md) (formulas and defaults — not repeated here) · [`integrations.instructions.md`](../../.github/instructions/integrations.instructions.md) · [SA5 in 03-feature-catalog.md](./03-feature-catalog.md)
**Last updated:** 2026-11-09
**Owner:** Engineering

## 1. Global settings (SA5)

Branding, delivery fee slabs, rider earning rule, commission,
subscription plans, promotion fees, payments (online/COD, gateway),
refund and cancellation window, review rules, notification and
WhatsApp/SMS/email integration, SEO defaults, feature flags, legal
pages. **Numeric defaults are the single source of truth in
[04-business-rules.md](./04-business-rules.md) "Formulas and
defaults"** — don't restate them here or elsewhere; link to that
section.

## 2. Feature flags (default)

| Flag | Default |
|---|---|
| Reviews | on |
| Guest browsing | on |
| WhatsApp | on |
| Booking/quotation/payment for services (SV5, PV7) | **off** |
| Donations | **off** |
| Payments: online | on |
| Payments: COD | on |

## 3. Integration ports and responsibilities

Providers stay behind their ports and approved local verification adapters.
Cloudinary public images, YouTube/Instagram link embeds and Leaflet/OSM maps
are selected in the [media/map contract](../../specs/_foundation/media-and-maps.md).
Other provider/operational decisions remain in
[12-decisions-assumptions-open-questions.md](./12-decisions-assumptions-open-questions.md).

| Port | Responsibility | Failure behaviour |
|---|---|---|
| Payment gateway | UPI/cards/net banking/wallets, webhooks | Retry, offer pay-on-delivery (CK7) |
| SMS/OTP | Login OTP delivery | Failover provider, same OTP session |
| WhatsApp Business API | Order updates, admin communications | Falls back to in-app/email notification |
| Email | Transactional email | Best-effort; never the only channel for a critical event |
| Public image storage | Cloudinary behind Media/StoragePort; sanitized authenticated variants, same-origin authorized delivery | Explicit upload failure/retry; retain prior attachment |
| Private storage | KYC, dispute evidence and account exports; separate from Cloudinary | Owning authorization/retention gates; never public fallback |
| Map rendering / tiles | Leaflet + Geoman Free + policy-compliant OSM tiles; Geo/PostGIS owns resolution and fees | List/manual entry stays usable; tile error/retry; no implicit geocoder |
| Video embeds / image processing | YouTube/Instagram typed renderer and Media image sanitization (BR-10); direct video uploads disabled | Canonical Open fallback for valid unavailable sources; invalid URLs rejected |

## 4. Admin-editable vs deploy-time configuration

| Admin-editable (SA5, runtime) | Deploy-time (environment/ops) |
|---|---|
| Fee slabs, commission, plans, promotion fees | Integration credentials (`.env.example`) |
| Feature flags | Database connection |
| Refund/cancellation window, review rules | Hosting/CI configuration |
| SEO defaults, legal page content | Logging/observability backend |

Cloudinary credentials, provider enable switches and validated tile
URL/attribution/zoom settings follow the
[configuration ownership table](../../specs/_foundation/media-and-maps.md#configuration-and-readiness).
Admin UI displays image readiness, never provider secrets or a video-upload
enable switch. Free map libraries do not guarantee free unlimited tile or
Cloudinary capacity; operator quotas, residency and availability are separate gates.

## 5. Sample seed data *(sample data only — never ship as real production data)*

**Padrauna shops:** Shri Ram Kirana Store, Gupta Medical Hall, Singh
Electronics, Raj Mobile Point, Kushinagar Sweets & Namkeen, Maa Durga
Cloth House, Sharma Hardware & Paints, Student Stationery Corner, Shree
Furniture Mart, Lakshmi Jewellers.

**Providers:** Shubh Vivah Events & Tent House, Sai Builders &
Contractors, Ansari Auto Works, Bright Future Coaching, Verma
Electricals, Rajesh Plumbing Service, Cool Care AC Services, Rocket DJ
& Sound, Annapurna Catering, Shiv Tent & Lights, Shree Photo & Video,
Glow Mehndi & Makeup.

**Riders:** Sunil Yadav, Imran Ansari.

**Admins:** sample names only — generate at seed time, never hard-code
real people.
