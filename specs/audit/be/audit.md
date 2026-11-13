# BE: audit

Features: F-X-014, F-AD-014, F-SA-007 | Rules: BR-12 | State machines: none | Depends on: admin (guards, admin names); used by every module that performs admin or sensitive actions.

Frontend counterpart: [FE audit](../fe/audit.md)

Contents: [Tables](#tables) · [Endpoints](#endpoints) · [Rules](#rules-and-use-cases) · [Acceptance](#acceptance-criteria)

## Responsibility

Provide the single append-only audit trail (actor, action, entity, before/after, time, scope) written inside the caller's transaction, plus search, filters, diff view and CSV export for admins (scoped) and the super admin (platform-wide).

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `audit_logs` | `id uuid PK` (UUIDv7); `occurred_at timestamptz NOT NULL DEFAULT now()`; `actor_user_id uuid NULL FK users` (NULL = system); `actor_role text NOT NULL CHECK ('customer','vendor','provider','rider','admin','super_admin','system')`; `actor_label text NOT NULL`; `action text NOT NULL` (dotted key); `entity_type text NOT NULL`; `entity_id uuid NULL`; `city_id uuid NULL`; `area_id uuid NULL`; CHECK area implies city; `related_scopes jsonb NOT NULL DEFAULT '[]'` (validated `ScopeRef[]`, e.g. destination of an area move); `summary text NOT NULL CHECK length <= 300`; `before/after jsonb NULL`; `correlation_id text NOT NULL`; `ip_hash bytea NULL` | `(occurred_at DESC,id DESC)` feed; `(entity_type,entity_id,occurred_at DESC,id DESC)` history; `(actor_user_id,occurred_at DESC,id DESC)` actor shortcut; `(city_id,area_id,occurred_at DESC,id DESC)` scoped feed; GIN full-text over actor/action/sanitized summary |

Append-only: app DB role has `INSERT, SELECT` only. No guessed three-year retention: privileged retention/de-identification processing is disabled until Q-13/Q-32/legal policy is approved; account deletion cannot cascade into financial/admin evidence.

## Endpoints

| Method | Path | Auth, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| Internal | `AuditWriter.record(tx, entry)` | Owning module, caller's transaction | `{actor,action,entityType,entityId,cityId?,areaId?,relatedScopes?,summary,before?,after?}`; server-resolved scopes, allow-listed diff and recursive redaction | — | Caller mutation key prevents repeat | F-X-014 |
| GET | `/admin/audit?q=&action=&entityType=&actorId=&cityId=&areaId=&from=&to=&cursor=&limit=` | Active admin `reports:view` + **area-aware predicate below**; super_admin all | → `{items:[{id,occurredAt,actorUserId,actorLabel,actorRole,action,summary,entityType,entityId,hasDiff}],nextCursor}`; limit ≤50 | `VALIDATION_ERROR` | Yes | F-AD-014, S-ADMN-16 |
| GET | `/admin/audit/{id}` | Same as list | → entry with `before`, `after` | `AUDIT_NOT_FOUND` | Yes | F-AD-014 |
| GET | `/super-admin/activity` · `/{id}` | Super admin | same filters + `cityId` and `actorRole` | `VALIDATION_ERROR` | Yes | F-SA-007, S-SUPR-08 |
| GET | `/super-admin/activity/export.csv?…` | Super admin; audited (`audit.exported`) | → CSV stream ≤ 100 000 rows: time (IST), actor, role, action, entity, summary, before/after JSON; formula-injection neutralised | `REPORT_TOO_LARGE` | Yes | F-SA-007 |
| Internal | `AuditReadPort.entityHistory(ctx,{entityType,entityId,cursor?,limit?})` | Admin `approvals:view` + exact business/rider scope; super_admin | → same page DTO restricted to that application's approval actions; detail diffs sanitized; not a back door to global activity | `AUDIT_NOT_FOUND` | Yes | S-ADMN-02 |

## Rules and use-cases

1. Every data-changing admin action and sensitive action (approvals, status changes, refunds, role/permission/area changes, settings, campaigns, moderation, code lock-outs, data export/deletion) records one entry in the same transaction; if the audit insert fails, the action rolls back.
2. Before/after contain only changed allow-listed fields. Recursively redact phone, email, OTP/code, documents, tokens, card/UPI, signed URLs and credentials in diffs **and summaries**; free-text notes are plain text and cannot carry arbitrary serialized payloads. Actor display label/ID remains purpose-limited.
3. Allow-listed full-text/filter queries are parameterized; stable order `occurred_at DESC,id DESC`. Keyset cursor binds filters, actor and current scope revision; scope filters run before pagination/search/counts/export.
4. **Read predicate:** use [Admin scope and read context](../../admin/be/admin.md#scope-and-read-context) for the row's `(city_id,area_id)` and **every** `related_scopes` entry. An area grant admits only that area; a city-only row requires an explicit whole-city grant; global/unknown scope requires super_admin. A parent city inferred from an assigned area is **not** whole-city authority.
5. Apply that predicate to list, detail, embedded approval history and any export. Same-city foreign-area detail returns `AUDIT_NOT_FOUND` without diff/metadata leakage. Changing `actorId`, `q` or `cityId` can only narrow results.
6. `/super-admin/activity?actorId={userId}` is the exact Admin-card shortcut. Name collisions/renames do not alter identity filtering; CSV uses the same actor/date/city/role filters. Date bounds are UTC instants derived from selected IST calendar dates.

## Events and jobs

None published. A future privileged `audit.retention` job requires an approved policy/version and deletion receipts; no schedule or destructive retention duration is assumed in this repair.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `AUDIT_NOT_FOUND` | 404 | `errors.audit.notFound` |

## Acceptance criteria

1. Given an authorized approval, when its decision commits, then exactly one audit row records before/after in the same transaction.
2. Given the audit insert fails, when deciding the approval, then the complete decision rolls back.
3. Given the app role, when UPDATE/DELETE on `audit_logs` is attempted, then the database denies it.
4. Given one Padrauna area grant, when searching/opening another area's row in Padrauna, then it is excluded/404; Kasia rows are also inaccessible.
5. Given no `reports:view`, when opening general audit, then 403 even for the actor's own actions; approval-history access is limited to its separately authorized projection.
6. Given a phone/token nested in `after` or a summary, when recording the action, then the sensitive value is redacted before persistence.
7. Given a summary starting with `=`, when exported, then the CSV cell starts with `'`.
8. Given an area-only versus explicit whole-city versus super admin, when opening city-only/global records, then only the explicitly authorized cases pass.
9. Given an action moves a listing between areas, when its history is read, then both recorded scopes must pass; source-only or destination-only grants cannot reveal the diff.
10. Given two admins share a name, when the Admin-card actor shortcut is exported, then only the chosen `actorId` matches across pages and CSV.
11. Given no approved retention policy, when cleanup or account erasure runs, then audit history is not deleted by an assumed retention period.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Rules: AC4/8/9 scope matrix, recursive redaction and CSV/formula payloads. Manual API/DB: AC1/2 transactional rollback/replay, DB permission denial, scope before keyset/full-text, actor-filter export parity and IST bounds. Authorization negatives: same city/different area, city-only/global records, revoked grant on next page, forged entity-history purpose, admin on super routes. Retention check AC11 blocks destructive jobs.

## Open questions

Open question: Q-13/Q-32 retention/de-identification/legal holds remain unresolved; block destructive processing. `reports:view` is the established general audit gate, not an open permission question. Explicit whole-city-grant provisioning remains ADM-Q3; do not infer it from area membership.
