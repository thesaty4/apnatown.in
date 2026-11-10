# 08 Permissions matrix

- **Purpose:** Role x module x action rules, admin scoping, role templates and route access.
- **Audience:** Copilot agents and developers
- **Related:** 07-state-machines-and-business-rules.md, 02-screen-inventory.md
- **Last updated:** 2026-11-10
- **Source:** extracted from the finished ApnaTown design (interactive prototype and its source code)

## 1. Platform roles

| Role | Code | Can do | Hard limits |
|---|---|---|---|
| Customer | customer | Browse (guest or logged in), order, review, follow, like, heart, enquire, save | Login required for order, bookmark, review, like, follow, comment |
| Vendor | vendor | Own profile, products, services, offers, orders, inventory, media, followers, earnings | Must be approved to sell; sees only own data |
| Service provider | provider | Own profile, services, enquiries, media, analytics; can also list products | Same approval gating; enquiry-only services |
| Rider | rider | Go online, accept requests, deliver with OTP, earnings | Must be approved; sees minimal customer data (masked calls) |
| Admin | admin | Modules granted in the permission matrix, inside assigned cities/areas | Cannot change main categories, cities/zones, roles, global settings |
| Super admin | super_admin | Everything admin can do platform-wide plus admins, roles, cities/zones, settings, main categories | - |

## 2. Admin permission modules

| Module key | Label | Actions in prototype | Actions supported by role template |
|---|---|---|---|
| `approvals` | Approvals | view, edit | view, create, edit, delete, export (template) |
| `orders` | Orders & disputes | view, edit | view, create, edit, delete, export (template) |
| `users` | Users | view, edit | view, create, edit, delete, export (template) |
| `reviews` | Review moderation | view, edit | view, create, edit, delete, export (template) |
| `comms` | Communications | view, edit | view, create, edit, delete, export (template) |
| `reports` | Reports | view, edit | view, create, edit, delete, export (template) |
| `catalog` | Categories & listings | view, edit | view, create, edit, delete, export (template) |
| `promos` | Promotions | view, edit | view, create, edit, delete, export (template) |

Admin UI without permission shows a clear 'You don't have permission' state (hidden or disabled); the backend must enforce the same rule.

## 3. Admin accounts in sample data (scope + permissions)

| Admin | Areas | Status | Permissions |
|---|---|---|---|
| Admin Kavita | chauraha, busstand, hata, tehsil, collect | active | approvals: view/edit; orders: view/edit; users: view; reviews: view/edit; comms: view/edit; reports: view; catalog: view/edit; promos: view/edit |
| Admin Manoj | station, ramkola | active | approvals: view; orders: view/edit; users: view; reviews: view; comms: ; reports: view; catalog: view; promos:  |
| Admin Seema |  | inactive | approvals: ; orders: view; users: ; reviews: ; comms: ; reports: view; catalog: ; promos:  |

## 4. Role templates (sample)

| Role | System | Permissions |
|---|---|---|
| Area Admin | True | null |
| Support | False | null |
| Moderator | False | null |

## 5. Rules

- A role cannot be deleted while admins are assigned (reassign first); system roles (e.g. Area Admin) cannot be deleted.
- Communications scope: Overall only for super admin; City-wise and Zone-wise only inside the admin's assigned cities/zones and only with `comms` edit.
- Every sensitive action is audit-logged with before/after.
- Admin scope = assigned cities/areas AND module permissions; both are checked on every API call.

## 6. Route access by role (prototype ROLEOF map; production uses guards)

| Route key | Role |
|---|---|
| aappr | admin |
| aaudit | admin |
| acats | admin |
| acomms | admin |
| ahome | admin |
| akeys | admin |
| alistings | admin |
| alive | admin |
| aorders | admin |
| aprofile | admin |
| apromos | admin |
| areports | admin |
| areviews | admin |
| asubs | admin |
| ausers | admin |
| avideos | admin |
| ractive | rider |
| rearn | rider |
| rfeedback | rider |
| rhistory | rider |
| rhome | rider |
| ronboard | rider |
| rprofile | rider |
| rreq | rider |
| saccount | provider |
| sanalytics | provider |
| senq | provider |
| sfollow | provider |
| shome | provider |
| smedia | provider |
| snotif | provider |
| soffers | provider |
| sonboard | provider |
| sorder | provider |
| sorders | provider |
| sprod | provider |
| sproducts | provider |
| sprofile | provider |
| sqr | provider |
| sreviews | provider |
| sservices | provider |
| vaccount | vendor |
| vearn | vendor |
| venq | vendor |
| vfollow | vendor |
| vhome | vendor |
| vinv | vendor |
| vmedia | vendor |
| vnotif | vendor |
| voffers | vendor |
| vonboard | vendor |
| vorder | vendor |
| vorders | vendor |
| vprod | vendor |
| vproducts | vendor |
| vprofile | vendor |
| vqr | vendor |
| vreviews | vendor |
| vservices | vendor |
| xactivity | super |
| xadmins | super |
| xanalytics | super |
| xcity | super |
| xgeo | super |
| xhome | super |
| xroles | super |
| xsettings | super |

## 7. Navigation by role (prototype NAV)

**Vendor** - primary: vhome, vorders, vproducts, vreviews

- Sell: Overview (`vhome`), Orders (`vorders`), Products (`vproducts`), Services (`vservices`), Enquiries (`venq`), Inventory (`vinv`), Offers (`voffers`)
- Grow: Reviews (`vreviews`), Followers (`vfollow`), QR & links (`vqr`), Gallery & media (`vmedia`), Business profile (`vprofile`)
- Account: Earnings & plan (`vearn`), Notifications (`vnotif`), Account (`vaccount`)

**Service provider** - primary: shome, senq, sprofile, sreviews

- Work: Overview (`shome`), Enquiries (`senq`), Orders (`sorders`), Products (`sproducts`), Services (`sservices`), Profile (`sprofile`), Reviews (`sreviews`), Followers (`sfollow`)
- Grow: Gallery & media (`smedia`), QR & links (`sqr`), Analytics (`sanalytics`)
- Account: Notifications (`snotif`), Account (`saccount`)

**Rider** - primary: rhome, rreq, rearn, rprofile

- Deliver: Home (`rhome`), Requests (`rreq`), Active delivery (`ractive`), History (`rhistory`)
- Me: Earnings (`rearn`), Feedback (`rfeedback`), Profile & documents (`rprofile`)

**Admin** - primary: ahome, aappr, aorders, areviews

- Monitor: Overview (`ahome`), Live deliveries (`alive`), Orders & disputes (`aorders`), Reports (`areports`)
- Manage: Approvals (`aappr`), Users (`ausers`), Categories (`acats`), Subcategory suggestions (`asubs`), Listings (`alistings`), Review moderation (`areviews`)
- Grow: Promotions (`apromos`), Communications (`acomms`), Videos & moderation (`avideos`), Search keywords (`akeys`)
- System: Audit log (`aaudit`), Profile (`aprofile`)

**Super Admin** - primary: xhome, xadmins, xgeo, xsettings

- Platform: Overview (`xhome`), Analytics (`xanalytics`), Activity monitor (`xactivity`)
- Control: Admins & areas (`xadmins`), Roles & permissions (`xroles`), Cities & zones (`xgeo`), Global settings (`xsettings`)
- Admin tools: Admin overview (`ahome`), Approvals (`aappr`), Orders & disputes (`aorders`), Live map (`alive`), Reviews (`areviews`), Communications (`acomms`), Videos & moderation (`avideos`), Search keywords (`akeys`), Categories (`acats`), Subcategory suggestions (`asubs`), Users (`ausers`)

