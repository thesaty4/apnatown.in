import type { AdminReadContext } from '../../../shared/auth/ports';
import type { AuditReadScope } from '../domain/audit-read';

/** Single source for the admin audit visibility predicate (list + entity history). */
export function auditReadScope(ctx: AdminReadContext): AuditReadScope {
  return ctx.isSuper
    ? { platformWide: true, cityWideIds: [], areaIds: [] }
    : {
        platformWide: false,
        cityWideIds: ctx.scope.cityWideIds,
        areaIds: ctx.scope.areaIds,
      };
}
