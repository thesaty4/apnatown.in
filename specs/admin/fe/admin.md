# FE: admin

Features: F-AD-001, F-AD-002, F-AD-003, F-AD-004, F-AD-013, F-AD-016, F-SA-001, F-SA-002, F-SA-003, F-SA-006 | Screens: S-ADMN-01, S-ADMN-02, S-ADMN-03, S-ADMN-04, S-ADMN-14, S-ADMN-17, S-SUPR-01, S-SUPR-02, S-SUPR-03, S-SUPR-07 | Flows: J7, J10

Backend contract: [BE admin](../be/admin.md)

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

**Permission-aware UI (F-AD-016):** `usePermissions()` reads `/admin/me` once per session (server component passes it down). A page without its module permission renders the standard no-permission state ("You don't have permission"); actions needing `edit` are disabled with tooltip "View only". Nav items stay visible (prototype) and lead to the no-permission state.

## Screens

### S-ADMN-01 Admin overview | `/admin/overview` | `d-admin-ahome.jpg`, `m-admin-ahome.jpg`
- Layout: `KpiCard` grid (GMV this month, Orders today, Active deliveries, Approvals pending, Open cases, Riders online); approvals queue card (top 5 → Approvals); live orders card; alerts list.
- Data: `GET /admin/overview`. Blocks missing in the response render a disabled card with lock icon.
- Acceptance: Given no `orders:view`, then order KPIs show the locked state; Given Hindi, KPI labels in Hindi with INR Indian grouping.

### S-ADMN-02 Approvals | `/admin/approvals(/[type]/[id])` | `d-admin-aappr.jpg`, `d-admin-aappr-ap1.jpg`, `m-admin-aappr.jpg`, `m-admin-aappr-ap1.jpg`
- Layout: tabs Businesses / Service providers / Riders, status filter; list rows with `StatusBadge`; detail = `ApprovalDocumentViewer` (zoom, next/prev doc) + facts + history timeline + actions Approve / Request changes / Reject.
- Reject and Request changes open a `Sheet` with required reason (≥10 chars); confirm shows impact; on success toast and next item opens.
- Data: `/admin/approvals?type=&status=&cursor=`, `/admin/approvals/{type}/{id}`; decisions to the owning module endpoints in the BE spec. URL holds `type`, `status`.
- Special states: empty queue "All caught up"; version conflict → reload item.
- Acceptance: Given `approvals:view` only, buttons disabled; Given reject without reason, then inline error; Given a decision succeeds, then the item leaves the pending list.

### S-ADMN-03 Listings | `/admin/listings` | `d-admin-alistings.jpg`, `m-admin-alistings.jpg`
- Layout: header with Add; tabs Businesses / Service providers / Riders; `DataTable` columns Name, Category / vehicle, Area, Rating, Status, actions Edit and Products (not riders).
- Edit `Sheet`: name EN/HI, category, area, status; Products `Sheet`: product rows with Publish/Unpublish toggle (reason required on unpublish).
- Acceptance: Given `catalog:view` only, Add/Edit disabled; Given unpublish, the product shows "Unpublished" and disappears from the public catalogue.

### S-ADMN-04 Users | `/admin/users(/[id])` | `d-admin-ausers.jpg`, `m-admin-ausers.jpg`
- Layout: tabs Customers / Vendors / Riders, search (name/phone, debounced, in URL `q`), `DataTable` (Name, Phone masked, Status, meta); detail page with profile, order history (paged), cases; Suspend / Reactivate with `ConfirmImpactDialog` and reason.
- Acceptance: Given `users:view` only, Suspend hidden as disabled; Given suspend confirmed, status badge "Suspended" (icon + text).

### S-ADMN-14 Reports | `/admin/reports` | `d-admin-areports.jpg`, `m-admin-areports.jpg`
- Layout: tabs Orders / Revenue / Vendors / Riders / Enquiries; date range and city filters (URL state); Orders: orders-per-day bar chart + order mix donut; Revenue: GMV per day bar + commission KPI; others: `DataTable`. "Export CSV" button downloads the current tab.
- Special states: no data for range (empty); export too large → toast with range hint.
- Acceptance: Given range changed, URL updates and Back restores it; charts have text alternatives (table toggle).

### S-ADMN-17 Admin profile | `/admin/profile` | `d-admin-aprofile.jpg`, `m-admin-aprofile.jpg`
- Layout: avatar initial, name, email; Assigned areas chips ("None yet"); My permissions list per module (`view, edit` or "—"); Logout row.
- Data: `/admin/me`.

### S-SUPR-01 Super admin overview | `/super-admin/overview` | `d-super-xhome.jpg`, `m-super-xhome.jpg`
- Layout: header with "Platform-wide" badge; `KpiCard`s (Total GMV, Active cities, Vendors, Riders, Admins, Waitlist signups); `ChartCard` with segmented Graph view / Candle view, controls Metric (Orders, Revenue, Deliveries), Date range (Last 7/30/90 days), City; legend "Up: close ≥ open (filled)" / "Down: close < open (hollow)"; tooltip on hover/focus/tap with Open/High/Low/Close; each bar/candle focusable with aria-label including "Up"/"Down".
- Data: `/super-admin/overview`, `/super-admin/metrics` (controls in URL).
- Special states: chart skeleton while loading; empty "No data for {city} yet"; error "We could not load the chart data." + Retry.
- Acceptance: Given the Candle tab, up candles filled green, down hollow red and words Up/Down present (not colour-only); Given keyboard focus on a candle, tooltip shows values; Given dark mode, tokens apply.

### S-SUPR-02 Admins and areas | `/super-admin/admins` | `d-super-xadmins.jpg`, `m-super-xadmins.jpg`
- Layout: header + Add admin; search "Search name, phone or email"; Filters `Sheet` (city, area/zone, role, status) with removable chips, result count, Clear all; `AdminCollapsibleCard` per admin (avatar, name, email, role, status badge, Activate/Deactivate, Areas sheet, Permissions sheet with `PermissionMatrix`).
- Deactivate uses `ConfirmImpactDialog` ("{name} will lose access immediately…", areas left uncovered, open cases) → Confirm deactivate.
- Special states: no results (with Clear all).
- Acceptance: Given filters applied, chips show and count updates; Given deactivate confirmed, badge "Inactive" and toast "{name} was deactivated".

### S-SUPR-03 Roles and permissions | `/super-admin/roles` | `d-super-xroles.jpg`, `m-super-xroles.jpg`
- Layout: role list (name, admin count, "System role" badge); editor with Role name, Description, `PermissionMatrix` (modules × View/Create/Edit/Delete/Export); "Unsaved changes" indicator; Review & save shows before/after summary ("No changes" when equal); Duplicate; Delete.
- Leaving with unsaved edits → "Discard changes?" "Your edits to this role will be lost." (also on Esc/Back).
- Delete in use → reassign picker (other roles) then confirm; system role delete disabled "System roles cannot be deleted".
- Acceptance: Given `ROLE_IN_USE`, the reassign picker opens; Given a system role, delete disabled and name read-only.

### S-SUPR-07 Platform analytics | `/super-admin/analytics` | `d-super-xanalytics.jpg`, `m-super-xanalytics.jpg`
- Layout: KPIs GMV (30d), Orders (30d), Avg order value, Repeat customers with deltas; Orders by category bars; Delivery vs pickup donut with legend %; Top vendors table.
- Special states: empty (no orders in range).

## Feature components

`src/features/admin/{overview,approvals,listings,users,reports,profile}` and `src/features/super-admin/{overview,admins,roles,analytics}`: `ApprovalQueue`, `ApprovalDetail`, `ListingEditSheet`, `ProductPublicationSheet`, `UserDetail`, `ReportTabs`, `AdminFilters`, `RoleEditor`, `RoleDeleteReassign`, `MetricChartCard`. Shared: `DashboardShell`, `KpiCard`, `ChartCard`, `Charts`, `DataTable`, `AdminCollapsibleCard`, `PermissionMatrix`, `RoleForm`, `ConfirmImpactDialog`, `ApprovalDocumentViewer`, `Sheet`, `Toast`, `StatusBadge`; hook `usePermissions`.

## i18n and analytics

Prefixes `admin.*`, `superAdmin.*`. Events: `approval_decided`, `listing_updated`, `product_unpublished`, `user_status_changed`, `report_exported`, `chart_view_changed`, `admin_status_changed`, `role_saved`, `role_deleted`.

## Tests

Component: permission-aware gating per module, approval reason validation, candle a11y labels, role unsaved guard, filter chips. E2E: J7 vendor onboarding approved by area admin; J10 super admin creates role, adds admin with areas, deactivates; negative: area admin opening `/super-admin/*` sees not-found/no-permission.
