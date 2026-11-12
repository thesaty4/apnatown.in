import {
  ADMIN_ACTIONS,
  ADMIN_MODULES,
  normalizePermissions,
  type AdminAction,
  type AdminModule,
  type PermissionMatrix,
} from '@apnatown/shared/admin';

export const isModule = (value: string): value is AdminModule =>
  (ADMIN_MODULES as readonly string[]).includes(value);
export const isAction = (value: string): value is AdminAction =>
  (ADMIN_ACTIONS as readonly string[]).includes(value);

/** One checkbox change through the shared rule: any action implies view;
 * clearing view clears the module. */
export function togglePermission(
  current: PermissionMatrix,
  module: string,
  action: string,
  checked: boolean,
): PermissionMatrix {
  if (!isModule(module) || !isAction(action)) return current;
  const actions = current[module].filter((item) => item !== action);
  return normalizePermissions(
    { ...current, [module]: checked ? [...actions, action] : actions },
    current,
  );
}

export function samePermissions(a: PermissionMatrix, b: PermissionMatrix) {
  return ADMIN_MODULES.every((module) => a[module].join() === b[module].join());
}

/** Modules whose granted actions differ, in canonical order. */
export function changedModules(
  before: PermissionMatrix,
  after: PermissionMatrix,
) {
  return ADMIN_MODULES.filter(
    (module) => before[module].join() !== after[module].join(),
  );
}
