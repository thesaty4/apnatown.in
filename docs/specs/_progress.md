# Development specifications progress

## Contents

- [Step 0 status](#step-0-status)
- [Design Context Pack counts](#design-context-pack-counts)
- [Prompt checklist](#prompt-checklist)
- [LEAN SPECS progress](#lean-specs-progress)
- [Pack file manifest and sizes](#pack-file-manifest-and-sizes)

## Step 0 status

**Complete.** The Design Context Pack text, JSON, HTML, CSS, JavaScript, and Python source files were read; all included assets were inventoried. The runnable prototype and its source/stylesheet are the visual and behavioural source of truth. Step 0 made no specification or application-code changes. P01 completion is tracked below.

## Design Context Pack counts

| Item | Count | Counting basis |
|---|---:|---|
| Features | 206 | Unique IDs in `01-feature-inventory.md` |
| Screens | 105 | Unique IDs in `02-screen-inventory.md` |
| Flows | 14 | J1-J14 in `03-user-flows.md` |
| Components | 105 | 93 unique named components in catalogue sections A-F after deduplicating ShareSheet, plus 12 admin components in section G of `06-component-catalogue.md` |
| Tokens | 136 | Leaf token values across light/dark, typography, spacing, layout and component metrics; excludes metadata and theme labels |
| State entries | 76 | Model-specific named states across the 16 lifecycle models |
| Business rules | 22 | BR-01 through BR-22 |
| Status models | 16 | Unique ST-* models in `07-state-machines-and-business-rules.md` |
| i18n strings | 927 | English/Hindi pairs in `09a-i18n-en-hi.json` |

Every screen also specifies six baseline states: default, loading, empty, error, no-permission and offline; special states are enumerated per screen in the inventory.

## Prompt checklist

Status applies to the actual prompt files and outputs. Step 0 and P01 are complete. P02-P11 remain not started and are replaced by the LEAN SPECS workflow below; they are not being executed.

| Prompt | Scope | Output | Status |
|---|---|---|---|
| [P01](../../docs/prompts/P01-product-and-feature-spec.md) | Product and feature spec | `docs/specs/01-product/` | Complete |
| [P02](../../docs/prompts/P02-system-architecture.md) | System architecture | `docs/specs/02-architecture/` | Not started |
| [P03](../../docs/prompts/P03-database-postgresql.md) | Database PostgreSQL | `docs/specs/03-database/` | Not started |
| [P04](../../docs/prompts/P04-backend-nestjs.md) | Backend NestJS | `docs/specs/04-backend/` | Not started |
| [P05](../../docs/prompts/P05-frontend-architecture-nextjs.md) | Frontend architecture Next.js | `docs/specs/05-frontend/` | Not started |
| [P06](../../docs/prompts/P06-shared-component-library.md) | Shared component library | `docs/specs/06-shared-ui/` | Not started |
| [P08g](../../docs/prompts/P08g-reference-vertical-slice-explore-services.md) | Reference vertical slice: Explore services | `docs/specs/08-screens/reference-slice-explore-services.md` | Not started |
| [P07](../../docs/prompts/P07-seo.md) | SEO | `docs/specs/07-seo/` | Not started |
| [P08a](../../docs/prompts/P08a-screens-customer.md) | Customer screen specs | `docs/specs/08-screens/` | Not started |
| [P08b](../../docs/prompts/P08b-screens-vendor.md) | Vendor screen specs | `docs/specs/08-screens/` | Not started |
| [P08c](../../docs/prompts/P08c-screens-provider.md) | Provider screen specs | `docs/specs/08-screens/` | Not started |
| [P08d](../../docs/prompts/P08d-screens-rider.md) | Rider screen specs | `docs/specs/08-screens/` | Not started |
| [P08e](../../docs/prompts/P08e-screens-admin.md) | Admin screen specs | `docs/specs/08-screens/` | Not started |
| [P08f](../../docs/prompts/P08f-screens-super-admin.md) | Super-admin screen specs | `docs/specs/08-screens/` | Not started |
| [P09](../../docs/prompts/P09-infrastructure-security-operations.md) | Infrastructure, security and operations | `docs/specs/09-infra-security-ops/` | Not started |
| [P10](../../docs/prompts/P10-testing-delivery-traceability.md) | Testing, delivery and traceability | `docs/specs/10-delivery/` | Not started |
| [P11](../../docs/prompts/P11-coverage-audit.md) | Coverage audit and fixes | `docs/specs/11-coverage-audit.md` | Not started |

## LEAN SPECS progress

Source: [LEAN-SPECS.md](../prompts/LEAN-SPECS.md). The foundation checkpoint is complete and module specs are in progress. Stop for human review after each five-module checkpoint as required by the prompt; a module is complete only when both BE and FE columns are done.

| Foundation file | Status |
|---|---|
| [Architecture](../../specs/_foundation/architecture.md) | Complete |
| [Backend shared](../../specs/_foundation/backend-shared.md) | Complete |
| [Frontend shared](../../specs/_foundation/frontend-shared.md) | Complete |
| [Data model](../../specs/_foundation/data-model.md) | Complete |

| # | Module | BE | FE |
|---:|---|---|---|
| 1 | `auth` | Done | Done |
| 2 | `users` | Done | Done |
| 3 | `geo` | Done | Done |
| 4 | `catalog` | Done | Done |
| 5 | `businesses` | Done | Done |
| 6 | `products` | Done | Done |
| 7 | `services` | Done | Done |
| 8 | `search` | Done | Done |
| 9 | `offers` | Done | Done |
| 10 | `cart-checkout` | Done | Done |
| 11 | `payments` | Not started | Not started |
| 12 | `orders` | Not started | Not started |
| 13 | `delivery` | Not started | Not started |
| 14 | `reviews` | Not started | Not started |
| 15 | `engagement` | Not started | Not started |
| 16 | `media-videos` | Not started | Not started |
| 17 | `notifications` | Not started | Not started |
| 18 | `communications` | Not started | Not started |
| 19 | `admin` | Not started | Not started |
| 20 | `audit` | Not started | Not started |
| 21 | `settings` | Not started | Not started |

The required coverage script is deferred until the module specs exist; it would correctly fail against the intentionally incomplete foundation checkpoint.

## Pack file manifest and sizes

Manifest includes all 368 content files under `docs/design-context/` (15,670,474 bytes total), including 316 reference images. Windows `:Zone.Identifier` metadata sidecars are excluded because they are not design-pack content.

| Relative path | Bytes |
|---|---:|
| `00-product-summary.md` | 3,829 |
| `01-feature-inventory.md` | 33,082 |
| `02-screen-inventory.md` | 32,636 |
| `03-user-flows.md` | 5,462 |
| `04-design-tokens.json` | 4,815 |
| `05-design-system.md` | 3,982 |
| `06-component-catalogue.md` | 10,196 |
| `07-state-machines-and-business-rules.md` | 6,192 |
| `08-permissions-matrix.md` | 7,240 |
| `09-content-and-i18n.md` | 7,415 |
| `09a-i18n-en-hi.json` | 89,612 |
| `10-sample-data.json` | 164,028 |
| `11-open-issues-and-assumptions.md` | 4,018 |
| `README.md` | 1,836 |
| `reference/apnatown-prototype.html` | 741,573 |
| `reference/prototype-source/body.html` | 376 |
| `reference/prototype-source/build.sh` | 489 |
| `reference/prototype-source/head.html` | 704 |
| `reference/prototype-source/hi.json` | 65,299 |
| `reference/prototype-source/hi2.py` | 11,332 |
| `reference/prototype-source/hi3.py` | 1,614 |
| `reference/prototype-source/hi_build.py` | 52,341 |
| `reference/prototype-source/js0.js` | 5,984 |
| `reference/prototype-source/js1.js` | 28,549 |
| `reference/prototype-source/js10.js` | 26,700 |
| `reference/prototype-source/js11.js` | 39,986 |
| `reference/prototype-source/js12.js` | 19,553 |
| `reference/prototype-source/js13.js` | 44,302 |
| `reference/prototype-source/js14.js` | 557 |
| `reference/prototype-source/js15.js` | 10,297 |
| `reference/prototype-source/js16.js` | 40,701 |
| `reference/prototype-source/js17.js` | 18,952 |
| `reference/prototype-source/js18.js` | 35,115 |
| `reference/prototype-source/js19.js` | 24,032 |
| `reference/prototype-source/js2.js` | 16,097 |
| `reference/prototype-source/js20.js` | 14,137 |
| `reference/prototype-source/js21.js` | 17,393 |
| `reference/prototype-source/js22.js` | 17,739 |
| `reference/prototype-source/js23.js` | 20,917 |
| `reference/prototype-source/js24.js` | 20,797 |
| `reference/prototype-source/js25.js` | 16,483 |
| `reference/prototype-source/js26.js` | 18,772 |
| `reference/prototype-source/js27.js` | 13,444 |
| `reference/prototype-source/js28.js` | 13,194 |
| `reference/prototype-source/js3.js` | 22,824 |
| `reference/prototype-source/js4.js` | 20,399 |
| `reference/prototype-source/js5.js` | 27,396 |
| `reference/prototype-source/js6.js` | 33,407 |
| `reference/prototype-source/js7.js` | 16,792 |
| `reference/prototype-source/js8.js` | 35,620 |
| `reference/prototype-source/js9.js` | 15,689 |
| `reference/prototype-source/style.css` | 39,335 |
| `screenshots/d-admin-aappr-ap1.jpg` | 68,777 |
| `screenshots/d-admin-aappr.jpg` | 51,285 |
| `screenshots/d-admin-aaudit.jpg` | 59,062 |
| `screenshots/d-admin-acats.jpg` | 83,535 |
| `screenshots/d-admin-acomms.jpg` | 80,014 |
| `screenshots/d-admin-ahome.jpg` | 76,167 |
| `screenshots/d-admin-akeys.jpg` | 80,524 |
| `screenshots/d-admin-alistings.jpg` | 96,592 |
| `screenshots/d-admin-alive.jpg` | 52,940 |
| `screenshots/d-admin-aorder-AT10177.jpg` | 61,468 |
| `screenshots/d-admin-aorder-AT10231.jpg` | 56,334 |
| `screenshots/d-admin-aorders.jpg` | 74,561 |
| `screenshots/d-admin-aprofile.jpg` | 58,965 |
| `screenshots/d-admin-apromos.jpg` | 75,786 |
| `screenshots/d-admin-areports.jpg` | 58,672 |
| `screenshots/d-admin-areviews.jpg` | 48,839 |
| `screenshots/d-admin-asubs.jpg` | 63,933 |
| `screenshots/d-admin-ausers.jpg` | 63,779 |
| `screenshots/d-admin-avideos.jpg` | 54,006 |
| `screenshots/d-customer-about.jpg` | 52,230 |
| `screenshots/d-customer-account.jpg` | 52,994 |
| `screenshots/d-customer-addresses.jpg` | 52,128 |
| `screenshots/d-customer-biz-b1.jpg` | 26,254 |
| `screenshots/d-customer-biz-b3.jpg` | 26,917 |
| `screenshots/d-customer-biz-b4.jpg` | 27,191 |
| `screenshots/d-customer-biz-b5.jpg` | 27,225 |
| `screenshots/d-customer-bookmarks.jpg` | 41,850 |
| `screenshots/d-customer-bye.jpg` | 39,348 |
| `screenshots/d-customer-cart.jpg` | 37,469 |
| `screenshots/d-customer-cat-grocery.jpg` | 60,236 |
| `screenshots/d-customer-cat-wedding.jpg` | 91,471 |
| `screenshots/d-customer-checkout.jpg` | 22,653 |
| `screenshots/d-customer-design.jpg` | 54,394 |
| `screenshots/d-customer-done.jpg` | 36,705 |
| `screenshots/d-customer-err500.jpg` | 38,109 |
| `screenshots/d-customer-explore.jpg` | 86,985 |
| `screenshots/d-customer-help.jpg` | 56,904 |
| `screenshots/d-customer-home.jpg` | 74,164 |
| `screenshots/d-customer-invoice-AT10198.jpg` | 55,197 |
| `screenshots/d-customer-login.jpg` | 37,010 |
| `screenshots/d-customer-maintenance.jpg` | 39,161 |
| `screenshots/d-customer-nf.jpg` | 38,109 |
| `screenshots/d-customer-notifications.jpg` | 65,552 |
| `screenshots/d-customer-offers.jpg` | 82,026 |
| `screenshots/d-customer-offline.jpg` | 38,682 |
| `screenshots/d-customer-order-AT10177.jpg` | 65,988 |
| `screenshots/d-customer-order-AT10198.jpg` | 61,117 |
| `screenshots/d-customer-order-AT10231.jpg` | 64,713 |
| `screenshots/d-customer-order-AT10232.jpg` | 65,166 |
| `screenshots/d-customer-orders.jpg` | 55,566 |
| `screenshots/d-customer-prefs.jpg` | 61,165 |
| `screenshots/d-customer-privacy.jpg` | 51,036 |
| `screenshots/d-customer-prod-p1.jpg` | 53,264 |
| `screenshots/d-customer-prod-p45.jpg` | 56,783 |
| `screenshots/d-customer-prod-p46.jpg` | 49,082 |
| `screenshots/d-customer-prod-p50.jpg` | 53,969 |
| `screenshots/d-customer-prod-p6.jpg` | 50,456 |
| `screenshots/d-customer-prod-p9.jpg` | 50,520 |
| `screenshots/d-customer-profile.jpg` | 64,023 |
| `screenshots/d-customer-refund.jpg` | 53,605 |
| `screenshots/d-customer-rev-b1.jpg` | 40,546 |
| `screenshots/d-customer-rev-p1.jpg` | 39,052 |
| `screenshots/d-customer-rev-s5.jpg` | 48,626 |
| `screenshots/d-customer-reviews.jpg` | 42,126 |
| `screenshots/d-customer-search.jpg` | 53,269 |
| `screenshots/d-customer-service-b4-sv2.jpg` | 65,677 |
| `screenshots/d-customer-service-s11-sv1.jpg` | 61,803 |
| `screenshots/d-customer-service-s7-sv0.jpg` | 66,590 |
| `screenshots/d-customer-services.jpg` | 111,423 |
| `screenshots/d-customer-session.jpg` | 37,481 |
| `screenshots/d-customer-svc-s1.jpg` | 28,554 |
| `screenshots/d-customer-svc-s3.jpg` | 27,205 |
| `screenshots/d-customer-svc-s5.jpg` | 25,220 |
| `screenshots/d-customer-terms.jpg` | 50,561 |
| `screenshots/d-customer-videos-m13.jpg` | 15,570 |
| `screenshots/d-customer-videos-m5.jpg` | 65,609 |
| `screenshots/d-customer-videos-m99.jpg` | 15,570 |
| `screenshots/d-customer-videos.jpg` | 65,686 |
| `screenshots/d-dark-customer-cart.jpg` | 37,469 |
| `screenshots/d-dark-customer-explore.jpg` | 86,985 |
| `screenshots/d-dark-customer-home.jpg` | 70,885 |
| `screenshots/d-dark-customer-prod-p1.jpg` | 53,264 |
| `screenshots/d-hindi-customer-cart.jpg` | 35,181 |
| `screenshots/d-hindi-customer-explore.jpg` | 83,012 |
| `screenshots/d-hindi-customer-home.jpg` | 71,832 |
| `screenshots/d-hindi-customer-prod-p1.jpg` | 51,256 |
| `screenshots/d-overlay-explore-services-sidebar-filter.jpg` | 93,229 |
| `screenshots/d-overlay-explore-services-two-subcategories-selected.jpg` | 96,208 |
| `screenshots/d-overlay-login-prompt-on-like.jpg` | 62,180 |
| `screenshots/d-overlay-product-media-viewer.jpg` | 22,678 |
| `screenshots/d-overlay-product-offer-banner.jpg` | 53,969 |
| `screenshots/d-overlay-product-offer-expired.jpg` | 49,846 |
| `screenshots/d-overlay-share-sheet.jpg` | 62,194 |
| `screenshots/d-overlay-shop-this-video-sheet.jpg` | 62,165 |
| `screenshots/d-provider-saccount.jpg` | 54,015 |
| `screenshots/d-provider-sanalytics.jpg` | 53,253 |
| `screenshots/d-provider-senq-e1.jpg` | 51,765 |
| `screenshots/d-provider-senq.jpg` | 62,941 |
| `screenshots/d-provider-sfollow.jpg` | 62,545 |
| `screenshots/d-provider-shome.jpg` | 82,317 |
| `screenshots/d-provider-smedia.jpg` | 62,793 |
| `screenshots/d-provider-snotif.jpg` | 38,594 |
| `screenshots/d-provider-sonboard.jpg` | 43,324 |
| `screenshots/d-provider-sorder-AT10231.jpg` | 32,870 |
| `screenshots/d-provider-sorders.jpg` | 41,291 |
| `screenshots/d-provider-sprod-new.jpg` | 79,348 |
| `screenshots/d-provider-sprod-p48.jpg` | 79,502 |
| `screenshots/d-provider-sproducts.jpg` | 64,427 |
| `screenshots/d-provider-sprofile.jpg` | 71,738 |
| `screenshots/d-provider-sqr.jpg` | 45,392 |
| `screenshots/d-provider-sreviews.jpg` | 50,171 |
| `screenshots/d-provider-sservices.jpg` | 70,450 |
| `screenshots/d-rider-ractive.jpg` | 32,405 |
| `screenshots/d-rider-rearn.jpg` | 60,975 |
| `screenshots/d-rider-rfeedback.jpg` | 41,001 |
| `screenshots/d-rider-rhistory.jpg` | 39,204 |
| `screenshots/d-rider-rhome.jpg` | 45,681 |
| `screenshots/d-rider-ronboard.jpg` | 45,238 |
| `screenshots/d-rider-rprofile.jpg` | 58,785 |
| `screenshots/d-rider-rreq.jpg` | 41,816 |
| `screenshots/d-super-aappr.jpg` | 53,682 |
| `screenshots/d-super-acomms.jpg` | 84,861 |
| `screenshots/d-super-ahome.jpg` | 78,537 |
| `screenshots/d-super-akeys.jpg` | 82,653 |
| `screenshots/d-super-alive.jpg` | 55,483 |
| `screenshots/d-super-asubs.jpg` | 65,953 |
| `screenshots/d-super-avideos.jpg` | 56,508 |
| `screenshots/d-super-xactivity.jpg` | 56,339 |
| `screenshots/d-super-xadmins.jpg` | 71,179 |
| `screenshots/d-super-xanalytics.jpg` | 79,045 |
| `screenshots/d-super-xcity-kasia.jpg` | 57,664 |
| `screenshots/d-super-xcity-padrauna.jpg` | 70,912 |
| `screenshots/d-super-xgeo.jpg` | 70,366 |
| `screenshots/d-super-xhome.jpg` | 69,477 |
| `screenshots/d-super-xroles.jpg` | 85,534 |
| `screenshots/d-super-xsettings.jpg` | 71,751 |
| `screenshots/d-vendor-vaccount.jpg` | 64,943 |
| `screenshots/d-vendor-vearn.jpg` | 68,340 |
| `screenshots/d-vendor-venq-e1.jpg` | 33,810 |
| `screenshots/d-vendor-venq.jpg` | 41,757 |
| `screenshots/d-vendor-vfollow.jpg` | 62,790 |
| `screenshots/d-vendor-vhome.jpg` | 81,185 |
| `screenshots/d-vendor-vinv.jpg` | 64,126 |
| `screenshots/d-vendor-vmedia.jpg` | 63,167 |
| `screenshots/d-vendor-vnotif.jpg` | 49,553 |
| `screenshots/d-vendor-voffers.jpg` | 61,483 |
| `screenshots/d-vendor-vonboard.jpg` | 43,324 |
| `screenshots/d-vendor-vorder-AT10231.jpg` | 69,812 |
| `screenshots/d-vendor-vorder-AT10236.jpg` | 66,903 |
| `screenshots/d-vendor-vorder-AT10240.jpg` | 65,419 |
| `screenshots/d-vendor-vorders.jpg` | 42,061 |
| `screenshots/d-vendor-vprod-new.jpg` | 80,370 |
| `screenshots/d-vendor-vprod-p1.jpg` | 83,012 |
| `screenshots/d-vendor-vproducts.jpg` | 79,959 |
| `screenshots/d-vendor-vprofile.jpg` | 79,110 |
| `screenshots/d-vendor-vqr.jpg` | 76,307 |
| `screenshots/d-vendor-vreviews.jpg` | 72,904 |
| `screenshots/d-vendor-vservices.jpg` | 49,256 |
| `screenshots/m-admin-aappr-ap1.jpg` | 29,916 |
| `screenshots/m-admin-aappr.jpg` | 26,737 |
| `screenshots/m-admin-aaudit.jpg` | 39,132 |
| `screenshots/m-admin-acats.jpg` | 40,584 |
| `screenshots/m-admin-acomms.jpg` | 34,032 |
| `screenshots/m-admin-ahome.jpg` | 34,732 |
| `screenshots/m-admin-akeys.jpg` | 36,379 |
| `screenshots/m-admin-alistings.jpg` | 33,521 |
| `screenshots/m-admin-alive.jpg` | 29,336 |
| `screenshots/m-admin-aorder-AT10177.jpg` | 29,388 |
| `screenshots/m-admin-aorder-AT10231.jpg` | 29,872 |
| `screenshots/m-admin-aorders.jpg` | 33,556 |
| `screenshots/m-admin-aprofile.jpg` | 34,458 |
| `screenshots/m-admin-apromos.jpg` | 42,380 |
| `screenshots/m-admin-areports.jpg` | 29,885 |
| `screenshots/m-admin-areviews.jpg` | 26,824 |
| `screenshots/m-admin-asubs.jpg` | 38,652 |
| `screenshots/m-admin-ausers.jpg` | 31,800 |
| `screenshots/m-admin-avideos.jpg` | 29,304 |
| `screenshots/m-customer-about.jpg` | 32,136 |
| `screenshots/m-customer-account.jpg` | 32,470 |
| `screenshots/m-customer-addresses.jpg` | 26,105 |
| `screenshots/m-customer-biz-b1.jpg` | 34,085 |
| `screenshots/m-customer-biz-b3.jpg` | 34,566 |
| `screenshots/m-customer-biz-b4.jpg` | 33,665 |
| `screenshots/m-customer-biz-b5.jpg` | 32,436 |
| `screenshots/m-customer-bookmarks.jpg` | 22,992 |
| `screenshots/m-customer-bye.jpg` | 20,879 |
| `screenshots/m-customer-cart.jpg` | 17,578 |
| `screenshots/m-customer-cat-grocery.jpg` | 27,736 |
| `screenshots/m-customer-cat-wedding.jpg` | 33,431 |
| `screenshots/m-customer-checkout.jpg` | 16,437 |
| `screenshots/m-customer-design.jpg` | 34,560 |
| `screenshots/m-customer-done.jpg` | 18,222 |
| `screenshots/m-customer-err500.jpg` | 19,607 |
| `screenshots/m-customer-explore.jpg` | 33,487 |
| `screenshots/m-customer-help.jpg` | 30,877 |
| `screenshots/m-customer-home.jpg` | 35,988 |
| `screenshots/m-customer-invoice-AT10198.jpg` | 35,369 |
| `screenshots/m-customer-login.jpg` | 15,013 |
| `screenshots/m-customer-maintenance.jpg` | 20,710 |
| `screenshots/m-customer-nf.jpg` | 19,607 |
| `screenshots/m-customer-notifications.jpg` | 37,929 |
| `screenshots/m-customer-offers.jpg` | 38,111 |
| `screenshots/m-customer-offline.jpg` | 20,036 |
| `screenshots/m-customer-order-AT10177.jpg` | 29,361 |
| `screenshots/m-customer-order-AT10198.jpg` | 29,437 |
| `screenshots/m-customer-order-AT10231.jpg` | 29,052 |
| `screenshots/m-customer-order-AT10232.jpg` | 31,641 |
| `screenshots/m-customer-orders.jpg` | 36,000 |
| `screenshots/m-customer-prefs.jpg` | 40,134 |
| `screenshots/m-customer-privacy.jpg` | 31,200 |
| `screenshots/m-customer-prod-p1.jpg` | 25,420 |
| `screenshots/m-customer-prod-p45.jpg` | 28,063 |
| `screenshots/m-customer-prod-p46.jpg` | 25,935 |
| `screenshots/m-customer-prod-p50.jpg` | 26,968 |
| `screenshots/m-customer-prod-p6.jpg` | 26,475 |
| `screenshots/m-customer-prod-p9.jpg` | 26,899 |
| `screenshots/m-customer-profile.jpg` | 30,990 |
| `screenshots/m-customer-refund.jpg` | 33,616 |
| `screenshots/m-customer-rev-b1.jpg` | 22,130 |
| `screenshots/m-customer-rev-p1.jpg` | 20,581 |
| `screenshots/m-customer-rev-s5.jpg` | 28,287 |
| `screenshots/m-customer-reviews.jpg` | 21,254 |
| `screenshots/m-customer-search.jpg` | 25,994 |
| `screenshots/m-customer-service-b4-sv2.jpg` | 26,595 |
| `screenshots/m-customer-service-s11-sv1.jpg` | 28,488 |
| `screenshots/m-customer-service-s7-sv0.jpg` | 27,251 |
| `screenshots/m-customer-services.jpg` | 32,930 |
| `screenshots/m-customer-session.jpg` | 19,003 |
| `screenshots/m-customer-svc-s1.jpg` | 32,229 |
| `screenshots/m-customer-svc-s3.jpg` | 35,190 |
| `screenshots/m-customer-svc-s5.jpg` | 33,042 |
| `screenshots/m-customer-terms.jpg` | 30,978 |
| `screenshots/m-customer-videos-m13.jpg` | 10,844 |
| `screenshots/m-customer-videos-m5.jpg` | 29,097 |
| `screenshots/m-customer-videos-m99.jpg` | 10,844 |
| `screenshots/m-customer-videos.jpg` | 28,044 |
| `screenshots/m-dark-customer-cart.jpg` | 17,578 |
| `screenshots/m-dark-customer-explore.jpg` | 33,487 |
| `screenshots/m-dark-customer-home.jpg` | 35,038 |
| `screenshots/m-dark-customer-prod-p1.jpg` | 25,420 |
| `screenshots/m-hindi-customer-cart.jpg` | 17,075 |
| `screenshots/m-hindi-customer-explore.jpg` | 34,794 |
| `screenshots/m-hindi-customer-home.jpg` | 32,730 |
| `screenshots/m-hindi-customer-prod-p1.jpg` | 24,079 |
| `screenshots/m-overlay-explore-services-filter-sheet.jpg` | 27,056 |
| `screenshots/m-overlay-explore-services-two-subcategories-selected.jpg` | 35,820 |
| `screenshots/m-overlay-login-prompt-on-like.jpg` | 27,520 |
| `screenshots/m-overlay-product-media-viewer.jpg` | 13,684 |
| `screenshots/m-overlay-product-offer-banner.jpg` | 26,968 |
| `screenshots/m-overlay-product-offer-expired.jpg` | 25,910 |
| `screenshots/m-overlay-share-sheet.jpg` | 28,583 |
| `screenshots/m-overlay-shop-this-video-sheet.jpg` | 28,583 |
| `screenshots/m-provider-saccount.jpg` | 27,777 |
| `screenshots/m-provider-sanalytics.jpg` | 29,088 |
| `screenshots/m-provider-senq-e1.jpg` | 28,452 |
| `screenshots/m-provider-senq.jpg` | 37,919 |
| `screenshots/m-provider-sfollow.jpg` | 27,566 |
| `screenshots/m-provider-shome.jpg` | 32,114 |
| `screenshots/m-provider-smedia.jpg` | 32,681 |
| `screenshots/m-provider-snotif.jpg` | 19,301 |
| `screenshots/m-provider-sonboard.jpg` | 22,763 |
| `screenshots/m-provider-sorder-AT10231.jpg` | 16,003 |
| `screenshots/m-provider-sorders.jpg` | 17,889 |
| `screenshots/m-provider-sprod-new.jpg` | 26,528 |
| `screenshots/m-provider-sprod-p48.jpg` | 31,642 |
| `screenshots/m-provider-sproducts.jpg` | 33,708 |
| `screenshots/m-provider-sprofile.jpg` | 34,724 |
| `screenshots/m-provider-sqr.jpg` | 25,530 |
| `screenshots/m-provider-sreviews.jpg` | 26,941 |
| `screenshots/m-provider-sservices.jpg` | 42,632 |
| `screenshots/m-rider-ractive.jpg` | 16,584 |
| `screenshots/m-rider-rearn.jpg` | 28,790 |
| `screenshots/m-rider-rfeedback.jpg` | 21,170 |
| `screenshots/m-rider-rhistory.jpg` | 21,929 |
| `screenshots/m-rider-rhome.jpg` | 26,613 |
| `screenshots/m-rider-ronboard.jpg` | 24,796 |
| `screenshots/m-rider-rprofile.jpg` | 32,806 |
| `screenshots/m-rider-rreq.jpg` | 23,772 |
| `screenshots/m-super-aappr.jpg` | 26,997 |
| `screenshots/m-super-acomms.jpg` | 35,768 |
| `screenshots/m-super-ahome.jpg` | 34,965 |
| `screenshots/m-super-akeys.jpg` | 36,653 |
| `screenshots/m-super-alive.jpg` | 29,590 |
| `screenshots/m-super-asubs.jpg` | 38,933 |
| `screenshots/m-super-avideos.jpg` | 29,558 |
| `screenshots/m-super-xactivity.jpg` | 29,505 |
| `screenshots/m-super-xadmins.jpg` | 31,924 |
| `screenshots/m-super-xanalytics.jpg` | 34,203 |
| `screenshots/m-super-xcity-kasia.jpg` | 27,491 |
| `screenshots/m-super-xcity-padrauna.jpg` | 36,106 |
| `screenshots/m-super-xgeo.jpg` | 38,776 |
| `screenshots/m-super-xhome.jpg` | 31,395 |
| `screenshots/m-super-xroles.jpg` | 34,430 |
| `screenshots/m-super-xsettings.jpg` | 35,062 |
| `screenshots/m-vendor-vaccount.jpg` | 31,042 |
| `screenshots/m-vendor-vearn.jpg` | 30,586 |
| `screenshots/m-vendor-venq-e1.jpg` | 15,746 |
| `screenshots/m-vendor-venq.jpg` | 20,877 |
| `screenshots/m-vendor-vfollow.jpg` | 27,203 |
| `screenshots/m-vendor-vhome.jpg` | 33,186 |
| `screenshots/m-vendor-vinv.jpg` | 30,623 |
| `screenshots/m-vendor-vmedia.jpg` | 32,308 |
| `screenshots/m-vendor-vnotif.jpg` | 27,603 |
| `screenshots/m-vendor-voffers.jpg` | 33,829 |
| `screenshots/m-vendor-vonboard.jpg` | 22,763 |
| `screenshots/m-vendor-vorder-AT10231.jpg` | 29,999 |
| `screenshots/m-vendor-vorder-AT10236.jpg` | 28,097 |
| `screenshots/m-vendor-vorder-AT10240.jpg` | 28,442 |
| `screenshots/m-vendor-vorders.jpg` | 20,274 |
| `screenshots/m-vendor-vprod-new.jpg` | 26,305 |
| `screenshots/m-vendor-vprod-p1.jpg` | 34,074 |
| `screenshots/m-vendor-vproducts.jpg` | 33,779 |
| `screenshots/m-vendor-vprofile.jpg` | 38,114 |
| `screenshots/m-vendor-vqr.jpg` | 33,656 |
| `screenshots/m-vendor-vreviews.jpg` | 39,345 |
| `screenshots/m-vendor-vservices.jpg` | 28,545 |
