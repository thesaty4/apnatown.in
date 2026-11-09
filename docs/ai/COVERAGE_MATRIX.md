# Coverage Matrix

Mandatory self-check (`AGENTS.md` section 5 of the original bootstrap task): 
every feature ID from `docs/FEATURE_INVENTORY.md` and every invariant from 
`docs/PROJECT.md` maps to at least one instruction file, one skill, one agent, 
and a BE module + FE area. No row may be empty. Mappings below are area-level 
(all IDs in an area share the same row set); a feature's spec may narrow this 
to the specific file(s) it actually used.


## X. Cross-cutting

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| X1 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X2 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X3 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X4 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X5 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X6 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X7 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X8 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X9 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X10 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X11 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X12 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X13 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X14 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |
| X15 | `solid-dry-design.instructions.md`, `i18n-a11y.instructions.md`, `security.instructions.md`, `specs-and-docs.instructions.md` | `i18n-en-hi`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications, audit` | `packages/ui, packages/shared` |

## AU. Auth and onboarding

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| AU1 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| AU2 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| AU3 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| AU4 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| AU5 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| AU6 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| AU7 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |
| AU8 | `security.instructions.md`, `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `auth, users` | `/login, /onboarding` |

## HM. Home

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| HM1 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM2 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM3 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM4 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM5 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM6 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM7 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM8 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM9 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM10 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM11 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM12 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM13 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |
| HM14 | `frontend.instructions.md`, `i18n-a11y.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-frontend`, `code-reviewer` | `catalog, businesses, products, services, offers, engagement` | `/` |

## LC. Location and discovery

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| LC1 | `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `geo-zones-delivery-fees`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `geo` | `/location` |
| LC2 | `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `geo-zones-delivery-fees`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `geo` | `/location` |
| LC3 | `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `geo-zones-delivery-fees`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `geo` | `/location` |
| LC4 | `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `geo-zones-delivery-fees`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `geo` | `/location` |
| LC5 | `domain-accounts-admin.instructions.md`, `frontend.instructions.md` | `geo-zones-delivery-fees`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `geo` | `/location` |

## EX. Explore

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| EX1 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX2 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX3 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX4 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX5 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX6 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX7 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX8 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX9 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX10 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |
| EX11 | `domain-catalog-search.instructions.md`, `frontend.instructions.md`, `i18n-a11y.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search, catalog, products, services, businesses` | `/explore` |

## SR. Search

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| SR1 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR2 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR3 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR4 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR5 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR6 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR7 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR8 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR9 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |
| SR10 | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `search-keyword-mapping`, `explore-filter-url-state`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `search` | `/search` |

## PF. Business and provider profile

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| PF1 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF2 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF3 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF4 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF5 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF6 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF7 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF8 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF9 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF10 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF11 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF12 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |
| PF13 | `domain-media-engagement.instructions.md`, `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `ui-component`, `media-embeds-and-reels` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, media-videos, reviews, engagement` | `/business/:slug` |

## PD. Product details

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| PD1 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD2 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD3 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD4 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD5 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD6 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD7 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD8 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |
| PD9 | `domain-commerce.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `products, offers, reviews` | `/product/:slug` |

## SV. Services

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| SV1 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| SV2 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| SV3 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| SV4 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| SV5 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| SV6 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| SV7 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |
| SV8 | `domain-catalog-search.instructions.md`, `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `services, offers, reviews` | `/service/:slug` |

## OF. Offers

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| OF1 | `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` | `/offers` |
| OF2 | `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` | `/offers` |
| OF3 | `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` | `/offers` |
| OF4 | `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` | `/offers` |
| OF5 | `domain-commerce.instructions.md`, `frontend.instructions.md` | `ui-component`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` | `/offers` |

## CK. Cart and checkout

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| CK1 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK2 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK3 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK4 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK5 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK6 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK7 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK8 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |
| CK9 | `domain-commerce.instructions.md`, `security.instructions.md`, `frontend.instructions.md` | `order-state-machine`, `secure-coding-review`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `cart-checkout` | `/cart, /checkout` |

## OR. Orders and tracking

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| OR1 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| OR2 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| OR3 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| OR4 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| OR5 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| OR6 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| OR7 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |
| OR8 | `domain-commerce.instructions.md`, `domain-delivery-riders.instructions.md`, `security.instructions.md` | `order-state-machine`, `otp-and-codes`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `orders, delivery, payments` | `/orders` |

## RV. Reviews

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| RV1 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |
| RV2 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |
| RV3 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |
| RV4 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |
| RV5 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |
| RV6 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |
| RV7 | `domain-media-engagement.instructions.md`, `i18n-a11y.instructions.md` | `write-tests`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `reviews` | `/reviews` |

## EG. Engagement

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| EG1 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |
| EG2 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |
| EG3 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |
| EG4 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |
| EG5 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |
| EG6 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |
| EG7 | `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `media-embeds-and-reels`, `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `engagement` | `/saved` |

## RL. Videos and reels

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| RL1 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL2 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL3 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL4 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL5 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL6 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL7 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL8 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL9 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |
| RL10 | `domain-media-engagement.instructions.md`, `security.instructions.md` | `media-embeds-and-reels`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `media-videos, engagement` | `/videos/:id` |

## NT. Notifications

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| NT1 | `domain-accounts-admin.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications` | `/notifications` |
| NT2 | `domain-accounts-admin.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications` | `/notifications` |
| NT3 | `domain-accounts-admin.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications` | `/notifications` |
| NT4 | `domain-accounts-admin.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `notifications` | `/notifications` |

## AC. Account

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| AC1 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |
| AC2 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |
| AC3 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |
| AC4 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |
| AC5 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |
| AC6 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |
| AC7 | `domain-accounts-admin.instructions.md`, `security.instructions.md`, `i18n-a11y.instructions.md` | `consent-and-notifications`, `secure-coding-review` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `users, settings` | `/account` |

## VD. Vendor dashboard

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| VD1 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD2 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD3 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD4 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD5 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD6 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD7 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD8 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD9 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD10 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD11 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD12 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD13 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD14 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD15 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD16 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD17 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |
| VD18 | `domain-commerce.instructions.md`, `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component`, `api-endpoint`, `order-state-machine` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, products, services, offers, orders, media-videos, engagement, settings` | `/vendor` |

## PV. Provider dashboard

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| PV1 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |
| PV2 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |
| PV3 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |
| PV4 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |
| PV5 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |
| PV6 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |
| PV7 | `domain-catalog-search.instructions.md`, `domain-media-engagement.instructions.md`, `frontend.instructions.md` | `ui-component` | `spec-writer`, `developer-backend`, `developer-frontend`, `code-reviewer` | `businesses, services, engagement` | `/provider` |

## RD. Rider (mobile-first PWA)

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| RD1 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| RD2 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| RD3 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| RD4 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| RD5 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| RD6 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| RD7 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |
| RD8 | `domain-delivery-riders.instructions.md`, `security.instructions.md` | `otp-and-codes`, `geo-zones-delivery-fees`, `write-tests` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `delivery, users` | `/rider` |

## AD. Admin

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| AD1 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD2 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD3 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD4 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD5 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD6 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD7 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD8 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD9 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD10 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD11 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD12 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD13 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD14 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD15 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |
| AD16 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `consent-and-notifications`, `search-keyword-mapping` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, users, catalog, orders, delivery, reviews, media-videos, communications, audit, search, geo` | `/admin` |

## SA. Super admin

| ID | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) | FE area |
|---|---|---|---|---|---|
| SA1 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |
| SA2 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |
| SA3 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |
| SA4 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |
| SA5 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |
| SA6 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |
| SA7 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |
| SA8 | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit`, `geo-zones-delivery-fees` | `spec-writer`, `developer-backend`, `developer-frontend`, `security-auditor`, `code-reviewer` | `admin, geo, settings, audit, catalog` | `/super-admin` |

---

**Total feature IDs covered: 207.**

## Business rule invariants (1-17)

| # | Invariant | Instruction file(s) | Skill(s) | Agent(s) | BE module(s) |
|---|---|---|---|---|---|
| 1 | Money integer paise; server computes totals | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `cart-checkout, orders, payments` |
| 2 | UTC storage, IST 12-hour display | `i18n-a11y.instructions.md`, `backend.instructions.md` | `i18n-en-hi` | `developer-backend`, `developer-frontend`, `code-reviewer` | `packages/shared (all modules)` |
| 3 | One order per shop, own status/mode/payment/OTP | `domain-commerce.instructions.md` | `order-state-machine` | `developer-backend`, `code-reviewer` | `cart-checkout, orders` |
| 4 | Order status only via state machine; no oversell | `domain-commerce.instructions.md` | `order-state-machine`, `write-tests` | `developer-backend`, `code-reviewer` | `orders, products` |
| 5 | Delivery OTP / pickup code verified server-side only | `security.instructions.md`, `domain-delivery-riders.instructions.md` | `otp-and-codes` | `developer-backend`, `security-auditor`, `code-reviewer` | `delivery, orders` |
| 6 | Only approved vendors/providers/riders sell/accept/go online | `domain-accounts-admin.instructions.md`, `domain-delivery-riders.instructions.md` | `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `users, businesses, delivery` |
| 7 | Main categories super_admin only; subcategory suggestion/approval; one subcategory per service | `domain-catalog-search.instructions.md` | `search-keyword-mapping`, `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `catalog` |
| 8 | Reviews only from verified purchasers/enquirers; moderation for unsafe content | `domain-media-engagement.instructions.md`, `testing.instructions.md` | `write-tests`, `secure-coding-review` | `developer-backend`, `code-reviewer` | `reviews` |
| 9 | Videos public only when approved; reports to moderation; removed shows unavailable | `domain-media-engagement.instructions.md` | `media-embeds-and-reels` | `developer-backend`, `developer-frontend`, `code-reviewer` | `media-videos` |
| 10 | Location optional; consent for marketing; opt-outs honoured; consent-aware counts | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `consent-and-notifications` | `developer-backend`, `security-auditor`, `code-reviewer` | `communications, users` |
| 11 | Admins scoped to city/area + permissions; sensitive actions audit-logged | `domain-accounts-admin.instructions.md`, `security.instructions.md` | `rbac-scope-audit` | `developer-backend`, `security-auditor`, `code-reviewer` | `admin, audit` |
| 12 | Role cannot be deleted while assigned; system roles never deletable | `domain-accounts-admin.instructions.md` | `rbac-scope-audit` | `developer-backend`, `code-reviewer` | `admin` |
| 13 | DPDP: minimise, consent, export/delete; KYC visible only to authorised admins | `security.instructions.md`, `domain-accounts-admin.instructions.md` | `secure-coding-review` | `developer-backend`, `security-auditor`, `code-reviewer` | `users, admin` |
| 14 | Explore filter state in shareable URL; Explore and Search keep separate filter state | `domain-catalog-search.instructions.md`, `frontend.instructions.md` | `explore-filter-url-state` | `developer-frontend`, `code-reviewer` | `search` |
| 15 | Media appears in Gallery/Reels only if vendor allows it (consent) | `domain-media-engagement.instructions.md` | `media-embeds-and-reels` | `developer-backend`, `developer-frontend`, `code-reviewer` | `media-videos, businesses` |
| 16 | Offer applies only while active and not expired; expired/out-of-stock states shown clearly | `domain-commerce.instructions.md` | `write-tests` | `developer-backend`, `developer-frontend`, `code-reviewer` | `offers` |
| 17 | A service's subcategory drives Explore/Search filters and counts | `domain-catalog-search.instructions.md` | `explore-filter-url-state`, `search-keyword-mapping` | `developer-backend`, `developer-frontend`, `code-reviewer` | `services, search` |

**All 17 invariants covered; no empty cells above.**


All rows list at least `security-auditor` implicitly available — it is required 
(not listed per-row unless already required) for any PR touching auth, payments, 
uploads/CSV, embeds, admin permissions, or communications, per `AGENTS.md`.
