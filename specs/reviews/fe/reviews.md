# FE: reviews

Features: F-RV-001, F-RV-002, F-RV-003, F-RV-004, F-RV-005, F-RV-006, F-RV-007, F-AD-009, F-PD-007, F-VD-010, F-RD-007 | Screens: S-CUST-17, S-CUST-18, S-VEND-09, S-PROV-10, S-ADMN-10; integration S-RIDE-07 | Flows: J1, J14

Backend contract: [BE reviews](../be/reviews.md)

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Components](#feature-components) · [Verification](#verification)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/my-reviews` | S-CUST-17 | SSR private | Customer (auth gate) | noindex |
| `/reviews/new?target=<type>:<id>` | S-CUST-18 | SSR shell + client form | Customer (auth gate, returns here) | noindex |
| `/reviews/new?target=<type>:<id>&reviewId=<id>` | S-CUST-18 edit mode | Same shell, authorized edit hydration | Author only | noindex |
| `/vendor/reviews`, `/provider/reviews` | S-VEND-09, S-PROV-10 | SSR private, same feature view | Approved vendor / provider | noindex |
| `/admin/reviews?tab=` | S-ADMN-10 | SSR shell + client queue | Admin `reviews:view` + scope | noindex |

Public review sections (product F-PD-007, shop/provider/service) use `ReviewsSection` inside owning pages. Only anonymous public text/aggregates may enter ISR; `helpfulByMe`, `reportedByMe` and allowed actions come from a no-store client request and never enter a shared cache. Use [frontend-shared](../../_foundation/frontend-shared.md) for standard states, tokens and accessible controls.

### Public ReviewsSection (F-RV-005, F-PD-007)
- Data: `GET /reviews?targetType=&targetId=&sort=&cursor=`; rating breakdown, Recent/Helpful sorting and cards. Public cards expose **Helpful (count)** and **Report**, matching `js2.js:55`; guests can use the abuse-limited public subject flow, not the login-only write-review flow.
- Helpful uses PUT/DELETE `/reviews/{id}/helpful`, shows `aria-pressed`, optimistically updates once and reconciles authoritative count/flag on error or retry. Author cannot vote for their own review.
- Report sheet sends `{reason,details?}` to `/reviews/{id}/reports`, with inert plain text and inline 500-char cap; success replaces action with Reported. Duplicate acknowledgement does not increment a counter. Abuse-limit feedback retains input.
- **Identity binding:** provider-profile pages pass `targetType=business` with the provider's Businesses ID; individual service pages pass `service` with Services ID. Product and rider targets use their BE mappings; never infer type from an ID prefix.
- Acceptance: Given a visible review, when Helpful is retried, then one vote/count update persists. Given a guest report, when accepted, then Reported appears and moderation receives it without public takedown. Given hidden content or a denied action, when submitted, then the optimistic state rolls back without leaking it.

## Screens

### S-CUST-17 My reviews | `/my-reviews` | `d-customer-reviews.jpg`, `m-customer-reviews.jpg`
- Layout: list of own reviews (target name, `Rating`, text, status chip for Pending/Hidden), Edit / Delete actions.
- Data: `GET /reviews/me`, `GET /reviews/{id}/edit`, versioned PATCH/DELETE. Edit navigates with explicit review ID; preserve immutable target/proof, hydrate rating/text/tags/photo asset IDs and version, never create a second review by reusing POST.
- Special states: empty ("No reviews yet" + browse link); pending ("Awaiting moderation" text + icon).
- Acceptance: Given Delete is confirmed, when the versioned request succeeds, then the review disappears with a toast. Given pending content, when listed, then “Awaiting moderation” includes text/icon. Given another author's ID, when edit opens, then no draft or proof is disclosed.

### S-CUST-18 Write a review | `/reviews/new?target=` | `d-customer-rev-b1.jpg`, `d-customer-rev-p1.jpg`, `d-customer-rev-s5.jpg`, `m-customer-rev-b1.jpg`
- Layout: target header, required `Rating`, target-kind tag chips, **required** trimmed review text (1–1000; `js5.js:71`), optional photo picker max 5, Submit/Update. Provider profile uses provider tags even though its normalized target type is business.
- Data: `GET /reviews/eligibility` returns `ReviewWriteContext`; POST includes the server-selected proof reference and policy version only when create is enabled. Edit hydrates `/reviews/{id}/edit` and PATCHes that ID/version. Uploads use `review_photo` AssetPort-issued IDs, not URLs.
- Special states: ineligible explanation, **decision-required** (RV-Q1/RV-Q2) with disabled write action, pending result, stale-version reload preserving the unsaved draft. An unresolved policy is not an ordinary “you did not purchase” denial.
- No invented proof selector, “latest purchase” choice or per-purchase duplicate flow. `existingReviews`/`allowedActions` determine edit/create mode; absent a resolved policy, ambiguous writes remain blocked.
- Interactions: stars keyboard-operable (arrow keys); Esc/back asks to discard unsaved text.
- Acceptance: Given empty text or no rating, when submitting, then field errors prevent the request. Given a guest, when writing a review, then login returns to the exact target/review URL. Given an existing authorized review, when editing, then all values/version hydrate and PATCH preserves identity. Given policy ambiguity, when the form loads, then Submit is disabled with the BE decision key, not a silently chosen eligibility rule.

### S-VEND-09 / S-PROV-10 Reviews | `/vendor/reviews`, `/provider/reviews` | `d-vendor-vreviews.jpg`, `m-vendor-vreviews.jpg`, `d-provider-sreviews.jpg`, `m-provider-sreviews.jpg`
- Layout: aggregate summary, **All / Needs reply / Reported** chips from `js8.js:88` (URL `filter`), optional rating refinement, cards with Reply/Edit reply and Report abusive. Counts and “Reported” reflect open reports, not a client-only flag.
- Data: `GET /businesses/me/reviews?filter=&rating=&cursor=`, reply PUT/DELETE, reports POST. Provider-profile/business and child item IDs retain the BE mappings.
- Special states: empty ("No reviews yet — Reviews appear after customers rate you.").
- Acceptance: Given a valid owner reply, when saved, then it appears and the author receives the Notifications handoff. Given Reported selected, when reloaded or restored with Back, then the same filtered records appear. Given another business's review, when a reply/report owner action is attempted, then the server denial preserves no unauthorized edit.

### S-ADMN-10 Review moderation | `/admin/reviews` | `d-admin-areviews.jpg`, `m-admin-areviews.jpg`
- Layout: Reported / Pending / Removed with server-scoped counts; content/photos/reasons, Approve/Hide/Delete. Approve on **hidden** Removed is BE `restore` (hidden→published); deleted tombstones are read-only. Reason required for hide/delete, versions on every decision.
- Data: `GET /admin/reviews?tab=`, `POST /admin/reviews/{id}/decision`.
- Special states: no permission, empty tab.
- Acceptance: Given `reviews:view` only, when the queue loads, then mutations are disabled and forged requests fail. Given a hidden review, when Restore succeeds, then it is public/countable once and Removed/counts refresh. Given a deleted tombstone, when viewed, then Restore is absent. Given a same-city unassigned area, when deep-linked, then no moderation content is shown.

### Rider feedback integration (S-RIDE-07)
- Delivery owns the route/shell; `GET /reviews/riders/me` supplies the rider's own aggregate and comments. Public rider review discovery remains RV-Q3-gated.
- Acceptance: Given a rider, when feedback loads, then only their target's reviews appear; a modified rider ID never selects another rider's private feedback.

## Feature components

`ReviewsSection` (summary/list/Write/Helpful/Report), `ReviewForm`, `ReviewCard`, `OwnerReplyEditor`, `ReportReviewSheet` in `src/features/reviews`. Shared: `Rating`, `Chip`, `Sheet`, `ModerationQueueItem`, `DataTable`, `Toast`; no duplicated rating or proof logic in UI.

## i18n and analytics

Prefix `reviews.*`, `admin.reviews.*`. Events: `review_submitted`, `review_helpful_marked`, `review_reported`, `review_replied`, `review_moderated`.

## Verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Manual UI/accessibility: rating keyboard, required text, provider versus service tags, Helpful pressed/count state, report/reply sheets, owner Reported filter, topmost Esc, Hindi/dark layouts. Manual journey J1/J14 use approved eligibility-policy synthetic scenarios; unresolved synthetic scenarios assert blocked writes, not presumed converted eligibility. Cover existing-ID edit hydration, wrong-owner/proof denial, report → hide → restore with exact counts, duplicate votes/reports, failed upload/retry and malicious plain text. Account deletion/export UI remains Users-owned; clear personal cached review state on session invalidation.
