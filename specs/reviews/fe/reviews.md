# FE: reviews

Features: F-RV-001, F-RV-002, F-RV-003, F-RV-004, F-RV-005, F-RV-006, F-RV-007, F-AD-009, F-PD-007, F-VD-010 | Screens: S-CUST-17, S-CUST-18, S-VEND-09, S-PROV-10, S-ADMN-10 | Flows: J1, J14

Backend contract: [BE reviews](../be/reviews.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/my-reviews` | S-CUST-17 | SSR private | Customer (auth gate) | noindex |
| `/reviews/new?target=<type>:<id>` | S-CUST-18 | SSR shell + client form | Customer (auth gate, returns here) | noindex |
| `/vendor/reviews`, `/provider/reviews` | S-VEND-09, S-PROV-10 | SSR private, same feature view | Approved vendor / provider | noindex |
| `/admin/reviews?tab=` | S-ADMN-10 | SSR shell + client queue | Admin `reviews:view` + scope | noindex |

Public review sections (product F-PD-007, shop, service) are the `ReviewsSection` component rendered inside the owning pages with ISR data from `GET /reviews`.

## Screens

### S-CUST-17 My reviews | `/my-reviews` | `d-customer-reviews.jpg`, `m-customer-reviews.jpg`
- Layout: list of own reviews (target name, `Rating`, text, status chip for Pending/Hidden), Edit / Delete actions.
- Data: `GET /reviews/me`, `PATCH`/`DELETE /reviews/{id}`.
- Special states: empty ("No reviews yet" + browse link); pending ("Awaiting moderation" text + icon).
- Acceptance: Given delete is confirmed, then the review disappears and a toast confirms. Given a pending review, then the status reads "Awaiting moderation" (not colour alone).

### S-CUST-18 Write a review | `/reviews/new?target=` | `d-customer-rev-b1.jpg`, `d-customer-rev-p1.jpg`, `d-customer-rev-s5.jpg`, `m-customer-rev-b1.jpg`
- Layout: target header, interactive `Rating` (required), quick tag chips for the target type, textarea with 1000-char counter, photo picker (max 5), Submit.
- Data: `GET /reviews/eligibility` then `POST /reviews` with idempotency key.
- Special states: not eligible (explanation: "Only customers who ordered or enquired can review" + link back), awaiting moderation result after submit.
- Interactions: stars keyboard-operable (arrow keys); Esc/back asks to discard unsaved text.
- Acceptance: Given no rating, then Submit shows an inline error. Given the user is a guest, then login opens and returns to this URL (BR-21). Given Hindi, then tags show Hindi labels.

### S-VEND-09 / S-PROV-10 Reviews | `/vendor/reviews`, `/provider/reviews` | `d-vendor-vreviews.jpg`, `m-vendor-vreviews.jpg`, `d-provider-sreviews.jpg`, `m-provider-sreviews.jpg`
- Layout: aggregate summary, filters (rating, replied/unreplied; URL state), review cards with Reply/Edit reply and "Report abusive".
- Data: `GET /businesses/me/reviews`, reply PUT/DELETE, `POST /reviews/{id}/reports`.
- Special states: empty ("No reviews yet — Reviews appear after customers rate you.").
- Acceptance: Given a reply is saved, then it shows under the review. Given the report sheet is submitted, then "Reported" text replaces the action.

### S-ADMN-10 Review moderation | `/admin/reviews` | `d-admin-areviews.jpg`, `m-admin-areviews.jpg`
- Layout: tabs Reported / Pending / Removed with counts; `ModerationQueueItem` list showing text, photos, reports, actions Approve / Hide / Delete (reason required for hide/delete).
- Data: `GET /admin/reviews?tab=`, `POST /admin/reviews/{id}/decision`.
- Special states: no permission, empty tab.
- Acceptance: Given `reviews:view` only, then actions are hidden/disabled and server enforces. Given an item is decided, then it leaves the tab and counts update.

## Feature components

`ReviewsSection` (summary + list + "Write a review"), `ReviewForm`, `ReviewCard`, `OwnerReplyEditor`, `ReportReviewSheet` in `src/features/reviews`. Shared: `Rating`, `Chip`, `Sheet`, `ModerationQueueItem`, `DataTable`, `Toast`.

## i18n and analytics

Prefix `reviews.*`, `admin.reviews.*`. Events: `review_submitted`, `review_helpful_marked`, `review_reported`, `review_replied`, `review_moderated`.

## Tests

Component: rating input keyboard, tag chips per type, char counter, not-eligible state. E2E: J1 deliver → review; J14 converted enquiry → review; admin hide flow.
