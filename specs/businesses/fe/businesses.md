# FE: businesses

Features: F-PF-001, F-PF-002, F-PF-003, F-PF-004, F-PF-005, F-PF-006, F-PF-007, F-PF-011, F-PF-012, F-PF-013, F-VD-001, F-VD-002, F-VD-003, F-VD-011, F-VD-018, F-PV-001, F-PV-002, F-PV-006, F-PV-007, F-X-011 | Screens: S-CUST-06, S-CUST-07, S-VEND-01, S-VEND-02, S-VEND-10, S-VEND-12, S-VEND-18, S-PROV-01, S-PROV-02, S-PROV-09, S-PROV-13, S-PROV-14, S-PROV-16 | Flows: J7

Backend contract: [BE businesses](../be/businesses.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

Logo/cover Uploaders, media panels and location pins follow the shared
[media/map contract](../../_foundation/media-and-maps.md). Public-purpose
images use Cloudinary through Media; onboarding documents stay private even
when they are photos. Reuse Leaflet MapView and the typed link-only renderer.

## Routes and rendering

| Route | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/shop/[slug]` | S-CUST-06 | ISR; approved public business data, revalidate on profile/status change | Public | Self-canonical/index only while approved and live |
| `/provider/[slug]` | S-CUST-07 | ISR; approved public business data, revalidate on profile/status change | Public | Self-canonical/index only while approved and live |
| `/vendor/onboarding` | S-VEND-01 | SSR shell; form client island | Authenticated applicant/vendor | Noindex |
| `/provider/onboarding` | S-PROV-01 | SSR shell; form client island | Authenticated applicant/provider | Noindex |
| `/vendor/overview` | S-VEND-02 | SSR, private module summaries | Owned shop applicant/vendor; current capabilities | Noindex |
| `/provider/overview` | S-PROV-02 | SSR, private module summaries | Owned provider applicant/provider; current capabilities | Noindex |
| `/vendor/profile` | S-VEND-12 | SSR initial data; edit/preview client island | Owned shop applicant/vendor; editable profile capability | Noindex |
| `/provider/profile` | S-PROV-09 | SSR initial data; edit/preview client island | Owned provider applicant/provider; editable profile capability | Noindex |
| `/vendor/qr` | S-VEND-10 | SSR profile; local QR/print client island | Owner/applicant capability for own business with assigned slug | Noindex |
| `/provider/qr` | S-PROV-13 | SSR profile; local QR/print client island | Owner/applicant capability for own business with assigned slug | Noindex |
| `/provider/analytics` | S-PROV-14 | SSR private data; charts client island | Provider, own business | Noindex |
| `/vendor/account` | S-VEND-18 | SSR private account shell; forms client island | Vendor, own account | Noindex |
| `/provider/account` | S-PROV-16 | SSR private account shell; forms client island | Provider, own account | Noindex |

## Screens

Shared UX states come from `frontend-shared.md`; use the screen-specific states below. Match prototype layouts/tokens and screenshot behavior; do not expose OTPs or private documents.

Owner API calls set `X-Business-Kind` from the vendor/provider route group; the server resolves ownership and capabilities. Do not retain one role's private query cache when changing business context. Provider-product fulfilment settings UX is an explicit BE decision gate; unconfigured delivery/pickup is not an implicit free service.

### S-CUST-06 — Shop profile

- Screenshots: `d-customer-biz-b1.jpg`, `d-customer-biz-b3.jpg`, `d-customer-biz-b4.jpg`, `d-customer-biz-b5.jpg`.
- Layout: mobile stacks cover/header/actions/tabs; tablet and desktop use the shared profile regions. Use `ShopCard`, `Rating`, `Tabs`, `CategoryPillRow`, `ShareSheet`, `FollowButton`.
- Data: `GET /businesses/public/{slug}`; Products `GET /businesses/public/{slug}/products` and Services `GET /businesses/public/{slug}/services` provide results/counted pills; offers, media, reviews and follow state use their owning modules. Location-dependent distance/delivery eligibility is a no-store island, never cached in the shared ISR profile.
- Special states: not live (`business.profile.notLive`), temporarily closed (`business.profile.closed`), outside delivery range (`business.profile.outsideRange`), no services/products (`business.profile.noServices`, `business.profile.noProducts`).
- Interactions: render About, Products & Services, Offers, Gallery, Videos/Reels, Reviews and Contact & Location tabs. Show today's hours, distance, delivery/pickup eligibility and only applicable customer product/service segments; keep category pills/counts sticky. Call/WhatsApp/Directions/Share/QR use approved profile fields; Report listing opens the admin-owned reporting flow; Save, product cart and service enquiry use their owning modules. F-PF-008 is engagement-owned; F-PF-009/010 media panels remain media-videos owned.
- Rules: F-PF-001, F-PF-002, F-PF-003, F-PF-004, F-PF-005, F-PF-006, F-PF-007, F-PF-011, F-PF-012, F-PF-013; BR-06/16/21; status includes text/icon, not colour alone. Follow G-01 for customer versus owner segment visibility.
- Given a business is not approved, when its public route is requested, then private application data is not disclosed and the unavailable copy is shown; the Verified badge is never derived from approval status.
- Given a live business is closed, out of range or has no eligible listings, when its profile loads, then the matching special state appears without hiding unrelated sections.
- Given a guest invokes a gated action, when login is required, then return-to-origin restores this profile; keyboard, EN/HI and dark states remain usable.

### S-CUST-07 — Service provider profile

- Screenshots: `d-customer-svc-s1.jpg`, `d-customer-svc-s3.jpg`, `d-customer-svc-s5.jpg`, `m-customer-svc-s1.jpg`.
- Layout: same unified regions as S-CUST-06, with provider expertise and service sections; use `ServiceCard`, `SubcategoryPillRow`, `ShareSheet`, `FollowButton`.
- Data: business public DTO plus expertise/services/reviews/media/follow from owning modules.
- Special states: listing not live (`business.profile.notLive`); no services (`business.profile.noServices`).
- Interactions: service enquiry routes to `services`; call/WhatsApp/directions/share/save use the profile or owning module contract.
- Rules: F-PF-001–007, F-PF-011/012; BR-06/08/21. Expertise is multi-select; each service still has one subcategory.
- Given a provider is approved, when the profile loads, then only public profile and provider expertise data are shown.
- Given the provider has no active services, when the services section loads, then its empty copy is shown without a booking or payment action.
- Given a guest sends an enquiry, when the form is submitted, then Services accepts the guest flow without a fabricated login requirement; gated Save/Follow actions retain the profile return path.

### S-VEND-01 — Vendor onboarding wizard

- Screenshots: `d-vendor-vonboard.jpg`, `m-vendor-vonboard.jpg`.
- Layout: centered seven-step wizard on desktop and compact mobile column; use `Stepper`, `PhoneInput`, `OtpInput`, `Input`, `Select`, `MapView`, `Uploader`, `Button`.
- Data: OTP through auth; create/update/submit and optional private docs through BE businesses. Review cross-module category/area choices from catalog/geo.
- Special states: draft resume (`business.onboarding.draftSaved`); pending (`business.onboarding.pending`), rejected with reason (`business.onboarding.rejected`), changes requested (`business.onboarding.changesRequested`), suspended (`business.onboarding.suspended`) and inactive (`business.onboarding.inactive`).
- Interactions: seven steps are mobile/OTP, business type, basics, location, hours/delivery, optional documents, review; Back, Save draft and Next retain entered data. OTP is delivered by the auth adapter; never show prototype demo code `123456`.
- Rules: F-VD-001, ST-approval, BR-06/14; app state changes only through submit/decision endpoints.
- Given OTP verification fails, when Next is selected, then progression is blocked and the draft remains unchanged.
- Given an applicant saves and resumes a draft, when the wizard reloads, then the server draft restores the completed steps.
- Given required details are valid, when the applicant submits with no optional documents, then status becomes pending and follows ST-approval.

### S-PROV-01 — Provider onboarding wizard

- Screenshots: `d-provider-sonboard.jpg`, `m-provider-sonboard.jpg`.
- Layout: same seven-step wizard as S-VEND-01.
- Data: auth OTP and businesses application; provider expertise writes through services contract.
- Special states: draft resume (`business.onboarding.draftSaved`) and ST-approval keys `business.onboarding.pending/rejected/changesRequested/suspended/inactive`.
- Interactions: capture service area and provider expertise through services; optional documents may be submitted. Do not promise the Verified badge until Q-41 is resolved; no booking/payment setup is enabled.
- Rules: F-PV-001/002/007, ST-approval, BR-06/08.
- Given a provider edits an application, when its owner does not match the session, then the API denies the write.
- Given provider expertise is selected, when onboarding saves, then it remains separate from each service's single subcategory.
- Given booking/quotation/payment are feature-flagged off, when their placeholders render, then no mutation or booking route is exposed.

### S-VEND-02 — Vendor overview

- Screenshots: `d-vendor-vhome.jpg`, `m-vendor-vhome.jpg`.
- Layout: `DashboardShell`, KPI/cards, charts, low-stock and pending-action regions.
- Data: `GET /businesses/me/overview` composes Products/Orders summaries and business capabilities; do not add a second business metrics store. Each unavailable section has independent error/retry rather than a false zero.
- Special states: not approved limited access (`business.dashboard.limitedAccess`); no low-stock/pending actions (`business.dashboard.noActions`).
- Interactions: cards deep-link to their owning dashboard screens; retry summaries independently.
- Rules: F-VD-002, BR-06; data is read-only here.
- Given the business is pending, when the overview loads, then only limited permitted actions are available.
- Given products/orders have summary data, when cards render, then counts match owner-scoped source modules.
- Given no low-stock or pending actions exist, when the dashboard loads, then empty states are shown rather than errors.

### S-PROV-02 — Provider overview

- Screenshots: `d-provider-shome.jpg`, `m-provider-shome.jpg`.
- Layout: `DashboardShell`, status banner, KPI row, enquiries/chart and coming-soon panel.
- Data: `GET /businesses/me/overview` provides status, enquiry counts/latest records and source-owned rating/follower summaries; use reporting-v1 view/conversion definitions and coverage metadata.
- Special states: no enquiries (`business.dashboard.noEnquiries`); analytics unavailable (`business.analytics.unavailable`).
- Interactions: open inbox via services; booking, quotation and payment remain placeholders with the feature flag off and no API mutation.
- Rules: F-PV-006, F-PV-007, BR-06; no synthetic analytics. Reviews/followers/gallery/video screens in F-PV-006 are owned by reviews, engagement and media-videos.
- Given a provider opens the overview, when enquiries load, then only that provider's records are shown.
- Given historical metric evidence is unavailable, when the overview renders, then unavailable is distinct from zero and no synthetic values appear.
- Given the booking flag is off, when the coming-soon panel renders, then booking, quotation and payment remain non-actionable.

### S-VEND-12 — Business profile editor

- Screenshots: `d-vendor-vprofile.jpg`, `m-vendor-vprofile.jpg`.
- Layout: desktop form beside sticky live preview; mobile stacked form/preview. Use `Input`, `Select`, `Uploader`, `MapView`, `Toggle`, `Button`.
- Data: GET/PATCH `/businesses/me` uses the full typed profile/settings DTO and one version; POST `/businesses/me/media` returns ready logo/cover asset IDs to attach on save. Category and map options come from Catalog/Geo; uploads use Media's private validated asset port.
- Special states: pending profile-only edit (`business.profile.pendingEdit`); upload error (`business.profile.uploadError`); version conflict (`business.profile.versionConflict`).
- Interactions: edit logo/cover, EN/HI name, category, description, contacts/social links, address/area/pin, weekly hours, temporary closure and vendor delivery/pickup settings including pickup instructions; preview updates without publishing unconfirmed edits. Do not add a holiday editor absent from the source.
- Rules: F-VD-003, BR-01/02/06/14; money in paise; coordinates optional.
- Given an owner saves valid profile fields, when the API confirms, then the preview reflects the saved public DTO.
- Given invalid contact data or a stale version, when save is attempted, then field values remain and a localized error appears.
- Given logo/cover upload fails validation, when the form renders its error, then the prior asset remains and no unapproved asset is public.

### S-PROV-09 — Provider profile editor

- Screenshots: `d-provider-sprofile.jpg`, `m-provider-sprofile.jpg`.
- Layout: same editor/preview pattern as S-VEND-12 with provider expertise/service-area controls.
- Data: GET/PATCH `/businesses/me`; expertise GET/PUT uses Services' independent `expertiseVersion`, not the business version; logo/cover use `/businesses/me/media`.
- Special states: pending edit only (`business.profile.pendingEdit`); empty expertise (`business.profile.noExpertise`); version conflict (`business.profile.versionConflict`).
- Interactions: update profile, hours, pin and service radius; expertise uses catalog-backed multi-select.
- Rules: F-PV-002, BR-06/08.
- Given a provider edits expertise, when saved, then service subcategory IDs remain unchanged.
- Given another provider or a stale version attempts a write, when rejected, then no profile or expertise data changes.
- Given a localized profile is saved, when preview updates, then it uses the matching localized name and approved media.

### S-VEND-10 — QR and links

- Screenshots: `d-vendor-vqr.jpg`, `m-vendor-vqr.jpg`.
- Layout: responsive preview with poster/table-tent/sticker selector, share link and product links.
- Data: the business slug is assigned once when its application is submitted; generate its `/shop/{slug}` QR locally, with no CDN request or persisted QR asset. Product links come from Products.
- Special states: before approval, the owner can preview/copy the QR but sees `business.qr.notLive`; scanning resolves to the unavailable public state. Renderer failure offers Retry; print unavailable offline (`business.qr.offline`).
- Interactions: copy/share link; select template; browser print / Save as PDF. Invoice and order-slip templates are owned by orders, not this screen.
- Rules: F-VD-011, F-X-011; print output hides dashboard chrome.
- Given an owner has submitted an application, when the QR screen renders, then the local renderer deterministically encodes the immutable canonical shop URL without a server-side QR record.
- Given a pending, suspended, inactive or deleted business QR is scanned, when the public route resolves, then no unpublished profile information is exposed; approved profiles resolve normally.
- Given the vendor prints poster, table tent or sticker, when the print dialog opens, then only the selected template prints without dashboard chrome.
- Given a different owner requests links, when the route loads, then no protected product/business links are returned.

### S-PROV-13 — Provider QR

- Screenshots: `d-provider-sqr.jpg`, `m-provider-sqr.jpg`.
- Layout: provider QR card and share controls; use provider logo/name where available.
- Data: own submitted provider URL; no API write or persisted QR asset.
- Special states: pre-approval public target is unavailable (`business.qr.notLive`); local renderer failure offers Retry.
- Interactions: local QR, copy/share, browser print.
- Rules: F-PV-006, F-X-011.
- Given an owner opens QR after submission, when it is generated, then the target is its canonical provider URL and retries do not create new assets.
- Given QR is rendered, when the screen loads, then generation uses a local library and makes no CDN request.
- Given Hindi is selected, when the QR print view is generated, then all supporting text remains readable.

### Business category selection

- On S-VEND-01/S-PROV-01 onboarding and S-VEND-12/S-PROV-09 profile editing, select one or more active product categories and exactly one primary category. Provider expertise stays a separate Services-owned multi-select.
- Given a submitted category selection omits its primary, duplicates an ID or includes a service category, when saved, then validation identifies the field and retains the draft.
- Given a category is removed from an existing business, when discovery refreshes, then category memberships/counts update once and products/services retain their own taxonomy.

### S-PROV-14 — Provider analytics

- Screenshots: `d-provider-sanalytics.jpg`, `m-provider-sanalytics.jpg`.
- Layout: KPI cards, views-vs-enquiries chart and enquiry-status mix, with accessible chart table fallback.
- Data: `GET /businesses/me/analytics?period=30d`; render daily enquiry/status counts, window-deduplicated profile views and enquiry-cohort conversion from reporting-v1. Zero denominator is not applicable; missing history is unavailable.
- Special states: empty analytics (`business.analytics.empty`).
- Interactions: no data mutation; chart tooltips and equivalent table are keyboard accessible.
- Rules: F-PV-006; no fabricated sample values in production.
- Given reporting-v1 covered records exist, when analytics loads, then only authorized provider metrics are returned.
- Given the period has no source data, when the screen loads, then the explicit empty state appears without sample counts.
- Given a chart is rendered, when used by keyboard or assistive technology, then labels and values are available without colour-only cues.

### S-VEND-18 — Vendor account

- Screenshots: `d-vendor-vaccount.jpg`, `m-vendor-vaccount.jpg`.
- Layout: account sections for owner, payout, staff, security and language; use shared `Input`, `Button`, `Toggle`.
- Data: owner/security/language via users/auth/settings; payout via payments. Staff remains a display placeholder until Q-10 defines roles. The login phone remains auth-owned; Q-43 resolves whether it can be changed.
- Special states: payout unavailable (`business.account.payoutUnavailable`); save validation/error (`business.account.saveError`).
- Interactions: save owner name; render login phone as non-editable pending Q-43; navigate to payout/security/language owners. No staff invitation or role mutation.
- Rules: F-VD-018, BR-12/14.
- Given a vendor opens account settings, when data loads, then owner and payout data come only from their owning modules.
- Given the owner saves account details, when the request is submitted, then another user's account cannot be changed and login phone is not persisted pending Q-43.
- Given staff roles remain unresolved under Q-10, when the staff section renders, then it offers no invite or permission mutation.

### S-PROV-16 — Provider account

- Screenshots: `d-provider-saccount.jpg`, `m-provider-saccount.jpg`.
- Layout: owner, OTP security, language and help sections; responsive dashboard shell.
- Data: users/auth/settings contracts only; no business-owned account table. The login phone remains auth-owned; Q-43 resolves whether it can be changed.
- Special states: save validation/error (`business.account.saveError`).
- Interactions: save owner name; render login phone as non-editable pending Q-43; help and language actions route to their owners.
- Rules: F-PV-006, BR-14.
- Given a provider saves owner details, when the request is submitted, then cross-owner edits are denied and login phone is not persisted pending Q-43.
- Given OTP security information is shown, when no change-phone/recovery action is approved under Q-43, then it remains informational and invokes no nonexistent mutation.
- Given Hindi or keyboard navigation is used, when account settings render, then labels, focus and errors remain accessible.

## Feature components and shared components

Feature-only: `BusinessOnboardingWizard`, `BusinessProfileHeader`, `BusinessProfileEditor`, `BusinessQrPrintTemplate`, `BusinessAnalyticsPanel`. Reuse `DashboardShell`, `Stepper`, `PhoneInput`, `OtpInput`, `Input`, `Select`, `Uploader`, `MapView`, `Toggle`, `Tabs`, `ShopCard`, `ServiceCard`, `Rating`, `KpiCard`, `Charts`, `ShareSheet`, `FollowButton`, and shared state views; data fetching remains in feature route/server or hooks.

## i18n and analytics

- Key prefixes: `business.profile.*`, `business.onboarding.*`, `business.dashboard.*`, `business.qr.*`, `business.account.*`, `business.analytics.*`.
- Localize all UI/errors EN/HI; user-entered names retain their supplied locale. Test long Hindi wrapping on both public and dashboard layouts.
- Only specified first-party reporting-v1 signals and committed domain facts feed dashboards; no additional marketing taxonomy.
- In the unified public profile, F-PF-008 is owned by engagement and F-PF-009/010 by media-videos; this spec owns only their profile-tab composition.
- Within F-PV-006, S-PROV-10 reviews is reviews-owned, S-PROV-11 followers is engagement-owned, and S-PROV-12 media is media-videos-owned; this module owns the overview, QR, analytics and account surfaces.

## Verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Add the shared Billing identity section to existing vendor/provider onboarding/profile editors, using `/businesses/me/billing-profile`, its independent version and registration-specific fiscal fields. Save submits review; show pending/rejected/approved and explain the block on new financial quotes/purchases without changing existing invoices. No self-verified checkbox. Admin approvals uses the linked owner contract and exact `approvals:view/edit` scope. Verify EN/HI validation, forbidden evidence reads and stale saves.
Public profiles record views only after actual display, never SSR/GET/prefetch or owner preview. Label counts as session windows, not unique people.

Manual UI: onboarding step retention/validation, profile preview, document privacy, QR print variants, analytics empty state, account ownership. Manual journey: J7 onboarding; public shop/provider profile load and unavailable states; vendor/provider profile save; QR share/print; provider analytics empty state.
