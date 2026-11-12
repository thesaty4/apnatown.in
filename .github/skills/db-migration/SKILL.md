---
name: db-migration
description: "Recipe for forward-only PostgreSQL/Prisma migration authoring and generated-client builds without running Docker, migrations or seeds."
---

# DB migration

Use PostgreSQL/Prisma as specified in `specs/_foundation/data-model.md`
and the owning module's BE spec. Path rules:
`.github/instructions/database.instructions.md`.

## Steps

1. Never edit a migration already merged to `main` — write a new
   migration to change something that already shipped.
2. One migration does one logical change (add a table, add a column,
   add an index) — don't bundle unrelated schema changes.
3. Use the API-owned Prisma migration history; review generated SQL.
   Enable required extensions with the migration role, never runtime
   credentials. Add indexes supporting the specified filter/sort
   combinations, not blindly one per field.
   Every new table/view must `GRANT` least-privilege access to
   `apnatown_runtime` in the same migration; there are no default
   privileges. Use column-scoped `UPDATE` grants and remember that
   `SELECT ... FOR UPDATE` also needs `UPDATE`.
4. Document forward repair/restore and data-loss risks. Destructive
   changes require explicit human sign-off; do not promise an automatic
   production down migration.
5. Match naming conventions: `snake_case` plural table names,
   `snake_case` columns, `<entity>_id` foreign keys, and the exact enum
   string values from the owning BE spec/shared schema.
6. Soft-delete user-facing deletable records; reserve hard delete for
   explicit DPDP erasure requests, scoped narrowly.
7. Generate the Prisma client if needed, then run the affected build and
   fix related errors. Do not start Docker, provision databases, apply
   migrations or run seeds during implementation. Report execution as
   deferred; a separate explicit request is required to run it.

## Skeleton

```sql
-- Example index for the Products owner-list query; check existing indexes first.
CREATE INDEX idx_products_owner_page
  ON products (business_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;
-- Recovery: a new reviewed migration can drop this index; no row data is removed.
```

## Checklist

- [ ] Forward-only; no edits to a merged migration.
- [ ] One logical change per migration.
- [ ] Indexes added alongside new filterable/sortable fields.
- [ ] New tables/views grant least-privilege runtime access.
- [ ] Forward repair/restore documented; data-loss risk flagged for sign-off.
- [ ] Naming matches convention and shared status enum values.
- [ ] Generated client and affected build pass; migration/seed execution deferred.
