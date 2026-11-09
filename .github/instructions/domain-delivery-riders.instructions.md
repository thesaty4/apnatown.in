---
applyTo: "apps/api/src/modules/delivery/**,apps/api/src/modules/orders/**,apps/web/src/features/rider/**"
---

# Domain: Delivery and riders

Builds on `backend.instructions.md`/`frontend.instructions.md`.
Rules: `docs/project/04-business-rules.md` (BR-01, BR-05, BR-06).
Journeys J1, J7: `docs/project/06-user-journeys.md`. Applies to the
`delivery` module, the delivery parts
of `orders`, and the rider PWA (`apps/web/src/features/rider`).

## Delivery modes and fee slabs (CK3, SA4)

- Delivery fee is computed server-side from the destination's zone fee
  slab (`geo` module, polygon + slabs — `domain-accounts-admin...`);
  never trust a client-supplied fee.
- Self-pickup skips delivery-job creation entirely.

## Rider earning (RD6, SA5)

- Earning = per-ride base + per-km rate, from the current global
  settings (`settings` module); computed and stored at job completion
  time (not recomputed later if settings change), so historical
  earnings stay stable.
- Daily/weekly earnings and payout status are derived views over
  completed jobs, not a separately-edited ledger.

## Delivery job lifecycle (RD3-RD4)

- States: `requested -> accepted -> reached_shop -> picked_up ->
  reached_drop -> delivered`, or `failed`/`cancelled` with a reason from
  any active state.
- A delivery request to a rider includes pickup, drop, distance, and
  estimated earning, with a **countdown** to accept/reject; on timeout
  it is reassigned/requeued, never left pending indefinitely.
- Only an **approved** rider can go online or accept jobs (BR-06);
  `online/offline` toggle checks approval status server-side on
  every state change, not just at login.

## OTP / pickup code verification (BR-05)

- Delivery OTP (customer-held) and pickup code (customer-held, for
  self-pickup) are generated server-side when the job/order reaches the
  relevant state and verified **server-side only**, with attempt limits
  and lockout — the rider app never accepts/validates the code
  client-side.
- A `delivered`/`picked_up` transition is blocked until the correct
  code is verified; cash collection (COD) is confirmed as a separate
  explicit rider action, not implied by delivery.

## Masked calls and live tracking

- Rider <-> customer calling uses a masked/proxy number
  (`integrations.instructions.md`); raw phone numbers are never
  exposed to the other party in the UI or API response.
- Live tracking (OR3, AD8) exposes rider name, phone (masked), rating,
  status, and ETA — ETA is a best-effort estimate, recomputed
  periodically, not a one-time value.

## Failure handling

- `failed`/`cancel` requires a reason, visible to admin (AD7/AD8) and
  the customer (OR8); a failed delivery triggers the same
  refund/dispute flow as `domain-commerce.instructions.md`.

## Rider PWA constraints (RD, X15)

- Works offline-tolerant for brief connectivity gaps (queue/retry
  state-changing actions); optimized for mid-range Android, data-saver
  aware; installable PWA, not a thin wrapper that requires constant
  connectivity for the active-delivery screen.
