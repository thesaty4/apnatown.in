# FE: delivery

Features: F-RD-001, F-RD-002, F-RD-003, F-RD-004, F-RD-005, F-RD-006, F-RD-007, F-RD-008, F-AD-008, F-X-015 | Screens: S-RIDE-01, S-RIDE-02, S-RIDE-03, S-RIDE-04, S-RIDE-05, S-RIDE-06, S-RIDE-07, S-RIDE-08, S-ADMN-09 | Flows: J1, J11

Backend contract: [BE delivery](../be/delivery.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/rider/onboarding` | S-RIDE-01 | SSR shell + client form (uploads) | Authenticated user | noindex |
| `/rider/home`, `/rider/requests`, `/rider/active` | S-RIDE-02, S-RIDE-03, S-RIDE-04 | CSR islands in `DashboardShell`; SSE for offers/job | Rider (approved for requests/active) | noindex |
| `/rider/history`, `/rider/earnings`, `/rider/feedback`, `/rider/profile` | S-RIDE-05, S-RIDE-06, S-RIDE-07, S-RIDE-08 | SSR, private no-store | Rider | noindex |
| `/admin/live` | S-ADMN-09 | SSR shell + client `MapView` with SSE | Admin `orders:view` + scope | noindex |

All rider routes use `DashboardShell` with rider nav (Home, Requests, Active, History, Earnings, Feedback, Profile) from `08-permissions-matrix.md` §7.

## Screens

### S-RIDE-01 Rider signup | `/rider/onboarding` | `d-rider-ronboard.jpg`, `m-rider-ronboard.jpg`
- Layout: `Stepper` (profile, selfie, vehicle, licence, ID, RC, bank/UPI, documents); single column mobile, centred card desktop.
- Data: `GET/PUT /delivery/riders/me`; uploads via media private-asset upload.
- Special states: `pending` (under review), `rejected`/`changes_requested` (reason + resubmit), `suspended` (contact support). Keys `rider.onboard.*`.
- Interactions: save per step; submit confirms; file input accepts camera on mobile.
- Rules: ST-approval; names 2–60; BR-14 documents private.
- Acceptance: Given a rejected rider, when the page opens, then the reason and Resubmit are shown. Given a file of a disallowed type, then an inline error appears and nothing uploads. Given Hindi, then all step labels render in Devanagari without overflow.

### S-RIDE-02 Rider home | `/rider/home` | `d-rider-rhome.jpg`, `m-rider-rhome.jpg`
- Layout: online/offline toggle card, today's deliveries and earnings `KpiCard`s, link to current request/active job.
- Data: `GET /delivery/riders/me/summary`, `POST /delivery/riders/me/online`.
- Special states: offline (toggle off copy), not approved (toggle disabled + status link), F-X-015 install/PWA prompt per foundation.
- Acceptance: Given a pending rider, then the toggle is disabled with text explaining approval. Given an active job, when going offline, then the server error is shown as a toast and the toggle reverts.

### S-RIDE-03 Delivery requests | `/rider/requests` | `d-rider-rreq.jpg`, `m-rider-rreq.jpg`
- Layout: request card — pickup shop/area, drop area, distance, estimated earning (₹, Indian grouping), circular 60 s countdown, Accept (primary) / Reject.
- Data: `GET /delivery/riders/me/offers/current` + rider SSE; accept/reject with idempotency key.
- Special states: no requests (empty, stays online), expired (card greyed, "Request expired" text + icon).
- Interactions: countdown derived from server `expiresAt`; announce remaining time to screen readers at 30/10 s only; Accept navigates to `/rider/active`.
- Acceptance: Given the countdown hits 0, then buttons disable and the expired state shows. Given another rider accepted first, then "Request taken" toast and the card clears.

### S-RIDE-04 Active delivery | `/rider/active` | `d-rider-ractive.jpg`, `m-rider-ractive.jpg`
- Layout: `Timeline` steps (Accepted, Reached shop, Items check, Picked up, Navigate, Reached drop, Collect cash if COD, Enter OTP, Delivered); primary action per step; Navigate opens device maps; masked Call button; "Mark failed" secondary.
- Data: `GET /delivery/riders/me/active`, `POST /delivery/jobs/{id}/events`, `/complete`, `/call`; location posts every 5 s while active (foreground only).
- Special states: wrong OTP (inline error with attempts left), locked code (contact support), failed delivery (reason sheet: customer unreachable / wrong address / customer cancelled / vehicle problem), COD cash notice with amount.
- Rules: BR-05 — the UI never displays the customer's code; OTP entered via `OtpInput length=4`. ST-delivery-job.
- Acceptance: Given COD, when the rider reaches the OTP step, then "Collect ₹X cash" must be confirmed first. Given a wrong OTP, then the error shows and the field clears. Given a fail reason is chosen, then the job ends and home shows no active job.

### S-RIDE-05 History | `/rider/history` | `d-rider-rhistory.jpg`, `m-rider-rhistory.jpg`
- Layout: filter chips All / Today / This week (URL `?range=`), list of jobs (shop, area, status chip, earning, time IST), row opens detail sheet.
- Data: `GET /delivery/riders/me/history` keyset paginated.
- Special states: empty per filter.
- Acceptance: Given `?range=week` in the URL, when reloaded, then the same filter is active.

### S-RIDE-06 Earnings | `/rider/earnings` | `d-rider-rearn.jpg`, `m-rider-rearn.jpg`
- Layout: day/week toggle, totals, per-ride rows "base + per-km", payout list with status chip (Pending/Paid, icon + text).
- Data: `GET /delivery/riders/me/earnings`.
- Acceptance: Given amounts in paise, then they render as INR with Indian grouping. Given no rides, then zero totals and an empty list message.

### S-RIDE-07 Feedback | `/rider/feedback` | `d-rider-rfeedback.jpg`, `m-rider-rfeedback.jpg`
- Layout: average `Rating`, breakdown, comment list.
- Data: Reviews `GET /reviews?targetType=rider&targetId=me` (see [BE reviews](../../reviews/be/reviews.md)).
- Special states: empty ("No feedback yet").
- Acceptance: Given hidden reviews, then they are not listed.

### S-RIDE-08 Rider profile | `/rider/profile` | `d-rider-rprofile.jpg`, `m-rider-rprofile.jpg`
- Layout: documents with status, payout (masked UPI/bank), language switch, support links (settings help), "Report a dispute" sheet.
- Data: `GET/PUT /delivery/riders/me`, `POST /delivery/riders/me/disputes`, Users preferences for language.
- Acceptance: Given payout details, then only the last 4 characters display. Given a dispute is submitted twice quickly, then one case is created (idempotency key).

### S-ADMN-09 Live deliveries | `/admin/live` | `d-admin-alive.jpg`, `m-admin-alive.jpg`
- Layout: city `Combobox` (All cities + assigned cities), `MapView` with cluster pins per city for All, side list of active jobs (order no., rider, status chip); mobile list below map.
- Data: `GET /delivery/admin/live?cityId=` + SSE; URL `?city=`.
- Special states: empty city ("No live deliveries in <city>"), no permission (standard).
- Acceptance: Given an admin assigned only Padrauna, then the combobox lists only Padrauna and All. Given a job is delivered, then its pin disappears via SSE without reload. Given no `orders:view`, then the no-permission state shows.

## Feature components

`RequestCountdownCard`, `DeliveryStepFlow`, `FailReasonSheet`, `RiderOnlineToggle` (in `src/features/rider/components`). Shared: `DashboardShell`, `Stepper`, `Timeline`, `OtpInput`, `KpiCard`, `Rating`, `MapView`, `Combobox`, `Sheet`, `Toast`, `Skeleton`.

## i18n and analytics

Prefixes `rider.*`, `admin.live.*`. Events: `rider_online_toggled`, `rider_offer_accepted`, `rider_offer_rejected`, `rider_offer_expired`, `rider_delivery_completed`, `rider_delivery_failed`.

## Tests

Component: countdown expiry, OTP step error/lock, fail reason sheet, online toggle disabled state. E2E: J11 accept → pickup → OTP deliver (COD and prepaid); admin live map city filter; rider signup resubmit.
