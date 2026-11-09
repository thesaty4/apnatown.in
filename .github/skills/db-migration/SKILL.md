---
name: db-migration
description: "Placeholder guidance for forward-only database migrations, valid now even though the database engine itself is not yet chosen."
---

# DB migration (placeholder guidance for the next stage)

The database engine is undecided (`docs/adr/0001-tech-stack.md`); this
skill records the rules that apply regardless of engine
(`database.instructions.md`). Full schema design is a later stage.

## Steps

1. Never edit a migration already merged to `main` — write a new
   migration to change something that already shipped.
2. One migration does one logical change (add a table, add a column,
   add an index) — don't bundle unrelated schema changes.
3. Add indexes for every new filterable/sortable field used by
   Explore/Search/admin lists in the same migration that adds the
   field.
4. Document a down-path (even if not auto-executed in production) for
   every migration, and flag any migration that could lose data for
   explicit human sign-off.
5. Match naming conventions: `snake_case` plural table names,
   `snake_case` columns, `<entity>_id` foreign keys, and the exact enum
   string values from `docs/PROJECT.md` "Status and lifecycle models".
6. Soft-delete user-facing deletable records; reserve hard delete for
   explicit DPDP erasure requests, scoped narrowly.

## Skeleton

```sql
-- 0007_add_delivery_otp_to_delivery_jobs.sql
ALTER TABLE delivery_jobs ADD COLUMN delivery_otp_hash TEXT;
ALTER TABLE delivery_jobs ADD COLUMN delivery_otp_attempts INT NOT NULL DEFAULT 0;
CREATE INDEX idx_delivery_jobs_status ON delivery_jobs (status);
-- down: ALTER TABLE delivery_jobs DROP COLUMN delivery_otp_hash, DROP COLUMN delivery_otp_attempts; DROP INDEX idx_delivery_jobs_status;
```

## Checklist

- [ ] Forward-only; no edits to a merged migration.
- [ ] One logical change per migration.
- [ ] Indexes added alongside new filterable/sortable fields.
- [ ] Down-path documented; data-loss risk flagged for sign-off.
- [ ] Naming matches convention and shared status enum values.
