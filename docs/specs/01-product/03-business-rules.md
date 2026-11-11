# Business rules and validation

## Contents

- [Business rules](#business-rules)
- [Formulas and defaults](#formulas-and-defaults)
- [Validation](#validation)
- [Error contract](#error-contract)

## Business rules

All rules retain their IDs and wording; rationales/enforcement/test ideas are grounded in the Design Context Pack. Candidate error codes need P04 confirmation.

| ID | Binding rule | Rationale | Enforcement | Candidate error code | Test idea |
|---|---|---|---|---|---|
| BR-01 | Money is integer paise; INR/Indian grouping; server computes totals. | Avoid float errors and client-side price tampering. | API services + DB constraints + shared formatter. | BUSINESS_RULE_VIOLATION (ruleId). | Reject invalid money; prove server total authoritative. |
| BR-02 | Persist UTC; display IST 12-hour. | Consistent instants and correct local display. | All repositories/shared formatters. | VALIDATION_ERROR for invalid timestamp. | Round-trip known UTC instants to expected IST. |
| BR-03 | One checkout creates one order per shop with independent state/mode/payment/code. | Independent vendor fulfilment. | Cart-checkout/orders transaction. | BUSINESS_RULE_VIOLATION. | Multi-shop cart produces exactly one order per shop. |
| BR-04 | Order status only via state machine; stock never oversells. | Prevent invalid transitions and negative stock. | Orders/products transaction and locking. | CONFLICT or BUSINESS_RULE_VIOLATION. | Concurrent last-unit purchase cannot oversell. |
| BR-05 | Delivery/pickup codes server-verified, attempt-limited, never returned to rider/vendor APIs. | Prevent handover fraud. | Delivery/orders service and DTO allow-list. | RATE_LIMITED or VALIDATION_ERROR. | Wrong/repeated code denied; secret absent from unauthorized DTO/logs. |
| BR-06 | Only approved vendor/provider/rider sells, accepts orders or goes online. | No unapproved participant can transact. | Users approval checks in domain services. | FORBIDDEN. | Pending/rejected/suspended/inactive cannot perform gated action. |
| BR-07 | Super Admin owns main categories; subcategory suggestions need admin approval and duplicate detection. | Consistent taxonomy. | Catalog service and guards. | FORBIDDEN or CONFLICT. | Non-super-admin change denied; normalized duplicate surfaced. |
| BR-08 | Each service has exactly one subcategory; provider may have several expertise subcategories. | Unambiguous per-service filter. | Services/catalog validation and relation constraints. | VALIDATION_ERROR. | Reject zero/multiple service subcategories; allow multiple provider expertise. |
| BR-09 | Reviews only from verified purchaser/enquirer; risky content moderated. | Trust and abuse prevention. | Reviews eligibility and moderation. | FORBIDDEN or VALIDATION_ERROR. | Ineligible user cannot publish; risky content stays pending. |
| BR-10 | Videos public only after approval; reports queue; removed/rejected unavailable. | Content safety. | Media-videos publication/read query. | NOT_FOUND/UNAVAILABLE. | Pending not public; reports queued; removed shows unavailable. |
| BR-11 | Location optional; marketing/WhatsApp consent-based; opt-outs/counts honored. | Privacy/DPDP. | Users consent and communications resolver. | CONSENT_REQUIRED (candidate). | Opted-out recipient excluded from counts and send. |
| BR-12 | Admin role+assigned scope+module permission; audit sensitive before/after. | Least privilege/accountability. | Admin guards and audit transaction. | FORBIDDEN or NOT_FOUND. | Missing scope/module grant denied; sensitive action audited. |
| BR-13 | Cannot delete role in use or system role. | Prevent admin lockout. | Admin role service transaction. | CONFLICT. | Both conditions block deletion without partial change. |
| BR-14 | Minimize data; support consent/export/delete; restrict KYC. | DPDP and sensitive-data protections. | Users privacy workflow/admin permission. | FORBIDDEN. | Verify privacy request and unauthorized KYC payload/log leakage. |
| BR-15 | Explore URL is shareable; Explore/Search states independent. | Shareable navigation and state isolation. | Search URL-state schema. | VALIDATION_ERROR. | URL round-trip and cross-screen isolation. |
| BR-16 | Product/service media appears in Gallery/Reels only with per-item vendor consent/default. | Owner controls publication. | Media/business consent field and public queries. | FORBIDDEN/VALIDATION_ERROR. | Disabled item excluded; only owner can change toggle. |
| BR-17 | Offer applies only active and unexpired; expired/out-of-stock states clear. | Prevent stale discounts. | Offers and server checkout pricing. | CONFLICT. | Expired/paused/out-of-stock offer never reduces total. |
| BR-18 | Service subcategory drives Explore/Search filters and counts. | Consistent filtering. | Services/catalog/search query. | DEPENDENCY_UNAVAILABLE for count failure. | Assignment affects results/counts; zero count remains disabled. |
| BR-19 | Distribute coupon discount proportionally across eligible shop orders. | Correct per-shop accounting. | Checkout transaction and deterministic paise rounding. | BUSINESS_RULE_VIOLATION. | Allocations sum exactly to discount and honor cap/minimum. |
| BR-20 | Cancellation/refund request notifies both admin and vendor. | All resolution owners informed. | Orders event + durable outbox/notifications. | DEPENDENCY_UNAVAILABLE if notification intent not durable. | Durable intents for both audiences; retry does not duplicate. |
| BR-21 | Guest gated actions prompt login and return to same place. | Preserve context. | Auth gate and safe return-route validation. | UNAUTHENTICATED. | Same-origin return restored; open redirect rejected. |
| BR-22 | Status is icon + text + colour, never colour alone. | Accessible semantic status. | Shared StatusBadge/Timeline/accessibility tests. | N/A. | Every status exposes accessible text/name. |

## Formulas and defaults

Sample/default values from the prototype; confirm per city before launch (A-01 and the relevant Q-06, Q-07 and Q-09 decisions). Values match the Design Context Pack.

| Item | Value |
|---|---|
| Delivery fee | Up to 2 km ₹20; up to 4 km ₹35; up to 7 km ₹50; outside radius not deliverable. |
| Rider earning | Base ₹20 + ₹7/km, rounded to nearest rupee. |
| Platform fee | ₹5/order. |
| Commission/plans | Default 6%; Basic ₹0/month at 6%, Growth ₹499/month at 4%, Pro ₹999/month at 3%. |
| Promotions | Featured listing (7 days) ₹199; homepage banner (7 days) ₹699. |
| Coupons | APNA50: flat ₹50 above ₹299; WELCOME10: 10% up to ₹100. |
| Refund window | 24 hours after delivery. |
| Codes/timers | Login OTP 6 digits; resend 30 seconds; delivery OTP 4 digits; pickup code 4 digits; rider request 60 seconds. |
| Search radius | Default 6 km; slider 1–12 km. |
| Flags | Reviews, guestBrowse, WhatsApp ON; booking, donations OFF; online payments and COD ON. |
| GST | Prices include GST; invoice is a printable tax invoice. |

## Validation

| Input | Requirement |
|---|---|
| Phone/OTP | +91 phone number, 10 digits; numeric 6-digit login OTP; server generated/verified. |
| PIN | 6 digits. |
| Names | 2–60 characters. |
| Price/stock | Non-negative integer paise; MRP >= price; stock >= 0. |
| Embed | youtube.com/youtu.be/instagram.com; allowed Instagram /reel/, /p/, /tv/ paths; strict ID extraction; rebuild URL server-side. |
| Service pricing | from/fixed/range/enquiry; enquiry has no amount. |
| Review | 1–5 stars; <=1000 chars; links/abusive content pending moderation. |
| Enquiry | Message required; optional preferred date cannot be past. |
| Subcategory | Required name; duplicate detection on normalized name. |
| Explore URL | `/explore?tab=services&category=wedding-events&subcategory=dj-sound,tent-lighting`; parse and validate slugs; category removal removes dependent subcategories; Search state separate. |

## Error contract

Errors must be machine-readable, localized via message key, have a correlation ID, omit stack traces and sensitive fields. P01 proposes envelope `{ code, messageKey, fieldErrors, correlationId }` and candidate codes `VALIDATION_ERROR, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, UNAVAILABLE, CONFLICT, INVALID_TRANSITION, RATE_LIMITED, CONSENT_REQUIRED, BUSINESS_RULE_VIOLATION, DEPENDENCY_UNAVAILABLE`; P04 owns final mapping. Never log/return OTP, pickup code, full phone, payment data, or raw KYC. This candidate contract is recorded in the Open Issues appendix.
