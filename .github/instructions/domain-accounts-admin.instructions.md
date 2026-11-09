---
applyTo: "apps/api/src/modules/{auth,users,admin,geo,communications,settings,audit}/**,apps/web/src/features/admin/**"
---

# Domain: Accounts and admin

Builds on `backend.instructions.md`/`frontend.instructions.md`/
`security.instructions.md`. Invariants: `docs/PROJECT.md` (6, 10-13).
Journeys J7, J9, J10. Covers `auth`, `users`, `admin`, `geo`,
`communications`, `settings`, `audit`, and the admin frontend.

## OTP login and approval gating (AU4, invariant 6)

- Mobile OTP: 6-box input, auto-advance, paste support, resend timer,
  attempt limits — verification is server-side only
  (`security.instructions.md`).
- Vendor/provider/rider accounts can only sell/accept orders/go online
  when `approved`; every relevant endpoint re-checks current approval
  status server-side, not a cached client flag.

## RBAC matrix and admin scope (invariant 11)

- Permissions are `(role, module, action)` triples; actions include at
  least view/edit, and create/delete/export where applicable
  (AD16/SA3 permission matrix).
- Admins act **only** within their assigned cities/areas; every admin
  endpoint filters by assigned scope server-side — UI hiding alone is
  not sufficient (`security.instructions.md`).
- **System roles are locked** — cannot be edited/deleted (invariant
  12); a custom role **cannot be deleted while any admin is assigned
  to it** — deletion requires a reassign-picker flow first (SA3).

## Cities, zones, fee slabs (SA4)

- A city has zones, each zone a polygon + a delivery-fee slab table;
  `delivery` (see `domain-delivery-riders.instructions.md`) reads fee
  slabs from here, never duplicates them.
- City enable/disable requires confirmation naming the impact (e.g.
  active orders/riders affected); a disabled city stops new
  discovery/orders but doesn't silently cancel in-flight ones.

## Communications scopes and consent (AD12, invariant 10)

- Audience resolution scope: Overall / City-wise / Zone-wise, filtered
  to **consented** recipients only; the UI must show a **consent-aware
  recipient count** before send, not the raw audience size.
- Flow is mandatory: template + channel (WhatsApp/in-app/email) pick ->
  preview -> schedule -> **review-before-send summary** -> send ->
  delivery report with opt-outs. No direct send without the review
  step.
- Sending is permission-scoped the same way as any other admin action
  (an admin can only message within their assigned city/area scope).

## Audit log before/after (invariant 11, X14)

- Every admin action that changes data (approvals, role/permission
  edits, settings changes, suspensions, category/subcategory decisions,
  moderation actions, communications sends) writes an audit entry with
  actor, timestamp, action, and **before/after values** — not just "X
  changed Y".
- Global settings changes (SA5) are always audited, including which
  setting and the previous value, since they affect money (fee
  slabs, commission) and policy (refund window, review rules) platform-wide.

## DPDP and KYC visibility (invariant 13)

- KYC documents (RD1/VD1/PV1 onboarding) are visible only to admins
  whose permission matrix grants the relevant approval module/action.
- Support account deletion and personal-data export requests (AU8,
  AC5) end-to-end across `users`, `orders`, `reviews`, etc.
