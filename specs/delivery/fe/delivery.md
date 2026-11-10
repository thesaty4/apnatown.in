# FE: delivery

Features: F-RD-001, F-RD-002, F-RD-003, F-RD-004, F-RD-005, F-RD-006, F-RD-007, F-RD-008, F-AD-008, F-X-015 | Screens: S-RIDE-01, S-RIDE-02, S-RIDE-03, S-RIDE-04, S-RIDE-05, S-RIDE-06, S-RIDE-07, S-RIDE-08, S-ADMN-09 | Flows: J1, J11

Backend contract: [BE delivery](../be/delivery.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/rider/onboarding` | S-RIDE-01 | SSR shell + client form (uploads) | Authenticated own applicant; no rider role required | noindex |
| `/rider/home`, `/rider/requests`, `/rider/active` | S-RIDE-02, S-RIDE-03, S-RIDE-04 | CSR islands in `DashboardShell`; SSE for offers/job | Rider (approved for requests/active) | noindex |
| `/rider/history`, `/rider/earnings`, `/rider/feedback` | S-RIDE-05, S-RIDE-06, S-RIDE-07 | SSR, private no-store | Rider; self | noindex |
| `/rider/profile` | S-RIDE-08 | SSR private shell + editable islands | Own authenticated applicant/rider; approval capabilities gate actions | noindex |
| `/admin/live` | S-ADMN-09 | SSR shell + client `MapView` with SSE | Admin `orders:view` + scope | noindex |

Approved rider routes use `DashboardShell`/rider nav per permission matrix; pending applicants get onboarding/status/support, not working rider actions. Follow [frontend-shared](../../_foundation/frontend-shared.md) tokens, standard states, no-store handling, flat errors and safe-integer paise formatting. Server `capabilities`, `allowedActions` and versions govern controls.

## Screens

### S-RIDE-01 Rider signup | `/rider/onboarding` | `d-rider-ronboard.jpg`, `m-rider-ronboard.jpg`
- Layout: final prototype's **five** steps Profile/photo → Vehicle → Documents → Payout details → Review; single column mobile, centred desktop card. Review summarizes entered details/documents before submit.
- Scope: use validated Geo city/area selection in Profile for the application's service area; missing area blocks submission, not earlier draft saves. Never copy the prototype's hard-coded area or require device GPS to choose it.
- Data: `GET/PUT /delivery/riders/me` using `RiderDraftWriteDTO`, saved step/version/key. Create own draft before Media upload; `purpose='kyc_document'`, `subject:{type:'rider_application',id:ownUserId}`, typed `{kind,assetId}` for selfie/licence/id_proof/rc/other. Media consults Delivery applicant authorization; no positional document array, raw key or client-supplied rider role.
- Special states: `pending` (under review), `rejected`/`changes_requested` (reason + resubmit), `suspended` (contact support). Keys `rider.onboard.*`.
- Interactions: save only fields in the current step; reload restores saved draft even with later steps missing. Submit checks server requirements/ready assets; unknown cycle/KYC rules show requirements unavailable, not invented exemptions. Upload resolves synchronously to a validated/durable `status:'ready'` asset; attach only its ID. Camera/progress/retry/cancel are local request UI, not persisted pending uploads or asset-status polling. Focus first invalid field and preserve nonsecret draft.
- Rules: ST-approval; names 2–60; BR-14 stored KYC views are scoped-admin-only; applicant sees own upload metadata (local selected-file preview is not a stored KYC view grant). Never persist raw documents/bank/UPI in browser storage, SSR snapshots or analytics. Approval refreshes Auth's committed capabilities; choosing rider in a client switch cannot grant privileges.
- Acceptance: Given profile-only draft, when saved/reloaded before payout/documents, then step progress survives but premature submit identifies missing required fields. Given rejected/changes-requested status, when reopened, then reason/resubmit show; suspended status offers support, not self-restore. Given a disallowed/foreign/wrong-purpose asset, when attached, then no false upload/approval success appears. Given keyboard/long Hindi, when navigating five steps, then labels, required markers and focus order remain usable.

### S-RIDE-02 Rider home | `/rider/home` | `d-rider-rhome.jpg`, `m-rider-rhome.jpg`
- Layout: online/offline toggle card, today's deliveries and earnings `KpiCard`s, link to current request/active job.
- Data: `GET /delivery/riders/me/summary`, `POST /delivery/riders/me/online`.
- Special states: offline (toggle off copy), not approved (toggle disabled + status link), F-X-015 install/PWA prompt per foundation.
- Acceptance: Given a pending applicant, when Home opens, then the toggle is disabled with approval explanation. Given an active job, when going offline, then server error is shown and the toggle reverts.
  Given approval/online status changes while open, when reconnecting/toggling, then capability is refreshed and no stale enabled request control is trusted. Given an IST day boundary, when summary refreshes, then totals use returned period bounds rather than browser timezone.

### S-RIDE-03 Delivery requests | `/rider/requests` | `d-rider-rreq.jpg`, `m-rider-rreq.jpg`
- Layout: request card — pickup shop/area, drop area, distance, estimated earning (₹, Indian grouping), circular 60 s countdown, Accept (primary) / Reject.
- Data: `RiderOfferDTO` from `/delivery/riders/me/offers/current` + `/stream`; `delivery.offer_created {offerId,jobId,riderUserId,expiresAt}` signals a current-offer refresh, not a client-created job/countdown. Ignore stale/replayed signals after authoritative expiry/response. Accept/reject sends offer version + stable operation key on network retry. Show immutable estimate/settings snapshot, not an earned/paid promise.
- Special states: no requests (empty, stays online), expired (card greyed, "Request expired" text + icon).
- Interactions: countdown from `expiresAt`/`serverTime`, resync after foreground/reconnect; announce at 30/10 s, not each tick. Navigate only after accept commits. No customer full address/phone/code on an offer.
- Acceptance: Given the server expiry is reached, when countdown/response refreshes, then buttons disable and expired state shows. Given another rider accepted first, when acceptance conflicts, then “Request taken” shows and the card clears.
  Given two tabs accept different jobs or admin assigns as Accept is pressed, when one wins, then refetch shows the single server active job and a conflict is not displayed as success. Given suspension/offline/permission revocation or expired stream, when action resumes, then countdown and capability refresh before another request.

### S-RIDE-04 Active delivery | `/rider/active` | `d-rider-ractive.jpg`, `m-rider-ractive.jpg`
- Layout: `Timeline` steps (Accepted, Reached shop, Items check, Picked up, Navigate, Reached drop, Collect cash if COD, Enter OTP, Delivered); primary action per step; Navigate opens device maps; masked Call button; "Mark failed" secondary.
- Data: `RiderJobDTO` from `/delivery/riders/me/active`; events/complete send job/order/financial versions + key; pickup sends checked **orderItemIds** at the current item revision. `/call` uses masked capability; location posts at most every 5 s in foreground while authorized/online, not a background PWA location trail.
- Items: render names, selected variant labels, fulfilled quantities and availability; check each required current item, not an invented count-only checkbox. If order/financial version changes, refetch and reset affected checks/cash confirmation before pickup/completion.
- Special states: wrong OTP/attempts left, expired/reissued generation, locked (support), withdrawn approval, changed payable/items, failed/cancelled, missing location/call provider. Fail reason sheet retains the four source reasons; no arbitrary customer-cancellation shortcut.
- Cash/code: explicit “Collected ₹X cash” uses **current outstanding**, separate from typed `OtpInput length=4`; prepaid/zero-due hides it. Rider never fetches/displays the customer code. Clear entered code on submit error/close/logout and exclude it from logs, storage and analytics. Expiry/reissue asks customer to read their current code; rider cannot resend/unlock.
- Acceptance: Given COD, when confirming completion, then current cash amount must be explicitly confirmed and no completion appears before server commit. Given wrong/expired/locked code, when rejected, then correct recovery is shown without inventing code or handover success. Given an item/amount adjustment, when a stale checklist/confirmation submits, then refetch resets it and no old amount is collected.
  Given a valid failure, when the transaction succeeds, then job/order/case result refreshes and no approved/completed refund is implied. Given retry after lost response, when the same key is used, then collection/earning is not duplicated. Given Maps/location/call unavailable, when navigating, then alternate textual address/support remains without exposing raw customer phone.

### S-RIDE-05 History | `/rider/history` | `d-rider-rhistory.jpg`, `m-rider-rhistory.jpg`
- Layout: filter chips All / Today / This week (URL `?range=`), list of jobs (shop, area, status chip, earning, time IST), row opens detail sheet.
- Data: `/delivery/riders/me/history` and `/history/{jobId}` detail, keyset paginated; show response bounds in IST. Today/week preserve prototype's rolling 24 hours/seven days, not calendar/settlement periods.
- Special states: empty per filter.
- Acceptance: Given `?range=week` in the URL, when reloaded, then the same filter is active.
  Given a rate change, when a completed ride detail opens, then persisted base/distance/rounding/earned snapshot stays unchanged, with estimate distinguished where different. Given failed/cancelled rows or a foreign job ID, when opened, then no earned success or other rider/customer data appears; history has no live contact/full recipient address.

### S-RIDE-06 Earnings | `/rider/earnings` | `d-rider-rearn.jpg`, `m-rider-rearn.jpg`
- Layout: day/week toggle, totals, per-ride persisted “base + distance + rounding” breakdown; payout section uses explicit availability, not invented pending/paid amounts.
- Data: `RiderEarningsDTO` from `/delivery/riders/me/earnings`; `earnedAt` and returned period bounds govern reporting.
- Acceptance: Given integer paise, when rendered, then INR grouping/rounding matches server totals. Given no completed rides with available data, when loaded, then actual zero/empty is shown. Given settlement policy unavailable, when loaded, then unavailable/null is shown, **not** zero payout or Paid. Given estimate differs from completed earning, when opening details, then both are labelled distinctly and no current-settings recomputation occurs.

### S-RIDE-07 Feedback | `/rider/feedback` | `d-rider-rfeedback.jpg`, `m-rider-rfeedback.jpg`
- Layout: average `Rating`, breakdown, comment list.
- Data: Reviews `GET /reviews/riders/me` (see [BE reviews](../../reviews/be/reviews.md)).
- Special states: empty ("No feedback yet").
- Acceptance: Given hidden reviews, when fetched, then they are absent. Given no feedback, when loaded, then empty differs from error/unavailable, not a fake five-star rating. Given malicious/long Hindi comments, when rendered, then escaped accessible content remains readable without layout overflow.

### S-RIDE-08 Rider profile | `/rider/profile` | `d-rider-rprofile.jpg`, `m-rider-rprofile.jpg`
- Layout: documents with status, payout (masked UPI/bank), language switch, support links (settings help), "Report a dispute" sheet.
- Data: `/delivery/riders/me` and `POST /delivery/riders/me/disputes {jobId?,reasonKey,details}`; linked follow-up `/disputes/{caseId}/notes {jobId,note,expectedVersion}`; Users preferences for language. Jobless report yields actual Settings support ID; job-linked report yields Orders case ID/status.
- Acceptance: Given payout details, when displayed, then only server-masked text is present, never full values hidden with CSS. Given duplicated job-linked/jobless submission, when committed, then one actual case/support receipt is shown, not a toast without persistence. Given foreign job/case or internal notes, when requested, then no content leaks. Given unknown sensitive-edit/reapproval policy, when editing documents/payout, then the gated action is explicit rather than an invented immediate approval.

### S-ADMN-09 Live deliveries | `/admin/live` | `d-admin-alive.jpg`, `m-admin-alive.jpg`
- Layout: city `Combobox` (All cities + assigned cities), `MapView` with cluster pins per city for All, side list of active jobs (order no., rider, status chip); mobile list below map.
- Data: `/delivery/admin/live?cityId=` + `/delivery/admin/stream`; URL `?city=`. List includes order number, rider/status and ETA/asOf; cluster counts are already city/**area** scoped. Order drill-down uses S-ADMN-08; no fabricated self-delivery rider pins.
- Special states: empty authorized city; stale/unavailable location/ETA, disconnected stream, permission/scope revoked, map unavailable with usable list. All cities means union of allowed areas, not all jobs in those cities.
- Acceptance: Given an admin assigned one area within a city, when selecting All or subscribing, then other areas' pins/counts/rows never appear. Given delivered/cancelled job, when SSE updates, then pin/list entry leaves without reload. Given permission removed/reconnect, when data refreshes, then stale private pins clear and no client-only filter protects the response. Given keyboard/screen reader use, when map unavailable, then list/combobox provides the same actionable information.

## Shared order integrations

F-OR-002, F-OR-003, F-OR-004, F-VD-008, F-PV-005, F-AD-002, F-AD-007; S-CUST-14, S-VEND-04, S-PROV-05, S-ADMN-02, S-ADMN-08. [Orders FE](../../orders/fe/orders.md) owns these pages; Delivery owns their typed actions/projections.

- Customer detail composes `/delivery/orders/{id}/tracking`/`stream` for rider name/rating/masked-call/ETA, with explicit stale/unavailable states. Only dedicated `/code` reads the current customer code after G-16 approval; repeat reload shows same generation until expiry. `/code/reissue` uses expected generation/key/cooldown; consumed/reissued code disappears. Keep plaintext out of SSR, normal order/tracking DTOs, persistent query cache, service worker, analytics and logs.
- Owner ready platform controls use `/request`, `/riders`, `/assign`; no picker for self/pickup. Self `/self-dispatch` then `/self-complete`, and pickup `/delivery/pickup-codes/verify`, need no rider job; completion sends current order/financial versions, typed customer code and separate explicit cash confirmation. Never equate handover/code match with payment.
- Approval/documents and admin assignment require city **and area**; candidate picker data is server scoped and assignment checks both job and rider. Unknown post-custody transfer/refund policy is unavailable, not an optimistic success.
- Acceptance: Given self/pickup versus platform orders, when owner completes with current code/cash confirmation, then the correct jobless/job result appears exactly once. Given stale amount/code/unauthorized role, when attempted, then no code consume/collection/transition is displayed; refetch restores truthful state. Given customer reissue/expiry/reload, when code is read, then only the authorized live generation appears and rider remains blind.

## Feature components

`RequestCountdownCard`, `DeliveryStepFlow`, `FailReasonSheet`, `RiderOnlineToggle` (in `src/features/rider/components`). Shared: `DashboardShell`, `Stepper`, `Timeline`, `OtpInput`, `KpiCard`, `Rating`, `MapView`, `Combobox`, `Sheet`, `Toast`, `Skeleton`.

## i18n and analytics

Prefixes `rider.*`, `admin.live.*`. Analytics: `rider_online_toggled`, `rider_offer_accepted`, `rider_offer_rejected`, `rider_offer_expired`, `rider_delivery_completed`, `rider_delivery_failed`; never attach code, coordinates, phone, KYC, payout instrument or free-text dispute.

## Tests

Component/E2E: map every screen criterion to tests; draft→typed KYC→approval/Auth refresh, two-tab accept/expiry/reconnect, item/financial version reset, pickup/self/platform explicit cash, code expiry/reissue/consume/lost response, failed-order case, history/estimate-vs-earned/IST bounds, jobless support receipt and same-city/wrong-area live SSE.

All screens: auth/ownership negatives, malformed/XSS form/asset/ID input, offline retry without duplicate money/mutation, EN/long Hindi, 360 px + desktop, light/dark/reduced motion, Axe/keyboard/focus return, topmost Esc, ≥44 px controls, status text/icons not color alone. No private/code data in analytics or browser caches.

## Open questions

BE gates apply to KYC/cycle requirements, dispatch selection, earning/distance configuration, actual settlement, masked calling, code channel/expiry/reissue/recovery and sensitive-edit/retention policies. Show explicit unavailable/support states; never substitute sample payouts, raw phones, guessed documents or a fake successful handover.
