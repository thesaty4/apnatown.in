# 11 Open issues, assumptions and conflicts

- **Purpose:** Everything not decided, assumed or inconsistent in the design. Copilot must record new items here instead of guessing.
- **Audience:** Product owner, tech lead, Copilot agents
- **Related:** all files in this pack
- **Last updated:** 2026-11-10

## Assumptions used in the design (confirm or change)
| ID | Assumption |
|---|---|
| A-01 | Delivery fee slabs, rider earning, commission, plans, promotion prices, coupons and refund window are **sample values** from the prototype settings; real values per city to be decided |
| A-02 | Hindi translations are machine-assisted and unreviewed by a native speaker |
| A-03 | Maps are schematic in the prototype; real maps/geocoding provider not chosen |
| A-04 | YouTube/Instagram embeds depend on the host allowing embedding; seed video ids are samples; the "Open in" fallback is always shown |
| A-05 | Reels playback in the prototype is simulated (poster + progress bar); real playback uses embeds or hosted video |
| A-06 | Payments, OTP, WhatsApp and file uploads are simulated; demo OTP 123456 exists only in the prototype and must never exist in production |
| A-07 | Search relevance is a keyword mapping table + small typo tolerance, not a full search engine |
| A-08 | Only Padrauna is live; Kasia is "coming soon"; Deoria and Gorakhpur planned |
| A-09 | QR codes are generated client-side from a CDN library in the prototype; production should generate them locally |
| A-10 | Staff accounts for vendors are a list placeholder |
| A-11 | Admin permission actions in the prototype are view/edit; role templates also support create/delete/export |
| A-12 | Hindi coverage in the prototype is partial for admin/dashboard strings (927 strings extracted; many admin strings fall back to English) |
## Gaps and contradictions noticed
| ID | Item | Proposed handling |
|---|---|---|
| G-01 | Business-page text says "show only the switch that applies" but also wants an empty state "This business has not added any services yet" | Show only applicable segments to customers; show both segments to the owner so the empty state is reachable; confirm |
| G-02 | A provider "can be an expert in only one subcategory" (Round 2 brief) vs "select one or several subcategories" (dashboard brief) | Implemented as: each **service** has one subcategory; the **provider** has several expert-in subcategories; confirm |
| G-03 | The "Home Construction" category is labelled "Home Builders" in the prototype | Use "Home Construction" with slug `home-construction`; confirm |
| G-04 | Prototype routes are hash-based; production URLs are path-based (see 02) | Use the production routes; keep Explore query contract identical |
| G-05 | Prototype stores state in localStorage; production must not store tokens or PII in browser storage | Server sessions with httpOnly cookies; only UI preferences in localStorage |
| G-06 | The hosted prototype may not keep a query string in the address bar | Production hosting keeps it; contract is in 07 and the Explore features |
| G-07 | Tablet horizontal filter bar is specified but not built in the prototype | Build from spec EX7 using the shared FilterPanel |
| G-08 | Video upload hosting vs link-only | Link-based first; hosting decision open |
| G-09 | Comments are shown with moderation placeholder only | Implement moderation queue with comments in the admin video module |
| G-10 | The desktop and mobile `dark-customer-explore.jpg` screenshots are byte-identical to their light variants | Use the runnable prototype's dark theme and token overrides as the visual source; regenerate or confirm the dark screenshots before pixel-level dark-mode review |
## Open questions
Q-01 payment gateway; Q-02 maps/geocoding provider; Q-03 video upload hosting and transcoding; Q-04 WhatsApp Business sender and template approval process; Q-05 KYC retention period; Q-06 commission and invoicing rules, GST handling; Q-07 refund SLA and moderation SLAs; Q-08 owner of Hindi translation review; Q-09 exact delivery slabs per city; Q-10 vendor staff roles; Q-11 analytics and event-tracking plan; Q-12 legal copy (terms, privacy, refund); Q-13 data residency, backups and retention; Q-14 SEO: indexable facets policy owner; Q-15 OTP/SMS provider and DLT registration.

## P01 specification assumptions and open items

These additions are append-only and do not replace the assumptions or questions above. Values marked provisional are planning inputs only; they are not approved product or vendor decisions.

### Assumptions

| ID | Assumption | Impact |
|---|---|---|
| A-13 | P01 proposes Prisma, Redis/BullMQ, PostgreSQL full-text plus `pg_trgm`, an S3-compatible storage port, SSE for server-to-client status updates, and candidate India payment/OTP/maps providers. These are recommendations only; P02/P09 and product owners must confirm before implementation or procurement. | No provider credentials, external integration, or production topology may be treated as selected based only on P01. |
| A-14 | P01 uses provisional NFR planning values where the pack has none: TTFB p75 <=800 ms, RPO <=15 minutes, RTO <=4 hours, Padrauna launch capacity 10,000 MAU/50 sustained API requests per second/150 short-peak requests per second, and a 10-city scenario of 100,000 MAU/500 sustained requests per second. | Capacity and recovery design must be revised after product forecast, provider/SLO review, and load testing. |
| A-15 | P01 proposes a machine-readable API error envelope (`code`, `messageKey`, `fieldErrors`, `correlationId`) and candidate error codes for P04 to confirm. | Error-code names and HTTP status mapping are not final until approved in the backend specification. |
| A-16 | F-X-001 requires the language choice to persist, but the pack does not specify whether it belongs to a signed-in profile or the current device. P01 traces it to a logical user/device preference without selecting storage. | P03/P04 must confirm preference ownership and retention before choosing a table or persistence mechanism. |

### Open questions

| ID | Question | Assumption used while P01 proceeds | Impact |
|---|---|---|---|
| Q-16 | What TTFB target, launch/10-city workload, RPO and RTO should be approved? | Treat A-14 values as planning targets only; replace them after product forecast, SLO review and load testing. | Do not use the figures as a production capacity or recovery commitment before approval. |
| Q-17 | For lifecycle transitions whose actor, guard or transition edge is not specified in the pack, what exact actors and guards apply? | Keep only source-defined edges and mark unspecified actors/guards for the owning BE spec. | Do not enable additional transitions until approved. |
| Q-18 | Approve or replace the P01 candidate API error envelope and machine-readable codes in A-15. | Use the candidate shape only as a trace handle; final names and HTTP mappings remain unapproved. | Backend DTOs and clients must not treat the candidate contract as final. |
| Q-19 | Approve or replace the P01 technology proposals in A-13; keep payment, OTP/SMS, WhatsApp, maps, storage and hosting provider decisions subject to their existing questions. | Treat all proposals as options behind ports, not selected dependencies. | No procurement, credentials or production integration decision follows from P01. |

## LEAN SPECS follow-up questions

These are additions for the backend/frontend foundation specs. Existing Q-01..Q-19 remain authoritative; recommendations below are not provider or product approvals.

| ID | Question | Assumption used while writing the foundation | Impact |
|---|---|---|---|
| Q-20 | Does the LEAN SPECS prompt's fixed PostgreSQL/PostGIS target supersede the proposed tech-stack ADR and the earlier database-open decision? | Specs target PostgreSQL/PostGIS as explicitly requested; the ADR remains proposed until a human reconciles it. | Do not treat the documentation conflict as approval to procure or provision production infrastructure. |
| Q-21 | For online checkout split across shops, is the gateway charge captured once per checkout or separately per shop? | Keep one idempotent checkout attempt and the BR-03 per-shop order/payment records; leave provider charge/capture topology to the payments decision. | Payments, reconciliation and refund specs must agree before gateway integration. |
| Q-22 | Which storage provider and region serve product, service, gallery and uploaded video media? | Specify only a storage port, fake and S3-compatible recommendation; select neither vendor nor region. | Retention, signed access, upload limits and data residency must be confirmed before implementation. |
| Q-23 | What production URL represents an indexable subcategory landing page? | Keep filter combinations `noindex`; do not invent a subcategory route beyond the current `/category/:slug` inventory. | SEO sitemap and canonical rules cannot include subcategory landing pages until the route is confirmed. |
| Q-24 | How are English and Hindi locale variants represented in production URLs for `hreflang`? | Use next-intl locale routing, but do not assume a locale prefix or cookie-only URL strategy. | Canonicals and alternates need the approved locale routing contract. |
| Q-25 | Which hosting region and backup/retention policy are approved for launch? | Recommend an India region; keep deployment provider, residency and recovery targets open under Q-13. | No production hosting or backup commitment follows from the recommendation. |
| Q-26 | Which API error envelope is canonical: P01's `messageKey`/`fieldErrors` proposal or the LEAN SPECS `message_key`/`status`/`details` contract? | Foundations use the exact LEAN SPECS contract; keep P01's candidate unapproved until the backend contract is reconciled. | API, OpenAPI and web clients must use one shape before implementation. |
| Q-27 | How should the design system reconcile 40px compact buttons and 44px action-bar buttons in prototype CSS with the 48px minimum touch-target rule, and what is the missing `lg` button metric? | Match the prototype's 40px `sm` and 48px base button metrics; retain the 48px accessibility target requirement for layouts and have the design owner approve exceptions/`lg`. | Final Tailwind size utilities and WCAG touch-target audit depend on this decision. |
| Q-28 | Are the desktop/mobile dark Explore screenshots intentionally identical to light screenshots or should they be regenerated? | Use prototype CSS and the documented dark tokens for dark-mode specs until the images are corrected. | Screenshots cannot currently validate dark-mode visual parity. |
| Q-29 | Does the LEAN SPECS default of pg-boss with no Redis supersede P01's A-13 Redis/BullMQ proposal? | Follow the latest prompt: use pg-boss and no Redis at launch; treat A-13 as superseded, unapproved guidance. | Reconcile the architecture ADR and any later operations specs before implementation. |
