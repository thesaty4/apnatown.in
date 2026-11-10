# FE: audit

Features: F-X-014, F-AD-014, F-SA-007 | Screens: S-ADMN-16, S-SUPR-08 | Flows: J10

Backend contract: [BE audit](../be/audit.md)

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Tests](#tests)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/admin/audit` | S-ADMN-16 | SSR first page (private, no-store) + client search/paging | admin `reports:view`, super_admin | noindex |
| `/super-admin/activity` | S-SUPR-08 | Same | super_admin | noindex |

## Screens

### S-ADMN-16 Audit log | `/admin/audit` | `d-admin-aaudit.jpg`, `m-admin-aaudit.jpg`
- Layout: `DashboardShell`; heading; searchbar "Search actions"; table (desktop) / cards (mobile): time (IST, 12-hour), actor, action, detail; row expands to `AuditDiff` (before/after side by side, changed keys highlighted with text "changed").
- Data: `/admin/audit?q=&action=&entityType=&actorId=&cityId=&areaId=&from=&to=&cursor=` (q debounced 300 ms); filters live in URL, “Load more” uses the opaque keyset. Fetch `/admin/audit/{id}` on expansion; never embed an unscoped diff in list HTML.
- Scope labels describe actual assigned areas/explicit city authority. An area in Padrauna does not grant all Padrauna logs; city-only/global records remain unavailable unless the server authorizes them. On grant revocation or detail 404, clear cached diff and show the shared unavailable state.
- Special states: no results for query; no permission (standard).
- Acceptance: Given a search term, when applied and then restored with Back, then URL/results agree. Given an authorized diff, when expanded by Enter/Space, then before/after appears with `aria-expanded`. Given a same-city unassigned-area ID, when opened, then no diff or target details appear.

### S-SUPR-08 Activity monitor | `/super-admin/activity` | `d-super-xactivity.jpg`, `m-super-xactivity.jpg`
- Layout: heading + Export; filter input “Filter by admin, action or detail”; date/city/role filters and removable actor filter in URL. Admin-card shortcut **`/super-admin/activity?actorId={id}`** hydrates that filter; actor label is for display, not identity matching.
- Export downloads CSV for current filters; toast on start; too large → toast asking to narrow the date range.
- Special states: empty (no activity yet).
- Acceptance: Given an actor shortcut and date/city filters, when exporting, then the same IDs/IST date bounds are used. Given empty results, when loaded, then Clear filters is available. Given matching admin names, when navigating from a card, then only the selected account's activity appears.

## Feature components

`AuditList`, `AuditFilters` in `src/features/admin/audit`. Shared: `AuditDiff`, `DataTable`, `SearchBar`, `EmptyState`, `Toast`.

## i18n and analytics

Prefix `admin.audit.*`, `superAdmin.activity.*`. Events: `audit_searched`, `audit_exported`.

## Tests

Component: URL state including `actorId`, redacted diff rendered as inert text, stale detail clearing. Keyboard/axe: filter chips, expansion, CSV feedback, Hindi/dark text and focus restoration. E2E J10: card → actor filter → pages → matching CSV; area-only versus city-wide/global log access; permission revoked with an expanded row. No export or caching bypasses the BE predicate.
