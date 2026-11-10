# BE: admin

Features: F-AD-001, F-AD-002, F-AD-003, F-AD-004, F-AD-013, F-AD-016, F-SA-001, F-SA-002, F-SA-003, F-SA-006 | Rules: BR-12, BR-13, BR-02, BR-14 | State machines: ST-approval (composed), ST-admin-account (active ⇄ inactive) | Depends on: users, geo, businesses, products, services, delivery, orders, payments, reviews, offers, media-videos, audit (writes), settings.

Frontend counterpart: [FE admin](../fe/admin.md)

## Responsibility

Own admin accounts, role templates, per-admin permissions and area scopes; provide the guards' data (`PermissionGuard`, `AdminScopeGuard` in [backend-shared](../../_foundation/backend-shared.md)). Compose admin console views (overview, approvals queue, listings, users, reports) and super-admin views (overview chart, admins, roles, analytics) from other modules' read ports. Decisions on a domain object always call the owning module; admin never writes another module's tables.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `roles` | `id uuid PK`; `name text NOT NULL UNIQUE CHECK 2–40`; `description text NULL CHECK <= 200`; `is_system bool NOT NULL DEFAULT false`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at` | PK, unique name |
| `role_permissions` | `role_id uuid FK roles ON DELETE CASCADE`; `module text CHECK ('approvals','orders','users','reviews','comms','reports','catalog','promos')`; `action text CHECK ('view','create','edit','delete','export')`; PK `(role_id,module,action)` | PK |
| `admin_accounts` | `user_id uuid PK FK users`; `display_name text NOT NULL`; `email_ciphertext text NOT NULL`; `role_id uuid NOT NULL FK roles`; `status text NOT NULL CHECK ('active','inactive')`; `version int NOT NULL DEFAULT 1`; `created_by uuid FK users`; `created_at/updated_at` | `(role_id)` (role in-use check); `(status)` |
| `admin_permissions` | `user_id uuid FK admin_accounts ON DELETE CASCADE`; `module`, `action` (same CHECKs); PK `(user_id,module,action)` | PK (guard lookup) |
| `admin_scopes` | `user_id uuid FK admin_accounts ON DELETE CASCADE`; `area_id uuid FK areas`; `city_id uuid NOT NULL FK cities` (denormalised from area); PK `(user_id,area_id)` | `(city_id)` (city card assigned admins); `(user_id)` (guard) |

`super_admin` is a `users` role, not an `admin_accounts` row; guards treat it as platform-wide with all permissions.

## Endpoints

All `/admin/*` require role admin or super_admin; all `/super-admin/*` require super_admin. "Scope" = rows filtered to the admin's `admin_scopes` (super_admin: all). Every mutation is audited (actor, before/after) and requires `Idempotency-Key`.

| Method | Path | Auth, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/admin/me` | Admin/super | → `{name,email(masked),areas[],permissions{module:[actions]},isSuper}` | — | Yes | F-AD-016, S-ADMN-17 |
| GET | `/admin/overview` | Admin; each block only if its module permission is held | → KPIs `gmvMonthPaise, ordersToday, activeDeliveries` (`orders:view`), `approvalsPending` (`approvals:view`), `openCases` (`orders:view`), `ridersOnline`; top 5 approvals; live orders; alerts (reported reviews/videos, low-rated, locked codes) | — | Yes | F-AD-001, S-ADMN-01 |
| GET | `/admin/approvals?type=business\|provider\|rider&status=pending\|changes_requested\|approved\|rejected&cursor=` | `approvals:view` + scope | → merged queue from Businesses and Delivery read ports; item `{type,id,name,category/vehicle,area,submittedAt,status}` | `VALIDATION_ERROR` | Yes | F-AD-002, S-ADMN-02 |
| GET | `/admin/approvals/{type}/{id}` | `approvals:view` + scope | → detail + documents (delegates to owning `/documents` endpoint) + decision history (Audit read by entity) | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-002 |
| — | decisions | `approvals:edit` | FE calls `POST /businesses/admin/applications/{id}/decision` or `POST /delivery/admin/riders/{userId}/decision` (owning modules; reason required for reject/request_changes; owner notified) | owning module codes | Required key | F-AD-002 |
| GET | `/admin/listings?type=business\|provider\|rider&q=&status=&cursor=` | `catalog:view` + scope | → `{id,name,category/vehicle,area,rating,status}` | — | Yes | F-AD-003, S-ADMN-03 |
| POST | `/admin/listings` | `catalog:edit` + target area in scope | `{type:'business'\|'provider',ownerPhone,nameEn,nameHi?,categoryId,areaId}` → pending listing (Businesses `adminCreate`) | `ADMIN_SCOPE_FORBIDDEN`, `BUSINESS_*` | Required key | F-AD-003 |
| PATCH / DELETE | `/admin/listings/{type}/{id}` | `catalog:edit` + scope | allow-listed details/status + `expectedVersion` → Businesses `adminUpdate`/`adminRemove`; riders via Delivery decision (`suspend`/`restore`) | `BUSINESS_VERSION_CONFLICT`, `RIDER_STATE_CONFLICT` | Required key | F-AD-003 |
| GET | `/admin/listings/{businessId}/products?cursor=` | `catalog:view` + scope | → Products `listForAdmin` | — | Yes | F-AD-003 |
| POST | `/admin/products/{productId}/publication` | `catalog:edit` + scope | `{published,reasonKey,expectedVersion}` → Products `setPublishedByAdmin` | `PRODUCT_VERSION_CONFLICT` | Required key | F-AD-003 |
| GET | `/admin/users?tab=customer\|vendor\|rider&q=&cursor=` | `users:view` + scope (customers by default address/last order area; vendors/riders by area/city) | → `{id,name,phoneMasked,status,meta}` (meta: order count / category / vehicle) | — | Yes | F-AD-004, S-ADMN-04 |
| GET | `/admin/users/{id}` | `users:view` + scope | → profile (masked contact), addresses count, order history page (Orders read port), cases | `USER_NOT_FOUND` | Yes | F-AD-004 |
| POST | `/admin/users/{id}/status` | `users:edit` + scope; not self, not super_admin | `{status:'active'\|'suspended',reasonKey,expectedVersion}` → Users `setAccountStatus` | `USER_VERSION_CONFLICT`, `ADMIN_SELF_ACTION` | Required key | F-AD-004 |
| GET | `/admin/reports/{tab}?from=&to=&cityId=` | `reports:view` + scope; `tab` ∈ orders, revenue, vendors, riders, enquiries; range ≤ 366 days | → orders per day + delivery/pickup mix; GMV per day + platform commission; vendor rows (orders, revenue, rating); rider rows (deliveries, rating, avg earning/ride); provider rows (enquiries, converted, rating) | `VALIDATION_ERROR` | Yes | F-AD-013, S-ADMN-14 |
| GET | `/admin/reports/{tab}/export.csv?…` | `reports:view` + scope (assumption; template action `export` once roles use it) | → CSV stream, ≤ 50 000 rows, UTF-8 BOM, IST timestamps, INR with paise; cells starting `= + - @ \t \r` prefixed with `'` | `REPORT_TOO_LARGE` | Yes | F-AD-013 |
| GET | `/super-admin/overview` | Super | → KPIs total GMV, active cities, vendors, riders, admins, waitlist signups | — | Yes | F-SA-001, S-SUPR-01 |
| GET | `/super-admin/metrics?metric=orders\|revenue\|deliveries&range=7d\|30d\|90d&cityId=` | Super | → `{buckets:[{label,open,high,low,close}]}` (day buckets for 7d/30d, week for 90d); empty array when city not live | `VALIDATION_ERROR` | Yes | F-SA-001 |
| GET | `/super-admin/analytics?range=30d&cityId=` | Super | → `gmvPaise, orders, aovPaise, repeatCustomerPct, ordersByCategory[], deliveryVsPickup{delivery,pickup}, topVendors[]` + deltas vs previous period | — | Yes | F-SA-006, S-SUPR-07 |
| GET | `/super-admin/admins?q=&cityId=&areaId=&roleId=&status=&cursor=` | Super | → `{items:[{id,name,emailMasked,role,status,areas[],permissions}],total}` | — | Yes | F-SA-002, S-SUPR-02 |
| POST | `/super-admin/admins` | Super | `{phone,email,displayName,roleId,areaIds[]}` → account (permissions seeded from role; user gets role admin) | `ADMIN_EXISTS`, `ROLE_NOT_FOUND` | Required key | F-SA-002 |
| GET | `/super-admin/admins/{id}/impact` | Super | → `{areasLeftWithoutActiveAdmin[], openCasesInScope}` for the deactivate confirmation | — | Yes | F-SA-002 |
| POST | `/super-admin/admins/{id}/status` | Super | `{status,expectedVersion}`; deactivate revokes sessions immediately | `ADMIN_VERSION_CONFLICT` | Required key | F-SA-002 |
| PUT | `/super-admin/admins/{id}/areas` · `/permissions` · `/role` | Super | `{areaIds[]}` · `{permissions{module:[actions]}}` · `{roleId,reseedPermissions}` + `expectedVersion` | `ADMIN_VERSION_CONFLICT`, `AREA_NOT_FOUND` | Yes | F-SA-002 |
| GET / POST | `/super-admin/roles` | Super | list with `adminCount`, `isSystem` / `{name,description,permissions}` | `ROLE_NAME_TAKEN` | Required key | F-SA-003, S-SUPR-03 |
| PATCH | `/super-admin/roles/{id}` | Super; system role permissions editable, name/delete locked | `{name?,description?,permissions?,expectedVersion}` → role + `{before,after}` summary | `ROLE_SYSTEM_LOCKED`, `ROLE_VERSION_CONFLICT` | Yes | F-SA-003 |
| POST | `/super-admin/roles/{id}/duplicate` | Super | → new role "Copy of …" | `ROLE_NAME_TAKEN` | Required key | F-SA-003 |
| DELETE | `/super-admin/roles/{id}?reassignTo=` | Super | in use → requires `reassignTo` (moves admins, then deletes in one transaction) | `ROLE_SYSTEM_LOCKED`, `ROLE_IN_USE` | Yes | F-SA-003 |

## Rules and use-cases

1. **Guard data:** `PermissionGuard` reads `admin_permissions` for `(user, module, action)`; `AdminScopeGuard` resolves the target's area/city via the owning module's scope resolver and checks `admin_scopes`. Inactive admin → 403 everywhere. Cached per request only; permission/area/status changes apply on the next request.
2. **Permission-aware responses (AD16):** composite views omit blocks the admin lacks; FE shows the no-permission state from `/admin/me`. Server enforcement is the control, UI is a hint.
3. **Roles (BR-13):** system role ("Area Admin") cannot be renamed or deleted; deleting a role in use requires reassignment; role edit returns before/after; `reseedPermissions` copies role permissions to an admin (per-admin edits otherwise persist).
4. **Admins:** super_admin only; cannot deactivate self; email/phone stored encrypted (users module rules); area assignment must reference existing areas.
5. **Metrics:** computed on demand from read ports (orders, payments, delivery, services enquiries) with indexes on `(city_id, created_at)`; responses `Cache-Control: private, max-age=300`. Money in paise; days bucketed in IST. Candle: per bucket open/close = first/last hourly value, high/low = max/min hourly value (assumption, open question).
6. **Reports CSV:** formula-injection neutralising; streamed; no full phone numbers.
7. **Audit (BR-12):** every POST/PATCH/PUT/DELETE here writes `audit_logs` with before/after (no PII beyond masked values).

## Events and jobs

Publishes `admin.account_status_changed` (Auth revokes sessions), `admin.scope_changed`, `role.updated`. No scheduled jobs.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `ADMIN_EXISTS` | 409 | `errors.admin.exists` |
| `ADMIN_VERSION_CONFLICT` | 409 | `errors.admin.versionConflict` |
| `ADMIN_SELF_ACTION` | 422 | `errors.admin.selfAction` |
| `ADMIN_INACTIVE` | 403 | `errors.admin.inactive` |
| `ROLE_NOT_FOUND` | 404 | `errors.role.notFound` |
| `ROLE_NAME_TAKEN` | 409 | `errors.role.nameTaken` |
| `ROLE_SYSTEM_LOCKED` | 409 | `errors.role.systemLocked` |
| `ROLE_IN_USE` | 409 | `errors.role.inUse` |
| `ROLE_VERSION_CONFLICT` | 409 | `errors.role.versionConflict` |
| `REPORT_TOO_LARGE` | 413 | `errors.reports.tooLarge` |

## Acceptance criteria

1. Given Admin Manoj (approvals:view only), when he posts a business decision, then 403 and no state/audit change.
2. Given an admin scoped to Padrauna areas, when listing approvals, then Kasia items are absent and `/admin/approvals/business/{kasiaId}` → `ADMIN_SCOPE_FORBIDDEN`.
3. Given an admin without `orders:view`, when loading overview, then order KPIs and live orders are omitted.
4. Given role "Support" has 2 admins, when deleted without `reassignTo`, then `ROLE_IN_USE`; with `reassignTo`, admins move and the role is deleted atomically.
5. Given the system role, when delete or rename is requested, then `ROLE_SYSTEM_LOCKED`.
6. Given a super admin deactivates an admin, then that admin's next request returns `ADMIN_INACTIVE` and sessions are revoked.
7. Given a vendor name `=HYPERLINK(...)`, when reports are exported, then the CSV cell starts with `'`.
8. Given `users:edit` + scope, when suspending a customer, then the user status is suspended, sessions revoked, audit has before/after.
9. Given `cityId` of a coming-soon city, when metrics are requested, then `buckets: []`.

## Tests

Unit: guard decisions (permission × scope × status), role delete/reassign, CSV neutraliser, candle bucketing (IST). Integration: approvals queue merging two modules with scope; deactivate → session revoked; role edit before/after. Authorisation negatives: admin on `/super-admin/*`, missing permission per endpoint, out-of-scope IDs, self-deactivate.

## Open questions

Candle OHLC definition (assumed hourly within bucket); whether CSV export needs a separate `export` permission (assumed `reports:view`, as in the prototype); admin-created listings owner invitation (assumed owner phone, listing stays `pending` until owner completes onboarding).
