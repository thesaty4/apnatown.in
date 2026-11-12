import { SetMetadata } from '@nestjs/common';

export const MAINTENANCE_ADMISSION = 'apnatown:maintenance-admission';
/**
 * Server-owned maintenance admission class (settings "Maintenance admission
 * matrix"). Unclassified routes are blocked with 503 MAINTENANCE while the
 * `maintenance` flag is on. Admission never bypasses the route's normal
 * authentication, CSRF, rate-limit, role/scope or idempotency checks.
 *
 * - `always`: health, safe public settings/legal reads and Auth recovery.
 * - `super`: Super Admin recovery; an authenticated non-super principal is
 *   blocked, anonymous callers continue to the normal auth guards (which deny).
 * - `consent-withdrawal`: only a `granted: false` consent choice is admitted.
 */
export type MaintenanceAdmissionClass =
  | 'always'
  | 'super'
  | 'consent-withdrawal';
export const MaintenanceAdmission = (admission: MaintenanceAdmissionClass) =>
  SetMetadata(MAINTENANCE_ADMISSION, admission);
