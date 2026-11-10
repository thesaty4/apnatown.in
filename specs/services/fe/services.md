# FE: services

## Contents

- [Routes and rendering](#routes-and-rendering)
- [Screens](#screens)
- [Components and integrations](#components-and-integrations)
- [i18n and analytics](#i18n-and-analytics)
- [Tests](#tests)

Features: F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, F-VD-014, F-VD-016, F-PV-003, F-PV-004 | Screens: S-CUST-09, S-VEND-13/14, S-PROV-03/08 | Flows: J2, J14

Backend contract: [BE services](../be/services.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/service/[slug]` | S-CUST-09 | ISR; revalidate service, business, media and offer tags on owning-module changes | Public | Self-canonical; index only for active service of approved business |
| `/vendor/services` | S-VEND-13 | SSR initial page; editor and active toggle are client islands | Vendor, own business | Noindex |
| `/vendor/enquiries` and `/vendor/enquiries/[id]` | S-VEND-14 | SSR private shell; inbox/detail client islands with keyset pagination | Vendor, own business | Noindex |
| `/provider/enquiries` and `/provider/enquiries/[id]` | S-PROV-03 | SSR private shell; inbox/detail client islands with keyset pagination | Provider, own business | Noindex |
| `/provider/services` | S-PROV-08 | SSR initial page; editor and active toggle are client islands | Provider, own business | Noindex |

## Screens

Standard default, skeleton, empty, error+retry, offline and no-permission behavior is defined in [frontend-shared.md](../../_foundation/frontend-shared.md). Match the named screenshots and shared design tokens; statuses always include text/icon, not color alone (BR-22).

### S-CUST-09 — Service details

- Screenshots: `d-customer-service-b4-sv2.jpg`, `d-customer-service-s11-sv1.jpg`, `d-customer-service-s7-sv0.jpg`, `m-customer-service-b4-sv2.jpg`.
- Layout: mobile stacks breadcrumb, image carousel, details and enquiry form; tablet/desktop use two-column media/details, then inclusions, availability, provider, videos, previous work, reviews, FAQs and related sections. Reuse `Breadcrumbs`, `MediaCarousel`, `ServiceCard`, `Avatar`, `Rating`, `FollowButton`, `IconButton`, `ShareSheet`, `Accordion`, `OfferBanner`, `GalleryGrid`, `EmbedCard`, `ReviewForm`, `RatingBreakdown`, `EnquiryForm`, and `Input` textarea mode.
- Data: `GET /services/{slug}`; offers, reviews, follow/bookmark, directions and approved videos come from owning modules. ISR tags are invalidated by their owners.
- Special states: enquiry success; paused service; no reference videos; no reviews; empty related services.
- Interactions: carousel is keyboard operable; breadcrumb links open Explore Services with category/subcategory; call, WhatsApp and Directions are explicit user-initiated links. Guest enquiry submits without login; Save/Follow prompts login and returns to this service. Booking/payment placeholder is disabled. Enquiry form fields are name, 10-digit phone, message and optional non-past preferred date.
- Rules: F-SV-001, F-SV-002, F-SV-003, F-SV-004, F-SV-005, F-SV-006, F-SV-007, F-SV-008 (catalog-owned), F-LC-003, F-RV-005 and F-X-010 (owning modules); BR-06/08/09/10/14/18/21; reviews become available only after verified-enquirer eligibility.
- Given an active service is opened, when the page loads, then its single subcategory and breadcrumb/filter links match.
- Given a service is paused, when its direct URL is opened, then the paused state is shown and enquiry submission is disabled.
- Given a guest submits a valid enquiry, when the server confirms it, then show localized success without requiring login or exposing the phone in analytics.
- Given a guest selects Save or Follow, when login is required, then return to the same service and restore the intended action.
- Given Hindi copy or keyboard navigation is used, when all sections are explored, then labels, accordion, carousel and validation remain accessible without clipping.

### S-VEND-13 — Vendor services manager

- Screenshots: `d-vendor-vservices.jpg`, `m-vendor-vservices.jpg`.
- Layout: `DashboardShell` with responsive service list, `StatusBadge`, and `Sheet` editor; use `Select`, `Input`, `Uploader`, `MediaSorter`, `MediaConsentToggle`, `Toggle`, `Button` and `ConfirmDialog`.
- Data: owner-scoped service list and mutations from BE services; approved video submission uses media-videos. Cache by business ID and invalidate after mutation.
- Special states: no services; stale version conflict.
- Interactions: editor fields follow the prototype (title, category, one subcategory, description, price type/amount/unit, included/excluded, service area, photos, optional video link, Gallery toggle and active toggle). Confirm delete; copy link reports success. The service-level Gallery control and FAQ behavior remain subject to Q-50/Q-52.
- Rules: F-VD-014, BR-06/08/16; only one subcategory per service. Supported units follow the service editor contract.
- Given a vendor edits a service outside their business, when saved, then show no-permission and preserve all data.
- Given a vendor submits an invalid category/subcategory pair or price range, when saved, then show field errors and do not close the editor.
- Given a vendor pauses a service, when saved, then the status label updates and public enquiry is unavailable.

### S-VEND-14 / S-PROV-03 — Enquiries inbox and detail

- Screenshots: vendor `d-vendor-venq-e1.jpg`, `d-vendor-venq.jpg`, `m-vendor-venq-e1.jpg`, `m-vendor-venq.jpg`; provider `d-provider-senq-e1.jpg`, `d-provider-senq.jpg`, `m-provider-senq-e1.jpg`, `m-provider-senq.jpg`.
- Layout: `DashboardShell` with keyset-paginated `DataTable`/mobile cards, status filters and selected detail; use `StatusBadge`, `Pagination` and `Button`. Provider and vendor use the same shared view.
- Data: owner-scoped inbox/detail/status endpoints; status mutation invalidates the inbox and detail query.
- Special states: no enquiries; no result for selected status; stale transition conflict.
- Interactions: call/WhatsApp open native/external user-initiated links; explicit status action advances only valid ST-enquiry transitions. Never auto-send a WhatsApp message.
- Rules: F-VD-016, F-PV-004, ST-enquiry, BR-09/14.
- Given a vendor/provider opens another business's enquiry, when detail is requested, then show no-permission without exposing PII.
- Given an enquiry is new, when the owner marks it contacted, then the status updates; invalid transitions show localized conflict feedback.
- Given a converted enquiry is displayed, when the owner selects review eligibility information, then the reviews module is the source of truth.

### S-PROV-08 — Provider services manager

- Screenshots: `d-provider-sservices.jpg`, `m-provider-sservices.jpg`.
- Layout/data/interactions: same as S-VEND-13, with provider-owned services and the provider role gate; F-SV-008 remains catalog-owned and F-PV-007's disabled placeholder remains businesses-owned.
- Special states: no services; booking/payment placeholder remains disabled and has no mutation or route (F-PV-007 is owned by businesses).
- Rules: F-PV-003, BR-06/08/16.
- Given a provider attempts to edit a vendor service, when the request is sent, then authorization denies it.
- Given booking is disabled, when the provider manager renders, then no booking/payment control is actionable.

## Components and integrations

Service card is reusable by Search, Explore, business profiles and category pages; Search owns those screens and uses this module's read contract. Reuse components from `packages/ui` and `frontend-shared.md`; add no module-local duplicate for shared cards, states, forms or status badges. Provider expertise selection in onboarding/profile uses `PUT /businesses/me/expertise`, owned here and surfaced by the businesses screens.

## i18n and analytics

- Key prefixes: `service.detail.*`, `service.enquiry.*`, `service.manager.*`, `service.enquiries.*`; provide EN/HI for headings, price labels, status, validation, success and error copy.
- Analytics: `service.detail.view`, `service.enquiry.submit`, `service.manager.save`, `service.enquiry.status_change`; never include phone, name or message.
- Verify long Hindi labels at 360px, keyboard focus order, reduced motion and light/dark states.

## Tests

- Component: service detail active/paused, enquiry validation/success, service editor price/subcategory validation, inbox status and no-permission.
- E2E: J2 service discovery-to-enquiry; J14 provider inbox-to-converted review eligibility.
- Screenshot checks: named mobile/desktop service, manager and inbox images; EN/HI and light/dark.
