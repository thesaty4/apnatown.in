# ApnaTown.in — Project Index

**Purpose:** The index into the product knowledge base — read this first, then follow the links.
**Audience:** Everyone, especially AI agents before implementing any feature.
**Related files:** [docs/project/README.md](./project/README.md) (ID scheme) · [AGENTS.md](../AGENTS.md) · [.github/copilot-instructions.md](../.github/copilot-instructions.md)
**Last updated:** 2026-11-09
**Owner:** Product

## What ApnaTown is

ApnaTown.in is a hyperlocal marketplace and local business discovery
platform, launching in Padrauna, Kushinagar, Uttar Pradesh. Shops and
service providers list products and services; customers discover them
by location, order (home delivery or self-pickup), send enquiries,
watch short videos/reels, follow, rate and review — mobile-first,
bilingual English/Hindi, built for first-time online shoppers on
mid-range Android. See [01-product-overview.md](./project/01-product-overview.md)
for the full picture.

## Roles

`R-01` customer · `R-02` vendor (shop) · `R-03` provider (service) ·
`R-04` rider · `R-05` admin (city/area-scoped) · `R-06` super_admin
(platform-wide). Full detail:
[02-users-roles-permissions.md](./project/02-users-roles-permissions.md).

## Feature areas at a glance

[X](./project/03-feature-catalog.md#x-cross-cutting) Cross-cutting ·
[AU](./project/03-feature-catalog.md#au-auth-and-onboarding) Auth &
onboarding · [HM](./project/03-feature-catalog.md#hm-home) Home ·
[LC](./project/03-feature-catalog.md#lc-location-and-discovery)
Location & discovery ·
[EX](./project/03-feature-catalog.md#ex-explore) Explore ·
[SR](./project/03-feature-catalog.md#sr-search) Search ·
[PF](./project/03-feature-catalog.md#pf-business-and-provider-profile)
Business/provider profile ·
[PD](./project/03-feature-catalog.md#pd-product-details) Product
details · [SV](./project/03-feature-catalog.md#sv-services) Services ·
[OF](./project/03-feature-catalog.md#of-offers) Offers ·
[CK](./project/03-feature-catalog.md#ck-cart-and-checkout) Cart &
checkout ·
[OR](./project/03-feature-catalog.md#or-orders-and-tracking) Orders &
tracking · [RV](./project/03-feature-catalog.md#rv-reviews) Reviews ·
[EG](./project/03-feature-catalog.md#eg-engagement) Engagement ·
[RL](./project/03-feature-catalog.md#rl-videos-and-reels) Videos &
reels · [NT](./project/03-feature-catalog.md#nt-notifications)
Notifications · [AC](./project/03-feature-catalog.md#ac-account)
Account · [VD](./project/03-feature-catalog.md#vd-vendor-dashboard)
Vendor dashboard ·
[PV](./project/03-feature-catalog.md#pv-provider-dashboard) Provider
dashboard ·
[RD](./project/03-feature-catalog.md#rd-rider-mobile-first-pwa) Rider
PWA · [AD](./project/03-feature-catalog.md#ad-admin) Admin ·
[SA](./project/03-feature-catalog.md#sa-super-admin) Super admin.

## Which file answers which question

| Question | File |
|---|---|
| What does feature HM6 do? | [03-feature-catalog.md](./project/03-feature-catalog.md) |
| What rules apply? | [04-business-rules.md](./project/04-business-rules.md) |
| What statuses/transitions exist? | [05-domain-model.md](./project/05-domain-model.md) |
| What does the user do end to end? | [06-user-journeys.md](./project/06-user-journeys.md) |
| Which URL and screen? | [07-screens-routes-sitemap.md](./project/07-screens-routes-sitemap.md) |
| How should it look? | [08-design-system.md](./project/08-design-system.md) |
| What does it say in Hindi? | [09-content-i18n-notifications.md](./project/09-content-i18n-notifications.md) |
| Security/perf limits? | [10-nonfunctional-security-privacy.md](./project/10-nonfunctional-security-privacy.md) |
| Defaults, fees, flags? | [11-config-settings-integrations.md](./project/11-config-settings-integrations.md) |
| What is undecided? | [12-decisions-assumptions-open-questions.md](./project/12-decisions-assumptions-open-questions.md) |
| What covers feature X? | [13-traceability-matrix.md](./project/13-traceability-matrix.md) |

## How AI must use this before building any feature

1. Find the feature ID(s) in [03](./project/03-feature-catalog.md).
2. Read the linked BRs in [04](./project/04-business-rules.md).
3. Read the entities and statuses in [05](./project/05-domain-model.md).
4. Check journeys in [06](./project/06-user-journeys.md) and
   screens/routes in [07](./project/07-screens-routes-sitemap.md).
5. Follow [08](./project/08-design-system.md) for UI and
   [09](./project/09-content-i18n-notifications.md) for copy.
6. Apply [10](./project/10-nonfunctional-security-privacy.md) and
   [11](./project/11-config-settings-integrations.md).
7. If anything is missing or contradictory, add a question in
   [12](./project/12-decisions-assumptions-open-questions.md) and
   state the assumption in the PR — **never guess**.
8. After the change, update the affected `docs/project/*.md` files and
   [13](./project/13-traceability-matrix.md) in the **same PR**.

## Also see

- [AGENTS.md](../AGENTS.md) — agent lifecycle, roster, hard limits (the
  *process* layer; this file and `docs/project/` are the *product*
  layer).
- [docs/architecture.md](./architecture.md) — backend module map and
  layering.
- [Media and maps contract](../specs/_foundation/media-and-maps.md) —
  selected Cloudinary images, link-only YouTube/Instagram embeds,
  Leaflet/OSM maps, configuration ownership and verification.
- [docs/adr/](./adr/) — architecture decision records (tech stack,
  etc.).
- [docs/security/security-guidelines.md](./security/security-guidelines.md)
  — full security engineering detail.
