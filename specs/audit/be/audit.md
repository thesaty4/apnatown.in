# BE: audit

Features: F-X-014, F-AD-014, F-SA-007 | Rules: BR-12 | State machines: none | Depends on: admin (guards, admin names); used by every module that performs admin or sensitive actions.

Frontend counterpart: [FE audit](../fe/audit.md)

## Responsibility

Provide the single append-only audit trail (actor, action, entity, before/after, time, scope) written inside the caller's transaction, plus search, filters, diff view and CSV export for admins (scoped) and the super admin (platform-wide).

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `audit_logs` | `id uuid PK` (UUIDv7, time-ordered); `occurred_at timestamptz NOT NULL DEFAULT now()`; `actor_user_id uuid NULL FK users` (NULL = system job); `actor_role text NOT NULL CHECK ('customer','vendor','provider','rider','admin','super_admin','system')`; `actor_label text NOT NULL` (display name at time of action); `action text NOT NULL` (dotted key, e.g. `business.approved`, `role.updated`, `campaign.sent`); `entity_type text NOT NULL`; `entity_id uuid NULL`; `city_id uuid NULL`; `area_id uuid NULL`; `summary text NOT NULL CHECK <= 300`; `before jsonb NULL`; `after jsonb NULL`; `correlation_id text NOT NULL`; `ip_hash bytea NULL` | `(occurred_at DESC, id DESC)` (feed keyset); `(entity_type, entity_id, occurred_at DESC)` (approval history); `(actor_user_id, occurred_at DESC)`; `(city_id, occurred_at DESC)` (scoped feed); GIN `to_tsvector('simple', actor_label||' '||action||' '||summary)` (search) |

Append-only: the app DB role has `INSERT, SELECT` only on `audit_logs` (no UPDATE/DELETE); retention 3 years (assumption) via a privileged maintenance role.

## Endpoints

| Method | Path | Auth, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| Internal | `AuditWriter.record(tx, entry)` | Called by owning modules inside their transaction | `{actor, action, entityType, entityId, cityId?, areaId?, summary, before?, after?}`; redacts keys in the deny list (phone, email, otp, code, document, token, card, upi) to `"•••"` | — | — | F-X-014 |
| GET | `/admin/audit?q=&action=&entityType=&actorId=&from=&to=&cursor=&limit=` | Admin `reports:view` (prototype gate) limited to entries whose `city_id` is in scope (NULL-city entries hidden); super_admin all | → `{items:[{id,occurredAt,actorLabel,actorRole,action,summary,entityType,entityId,hasDiff}],nextCursor}` (limit ≤ 50) | `VALIDATION_ERROR` | Yes | F-AD-014, S-ADMN-16 |
| GET | `/admin/audit/{id}` | Same as list | → entry with `before`, `after` | `AUDIT_NOT_FOUND` | Yes | F-AD-014 |
| GET | `/super-admin/activity` · `/{id}` | Super admin | same filters + `cityId` and `actorRole` | `VALIDATION_ERROR` | Yes | F-SA-007, S-SUPR-08 |
| GET | `/super-admin/activity/export.csv?…` | Super admin; audited (`audit.exported`) | → CSV stream ≤ 100 000 rows: time (IST), actor, role, action, entity, summary, before/after JSON; formula-injection neutralised | `REPORT_TOO_LARGE` | Yes | F-SA-007 |

## Rules and use-cases

1. Every data-changing admin action and sensitive action (approvals, status changes, refunds, role/permission/area changes, settings, campaigns, moderation, code lock-outs, data export/deletion) records one entry in the same transaction; if the audit insert fails, the action rolls back.
2. Before/after hold only changed allow-listed fields; secrets and PII are redacted (rule above).
3. Search `q` uses full-text over actor, action and summary; filters are allow-listed; ordering is fixed `occurred_at DESC, id DESC`.
4. Admin scope: entries are visible if `city_id` is in the admin's assigned cities; never cross-city.

## Events and jobs

None published. Job `audit.retention` (monthly) deletes entries older than retention using the maintenance role.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `AUDIT_NOT_FOUND` | 404 | `errors.audit.notFound` |

## Acceptance criteria

1. Given an approval is decided, then one `audit_logs` row exists with before/after status in the same transaction.
2. Given the audit insert fails, then the approval is rolled back.
3. Given the app role, when UPDATE/DELETE on `audit_logs` is attempted, then the database denies it.
4. Given an admin scoped to Padrauna, when searching, then Kasia entries are not returned.
5. Given an admin without `reports:view`, then 403.
6. Given an entry with a phone in `after`, then it is stored as `"•••"`.
7. Given a summary starting with `=`, when exported, then the CSV cell starts with `'`.

## Tests

Unit: redaction, CSV neutraliser, filter allow-list. Integration: transactional write/rollback, DB permission denial, keyset paging, full-text search. Authorisation negatives: admin on `/super-admin/activity`, out-of-scope entry by ID, missing `reports:view`.

## Open questions

Retention period (assumed 3 years); `reports:view` as the admin audit gate follows the prototype.
