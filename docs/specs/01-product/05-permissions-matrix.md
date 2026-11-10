# Permissions matrix and access boundaries

## Contents

- [Role principles](#role-principles)
- [Role x module x scope](#role-x-module-x-scope)
- [Admin grants](#admin-grants)
- [Screen groups](#screen-groups)
- [Denied cases](#denied-cases)

## Role principles

Authorization is server-side on role + ownership + city/area scope + module permission. Guests read only public surfaces; gated mutations use login origin return (BR-21). Approval gating (BR-06), audit (BR-12), role deletion (BR-13), privacy/KYC (BR-14), consent (BR-11) apply. “—” means deny by default.

| Role | Code | Hard limit |
|---|---|---|
| Customer | customer | Public browse; own records; login for order/bookmark/review/like/follow/comment. |
| Vendor | vendor | Own shop data; approved to sell/accept. |
| Service Provider | provider | Own provider data; approved; services enquiry-only. |
| Rider | rider | Own profile and assigned jobs; approved; masked customer data. |
| Admin | admin | Explicit module actions inside assigned cities/areas; no main category/city/role/global settings. |
| Super Admin | super_admin | Platform-wide admin plus admin/roles/cities/zones/settings/main categories. |

## Role x module x scope

| API module | Customer | Vendor | Service Provider | Rider | Admin | Super Admin |
|---|---|---|---|---|---|---|
| auth | Self/session | Self/session | Self/session | Self/session | Scoped admin account | Platform-wide |
| users | Own profile | Own profile | Own profile | Own profile | Assigned scope + users grant | Platform-wide |
| catalog | Public read | Suggest subcategory | Suggest subcategory | — | Assigned scope + catalog grant | Manage taxonomy |
| businesses | Public read | Own business | Own provider profile | Read/minimal | Assigned scope + approvals/listings | Platform-wide |
| products | Public read | Own products | Own products | Assigned order only | Assigned listing scope | Platform-wide |
| services | Public read | Own services | Own services | — | Assigned listing scope | Platform-wide |
| search | Public search | — | — | — | Keyword map with catalog grant | Platform-wide |
| offers | Active public | Own offers | Own offers | — | Assigned promos grant | Platform-wide |
| cart-checkout | Own cart | — | — | — | — | — |
| orders | Own orders | Own shop orders | Own provider orders | Assigned jobs | Assigned orders grant | Platform-wide |
| delivery | Own tracking | Own fulfilment | Own fulfilment | Assigned job | Assigned orders grant | Platform-wide |
| payments | Own payment | Own payout | Own payout | Own earnings | Assigned orders grant | Platform-wide |
| reviews | Published/own | Own-business reply | Own-provider reply | Own feedback | Assigned reviews grant | Platform-wide |
| media-videos | Approved public/own report | Own media | Own media | — | Assigned moderation grant | Platform-wide |
| engagement | Own follows/likes/saves | Own followers | Own followers | — | — | Platform-wide |
| notifications | Own feed/preferences | Own feed | Own feed | Own feed | Own feed | Platform-wide |
| communications | — | — | — | — | Assigned city/zone + comms edit | Platform-wide; Overall allowed |
| geo | Public city/own location | Own location | Own service area | Assigned job | Assigned geography read | Manage cities/zones |
| admin | — | — | — | — | Granted admin modules only | Manage admin/roles |
| audit | — | — | — | — | Granted scoped audit view | Platform-wide audit |
| settings | Own preferences | Own preferences | Own preferences | Own preferences | — | Global settings |

## Admin grants

| Key | Area | Prototype actions | Role-template actions | Scope |
|---|---|---|---|---|
| approvals | Approvals | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |
| orders | Orders & disputes | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |
| users | Users | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |
| reviews | Review moderation | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |
| comms | Communications | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |
| reports | Reports | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |
| catalog | Categories & listings | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |
| promos | Promotions | view, edit | view, create, edit, delete, export | Assigned city/area and target resource; comms also zone. |

Role templates are Area Admin (system), Support and Moderator (sample). System roles cannot be deleted; roles with assigned admins require reassignment first (BR-13). Communications Overall audience is Super Admin-only; City/Zone scopes require matching admin scope and comms edit. Audit sensitive changes with before/after (BR-12).

## Screen groups

IDs are drawn from all 105 inventory rows; each route also requires its module grant.

| Group | Role | Screen IDs |
|---|---|---|
| CUST | Customer | S-CUST-01, S-CUST-02, S-CUST-03, S-CUST-04, S-CUST-05, S-CUST-06, S-CUST-07, S-CUST-08, S-CUST-09, S-CUST-10, S-CUST-11, S-CUST-12, S-CUST-13, S-CUST-14, S-CUST-15, S-CUST-16, S-CUST-17, S-CUST-18, S-CUST-19, S-CUST-20, S-CUST-21, S-CUST-22, S-CUST-23, S-CUST-24, S-CUST-25, S-CUST-26, S-CUST-27, S-CUST-28, S-CUST-29, S-CUST-30, S-CUST-31, S-CUST-32, S-CUST-33, S-CUST-34, S-CUST-35, S-CUST-36, S-CUST-37, S-CUST-38 |
| VEND | Vendor | S-VEND-01, S-VEND-02, S-VEND-03, S-VEND-04, S-VEND-05, S-VEND-06, S-VEND-07, S-VEND-08, S-VEND-09, S-VEND-10, S-VEND-11, S-VEND-12, S-VEND-13, S-VEND-14, S-VEND-15, S-VEND-16, S-VEND-17, S-VEND-18 |
| PROV | Service Provider | S-PROV-01, S-PROV-02, S-PROV-03, S-PROV-04, S-PROV-05, S-PROV-06, S-PROV-07, S-PROV-08, S-PROV-09, S-PROV-10, S-PROV-11, S-PROV-12, S-PROV-13, S-PROV-14, S-PROV-15, S-PROV-16 |
| RIDE | Rider | S-RIDE-01, S-RIDE-02, S-RIDE-03, S-RIDE-04, S-RIDE-05, S-RIDE-06, S-RIDE-07, S-RIDE-08 |
| ADMN | Admin | S-ADMN-01, S-ADMN-02, S-ADMN-03, S-ADMN-04, S-ADMN-05, S-ADMN-06, S-ADMN-07, S-ADMN-08, S-ADMN-09, S-ADMN-10, S-ADMN-11, S-ADMN-12, S-ADMN-13, S-ADMN-14, S-ADMN-15, S-ADMN-16, S-ADMN-17 |
| SUPR | Super Admin | S-SUPR-01, S-SUPR-02, S-SUPR-03, S-SUPR-04, S-SUPR-05, S-SUPR-06, S-SUPR-07, S-SUPR-08 |

## Denied cases

| Attempt | Expected result |
|---|---|
| Guest performs login-gated action | Prompt login, preserve safe origin; no mutation before auth (BR-21). |
| Vendor accesses another vendor’s record | Deny ownership mismatch without disclosing record. |
| Unapproved provider sells or rider goes online | Deny under BR-06. |
| Admin with orders grant targets unassigned city/area | Deny even with module grant (BR-12). |
| Admin without comms edit/outside zone prepares campaign | Deny; no audience count or PII leak. |
| Admin changes main category, city, role or global settings | Deny; Super Admin-only. |
| Super Admin deletes system/in-use role | Reject per BR-13, no partial deletion. |
| Rider requests raw customer phone or OTP | Mask contact; never return OTP (BR-05). |
