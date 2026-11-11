# 02 — Users, Roles, Permissions

**Purpose:** The six roles, their approval states, and what each can do.
**Audience:** Product, backend/frontend engineers, AI agents (especially `developer-backend`, `security-auditor`).
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [04-business-rules.md](./04-business-rules.md) (BR-06, BR-12, BR-13) · [05-domain-model.md](./05-domain-model.md) (ST-approval) · [03-feature-catalog.md](./03-feature-catalog.md)
**Last updated:** 2026-11-09
**Owner:** Product

## 1. Roles

| ID | Role | Summary |
|---|---|---|
| R-01 | `customer` | Browses, orders, enquires, reviews, follows |
| R-02 | `vendor` | Shop owner: products, orders, offers |
| R-03 | `provider` | Service provider: services, enquiries |
| R-04 | `rider` | Delivery partner |
| R-05 | `admin` | City/area-scoped platform operator |
| R-06 | `super_admin` | Platform-wide owner (categories, cities, roles, settings) |

## 2. Approval states (vendor, provider, rider applications)

States: `pending`, `approved`, `rejected`, `suspended`, `inactive`,
`changes_requested` (ST-approval, see
[05-domain-model.md](./05-domain-model.md)).

| State | Capabilities |
|---|---|
| `pending` | Can edit profile only |
| `approved` | Full access |
| `rejected` | Sees reason; can re-submit |
| `suspended` | No selling, no edits; must contact support |
| `inactive` | Can reactivate |
| `changes_requested` | Sees requested changes; re-submit |

**BR-06:** a non-approved account cannot sell, accept orders, or go
online.

## 3. R-01 Customer

- Browse as guest; location never mandatory.
- Login (mobile OTP) required to: order, bookmark, review, like,
  follow, comment (BR-21 — returns to the same place after login).
- Can enquire (name + phone) and message via WhatsApp/call without an
  account beyond the enquiry form itself.

## 4. R-02 Vendor (shop)

Manages: profile, products, services (if applicable), offers, orders,
inventory, reviews, media/videos, followers, QR, earnings/plan. Sees
only own data. Staff access (orders only) is a list placeholder — see
VD18 in [03-feature-catalog.md](./03-feature-catalog.md).

## 5. R-03 Provider (service provider)

Manages services — **one subcategory each** (BR-08) — lists the
subcategories they are "expert in", enquiries inbox, media, analytics.
Can also list products and handle orders (PV5).

## 6. R-04 Rider

Mobile-first PWA: online/offline toggle, delivery requests with a
countdown, active-delivery flow with customer OTP, earnings, history.
See RD1-RD8 in [03-feature-catalog.md](./03-feature-catalog.md).

## 7. R-05 Admin

Scoped to **assigned cities/areas** and a **per-module permission
matrix** (view/edit; some modules also support create/delete/export).
Cannot manage main categories, cities/zones, roles/permissions, other
admins, or global settings — those are `super_admin`-only (BR-07).
Every sensitive action is audit-logged with before/after (BR-12).

## 8. R-06 Super admin

Everything an admin can do, plus: main category management, cities and
zones, roles and permissions, admin accounts, and global settings
(SA1-SA8 in [03-feature-catalog.md](./03-feature-catalog.md)).

## 9. Navigation by role

Each role has its own primary navigation and route namespace — see
[07-screens-routes-sitemap.md](./07-screens-routes-sitemap.md) for the
full route list (`/vendor/...`, `/provider/...`, `/rider/...`,
`/admin/...`, `/super-admin/...`).
