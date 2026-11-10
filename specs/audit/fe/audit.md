# FE: audit

Features: F-X-014, F-AD-014, F-SA-007 | Screens: S-ADMN-16, S-SUPR-08 | Flows: J10

Backend contract: [BE audit](../be/audit.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/admin/audit` | S-ADMN-16 | SSR first page (private, no-store) + client search/paging | admin `reports:view`, super_admin | noindex |
| `/super-admin/activity` | S-SUPR-08 | Same | super_admin | noindex |

## Screens

### S-ADMN-16 Audit log | `/admin/audit` | `d-admin-aaudit.jpg`, `m-admin-aaudit.jpg`
- Layout: `DashboardShell`; heading; searchbar "Search actions"; table (desktop) / cards (mobile): time (IST, 12-hour), actor, action, detail; row expands to `AuditDiff` (before/after side by side, changed keys highlighted with text "changed").
- Data: `/admin/audit?q=&cursor=` (q debounced 300 ms, in URL); "Load more" keyset.
- Special states: no results for query; no permission (standard).
- Acceptance: Given a search term, the URL holds `q` and Back restores results; Given an entry with diff, expanding shows before/after with keyboard toggle (Enter/Space) and `aria-expanded`; Given Hindi, column labels in Hindi.

### S-SUPR-08 Activity monitor | `/super-admin/activity` | `d-super-xactivity.jpg`, `m-super-xactivity.jpg`
- Layout: heading + Export button; filter input "Filter by admin, action or detail"; filters for date range, city, role (URL state); same list + `AuditDiff`.
- Export downloads CSV for current filters; toast on start; too large → toast asking to narrow the date range.
- Special states: empty (no activity yet).
- Acceptance: Given filters, export uses the same filters; Given empty results, the empty state shows with Clear filters.

## Feature components

`AuditList`, `AuditFilters` in `src/features/admin/audit`. Shared: `AuditDiff`, `DataTable`, `SearchBar`, `EmptyState`, `Toast`.

## i18n and analytics

Prefix `admin.audit.*`, `superAdmin.activity.*`. Events: `audit_searched`, `audit_exported`.

## Tests

Component: diff rendering, URL state for `q`. E2E: J10 super admin filters activity and exports CSV; admin without `reports:view` sees no-permission.
