# BE: admin

Features: F-AD-001, F-AD-002, F-AD-003, F-AD-004, F-AD-013, F-AD-016, F-SA-001, F-SA-002, F-SA-003, F-SA-006 | Rules: BR-12, BR-13, BR-02, BR-14 | State machines: ST-approval (composed), ST-admin-account (active ⇄ inactive) | Depends on: users, geo, businesses, products, services, delivery, orders, payments, reviews, offers, media-videos, audit (writes), settings.

Frontend counterpart: [FE admin](../fe/admin.md)

Contents: [Tables](#tables) · [Scope](#scope-and-read-context) · [Endpoints](#endpoints) · [Ports](#required-owning-module-ports) · [Acceptance](#acceptance-criteria) · [Decisions](#open-questions)

## Responsibility

Own admin accounts, role templates, per-admin permissions and area scopes; provide the guards' data (`PermissionGuard`, `AdminScopeGuard` in [backend-shared](../../_foundation/backend-shared.md)). Compose admin console views (overview, approvals queue, listings, users, reports) and super-admin views (overview chart, admins, roles, analytics) from other modules' read ports. Decisions on a domain object always call the owning module; admin never writes another module's tables.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `roles` | `id uuid PK`; `name text NOT NULL UNIQUE CHECK 2–40`; `description text NULL CHECK <= 200`; `is_system bool NOT NULL DEFAULT false`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at` | PK, unique name |
| `role_permissions` | `role_id uuid FK roles ON DELETE CASCADE`; `module text CHECK ('approvals','orders','users','reviews','comms','reports','catalog','promos')`; `action text CHECK ('view','create','edit','delete','export')`; PK `(role_id,module,action)` | PK |
| `admin_accounts` | `user_id uuid PK FK users`; `display_name text NOT NULL`; `email_ciphertext text NOT NULL`; `role_id uuid NOT NULL FK roles`; `status text NOT NULL CHECK ('active','inactive')`; `communication_scopes text[] NOT NULL DEFAULT '{}' CHECK subset of ('city','zone')`; `last_active_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; `created_by uuid FK users`; `created_at/updated_at` | `(role_id)` (role in-use check); `(status)` |
| `admin_permissions` | `user_id uuid FK admin_accounts ON DELETE CASCADE`; `module`, `action` (same CHECKs); PK `(user_id,module,action)` | PK (guard lookup) |
| `admin_scopes` | `id uuid PK`; `user_id uuid NOT NULL FK admin_accounts ON DELETE CASCADE`; `authority text NOT NULL CHECK ('area','city')`; `area_id uuid NULL FK areas`; `city_id uuid NOT NULL FK cities`; CHECK area authority has a matching-city area, city authority has no area; unique `(user_id,area_id)` for area grants and `(user_id,city_id)` for explicit city grants | `(user_id,authority,city_id,area_id)` (guard); `(city_id)` (assigned-admin cards) |
| `listing_reports` | `id uuid PK`; `target_type text NOT NULL CHECK ('business','provider')`; `target_id uuid NOT NULL FK businesses`; `reporter_user_id uuid NULL FK users`; `reporter_subject_hash bytea NOT NULL`; `reason text NOT NULL CHECK ('fake','wrong','abuse','closed')`; `details text NULL CHECK length <= 500`; `city_id/area_id uuid NOT NULL`; `status text NOT NULL DEFAULT 'open' CHECK ('open','resolved')`; `resolution text NULL CHECK ('dismissed','action_taken')`; `resolution_note text NULL CHECK length <= 500`; `resolved_by uuid NULL`; `resolved_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; timestamps; unique open `(target_id,reporter_subject_hash)` | `(area_id,status,created_at DESC,id DESC)` (Listings reports); `(target_id,status)` |

`super_admin` is a `users` role, not an `admin_accounts` row; guards treat it as platform-wide with all permissions.

## Scope and read context

- `ScopeRef = {cityId:uuid|null,areaId:uuid|null}`: area resource has both IDs; city-only resource has city but no area; global resource has neither. Resolve these from the owning module, not request claims.
- `AdminScopePort.authorize({actorUserId,module,action,scopes:ScopeRef[]})` returns server-derived `AdminReadContext = {actorUserId,permission:{module,action},scope:{platformWide,cityWideIds[],areaIds[]},scopeRevision,locale}`.
- **Shared predicate:** active super admin passes; active admin needs the module/action and, for every scope, the exact assigned area or an explicit whole-city grant. City-only records require an explicit whole-city grant. Global/unresolved records require super admin. One assigned area never implies authority over its city or other areas.
- An area move checks **both source and destination** with the same permission, before writing; apply the same intersection to history containing both scopes. `cityId=all`, search, totals, exports and recipients never bypass this predicate.
- Scope applies before pagination/aggregation. `Page<T>={items:T[],nextCursor:null|string}`, limit 1–50; cursors bind filters, actor/scope revision and stable `(createdAt,id)` ordering. Detail returns the same projection/version used by edits.
- `edit` implies `view`; enabling any other action also includes view, and removing view clears all actions for that module (`js18.js:97`). Recheck current grants on every call; role reseeding must not expand geography or `communication_scopes`.
- Existing area assignment replaces area grants only; grouped city labels are not city grants. Provisioning explicit whole-city authority is decision-gated below, not inferred from the prototype's city labels.

## Endpoints

All `/admin/*` require active admin/super_admin; `/super-admin/*` requires super_admin. “Scope” below means the predicate above. Admin mutations require CSRF, `Idempotency-Key`, expected versions and transactional before/after audit. Public report intake is the explicit exception to admin authentication.

| Method | Path | Auth, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/admin/me` | Own admin/super identity | → `{id,name,emailMasked,areas[],cityWideIds[],permissions,communicationScopes[],scopeRevision,isSuper}` | — | Yes | F-AD-016, S-ADMN-17 |
| GET | `/admin/overview` | Per-block permission + scope | → `OverviewDTO` below; includes existing support/report alerts, not a new inbox | — | Yes | F-AD-001, S-ADMN-01 |
| GET | `/admin/approvals?type=business\|provider\|rider&status=pending\|changes_requested\|approved\|rejected&cursor=` | `approvals:view` + scope | → merged queue from Businesses and Delivery read ports; item `{type,id,name,category/vehicle,area,submittedAt,status}` | `VALIDATION_ERROR` | Yes | F-AD-002, S-ADMN-02 |
| GET | `/admin/approvals/{type}/{id}` | `approvals:view` + scope | → owning detail DTO, `version`, document references and paged `AuditReadPort.entityHistory`; no storage keys | `ADMIN_SCOPE_FORBIDDEN` | Yes | F-AD-002 |
| — | decisions | `approvals:edit` | FE calls `POST /businesses/admin/applications/{id}/decision` or `POST /delivery/admin/riders/{userId}/decision` (owning modules; reason required for reject/request_changes; owner notified) | owning module codes | Required key | F-AD-002 |
| GET | `/admin/listings?type=business\|provider\|rider&q=&status=&cursor=&limit=` | `catalog:view` + scope | → `Page<ListingCard>` including report count, type, ID, name, category/vehicle, area, rating, status, version | — | Yes | F-AD-003, S-ADMN-03 |
| GET | `/admin/listings/{type}/{id}` | `catalog:view` + scope | → `ListingDetail` with actual edit values, `version`, `allowedActions`, paged reports | `COMMON_NOT_FOUND` | Yes | F-AD-003 |
| POST | `/admin/listings` | `catalog:edit` + destination scope | `ListingCreate` below → detail via owning command; blocked pending ADM-Q1, not silently pending or approved | `ADMIN_CREATION_POLICY_REQUIRED` | Required key | F-AD-003 |
| PATCH | `/admin/listings/{type}/{id}` | `catalog:edit` + source and destination scopes | `ListingEdit` below → owning versioned command, not direct status assignment | Owning version/state codes | Required key | F-AD-003 |
| DELETE | `/admin/listings/{type}/{id}` | `catalog:edit` + source scope | `{expectedVersion,note?}` → owning `adminRemove`/`adminRemoveRider`, no suspend-as-delete shortcut | `ADMIN_INFLIGHT_POLICY_REQUIRED`, owning conflict codes | Required key | F-AD-003 |
| POST | `/listing-reports` | Public, optional session; public shop/provider target | `{targetType,targetId,reason,details?}` → `202 {reportId}` | `VALIDATION_ERROR`, `COMMON_RATE_LIMITED`, `COMMON_NOT_FOUND` | Required key; duplicate returns same report | F-PF-007, S-CUST-06, S-CUST-07 |
| GET | `/admin/listing-reports?targetId=&status=&cursor=` · `/{id}` | `catalog:view` + report/target scope | → paged report/detail; reporter masked, no subject hash | `COMMON_NOT_FOUND` | Yes | S-ADMN-03 |
| POST | `/admin/listing-reports/{id}/resolution` | `catalog:edit` + scope | `{resolution:'dismissed'\|'action_taken',note?,expectedVersion}` → resolved report; listing action uses its existing command separately | `ADMIN_VERSION_CONFLICT` | Required key | S-ADMN-03 |
| GET | `/admin/listings/{businessId}/products?cursor=` | `catalog:view` + scope | → `ProductAdminReadPort.listForBusiness` including unpublished records | — | Yes | F-AD-003 |
| POST | `/admin/products/{productId}/publication` | `catalog:edit` + scope | `{published,reasonKey,expectedVersion}` → Products `setPublishedByAdmin` | `PRODUCT_VERSION_CONFLICT` | Required key | F-AD-003 |
| GET | `/admin/users?tab=customer\|vendor\|rider&q=&cursor=` | `users:view` + authoritative subject scope | → `Page<UserAdminCard>`; unresolved customer scope excluded for regular admins (ADM-Q3) | — | Yes | F-AD-004, S-ADMN-04 |
| GET | `/admin/users/{id}?tab=&businessId=&historyCursor=` | `users:view` + subject scope | → `UserAdminDetail`, narrow order/case history projection below | `USER_NOT_FOUND` | Yes | F-AD-004 |
| POST | `/admin/users/{id}/status` | `users:edit` + subject scope; not self/super admin | `{subject:'customer'\|'business'\|'rider',businessId?,action:'suspend'\|'reactivate',reasonKey,expectedVersion}` → typed owner command below | Owning conflicts, `ADMIN_SELF_ACTION`, `ADMIN_INFLIGHT_POLICY_REQUIRED` | Required key | F-AD-004 |
| GET | `/admin/reports/{tab}?from=&to=&cityId=` | `reports:view` + scope; `tab` ∈ orders, revenue, vendors, riders, enquiries; range ≤ 366 days | → orders per day + delivery/pickup mix; GMV per day + platform commission; vendor rows (orders, revenue, rating); rider rows (deliveries, rating, avg earning/ride); provider rows (enquiries, converted, rating) | `VALIDATION_ERROR` | Yes | F-AD-013, S-ADMN-14 |
| GET | `/admin/reports/{tab}/export.csv?…` | `reports:view` AND `reports:export` + current exact scope; recheck throughout streaming | → CSV stream, ≤ 50 000 rows, UTF-8 BOM, IST timestamps, INR with paise; cells starting `= + - @ \t \r` prefixed with `'` | `REPORT_TOO_LARGE` | Yes | F-AD-013 |
| GET | `/super-admin/overview` | Super | → KPIs total GMV, active cities, vendors, riders, admins, waitlist signups | — | Yes | F-SA-001, S-SUPR-01 |
| GET | `/super-admin/metrics?metric=orders\|revenue\|deliveries&range=7d\|30d\|90d&cityId=` | Super | Graph-only → `{asOf,definitionVersion,points:[{start,end,value}],unavailable[]}` using reporting definitions below; no `candles` or OHLC fields. | `VALIDATION_ERROR` | Yes | F-SA-001 |
| GET | `/super-admin/analytics?range=30d&cityId=` | Super | → `gmvPaise, orders, aovPaise, repeatCustomerPct, ordersByCategory[], deliveryVsPickup{delivery,pickup}, topVendors[]` + deltas vs previous period | — | Yes | F-SA-006, S-SUPR-07 |
| GET | `/super-admin/admins?q=&cityId=&areaId=&zoneId=&roleId=&status=&cursor=` | Super | → page + total; cards `{id,name,phoneE164,email,role,status,areas[],cities[],zones[],cityWideIds[],communicationScopes[],permissions,lastActiveAt,version}`; sensitive contacts private/no-store | — | Yes | F-SA-002, S-SUPR-02 |
| POST | `/super-admin/admins` | Super | `{phone,email,displayName,roleId,areaIds[]}` → account (permissions seeded from role; user gets role admin) | `ADMIN_EXISTS`, `ROLE_NOT_FOUND` | Required key | F-SA-002 |
| GET | `/super-admin/admins/{id}/impact` | Super | → `{areasLeftWithoutActiveAdmin[], openCasesInScope}` for the deactivate confirmation | — | Yes | F-SA-002 |
| POST | `/super-admin/admins/{id}/status` | Super | `{status,expectedVersion}`; deactivate revokes sessions immediately | `ADMIN_VERSION_CONFLICT` | Required key | F-SA-002 |
| PUT | `/super-admin/admins/{id}/areas` · `/permissions` · `/role` | Super | `{areaIds[]}` · `{permissions{module:[actions]}}` · `{roleId,reseedPermissions}` + `expectedVersion` | `ADMIN_VERSION_CONFLICT`, `AREA_NOT_FOUND` | Yes | F-SA-002 |
| GET / POST | `/super-admin/roles` | Super | list with `adminCount`, `isSystem` / `{name,description,permissions}` | `ROLE_NAME_TAKEN` | Required key | F-SA-003, S-SUPR-03 |
| PATCH | `/super-admin/roles/{id}` | Super; system roles locked | `{name?,description?,permissions?,expectedVersion}` → role + `{before,after}` summary | `ROLE_SYSTEM_LOCKED`, `ROLE_VERSION_CONFLICT` | Yes | F-SA-003 |
| POST | `/super-admin/roles/{id}/duplicate` | Super | → new role "Copy of …" | `ROLE_NAME_TAKEN` | Required key | F-SA-003 |
| DELETE | `/super-admin/roles/{id}?reassignTo=` | Super | in use → requires `reassignTo` (moves admins, then deletes in one transaction) | `ROLE_SYSTEM_LOCKED`, `ROLE_IN_USE` | Yes | F-SA-003 |

## Listing and user commands

- `ListingCreate` is `{type:'business'|'provider'|'rider',nameEn,nameHi?,phoneE164,areaId}`; shop/provider also need the owner-approved onboarding/category contract, rider creation the Delivery profile contract. No guessed category, Bike, address, verified badge or invitation. Missing required domain fields/creation authority is ADM-Q1; return `ADMIN_CREATION_POLICY_REQUIRED` without creating a row.
- `ListingDetail` is the appropriate owning detail DTO below plus `{type,rating:{average,count},reports:{openCount,items,nextCursor},allowedActions}`. Full contact for editing is returned only to this authorized private detail; notes are audit input, not a public profile field.
- `ListingEdit={nameEn?,nameHi?,phoneE164?,areaId?,statusAction?,note?,expectedVersion}`; business may additionally accept `categoryId?` where its owner allows it. Rider name maps to `fullName`; phone is rider contact, **not** replacement of the verified Users login credential. Note is plain text ≤500, audited. Status picker shows only named ST-approval actions returned by the owning module; never a raw unrestricted enum setter.
- Required writes: Businesses `adminCreate/adminUpdate/adminRemove`; Delivery `adminCreateRider/adminUpdateRider/adminRemoveRider`. Every command receives `AdminReadContext`, typed fields and version, repeats ownership/scope checks, writes its own tables, and audits once inside the transaction. Removal hides the listing/stops new selling or rider work; retained order/financial references are not deleted.
- Users-tab customer action calls `Users.setAccountStatus`; business action validates the selected business belongs to that user, then invokes Businesses suspend/restore; rider action invokes Delivery suspend/restore, setting offline and preventing new offers. Do not suspend a multi-role login just because one listing was selected. Restore cannot turn pending/rejected applications into approved ones.
- Existing orders/jobs are not silently cancelled, refunded, reassigned or erased. If removal/suspension would require an undecided in-flight intervention, reject with `ADMIN_INFLIGHT_POLICY_REQUIRED` until ADM-Q2 is resolved.
- Reports: plain-text details, enum reason, target-kind check, session-derived reporter; guests use an opaque first-party subject nonce with hashed storage. Enforce 5 submissions/hour per subject and abuse-IP hash, length/body caps, CSRF/origin protection and shared idempotency; never log report text/IP. Replays/open duplicates do not create alerts again. Report → queue + event; no automatic takedown. Resolve only after dismissing or recording a completed owning-module action.

## Required owning-module ports

These are **owner-implemented contracts for existing screens**, linked from the owning specs; Admin must not query their tables or reuse vendor-only APIs. All ports reauthorize `ctx` and scope before rows, totals or cursors; only allow-listed projections below may cross the boundary.

| Port / owner | Request | Response / permitted purpose |
|---|---|---|
| `BusinessAdminReadPort.list` / Businesses | `ctx,{view:'applications'\|'listings',kind?,status?,q?,cursor?,limit?}` | `Page<{id,kind,nameEn,nameHi?,categoryId,cityId,areaId,status,version,submittedAt?}>`; `approvals:view` for applications, `catalog:view` for listings, including non-public records |
| `BusinessAdminReadPort.detail` | `ctx,{businessId,view}` | Card + `{ownerUserId,phoneE164,addressText,logoAssetId?,coverAssetId?,documents:[{documentId,kind,assetId}],allowedActions[]}`; documents only for approval viewers, never public URLs |
| `BusinessAdminReadPort.summary` | `ctx,{from,toExclusive}` | `{pendingCount,approvedShopCount,approvedProviderCount,topPending[]}`; appropriate overview/report permission; no synthetic counts |
| `ProductAdminReadPort.listForBusiness` / Products | `ctx,{businessId,cursor?,limit?}` | `Page<{id,businessId,nameEn,nameHi?,slug,published,availableForSale,stock,version}>`, including unpublished rows; `catalog:view`; existing `setPublishedByAdmin` remains the mutation |
| `DeliveryAdminReadPort.listRiders/detail` / Delivery | `ctx,{view:'applications'\|'listings',status?,q?,cursor?,limit?}` / `ctx,{riderUserId,view}` | `Page<RiderAdminCard>` / card + `{phoneE164,documentRefs[],allowedActions[]}`; card `{id,fullName,vehicleType,vehicleNumber?,cityId,areaId?,status,isOnline,version,submittedAt?}`; permission follows view; city-only rider needs city-wide authority |
| `DeliveryAdminReadPort.summary` | `ctx` | `{pendingCount,approvedRiderCount,topPending: RiderAdminCard[]}` for authorized approval blocks/platform overview; not a guessed count of online riders |
| `UserAdminReadPort.list/detail` / Users | `ctx,{tab,q?,cursor?,limit?}` / `ctx,{userId,tab,businessId?}` | Cards `{id,name,phoneMasked,status,scope,version,subjectId,meta}`; detail adds `{emailMasked,addressCount,heldRoles}`; no KYC/payment credentials. Users resolves customer scope; never Admin's guessed last-order fallback |
| `UserAdminReadPort.adminContacts` | `ctx,{userIds[]}` (≤50, existing admin IDs only) | `[{userId,phoneE164}]`, super_admin management purpose only; fills the existing admin-card Call/contact control, never a regular admin's customer-contact dump |
| `OrderAdminReadPort.userHistory` / Orders | `ctx,{userId,businessId?,tab,cursor?,limit?}` | `Page<{orderId,orderNumber,businessId,mode,status,placedAt,totalPaise,caseSummary:{id,status}[]}>`; `users:view` narrow history only, scope checked on each order; no addresses/codes/internal notes |
| `OrderAdminReadPort.overview/report` | `ctx,{from,toExclusive,asOf,cursor?,categoryCursor?,limit?}` | `{ordersCreated,ordersByDay:[{date,count}],modeCounts:{delivery,pickup},categoryCounts:Page<{categoryId:uuid\|null,orderCount}>,openCases,liveOrders:Page<OrderCard>,vendors:Page<{businessId,orders}>,asOf,definitionVersion,unavailable[]}`; category counts use immutable primary-category snapshots, null=Unclassified, limit ≤50; `orders:view` overview or `reports:view` report, super_admin analytics |
| `PaymentAdminReadPort.metrics` / Payments | `ctx,{from,toExclusive,asOf,businessIds?,purpose:'overview'\|'reports'\|'analytics'}` | `{gmvPaise,commissionPaise,platformIncomePaise,completedOrderCount,repeatCohort:{eligibleCustomers,repeatCustomers,rateBps},gmvByDay:[{date,paise}],incomeByDay:[{date,paise}],byBusiness:[{businessId,gmvPaise,completedOrderCount}],topVendors:[{businessId,gmvPaise,completedOrderCount}],asOf,definitionVersion,unavailable[]}`; top ≤10 from the entire authorized cohort, byBusiness ≤50 requested IDs; null metrics only for incomplete data; `orders:view` overview, `reports:view` reports, super_admin analytics; no customer identities/ledger dump |
| `DeliveryAdminReadPort.overview/report` | `ctx,{from,toExclusive,cursor?,limit?}` | `{activeDeliveries,ridersOnline,deliveredCount,byDay:[{date,count}],riders:Page<{riderUserId,deliveries,earningPaise,averageEarningPerRidePaise}>,alerts[]}`; `orders:view` overview or `reports:view` report; earnings only posted/approved snapshots |
| `ServiceAdminReadPort.enquiryReport` / Services | `ctx,{from,toExclusive,cursor?,limit?}` | `{enquiriesTotal,convertedTotal,providers:{items:[{businessId,enquiries,converted}],nextCursor}}`; `reports:view`; enquiry text/contact excluded |
| `GeoAdminReadPort.options` / Geo | `ctx,{kind:'city'\|'area'\|'zone',cityId?,q?,cursor?,limit?}` | `Page<GeoScopeOption>` from [Geo's contract](../../geo/be/geo.md#endpoints), limit ≤50, intersected with grants; a choice is not a grant |
| `GeoAdminReadPort.resolveZoneScope` | `{zoneIds[]}` | `{zones:[{id,cityId,areaIds[],version}],revision,unresolved}`; authoritative mapping, no geometric guess; unresolved denies area-derived authority, not a separately verified whole-city grant |
| `GeoAdminReadPort.summary` | `ctx` | `{enabledCities,waitlistSignups}` from actual Geo records; super_admin only for platform overview |
| `ReviewsAdminReadPort.summary` / Reviews | `ctx,{targetRefs?,from?,toExclusive?}` | `{pendingCount?,reportedCount?,removedCount?,ratings:[{targetType,targetId,average,count}],alerts?}`; reviews:view for moderation counts/alerts; catalog/approvals/users/reports:view permits **only ratings** for the already-authorized listing/approval/subject/report projection |
| `MediaAdminReadPort.summary` / Media | `ctx` | `{pendingCount,openReportCount,removedCount,alerts[]}`; `reviews:view`, including photo reports; comments summary from Engagement with the same gate |
| `AuditReadPort.entityHistory` / Audit | `ctx,{entityType,entityId,cursor?,limit?}` | Narrow approval history after `approvals:view` and scope; general audit remains `reports:view` |
| `SettingsSupportReadPort.alerts/detail` / Settings | `ctx,{cursor?,limit?}` / `ctx,{messageId}` | Scoped support alert references / authorized message; existing `/admin/overview?supportMessageId=` destination only |

`AdminRecipientsPort.list({module,action:'view',scope,cursor?,limit<=500}) -> Page<{userId,audienceRole:'admin'|'super_admin'}>` is Admin-owned for Notifications. It returns active, currently authorized recipients only; global support alerts resolve to super admins, never all area admins.

### Composite DTOs and measurement boundaries

- `OrderCard={orderId,orderNumber,businessId,businessName,mode,status,placedAt,totalPaise,scope}` is the minimized live-order card. Rider `documentRefs` are `{documentId,kind,assetId}`, not URLs; authorized approval detail alone resolves them. Users-tab card `status/version/subjectId` refer to the selected customer account, business or rider subject, not a mismatched user version.
- `OverviewDTO={asOf,kpis,approvals:{items,nextCursor}?,liveOrders?,alerts[],unavailable[]}`. KPI keys remain `gmvMonthPaise,ordersToday,activeDeliveries,approvalsPending,openCases,ridersOnline`; omit forbidden blocks, not their data behind CSS. Alerts are `{kind,entityId,labelKey,params,linkPath}` from the ports; never leak raw report/support text in logs.
- Orders count = orders placed in `[from,toExclusive)`; live = placed/accepted/preparing/ready/out_for_delivery; open cases = open/in_review. Delivery counts use delivered timestamps. Enquiry totals use created timestamps; converted totals use converted timestamps. Buckets are IST dates converted to UTC bounds, including empty zero-count days.
- Reports response: `{tab,from,toExclusive,asOf,definitionVersion?,series?,rows:{items,nextCursor},totals,unavailable[]}`. Orders uses order counts/mode mix; revenue uses Payment metrics; vendors joins business/order/payment/rating by ID; riders joins Delivery/rating; enquiries joins Service/Business/rating. Scope is applied inside each owner, never after joining a global aggregate.
- Super overview combines actual approved vendor/provider/rider counts, active admin count, enabled cities and waitlist count; `totalGmvPaise` uses the financial definition, not order totals guessed as revenue.
- Analytics keeps `{gmvPaise,orders,aovPaise,repeatCustomerPct,ordersByCategory[],deliveryVsPickup,topVendors[],deltas,unavailable[]}` using the resolved definitions below. Return null plus `data_incomplete`/`dependency_unavailable` for missing evidence, not sample series. Candle/OHLC remains removed.
- Reports/export use identical filters, as-of instant, definitions and read ports; range ≤366 days, keyset rows, CSV ≤50,000 rows, paise-accurate INR/IST formatting and formula neutralisation. Financial columns with incomplete evidence are explicitly unavailable in screen/export, never zero. No-store private responses and live scope checks apply.

### Reporting definitions

**Decision 2026-11-11: ADM-Q4 and Q-11's existing dashboard metrics are resolved as `reporting-v1`.** These are operational reports, not statutory accounts, audited revenue recognition, payout promises or a new analytics platform. Owner modules compute their measures; Admin composes authorized projections.

| Metric | Exact source, denominator and time basis |
|---|---|
| Orders / delivery mix | Distinct per-shop orders placed in `[from,toExclusive)`; keep cancellation history in placement counts. Delivery/pickup mix uses this same cohort. Delivered jobs use actual `delivered_at`, never order creation. |
| GMV | Net merchandise value **including product GST**, after merchant offers/coupons, before platform-funded subsidy, excluding every delivery/platform fee. Count only fulfilled + verified-funded orders, bucket by `fulfilled_at`, subtract corresponding verified merchandise refunds through `asOf`. Full-refunded orders contribute zero; capture without placement and pending/refused refunds contribute nothing. Historical cohorts may change after a later verified refund; show `asOf`. |
| Commission / owner net | Payments' frozen checkout commission rate applies to tax-exclusive merchant merchandise consideration; remove original allocated commission on verified merchandise refunds. Owner gross is fulfilled merchant merchandise + merchant self-delivery, including their taxes, before platform subsidy; net deducts commission and its invoiced tax and verified merchant refunds. Platform subsidy is part of merchant funding, not extra gross. Net is an operating balance, not money paid out. |
| Platform income (`metric=revenue`) | Label **Platform income (operational)**. Sum commission + platform fee + platform-arranged delivery consideration excluding their GST at fulfilled/funded recognition, plus verified activated plan/promotion purchase consideration excluding GST at activation, minus verified reversals at reversal time. Bucket by these ledger effective instants; permit signed daily net. Prepaid purchase inclusion is clearly operational booking, not statutory deferred-revenue accounting. Never label all marketplace GMV as platform revenue. |
| AOV | GMV / count of fulfilled, funded orders in the GMV cohort, rounded half-up to paise. Zero denominator -> null/not applicable, not zero. Display “Completed-order AOV”; the separate Orders KPI counts placements and is not its denominator. |
| Repeat customers | Among distinct customers with at least one still-positive fulfilled/funded checkout in the selected period, percent with >=2 distinct such checkout IDs in that same period. Multi-shop orders from one checkout are **one** purchase for this metric. Zero customers -> null; use basis-point precision and shared display formatting. |
| Orders by category / top vendors | Each placed order belongs once to its snapshotted business primary-category ID (persist at checkout); never join current multi-category membership into counts. Missing legacy category is an explicit Unclassified bucket. Top vendors: GMV descending, then completed order count descending, then business ID; return at most 10 in the same scope/window. |
| Deltas | Compare equal-length adjacent periods using identical definitions/scope and the same `asOf`; percentage `(current-previous)/abs(previous)*100`, rounded to 2 decimals. Previous zero -> null with “No comparison”, never Infinity/100%. A genuinely empty complete period has zero count/amount; incomplete history is not an empty period. |
| Enquiries / conversion | Admin enquiry totals use creation time; converted activity uses first `converted_at`. Provider conversion rate instead uses a cohort: enquiries created in the requested period that have converted by `asOf` / enquiries created in that period. Zero denominator -> null. Do not divide conversions from older enquiries by only new enquiries. Enquiry-only services produce no revenue. |
| Ratings / riders | Ratings use current approved Reviews aggregates, labelled current (not a period rating). Rider average earning/ride uses posted earnings for completed jobs in the period divided by those jobs; zero jobs -> null. No unposted payout or estimated distance is earnings. |

Shared first-party **visible-detail measurement** for existing profile/offer/video metrics: accept only a browser active/visible signal, not GET rendering, prefetch, crawler, private preview or owner self-view. Use the existing anonymous/authenticated session's server-derived hash, entity ID and 30-minute UTC window as the dedup key; no new tracking cookie, raw IP, contact, device fingerprint, cross-site ID or marketing consent inference. A session is not a unique person. Enforce current public eligibility and CSRF/Origin checks on POST, cap signal ingestion at 30/minute/session via shared abuse limiter, persist dedup + IST daily counter atomically, and remove dedup after 48 hours. Aggregate counts retain no visitor identity; data requests stop/remove any still-linked transient records under the existing owner privacy contract.

Owners return `{asOf,definitionVersion:'reporting-v1',coverageStartedAt,unavailable[]}` with existing metrics. Migration records a known counter baseline and start time; never fabricate pre-instrumentation days/attribution. Public counts never authorize offers, financial payments, featuring or consent. No additional marketing/event taxonomy is selected.

Admin captures one trusted `asOf` and passes it to all owner reads for current/comparison periods; it never reconstructs missing cohort facts from public lists. Payments computes repeat customers internally from distinct checkout/customer IDs with retained positive merchandise GMV after verified reversals, including eligible platform-funded no-charge orders; merchant-free zero-GMV orders are not positive repeat purchases. Orders computes category counts before pagination; chart/table page identically without pretending a visible category page is the global total. No owner port exposes customer-level history for these aggregates.

Financial queries include only facts recorded by `asOf` and reversals verified by that cutoff. A lagging projection reports its coverage/unavailable state, never silently combines an incomplete cohort with a fully current denominator. Test repeat counts across multi-shop and distinct checkouts, full-refund/zero-GMV exclusion, top-vendor ties and a category beyond the first page; scoped direct owner-port calls must equal screen/export results.

For no-charge orders, the authorized `reverseNoCharge` ledger fact is the financial-return evidence: reduce original merchandise GMV/subsidy/commission by those frozen shares even though there is correctly no customer refund transaction/event. No reversal can exceed the original component.

Query contract: normalize IST date ranges once to half-open UTC bounds, use one trusted scope predicate in each owner, batch at most 50 business/target IDs and keyset-page rows. Add Orders `(fulfilled_at,business_id,id)` for completed cohorts and `(primary_category_id_snapshot,placed_at,id)` for category counts; Payments `(effective_at,business_id,id)` for scoped ledger series. Explain plans with representative multi-category shops, delayed refunds and 366-day ranges; no benchmark result is claimed. CSV requires `reports:export` as well as view; new grants are never auto-added to existing roles.

Acceptance: Given two shops in one checkout, a business in two categories, an old-order refund and a zero comparison period, then repeat purchases/categories are not doubled, GMV/reversal dates follow their definitions and undefined ratios are null. Given a cross-area admin, late duplicate events, a prefetch or repeated visible signal, then unauthorized rows never enter aggregates and counters increment at most once per key. Screen/table/CSV totals share the exact same definitions and `asOf`.

## Rules and use-cases

1. **Guard data:** use the scope/read-context contract above. Inactive admin → 403 everywhere; grants cached per request only. `communication_scopes` is an independent allowlist (`js15.js:23`, `js19.js:52`): zone-only stays zone-only even with `comms:edit`.
2. **Permission-aware responses (AD16):** composite views omit blocks the admin lacks; FE shows the no-permission state from `/admin/me`. Server enforcement is the control, UI is a hint.
3. **Roles (BR-13):** system roles are locked; deleting a custom role in use requires valid different-role reassignment, checked again under lock; reassign/delete is atomic. `reseedPermissions` copies normalized module permissions only; per-admin edits otherwise persist.
4. **Admins:** super_admin only; cannot deactivate self; email/phone stored encrypted (users module rules); area assignment must reference existing areas.
5. **Admin cards:** `zoneId` filters by authoritative Geo area mapping or an explicit city-wide grant covering that zone, not every admin with a same-city area. `areaId` and `zoneId` are mutually exclusive filter choices. Audit shortcut is `/super-admin/activity?actorId={userId}`, not a name search.
6. **Reports CSV:** formula-injection neutralising; streamed; no full phone numbers.
7. **Audit (BR-12):** every POST/PATCH/PUT/DELETE here writes `audit_logs` with before/after (no PII beyond masked values).

## Events and jobs

Publishes `admin.account_status_changed` (Auth revokes sessions), `admin.scope_changed`, `role.updated`, and `listing.reported {reportId,targetType,targetId,cityId,areaId}` after commit. Notifications consumes `listing.reported`; report resolution does not silently send an invented support reply. No scheduled jobs.

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
| `ADMIN_CREATION_POLICY_REQUIRED` | 409 | `errors.admin.creationPolicyRequired` |
| `ADMIN_INFLIGHT_POLICY_REQUIRED` | 409 | `errors.admin.inflightPolicyRequired` |
| `ADMIN_METRIC_POLICY_REQUIRED` | 409 | `errors.admin.metricPolicyRequired` |

## Acceptance criteria

1. Given an admin with approvals:view only, when posting a business decision, then 403 and no state/audit change.
2. Given one Padrauna area grant, when listing or opening another Padrauna area's record, a city-only rider, or a global record, then access is denied; explicit whole-city authority admits only that city's records.
3. Given an admin without `orders:view`, when loading overview, then order KPIs and live orders are omitted.
4. Given role "Support" has 2 admins, when deleted without `reassignTo`, then `ROLE_IN_USE`; with `reassignTo`, admins move and the role is deleted atomically.
5. Given the system role, when delete or rename is requested, then `ROLE_SYSTEM_LOCKED`.
6. Given a super admin deactivates an admin, when the transaction commits, then sessions are revoked and the next request returns `ADMIN_INACTIVE`.
7. Given a vendor name `=HYPERLINK(...)`, when reports are exported, then the CSV cell starts with `'`.
8. Given `users:edit` + scope, when suspending the selected customer/business/rider, then the correct owner's command runs with the selected version; other roles are unchanged and undecided in-flight intervention is blocked.
9. Given `cityId` of a coming-soon city, when metrics are requested, then `points: []` and an unavailable reason, with no sample data or `candles` field.
10. Given a rider detail, when editing phone/note or removing it, then Delivery receives the typed command and version, not a suspend/restore masquerading as CRUD.
11. Given a listing in area A, when moving it to unassigned area B, then the complete write is denied, even if both share a city.
12. Given ADM-Q1 unresolved, when creating any listing type, then no approved or pending listing is silently created.
13. Given a guest report replay or malicious details, when submitted, then duplicates alert once, text is inert, and abuse limits reject excess attempts; authorized Listings can read/resolve it.
14. Given empty versus unavailable metrics, when rendering/exporting a report, then actual emptiness is distinct from a decision gate; page/export filters and IST boundaries agree.
15. Given zone-only comms permission and an edit-only permission payload, when grants are saved, then view is included but city communication authority is not added.

## Verification

Follow the [verification policy](../../../.github/instructions/testing.instructions.md): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Rules: AC2/11/15 scope algebra and permission normalization; AC4/5 role locks/reassignment; AC13 input/CSV injection. Manual API/DB: populated/empty typed projections, scope before pagination/counts, AC8/10 owner commands, report intake → event → alert, version races, UTC/IST month boundaries, export parity (AC14). Authorization negatives: every port purpose, same-city foreign area, foreign rider/doc, super-only operations and permission revocation during paging.

## Open questions

- **ADM-Q1 — Open question:** prototype `js11.js:38–39` says **Create (approved)**; existing Businesses creation says pending/onboarding. Which owner verification, required category/vehicle fields and authority permit direct approval? Create stays blocked; do not choose either lifecycle or seed fake defaults.
- **ADM-Q2 — Open question:** active-order/job handling for removal/suspension beyond BR-06 is not defined. Block an action requiring that intervention; never cancel/refund/erase on Admin's initiative.
- **ADM-Q3 — Open question:** customer geographic membership and explicit whole-city-grant provisioning need approved definitions. Unknown scope is not city-wide; unscoped/global records remain super-admin-only.
- **ADM-Q4 — Resolved:** reporting-v1 above defines existing financial/cohort/attribution measures. Missing production evidence is a data-readiness error; Candle/OHLC remains excluded, not a future dependency.
- CSV uses prototype `reports:view`; a separate export capability, support-response workflow, and changing the per-admin communication-scope allowlist need confirmation before adding controls. System-role editing remains locked pending resolution of the prototype/domain-rule conflict.
