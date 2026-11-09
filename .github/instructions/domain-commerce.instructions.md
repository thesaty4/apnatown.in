---
applyTo: "apps/api/src/modules/{cart-checkout,orders,payments,offers}/**,apps/web/src/features/{cart,checkout,orders,offers}/**"
---

# Domain: Commerce (cart, checkout, orders, payments, offers)

Builds on `backend.instructions.md`/`frontend.instructions.md`.
Invariants: `docs/PROJECT.md` (1-4, 9, 16). Journeys J1, J3, J7, J8:
`docs/PROJECT.md`.

## Per-shop order split (CK2, invariant 3)

- One checkout creates **one order per shop**; each has its own status,
  mode (delivery/pickup), payment record, and OTP/pickup code.
- `cart-checkout` groups the cart by shop before creating orders; never
  a single multi-shop order record.

## Coupon proportional distribution (CK9)

- A coupon's discount is computed once on the whole cart, then
  distributed across shop-orders **proportionally to each shop's
  subtotal** (not evenly, not all on one shop); the sum of per-order
  discounts equals the total discount exactly (rounding goes to the
  largest-subtotal order, never silently dropped).

## Order state machine (OR2)

- Delivery: `placed -> accepted -> preparing -> ready ->
  out_for_delivery -> delivered`, plus `cancelled`/`refunded` from
  allowed states only.
- Pickup: `placed -> accepted -> ready -> picked_up`, plus
  `cancelled`/`refunded`.
- Transitions are explicit handlers (`solid-dry-design.instructions.md`
  open/closed); invalid transitions throw `InvalidTransitionError`
  (`backend.instructions.md`).
- Stock is decremented only on order creation and restored on
  cancellation before fulfilment; never oversell (invariant 4).

## Refund / cancel / dispute (OR6, OR8, invariant 3)

- Refund tracker: `requested -> approved -> completed`, independent
  from (but linked to) the order status.
- Cancellation always records a reason; customer sees "Admin and vendor
  have been notified and will contact you" (OR6).
- Disputes: `open -> in_review -> resolved`, with notes and optional
  refund approval; visible to the customer (OR8, AD7).
- Partial fulfilment/substitution: vendor marks an item unavailable
  (OR7) — this recomputes the order total and, if paid, triggers a
  partial refund, never a silent total mismatch.

## Payment retry and idempotency (CK7)

- Payment creation/retry uses an idempotency key per checkout attempt;
  a webhook retry must not double-apply a payment or double-create an
  order (`backend.instructions.md`, `integrations.instructions.md`).
- COD/pay-at-pickup orders start payment status `pending`, moving to
  `collected` on handover confirmation, not `paid` at order creation.

## Offer states (OF3, OF5, invariant 16)

- Offer lifecycle: `pending -> active -> paused -> ended`, with admin
  approval required to leave `pending`.
- An offer applies at checkout only while `active` **and** not expired
  **and** (if stock-linked) not out of stock; expired and
  out-of-stock-offer are distinct, clearly labelled UI states, not
  silently hidden.

## Minimum order / delivery range (CK5)

- Checkout validates the shop's minimum order and delivery range before
  allowing delivery mode; out-of-range shows a clear message and
  suggests self-pickup if eligible.

## Paise rounding

- All intermediate money math (discounts, proportional splits, tax) is
  done in integer paise with a single, shared rounding rule
  (`packages/shared`) — never float arithmetic on rupees.
