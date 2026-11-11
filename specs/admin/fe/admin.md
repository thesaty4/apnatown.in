# FE: admin

Features: F-AD-001, F-AD-002, F-AD-003, F-AD-004, F-AD-013, F-AD-016, F-SA-001, F-SA-002, F-SA-003, F-SA-006 | Screens: S-ADMN-01, S-ADMN-02, S-ADMN-03, S-ADMN-04, S-ADMN-14, S-ADMN-17, S-SUPR-01, S-SUPR-02, S-SUPR-03, S-SUPR-07 | Flows: J7, J10

Backend contract: [BE admin](../be/admin.md)

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Components](#feature-components) · [Tests](#tests)

## Routes and rendering

All routes use `DashboardShell` with the role NAV from `08-permissions-matrix.md` §7, are SSR (private, per-user data, `cache: 'no-store'`) with client islands for filters/sheets/charts, and are `noindex`.

| Route (production) | Screen ID | Auth / role |
|---|---|---|
| `/admin/overview` | S-ADMN-01 | admin, super_admin |
| `/admin/approvals`, `/admin/approvals/[type]/[id]` | S-ADMN-02 | `approvals:view` |
| `/admin/listings` | S-ADMN-03 | `catalog:view` |
| `/admin/users`, `/admin/users/[id]` | S-ADMN-04 | `users:view` |
| `/admin/reports` | S-ADMN-14 | `reports:view` |
| `/admin/profile` | S-ADMN-17 | admin, super_admin |
| `/super-admin/overview` | S-SUPR-01 | super_admin |
| `/super-admin/admins` | S-SUPR-02 | super_admin |
| `/super-admin/roles` | S-SUPR-03 | super_admin |
| `/super-admin/analytics` | S-SUPR-07 | super_admin |

**Permission-aware UI (F-AD-016):** SSR reads current `/admin/me`; refresh after grant changes or denial, never authorize from a session-long cached flag. A page without view permission renders the shared no-permission state; edit actions are disabled with “View only”. Visible nav entries do not grant access. Scope = exact assigned area or explicit whole-city authority; city grouping chips are not grants.
Use [frontend-shared](../../_foundation/frontend-shared.md) for standard states, tokens, EN/HI, focus/keyboard, offline and no-store rules. Forms keep local edits until submit; scope/version denial never silently retries a destructive action.

## Screens

### S-ADMN-01 Admin overview | `/admin/overview` | `d-admin-ahome.jpg`, `m-admin-ahome.jpg`
- Layout: `KpiCard` grid (GMV this month, Orders today, Active deliveries, Approvals pending, Open cases, Riders online); approvals queue card (top 5 → Approvals); live orders card; alerts list.
- Data: `GET /admin/overview`. Blocks missing in the response render a disabled card with lock icon.
- Alerts link to existing owning screens. A support alert opens `/admin/overview?supportMessageId={id}` and loads Settings' `GET /admin/support/messages/{id}` in the existing alert detail sheet; no new inbox, assignment or reply UI. Listing reports open `/admin/listings?reportId={id}`.
- `unavailable[]` shows definition-pending copy, not ₹0 or demo data. Missing permission and actual zero/empty data are different states.
- Acceptance: Given no `orders:view`, when opening overview, then order blocks are locked without data. Given an authorized support alert, when opened, then its actual message is reachable; a foreign-area ID returns no-permission/not-found. Given Hindi, when KPIs load, then labels and available INR values use shared formatters.

### S-ADMN-02 Approvals | `/admin/approvals(/[type]/[id])` | `d-admin-aappr.jpg`, `d-admin-aappr-ap1.jpg`, `m-admin-aappr.jpg`, `m-admin-aappr-ap1.jpg`
- Layout: tabs Businesses / Service providers / Riders, status filter; list rows with `StatusBadge`; detail = `ApprovalDocumentViewer` (zoom, next/prev doc) + facts + history timeline + actions Approve / Request changes / Reject.
- Reject and Request changes open a `Sheet` with required reason (≥10 chars); confirm shows impact; on success toast and next item opens.
- Data: `/admin/approvals?type=&status=&cursor=`, `/admin/approvals/{type}/{id}`; decisions to the owning module endpoints in the BE spec. URL holds `type`, `status`.
- Hydrate document IDs/asset references, permitted actions and `version` from detail. Each private document request reauthorizes; neither cached previews nor an uploader-owned asset URL can bypass approval scope. History uses the narrow approval-history projection.
- Special states: empty queue "All caught up"; version conflict → reload item.
- Acceptance: Given `approvals:view` only, when detail opens, then mutation buttons are disabled. Given reject without a reason, when submitting, then show an inline error. Given a decision succeeds, when the queue refreshes, then the item leaves Pending and history/counts update.

### S-ADMN-03 Listings | `/admin/listings` | `d-admin-alistings.jpg`, `m-admin-alistings.jpg`
- Layout: header Add; tabs Businesses / Service providers / Riders; table/cards Name, Category/vehicle, Area, Rating, Status, Edit and Products (not riders). URL holds `type,q,status,reportId`.
- Data: `GET /admin/listings`, then **`GET /admin/listings/{type}/{id}`** before opening Edit. Hydrate real name EN/HI, contact phone, area/category where editable, status, `allowedActions`, and `version`; never reconstruct edit values from abbreviated list labels.
- Add sheet: Type (including Rider), Name, Phone, Area, plus only owner-required fields after ADM-Q1 is decided. Prototype label is **Create (approved)**; prior pending-onboarding assumption conflicts. Until resolved, show the decision-required state and disable Create; do not relabel it “Create pending” or silently approve.
- Edit sheet includes **Phone** and **Note (shown in audit log)** for all types, including riders. Status choices map to returned ST-approval actions, not arbitrary status assignments. Submit `ListingEdit` to PATCH with `expectedVersion`; changing area requires server authorization over source and destination.
- Remove in Edit opens the source's named destructive confirmation (“Remove this listing?” / disappears from app). DELETE sends expected version and optional note. Keep the sheet and show `ADMIN_INFLIGHT_POLICY_REQUIRED` if active-order/job handling is blocked; never implement Remove by Suspend.
- Products sheet reads `/admin/listings/{businessId}/products`, including unpublished rows and versions; `POST /admin/products/{id}/publication` changes publication with reason/version and refreshes the list.
- Reports reuse this screen: open report badge/detail from `/admin/listing-reports` or `?reportId`; show typed reason, inert details and Open/Resolved state. Dismiss calls `/resolution`; “action taken” follows a successful existing listing action, never automatically removes the listing.
- Guest public profile report sheets (Businesses-owned) call `POST /listing-reports` with the BE enum/DTO and retained idempotency key. No login/phone requirement; show 202 acknowledgement or abuse-limit retry feedback without exposing reporter identity.
- Acceptance: Given a rider, when Edit opens, then current phone and version hydrate and the audit note is submitted. Given a foreign destination area, when Save is attempted, then no part changes. Given `catalog:view` only, when opening Listings, then Add/Edit/Remove/resolve are disabled. Given successful Unpublish/Remove, when the screen refreshes, then the owning publication state changes without deleting historical orders.
- Acceptance: Given a guest report, when accepted, then an authorized admin can open it here. Given ADM-Q1 unresolved, when opening Add for each type, then Create is visibly blocked rather than choosing an approval policy.

### S-ADMN-04 Users | `/admin/users(/[id])` | `d-admin-ausers.jpg`, `m-admin-ausers.jpg`
- Layout: tabs Customers / Vendors / Riders, search (name/phone, debounced, in URL `q`), `DataTable` (Name, Phone masked, Status, meta); detail page with profile, order history (paged), cases; Suspend / Reactivate with `ConfirmImpactDialog` and reason.
- Data: `/admin/users?tab=&q=&cursor=`, `/admin/users/{id}?tab=&businessId=&historyCursor=`. History is the narrow authorized projection, not a customer's/private vendor API called with a forged user ID.
- Status command sends the selected `subject` plus business ID when applicable, reason and matching entity version. Confirmation names **account**, **business**, or **rider** impact: customer session suspension versus stopping that listing's new selling/work. Do not promise cancellation of existing orders.
- Acceptance: Given `users:view` only, when viewing a profile, then Suspend is disabled. Given a multi-role owner, when the selected business is suspended, then only its returned domain state changes. Given unknown customer geography, when an area admin searches, then unresolved subjects are not shown as in scope.

### S-ADMN-14 Reports | `/admin/reports` | `d-admin-areports.jpg`, `m-admin-areports.jpg`
- Layout: tabs Orders / Revenue / Vendors / Riders / Enquiries; date range and city filters (URL state); Orders: orders-per-day bar chart + order mix donut; Revenue: GMV per day bar + commission KPI; others: `DataTable`. "Export CSV" button downloads the current tab.
- Data: `/admin/reports/{tab}` and matching `/export.csv` with identical normalized `from,to,cityId` filters. Display server `definitionVersion`, availability and paise/IST values; paginate rows with `nextCursor`. Do not calculate financial/cohort metrics from visible rows.
- Special states: no data for range (empty); export too large → toast with range hint.
- Decision-required metrics show “Not available until defined”, not synthetic figures; dependent export explains the gate. Scope denial clears stale protected results.
- Acceptance: Given a range change, when navigating Back, then URL/rows/chart restore together. Given populated or empty data, when exporting, then the same scope/date filters apply; chart table alternatives remain keyboard accessible.

### S-ADMN-17 Admin profile | `/admin/profile` | `d-admin-aprofile.jpg`, `m-admin-aprofile.jpg`
- Layout: avatar initial, name, email; Assigned areas chips ("None yet"); My permissions list per module (`view, edit` or "—"); Logout row.
- Data: `/admin/me`.
- Acceptance: Given an area-only admin, when profile loads, then its actual area grants and comms allowlist display without implying city-wide authority.

### S-SUPR-01 Super admin overview | `/super-admin/overview` | `d-super-xhome.jpg`, `m-super-xhome.jpg`
- Layout: header with "Platform-wide" badge; `KpiCard`s (Total GMV, Active cities, Vendors, Riders, Admins, Waitlist signups); one accessible Graph `ChartCard` with controls Metric (Orders, Revenue, Deliveries), Date range (Last 7/30/90 days), City, plus a screen-reader/keyboard-accessible data-table alternative. Candle view, OHLC legend and tooltip are removed.
- Data: `/super-admin/overview`, `/super-admin/metrics` (controls in URL).
- The server returns only `points`, availability and definition version. Order/delivery graph counts use actual records; revenue remains explicitly gated until ADM-Q4. The response has no candle/OHLC shape or synthetic derived series. Existing metric, date-range and city filters remain.
- Special states: chart skeleton while loading; empty "No data for {city} yet"; error "We could not load the chart data." + Retry.
- Acceptance: Given the chart loads, when Orders or Deliveries is selected, then actual graph points and their accessible table use the same range/city filters. Given Revenue is selected before its definition is approved, when metrics return, then the decision-required unavailable state appears rather than a guessed financial series. No Candle control, candle payload, OHLC value or chart-only claim is rendered.

### S-SUPR-02 Admins and areas | `/super-admin/admins` | `d-super-xadmins.jpg`, `m-super-xadmins.jpg`
- Layout: header + Add admin; search “Search name, phone or email”; desktop filters/mobile sheet (city, **area or zone**, role, status), chips, result count, Clear all. Collapsed cards show name/role/scope/status; expanded cards show **phone with Call, email, last active**, assigned cities/zones/areas, permissions summary, Audit shortcut and actions, matching `js18.js:55–65`.
- Data: `/super-admin/admins?q=&cityId=&areaId=&zoneId=&roleId=&status=&cursor=`. The area/zone picker serializes exactly one of `areaId` or `zoneId`; selection labels never substitute for IDs.
- Audit shortcut navigates to **`/super-admin/activity?actorId={id}`**, preserved through filters/export; names are display only. Private contact data is never put into analytics or query strings.
- Areas and Permissions mutations send `expectedVersion`; edit implies view, removing view clears edit. Display current `communicationScopes`; role/permission edits preserve a zone-only allowlist and do not silently grant city sending.
- Deactivate uses `ConfirmImpactDialog` ("{name} will lose access immediately…", areas left uncovered, open cases) → Confirm deactivate.
- Special states: no results (with Clear all).
- Acceptance: Given a zone filter, when applied, then the URL and count reflect the server's actual scope mapping. Given Audit on one card, when opened, then actor-ID filtering selects that account even if names collide. Given deactivate confirmed, when committed, then badge/toast update and stale sessions fail.

### S-SUPR-03 Roles and permissions | `/super-admin/roles` | `d-super-xroles.jpg`, `m-super-xroles.jpg`
- Layout: role list (name, admin count, "System role" badge); editor with Role name, Description, `PermissionMatrix` (modules × View/Create/Edit/Delete/Export); "Unsaved changes" indicator; Review & save shows before/after summary ("No changes" when equal); Duplicate; Delete.
- Leaving with unsaved edits → "Discard changes?" "Your edits to this role will be lost." (also on Esc/Back).
- Delete in use → reassign picker (other roles) then confirm; system roles remain locked. Matrix: selecting Edit also checks View; unchecking View clears every action in that row. Review summary uses normalized before/after values.
- Acceptance: Given `ROLE_IN_USE`, when deletion is attempted, then the reassign picker opens. Given a system role, when opening it, then edits/deletion remain locked. Given Edit is selected, when reviewing the change, then View is included and cancellation preserves the unsaved draft.

### S-SUPR-07 Platform analytics | `/super-admin/analytics` | `d-super-xanalytics.jpg`, `m-super-xanalytics.jpg`
- Layout: KPIs GMV (30d), Orders (30d), Avg order value, Repeat customers with deltas; Orders by category bars; Delivery vs pickup donut with legend %; Top vendors table.
- Data: `/super-admin/analytics?range=&cityId=`; use the BE definitions/availability contract. Financial values, repeat-cohort/category allocation and deltas cannot be inferred client-side.
- Special states: empty (no orders in range).
- Acceptance: Given unresolved analytics definitions, when the screen loads, then affected fields are labelled unavailable while known counts remain visible; an actual empty period shows the separate empty state.

## Feature components

`src/features/admin/{overview,approvals,listings,users,reports,profile}` and `src/features/super-admin/{overview,admins,roles,analytics}`: `ApprovalQueue`, `ApprovalDetail`, `ListingEditSheet`, `ProductPublicationSheet`, `UserDetail`, `ReportTabs`, `AdminFilters`, `RoleEditor`, `RoleDeleteReassign`, `MetricChartCard`. Shared: `DashboardShell`, `KpiCard`, `ChartCard`, `Charts`, `DataTable`, `AdminCollapsibleCard`, `PermissionMatrix`, `RoleForm`, `ConfirmImpactDialog`, `ApprovalDocumentViewer`, `Sheet`, `Toast`, `StatusBadge`; hook `usePermissions`.

## i18n and analytics

Prefixes `admin.*`, `superAdmin.*`. Events: `approval_decided`, `listing_updated`, `product_unpublished`, `user_status_changed`, `report_exported`, `chart_view_changed`, `admin_status_changed`, `role_saved`, `role_deleted`.

## Tests

Component: all screen ACs, typed listing/rider hydration, required phone/name, inert report/support text, versions, role matrix normalization, area/zone chips and actor shortcut. Keyboard/axe: Add/Edit/Remove and report sheets, documents, tabs, permission matrix, chart table/tooltip, topmost Esc, Hindi/dark layouts. E2E J7/J10: approval, role reassign/deactivate, report intake → existing alert → detail, rider edit/remove, export filter parity and stale writes. Negatives: same-city unassigned area, destination-only grants, scope revoked while a sheet is open, catalog-only video moderator, forbidden metrics. ADM-Q1/Q2/Q3/Q4 remain visible gates, not passing happy-path fixtures.
