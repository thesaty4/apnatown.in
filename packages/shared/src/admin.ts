import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import { PhoneInputSchema } from './users.js';

/** Admin permission matrix keys (admin spec `role_permissions`/`admin_permissions`). */
export const ADMIN_MODULES = Object.freeze([
  'approvals',
  'orders',
  'users',
  'reviews',
  'comms',
  'reports',
  'catalog',
  'promos',
] as const);
export const ADMIN_ACTIONS = Object.freeze([
  'view',
  'create',
  'edit',
  'delete',
  'export',
] as const);
export const AdminModuleSchema = z.enum(ADMIN_MODULES);
export const AdminActionSchema = z.enum(ADMIN_ACTIONS);
export type AdminModule = z.infer<typeof AdminModuleSchema>;
export type AdminAction = z.infer<typeof AdminActionSchema>;

const actionList = z.array(AdminActionSchema).max(ADMIN_ACTIONS.length);
/** Request payload: omitted modules mean "no actions". */
export const PermissionInputSchema = z.strictObject({
  approvals: actionList.optional(),
  orders: actionList.optional(),
  users: actionList.optional(),
  reviews: actionList.optional(),
  comms: actionList.optional(),
  reports: actionList.optional(),
  catalog: actionList.optional(),
  promos: actionList.optional(),
});
/** Normalized response matrix: every module present, canonical action order. */
export const PermissionMatrixSchema = z.strictObject({
  approvals: actionList,
  orders: actionList,
  users: actionList,
  reviews: actionList,
  comms: actionList,
  reports: actionList,
  catalog: actionList,
  promos: actionList,
});
export type PermissionInput = z.infer<typeof PermissionInputSchema>;
export type PermissionMatrix = z.infer<typeof PermissionMatrixSchema>;

/**
 * Shared permission normalization (admin spec "Scope and read context"):
 * enabling edit or any other action includes view; removing view (present in
 * `previous`) clears every action for that module.
 */
export function normalizePermissions(
  next: PermissionInput,
  previous?: PermissionMatrix,
): PermissionMatrix {
  const result = {} as Record<AdminModule, AdminAction[]>;
  for (const module of ADMIN_MODULES) {
    const requested = new Set(next[module] ?? []);
    if (
      requested.size === 0 ||
      (!requested.has('view') && previous?.[module].includes('view'))
    ) {
      result[module] = [];
      continue;
    }
    requested.add('view');
    result[module] = ADMIN_ACTIONS.filter((action) => requested.has(action));
  }
  return result;
}
export function emptyPermissions(): PermissionMatrix {
  return normalizePermissions({});
}
export function allPermissions(): PermissionMatrix {
  const all = {} as Record<AdminModule, AdminAction[]>;
  for (const module of ADMIN_MODULES) all[module] = [...ADMIN_ACTIONS];
  return all;
}

/** `{cityId,areaId}`: area resource, city-only (no area) or global (neither). */
export const ScopeRefSchema = z
  .strictObject({ cityId: IdSchema.nullable(), areaId: IdSchema.nullable() })
  .refine((scope) => scope.areaId === null || scope.cityId !== null);
export type ScopeRef = z.infer<typeof ScopeRefSchema>;

export const AdminStatusSchema = z.enum(['active', 'inactive']);
export const CommunicationScopeSchema = z.enum(['city', 'zone']);
export const ScopeRevisionSchema = z.string().regex(/^(platform|v[1-9]\d*)$/);
export type AdminStatus = z.infer<typeof AdminStatusSchema>;

export const AreaRefSchema = z.strictObject({
  id: IdSchema,
  cityId: IdSchema,
  nameEn: z.string(),
  nameHi: z.string(),
});
export const CityRefSchema = z.strictObject({
  id: IdSchema,
  nameEn: z.string(),
  nameHi: z.string(),
});
export const ZoneRefSchema = z.strictObject({
  id: IdSchema,
  cityId: IdSchema,
  name: z.string(),
});
export type AreaRef = z.infer<typeof AreaRefSchema>;
export type CityRef = z.infer<typeof CityRefSchema>;

const displayName = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine((value) => !/[<>\p{Cc}]/u.test(value));
const roleName = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .refine((value) => !/[<>\p{Cc}]/u.test(value));
const roleDescription = z
  .string()
  .trim()
  .max(200)
  .refine((value) => !/[<>\p{Cc}]/u.test(value));
const areaIds = z
  .array(IdSchema)
  .max(200)
  .refine((ids) => new Set(ids).size === ids.length);

export const MaskedEmailSchema = z.string().max(254);
/** `kavita@example.com` -> `k****@example.com`; never the full local part. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '****';
  return `${email[0]}****${email.slice(at)}`;
}

// GET /admin/me
export const AdminMeSchema = z.strictObject({
  id: IdSchema,
  name: z.string(),
  emailMasked: MaskedEmailSchema.nullable(),
  areas: z.array(AreaRefSchema),
  cityWideIds: z.array(IdSchema),
  permissions: PermissionMatrixSchema,
  communicationScopes: z.array(CommunicationScopeSchema),
  scopeRevision: ScopeRevisionSchema,
  isSuper: z.boolean(),
});
export type AdminMe = z.infer<typeof AdminMeSchema>;

// Super-admin admin management
export const AdminUnavailableSchema = z.enum(['zones', 'openCasesInScope']);
export const AdminCardSchema = z.strictObject({
  id: IdSchema,
  name: z.string(),
  phoneE164: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/)
    .nullable(),
  email: z.email().max(254),
  role: z.strictObject({ id: IdSchema, name: z.string() }),
  status: AdminStatusSchema,
  areas: z.array(AreaRefSchema),
  cities: z.array(CityRefSchema),
  zones: z.array(ZoneRefSchema),
  cityWideIds: z.array(IdSchema),
  communicationScopes: z.array(CommunicationScopeSchema),
  permissions: PermissionMatrixSchema,
  lastActiveAt: TimestampSchema.nullable(),
  version: VersionSchema,
  createdAt: TimestampSchema,
  unavailable: z.array(AdminUnavailableSchema),
});
export type AdminCard = z.infer<typeof AdminCardSchema>;
export const AdminListQuerySchema = PageQuerySchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  cityId: IdSchema.optional(),
  areaId: IdSchema.optional(),
  zoneId: IdSchema.optional(),
  roleId: IdSchema.optional(),
  status: AdminStatusSchema.optional(),
}).refine((query) => !(query.areaId && query.zoneId), {
  path: ['zoneId'],
});
export type AdminListQuery = z.infer<typeof AdminListQuerySchema>;
export const AdminPageSchema = z.strictObject({
  items: z.array(AdminCardSchema).max(50),
  nextCursor: CursorSchema.nullable(),
  total: CountSchema,
});
export type AdminPage = z.infer<typeof AdminPageSchema>;
export const AdminParamsSchema = z.strictObject({ id: IdSchema });
export type AdminParams = z.infer<typeof AdminParamsSchema>;
export const CreateAdminSchema = z.strictObject({
  phone: PhoneInputSchema,
  email: z.email().max(254),
  displayName,
  roleId: IdSchema,
  areaIds,
});
export type CreateAdmin = z.infer<typeof CreateAdminSchema>;
export const AdminImpactSchema = z.strictObject({
  adminId: IdSchema,
  areasLeftWithoutActiveAdmin: z.array(AreaRefSchema),
  openCasesInScope: CountSchema.nullable(),
  unavailable: z.array(AdminUnavailableSchema),
});
export type AdminImpact = z.infer<typeof AdminImpactSchema>;
export const SetAdminStatusSchema = z.strictObject({
  status: AdminStatusSchema,
  expectedVersion: VersionSchema,
});
export const SetAdminAreasSchema = z.strictObject({
  areaIds,
  expectedVersion: VersionSchema,
});
export const SetAdminPermissionsSchema = z.strictObject({
  permissions: PermissionInputSchema,
  expectedVersion: VersionSchema,
});
export const SetAdminRoleSchema = z.strictObject({
  roleId: IdSchema,
  reseedPermissions: z.boolean(),
  expectedVersion: VersionSchema,
});
export type SetAdminStatus = z.infer<typeof SetAdminStatusSchema>;
export type SetAdminAreas = z.infer<typeof SetAdminAreasSchema>;
export type SetAdminPermissions = z.infer<typeof SetAdminPermissionsSchema>;
export type SetAdminRole = z.infer<typeof SetAdminRoleSchema>;

// Roles (BR-13)
export const RoleSchema = z.strictObject({
  id: IdSchema,
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  permissions: PermissionMatrixSchema,
  adminCount: CountSchema,
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Role = z.infer<typeof RoleSchema>;
export const RoleListQuerySchema = PageQuerySchema;
export const RolePageSchema = z.strictObject({
  items: z.array(RoleSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type RolePage = z.infer<typeof RolePageSchema>;
export const RoleParamsSchema = z.strictObject({ id: IdSchema });
export type RoleParams = z.infer<typeof RoleParamsSchema>;
export const CreateRoleSchema = z.strictObject({
  name: roleName,
  description: roleDescription.nullable().default(null),
  permissions: PermissionInputSchema,
});
export type CreateRole = z.infer<typeof CreateRoleSchema>;
export const UpdateRoleSchema = z
  .strictObject({
    name: roleName.optional(),
    description: roleDescription.nullable().optional(),
    permissions: PermissionInputSchema.optional(),
    expectedVersion: VersionSchema,
  })
  .refine((value) => Object.keys(value).length > 1);
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
export const RoleSummarySchema = z.strictObject({
  name: z.string(),
  description: z.string().nullable(),
  permissions: PermissionMatrixSchema,
});
export const RoleUpdateResultSchema = z.strictObject({
  role: RoleSchema,
  summary: z.strictObject({
    before: RoleSummarySchema,
    after: RoleSummarySchema,
    changed: z.boolean(),
  }),
});
export type RoleUpdateResult = z.infer<typeof RoleUpdateResultSchema>;
export const DeleteRoleQuerySchema = z.strictObject({
  reassignTo: IdSchema.optional(),
});
export type DeleteRoleQuery = z.infer<typeof DeleteRoleQuerySchema>;
export const RoleDeletedSchema = z.strictObject({
  id: IdSchema,
  deleted: z.literal(true),
  reassignedTo: IdSchema.nullable(),
  reassignedCount: CountSchema,
});
export type RoleDeleted = z.infer<typeof RoleDeletedSchema>;

// Outbox events (published after commit by the relay)
export const ADMIN_EVENT_TYPES = Object.freeze({
  accountStatusChanged: 'admin.account_status_changed',
  scopeChanged: 'admin.scope_changed',
  roleUpdated: 'role.updated',
} as const);
export const AdminAccountStatusChangedPayloadSchema = z.strictObject({
  userId: IdSchema,
  status: AdminStatusSchema,
  version: VersionSchema,
});
export const AdminScopeChangedPayloadSchema = z.strictObject({
  userId: IdSchema,
  change: z.enum(['created', 'areas', 'permissions', 'role']),
  version: VersionSchema,
});
export const RoleUpdatedPayloadSchema = z.strictObject({
  roleId: IdSchema,
  change: z.enum(['created', 'updated', 'deleted']),
  version: VersionSchema,
  reassignedTo: IdSchema.nullable(),
});
export type AdminAccountStatusChangedPayload = z.infer<
  typeof AdminAccountStatusChangedPayloadSchema
>;
export type AdminScopeChangedPayload = z.infer<
  typeof AdminScopeChangedPayloadSchema
>;
export type RoleUpdatedPayload = z.infer<typeof RoleUpdatedPayloadSchema>;

// Audit search, detail and activity export (audit spec, F-AD-014, F-SA-007)
export const AUDIT_ACTOR_ROLES = Object.freeze([
  'customer',
  'vendor',
  'provider',
  'rider',
  'admin',
  'super_admin',
  'system',
] as const);
export const AuditActorRoleSchema = z.enum(AUDIT_ACTOR_ROLES);
export type AuditActorRole = z.infer<typeof AuditActorRoleSchema>;
/** Hard cap on rows in one activity CSV export. */
export const AUDIT_EXPORT_MAX_ROWS = 100_000;
const auditFilterShape = {
  q: z.string().trim().min(1).max(100).optional(),
  action: z
    .string()
    .max(100)
    .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
    .optional(),
  entityType: z
    .string()
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/)
    .optional(),
  actorId: IdSchema.optional(),
  cityId: IdSchema.optional(),
  areaId: IdSchema.optional(),
  /** Inclusive IST calendar date (YYYY-MM-DD); server converts to UTC instants. */
  from: z.iso.date().optional(),
  /** Inclusive IST calendar date (YYYY-MM-DD); server converts to UTC instants. */
  to: z.iso.date().optional(),
};
const actorRoleShape = { actorRole: AuditActorRoleSchema.optional() };
const dateOrder = (query: {
  from?: string | undefined;
  to?: string | undefined;
}) => !query.from || !query.to || query.from <= query.to;
export const AuditListQuerySchema = PageQuerySchema.extend(
  auditFilterShape,
).refine(dateOrder, { path: ['to'] });
export type AuditListQuery = z.infer<typeof AuditListQuerySchema>;
export const ActivityListQuerySchema = PageQuerySchema.extend({
  ...auditFilterShape,
  ...actorRoleShape,
}).refine(dateOrder, { path: ['to'] });
export type ActivityListQuery = z.infer<typeof ActivityListQuerySchema>;
export const ActivityExportQuerySchema = z
  .strictObject({ ...auditFilterShape, ...actorRoleShape })
  .refine(dateOrder, { path: ['to'] });
export type ActivityExportQuery = z.infer<typeof ActivityExportQuerySchema>;
export const AuditParamsSchema = z.strictObject({ id: IdSchema });
export type AuditParams = z.infer<typeof AuditParamsSchema>;
export const AuditEntrySummarySchema = z.strictObject({
  id: IdSchema,
  occurredAt: TimestampSchema,
  actorUserId: IdSchema.nullable(),
  /** Stored, redacted display label; never a phone or email. */
  actorLabel: z.string().max(80),
  actorRole: AuditActorRoleSchema,
  action: z.string().max(100),
  summary: z.string().max(300),
  entityType: z.string().max(64),
  entityId: IdSchema.nullable(),
  hasDiff: z.boolean(),
});
export type AuditEntrySummary = z.infer<typeof AuditEntrySummarySchema>;
const auditSnapshot = z.record(z.string(), z.json()).nullable();
export const AuditEntryDetailSchema = AuditEntrySummarySchema.extend({
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
  /** Changed allow-listed fields only, recursively redacted at write time. */
  before: auditSnapshot,
  after: auditSnapshot,
});
export type AuditEntryDetail = z.infer<typeof AuditEntryDetailSchema>;
export const AuditPageSchema = z.strictObject({
  items: z.array(AuditEntrySummarySchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type AuditPage = z.infer<typeof AuditPageSchema>;
