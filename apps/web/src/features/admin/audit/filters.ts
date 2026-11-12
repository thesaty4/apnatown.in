import { ActivityExportQuerySchema } from '@apnatown/shared/admin';

/** `audit` = S-ADMN-16 (`/admin/audit`), `activity` = S-SUPR-08. */
export type AuditSection = 'audit' | 'activity';

export const AUDIT_FILTER_NAMES = [
  'q',
  'action',
  'entityType',
  'actorId',
  'cityId',
  'areaId',
  'from',
  'to',
  'actorRole',
] as const;
export type AuditFilterName = (typeof AUDIT_FILTER_NAMES)[number];
/** Validated URL state; the same object is sent to list and export reads. */
export type AuditFilters = Partial<Record<AuditFilterName, string>>;

const shape = ActivityExportQuerySchema.shape;

/** Each URL value is validated with the shared API schema; unknown or invalid
 * values are dropped, never sent. Shared by the server page and client list so
 * both build the same query key. */
export function readAuditFilters(
  read: (name: string) => string | null | undefined,
  section: AuditSection,
): AuditFilters {
  const filters: AuditFilters = {};
  for (const name of AUDIT_FILTER_NAMES) {
    if (name === 'actorRole' && section !== 'activity') continue;
    const parsed = shape[name].safeParse(read(name) ?? undefined);
    if (parsed.success && parsed.data) filters[name] = parsed.data;
  }
  // The API rejects a reversed range; keep the start date only.
  if (filters.from && filters.to && filters.from > filters.to)
    delete filters.to;
  return filters;
}

/** Server `searchParams` record → reader (first value of a repeated name). */
export function recordReader(
  record: Record<string, string | string[] | undefined>,
) {
  return (name: string) => {
    const value = record[name];
    return Array.isArray(value) ? value[0] : value;
  };
}

export const hasAuditFilters = (filters: AuditFilters) =>
  Object.keys(filters).length > 0;

/** `admin.audit.roles.*` leaf for an actor role (keys are camelCase). */
export const roleKey = (role: string) =>
  `roles.${role === 'super_admin' ? 'superAdmin' : role}`;
