# 04 — Business Rules

**Purpose:** Every product invariant (BR-01..BR-22), plus the formulas and defaults that back them, in one place.
**Audience:** Everyone implementing or reviewing a feature — this is what `architect` checks in code-review mode on every PR.
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [03-feature-catalog.md](./03-feature-catalog.md) (Rules column) · [05-domain-model.md](./05-domain-model.md) · [13-traceability-matrix.md](./13-traceability-matrix.md) · [`security.instructions.md`](../../.github/instructions/security.instructions.md)
**Last updated:** 2026-11-09
**Owner:** Product

> **Note on IDs:** this file is the canonical, renumbered successor to
> the "17 invariants" previously stated directly in `docs/PROJECT.md`.
> Any code comment or doc still saying "invariant N" means the Nth rule
> in that old list; use the mapping below once, then use `BR-xx` going
> forward. Old invariants 1-17 map to BR-01..BR-17 in the same order;
> BR-18..BR-22 are newly made explicit here (they were already implied
> by features X8, RL7, OR6, OR7, CK9 but not previously stated as
> standalone rules).

## Rules

| ID | Rule | Why | Enforced where | Related features |
|---|---|---|---|---|
| BR-01 | Money is integer paise; INR; Indian digit grouping; the **server** computes prices, fees, discounts and totals. | Prevents float rounding errors and client-side price tampering. | BE: `cart-checkout`, `orders`, `payments` (`domain-commerce.instructions.md`) | CK1, CK8, CK9, PD3 |
| BR-02 | Timestamps stored in **UTC**, shown in **IST 12-hour**. | Single source of truth across services; correct local display. | BE: all modules; FE: `packages/shared` formatters | X13, OR2, RD6 |
| BR-03 | One checkout creates **one order per shop**, each with its own status, mode, payment record and OTP/pickup code. | Vendors fulfil independently; a problem at one shop doesn't block another. | BE: `cart-checkout`, `orders` | CK2, CK8, OR1 |
| BR-04 | Order status changes only through the **state machine**; stock never oversells. | Prevents invalid transitions and overselling. | BE: `orders`, `products` | OR2, VD9 |
| BR-05 | Delivery OTP and pickup code are verified **server-side only**, with attempt limits, and are never returned to rider/vendor APIs. | Prevents handover fraud. | BE: `delivery`, `orders` | OR3, OR4, RD4 |
| BR-06 | Only **approved** vendors/providers/riders can sell, accept orders or go online. | Keeps unapproved/suspended parties off the marketplace. | BE: `users`, `businesses`, `delivery` | AD2, VD1, PV1, RD1 |
| BR-07 | Main categories are managed only by **Super Admin**; subcategory suggestions need admin approval and duplicate detection. | Keeps the taxonomy consistent across the platform. | BE: `catalog` | SA8, AD6, VD6 |
| BR-08 | Each service has **exactly one** subcategory; a provider can be "expert in" **several**. | Keeps Explore/Search filtering unambiguous per service while letting providers advertise breadth. | BE: `catalog`, `services` | SV8, PF5, PV2 |
| BR-09 | Reviews only from verified purchasers or enquirers; unsafe content goes to moderation. | Trust and spam/abuse prevention. | BE: `reviews` | RV2, RV6 |
| BR-10 | Videos are public only when **approved**; reports go to the moderation queue; removed/rejected content shows "unavailable". | Content safety. | BE: `media-videos` | RL10, AD10 |
| BR-11 | Location is optional; WhatsApp/marketing only with recorded **consent**; opt-outs honoured; campaigns show consent-aware counts. | Privacy and DPDP compliance. | BE: `communications`, `users` | X8, AD12, NT2 |
| BR-12 | Admins act only within assigned cities/areas and module permissions; every sensitive/admin action is **audit-logged** with before/after. | Scoped access control and accountability. | BE: `admin`, `audit` | AD16, SA2, SA7 |
| BR-13 | A role cannot be deleted while admins use it; **system roles** cannot be deleted. | Prevents accidental lockout. | BE: `admin` | SA3 |
| BR-14 | **DPDP** principles: minimise, consent, export and delete on request; KYC/ID documents visible only to authorised admins. | Legal/privacy compliance. | BE: `users`, `admin` | AC5, AU8, RD1 |
| BR-15 | Explore filter state lives in a **shareable URL**; Explore and Search keep **separate** filter state. | Shareable links; no cross-contamination between screens. | FE: `search` feature area | EX8, EX9, SR10 |
| BR-16 | Media added to a product/service appears in the business Gallery/Reels only if the vendor allows it (**per-item toggle with a default**). | Vendor control over public gallery content. | BE: `media-videos`, `businesses` | VD12, VD13 |
| BR-17 | An offer applies only while **active and not expired**; expired and out-of-stock offers show clear states. | Prevents stale discounts; clear UX. | BE: `offers` | OF3, PD4 |
| BR-18 | A service's subcategory drives Explore/Search filters and counts. | Keeps filter counts accurate and meaningful. | BE: `search`, `catalog` | EX6, SR7 |
| BR-19 | Coupon discount is distributed **proportionally** across the shop orders it applies to. | Fair, auditable per-shop accounting (ties to BR-03). | BE: `cart-checkout` | CK9 |
| BR-20 | Customer cancellation or refund request **notifies both admin and vendor**. | Keeps all parties informed; consistent support experience. | BE: `orders`, `notifications` | OR6 |
| BR-21 | Guest actions that need login (bookmark, order, review, like, follow, comment) prompt login and **return to the same place**. | Minimises friction and lost context for first-time users. | FE: all guest-gated features | AU6, RL7 |
| BR-22 | The UI never relies on colour alone for status (**icon + text + colour**). | WCAG 2.2 AA; colour-blind-safe. | FE: `packages/ui` | X4, 08-design-system.md status colours |

## Formulas and defaults *(sample/default, confirm)*

- **Delivery fee** (ApnaTown-rider delivery, by distance slab): up to
  2 km ₹20; up to 4 km ₹35; up to 7 km ₹50 (beyond the last slab uses
  the last fee unless outside the delivery radius). A shop's own
  delivery uses the shop's flat fee. Each shop has a delivery radius
  and minimum order.
- **Rider earning** per ride = base ₹20 + ₹7 per km (rounded to the
  nearest rupee).
- **Platform fee** ₹5 per order. **Default commission** 6%. **Plans:**
  Basic ₹0/month (6%), Growth ₹499/month (4%), Pro ₹999/month (3%).
  **Promotions:** Featured listing (7 days) ₹199; Homepage banner
  (7 days) ₹699.
- **Coupons** (sample): `APNA50` flat ₹50 off above ₹299; `WELCOME10`
  10% off up to ₹100.
- **Refund request window:** 24 hours after delivery. **Login OTP:**
  6 digits, resend 30s. **Delivery OTP and pickup code:** 4 digits.
  **Rider request countdown:** 60s. **Search radius default:** 6 km
  (1-12 km slider).
- **Feature flags (default):** reviews on, guest browsing on, WhatsApp
  on, booking OFF, donations OFF. **Payment toggles:** online on,
  COD on.
- **GST** shown as included in item prices; invoice is a printable tax
  invoice.

See [11-config-settings-integrations.md](./11-config-settings-integrations.md)
for where these defaults are configured (admin-editable vs
deploy-time), and
[12-decisions-assumptions-open-questions.md](./12-decisions-assumptions-open-questions.md)
Q-11 for the open question on exact per-city delivery fee slabs.
