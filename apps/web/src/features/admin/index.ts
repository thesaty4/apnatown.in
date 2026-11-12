// Public API of the admin feature for routes and the super-admin feature.
export { AdminShell, useAdmin, type AdminContext } from './AdminShell';
export { AdminProfile } from './Profile';
export {
  Alert,
  AdminFailure,
  Notice,
  PermissionGrid,
  adminErrorKey,
  isDenied,
  usePermissionLabels,
} from './parts';
export {
  changedModules,
  samePermissions,
  togglePermission,
} from './permissions';
