import {
  AdminActionSchema,
  AdminModuleSchema,
  normalizePermissions,
  type AdminAction,
  type AdminModule,
  type PermissionMatrix,
} from '@apnatown/shared/admin';
import type { Grant } from '../domain/admin';

export function toMatrix(
  rows: readonly { module: string; action: string }[],
): PermissionMatrix {
  const input: Partial<Record<AdminModule, AdminAction[]>> = {};
  for (const row of rows) {
    const module = AdminModuleSchema.parse(row.module);
    (input[module] ??= []).push(AdminActionSchema.parse(row.action));
  }
  return normalizePermissions(input);
}
export function toGrants(matrix: PermissionMatrix): Grant[] {
  return (Object.entries(matrix) as [AdminModule, AdminAction[]][]).flatMap(
    ([module, actions]) => actions.map((action) => ({ module, action })),
  );
}
