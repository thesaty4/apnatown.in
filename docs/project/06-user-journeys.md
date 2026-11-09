# 06 — User Journeys

**Purpose:** Numbered end-to-end journeys: actors, steps, features/screens/rules used, success and failure paths.
**Audience:** `spec-writer`, `developer-frontend`, QA, `code-reviewer` (Playwright journey coverage).
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [03-feature-catalog.md](./03-feature-catalog.md) · [07-screens-routes-sitemap.md](./07-screens-routes-sitemap.md) · [`testing.instructions.md`](../../.github/instructions/testing.instructions.md)
**Last updated:** 2026-11-09
**Owner:** Product

Each journey lists: actor(s), steps with the feature/screen/rule IDs
involved, the success path, and the main failure path(s).

## J1 — Browse to delivered order (two shops, split)

- **Actor:** R-01 customer.
- **Steps:** home category tile (HM3, S-HM-1) -> Explore pre-selected
  (EX2, S-EX-1) -> product details (S-PD-1) -> add to cart (CK1,
  S-CK-1) -> checkout with two shops, split notice (CK2, BR-03, S-CK-2)
  -> order tracking (OR3, S-OR-2) -> delivery OTP (BR-05) -> write
  review (RV1, S-RV-1).
- **Success:** both shop-orders reach `delivered` (ST-order-delivery);
  review submitted.
- **Failure paths:** out-of-range shop at CK5 (shows message, customer
  drops that shop or switches to pickup); payment failure at CK7
  (retry or pay-on-delivery); delivery OTP mismatch at OR3 (attempt
  limit, BR-05).

## J2 — Service discovery to enquiry

- **Actor:** R-01 customer.
- **Steps:** Home -> Wedding & Events tile (HM4, S-HM-1) -> Explore
  Services (S-EX-1) -> open filters (EX6) -> tick DJ & Sound and Tent &
  Lighting (BR-18) -> results/chips update -> open a service card (SV1)
  -> service details (S-SV-1) -> Send Enquiry (SV5).
- **Success:** enquiry created (ST-enquiry = `new`), provider notified.
- **Failure:** zero results after ticking two subcategories with no
  overlap -> empty state with "Clear category" (EX10).

## J3 — Offer card to destination

- **Actor:** R-01 customer, guest.
- **Steps:** offer card (home or S-OF-1) -> product details (single
  product), service details (service offer), filtered product list
  (multi-product), or shop page (shop-wide) (OF2).
- **Success:** correct destination per offer type.
- **Failure:** offer `ended`/`expired` or `out-of-stock` shows the
  matching state (OF3, BR-17) instead of a broken link.

## J4 — Reels engagement to purchase

- **Actor:** R-01 customer, guest.
- **Steps:** play icon (RL1) -> Reels feed (S-RL-1) -> follow/like/
  share; guest triggers login prompt and returns to the same video
  (RL7, BR-21) -> linked product (RL6) -> add to cart (S-CK-1).
- **Success:** item added to cart from the video's linked-product
  strip.
- **Failure:** video `removed`/`unavailable` shows that state (RL8,
  BR-10) instead of failing silently.

## J5 — Keyword search to service

- **Actor:** R-01 customer, guest.
- **Steps:** search "AC" or "iPhone 15" (SR2, S-SR-1) -> grouped
  results (SR4, SR6) -> service details (S-SV-1).
- **Success:** relevant products, shops, services and videos all
  appear grouped.
- **Failure:** no results -> related-category suggestions (SR9).

## J6 — Vendor video to public Gallery/Reels

- **Actor:** R-02 vendor, R-05 admin.
- **Steps:** vendor uploads a video, links products, chooses the
  Gallery option (VD12, VD13, BR-16, S-VD-6) -> admin approves
  (AD10, ST-video `pending -> approved`) -> appears in Reels (S-RL-1)
  and Gallery (PF9, S-PF-1).
- **Success:** video public in both places per the vendor's visibility
  toggles.
- **Failure:** admin rejects with a reason -> vendor sees
  `rejected (reason)` in S-VD-6.

## J7 — Vendor onboarding to first delivered order and earnings

- **Actor:** R-02 vendor, R-05 admin, R-04 rider.
- **Steps:** vendor onboarding (VD1, BR-06) -> admin approval (AD2,
  ST-approval) -> first product (VD4) -> first order (VD8) -> accept
  -> ready -> rider accepts (RD3) -> OTP delivery (RD4, BR-05) ->
  rider earnings (RD6).
- **Success:** order `delivered`; rider earning computed (see
  [04-business-rules.md](./04-business-rules.md) formulas).
- **Failure:** vendor `rejected` at AD2 -> sees reason, can re-submit.

## J8 — Cancel/refund/dispute

- **Actor:** R-01 customer, R-05 admin, R-02 vendor.
- **Steps:** cancel or request refund with a reason (OR6, BR-20) ->
  both admin and vendor notified -> refund tracker
  `requested -> approved -> completed` (ST-refund) -> if contested,
  dispute case (OR8, ST-case) visible to the customer with status.
- **Success:** refund `completed`, or case `resolved`.
- **Failure:** refund `declined` -> escalated to admin (ST-refund).

## J9 — Subcategory suggestion to notification

- **Actor:** R-02 vendor/R-03 provider, R-05 admin.
- **Steps:** subcategory suggestion with duplicate detection (VD6,
  BR-07) -> admin approve/reject/merge (AD6, ST-subcategory-suggestion)
  -> notification to suggester.
- **Success:** suggestion `approved` and available for use, or
  `merged` into an existing subcategory.
- **Failure:** `rejected` with a reason shown to the suggester.

## J10 — Super admin operations

- **Actor:** R-06 super_admin.
- **Steps:** deactivate an admin with a named-impact confirmation
  (SA2, BR-12) -> edit/delete a role with the reassign rule (SA3,
  BR-13) -> draw a zone on the polygon editor (SA4) -> send a
  communication with scope and the review-before-send step (AD12,
  BR-11) -> use the live map city filter (AD8).
- **Success:** each action completes with an audit log entry
  (BR-12).
- **Failure:** role deletion blocked while admins are assigned ->
  reassign picker shown (SA3).

## J11 — Rider onboarding to first delivery

- **Actor:** R-04 rider.
- **Steps:** rider onboarding and document upload (RD1, BR-06) ->
  admin approval (ST-approval) -> go online (RD2) -> delivery request
  with countdown (RD3) -> deliver with OTP (RD4, BR-05).
- **Success:** first delivery `delivered`, earning recorded.
- **Failure:** rejected onboarding -> sees reason, re-submits
  documents.

## J12 — Guest to logged-in, returning to origin

- **Actor:** guest -> R-01 customer.
- **Steps:** guest action needing login -> OTP login (AU4) -> profile
  completion (AU5) -> returns to the exact origin page/video (AU6,
  BR-21).
- **Success:** user lands back where they started, action completes
  (e.g. the like/follow/comment that triggered the prompt).
- **Failure:** OTP attempt limit reached -> locked state with retry
  guidance.

## J13 — Language and theme switch

- **Actor:** any role.
- **Steps:** switch EN <-> HI and light <-> dark on any page (X1, X2).
- **Success:** full parity — no untranslated strings, no broken
  layout from longer Hindi text, correct token set per theme.
- **Failure:** n/a (this journey *is* the regression check — see
  [09-content-i18n-notifications.md](./09-content-i18n-notifications.md)
  and [08-design-system.md](./08-design-system.md)).

## J14 — Enquiry to review eligibility

- **Actor:** R-01 customer, R-03 provider.
- **Steps:** customer enquiry (SV5) -> provider inbox (PV4,
  ST-enquiry `new -> contacted`) -> `converted` -> customer becomes
  eligible to review (RV2, BR-09).
- **Success:** review eligible and submittable after `converted`.
- **Failure:** enquiry `closed` without conversion -> customer remains
  ineligible to review that provider via this path.
