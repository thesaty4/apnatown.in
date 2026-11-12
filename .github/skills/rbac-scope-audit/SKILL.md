---
name: rbac-scope-audit
description: "Recipe for adding/changing an admin action: role+ownership+scope checks, permission matrix wiring, and audit logging."
---

# RBAC, scope, and audit

Covers AD16, SA2-SA3, BR-12/BR-13 in `docs/project/04-business-rules.md`
(`domain-accounts-admin.instructions.md`).

## Steps

1. Identify the `(role, module, action)` triple this admin action
   needs (view/edit/create/delete/export) — check the permission matrix
   schema in `packages/shared` before adding a new action type.
2. Check the admin's assigned cities/areas against the target
   resource's city/area — every query/action is filtered to assigned
   scope server-side, not just hidden in the UI.
3. If editing/deleting a role: block deletion while any admin is
   assigned to it, and always block system roles — require a
   reassign-picker flow before deletion is allowed.
4. Wire the frontend to hide/disable the action when the permission is
   absent, showing "You don't have permission" (AD16) — but treat this
   as UX only; the server check in step 2 is the real control.
5. Write the audit entry: actor, timestamp, action, before/after values
   — for any action that changes data (approval decisions, settings,
   role/permission edits, suspensions).
6. Manually verify (`verify-change`; no automated test files): authorized admin succeeds; admin outside scope is denied;
   admin without the permission action is denied; system-role
   deletion is denied; role deletion while assigned is denied until
   reassigned.

## Skeleton

```ts
async function updateRole(ctx: AdminContext, roleId: string, dto: UpdateRoleDto) {
  const role = await roles.findById(roleId);
  if (role.isSystemRole) throw new ForbiddenError('SYSTEM_ROLE_LOCKED');
  authorize(ctx, { roles: ['admin', 'super_admin'], adminScope: { module: 'roles', action: 'edit' } });
  const before = role;
  const after = await roles.update(roleId, dto);
  await audit.record(ctx.user, 'role.updated', { before, after });
  return after;
}
```

## Checklist

- [ ] Role + ownership + scope all checked server-side.
- [ ] System roles cannot be deleted; roles in use require reassignment
  first.
- [ ] Permission-aware UI hides/disables with the standard message.
- [ ] Audit entry written with before/after for every data change.
- [ ] Manual checks cover denied-by-scope and denied-by-permission separately.
