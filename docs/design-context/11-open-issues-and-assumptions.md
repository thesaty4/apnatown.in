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
## Open questions
Q-01 payment gateway; Q-02 maps/geocoding provider; Q-03 video upload hosting and transcoding; Q-04 WhatsApp Business sender and template approval process; Q-05 KYC retention period; Q-06 commission and invoicing rules, GST handling; Q-07 refund SLA and moderation SLAs; Q-08 owner of Hindi translation review; Q-09 exact delivery slabs per city; Q-10 vendor staff roles; Q-11 analytics and event-tracking plan; Q-12 legal copy (terms, privacy, refund); Q-13 data residency, backups and retention; Q-14 SEO: indexable facets policy owner; Q-15 OTP/SMS provider and DLT registration.
