import {
  AdminCardSchema,
  AdminImpactSchema,
  AdminPageSchema,
  RoleDeletedSchema,
  RolePageSchema,
  RoleSchema,
  RoleUpdateResultSchema,
  type AdminStatus,
} from '@apnatown/shared/admin';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

export type AdminFilters = {
  cityId?: string | undefined;
  areaId?: string | undefined;
  zoneId?: string | undefined;
  roleId?: string | undefined;
  status?: AdminStatus | undefined;
};
export type CreateAdminBody = components['schemas']['CreateAdminDto'];
export type CreateRoleBody = components['schemas']['CreateRoleDto'];
export type UpdateRoleBody = components['schemas']['UpdateRoleDto'];
export type PermissionsBody = components['schemas']['SetAdminPermissionsDto'];

function present(values: Record<string, string | undefined>) {
  const query: Record<string, string> = {};
  for (const [name, value] of Object.entries(values))
    if (value) query[name] = value;
  return query;
}

export async function listAdmins(
  api: Reader,
  filters: AdminFilters & { q?: string | undefined },
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/super-admin/admins', {
      params: { query: present({ ...filters, cursor }) },
      ...withSignal(signal),
    }),
    AdminPageSchema,
  );
}

export async function getAdminImpact(
  api: Reader,
  id: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/super-admin/admins/{id}/impact', {
      params: { path: { id } },
      ...withSignal(signal),
    }),
    AdminImpactSchema,
  );
}

export async function listRoles(
  api: Reader,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/super-admin/roles', {
      params: { query: cursor ? { cursor, limit: 50 } : { limit: 50 } },
      ...withSignal(signal),
    }),
    RolePageSchema,
  );
}

/** CSRF/Origin come from the session transport; the caller owns the command key. */
export async function commandHeaders(
  api: BrowserApi,
  key: string,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return { ...header, 'Idempotency-Key': key };
}
export type Command = { key: string; assertCurrent: () => void };

export async function createAdmin(
  api: BrowserApi,
  body: CreateAdminBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/super-admin/admins', { params: { header }, body }),
    AdminCardSchema,
  );
}

export async function setAdminStatus(
  api: BrowserApi,
  id: string,
  body: { status: AdminStatus; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/super-admin/admins/{id}/status', {
      params: { header, path: { id } },
      body,
    }),
    AdminCardSchema,
  );
}

export async function setAdminAreas(
  api: BrowserApi,
  id: string,
  body: { areaIds: string[]; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PUT('/super-admin/admins/{id}/areas', {
      params: { header, path: { id } },
      body,
    }),
    AdminCardSchema,
  );
}

export async function setAdminPermissions(
  api: BrowserApi,
  id: string,
  body: PermissionsBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PUT('/super-admin/admins/{id}/permissions', {
      params: { header, path: { id } },
      body,
    }),
    AdminCardSchema,
  );
}

export async function setAdminRole(
  api: BrowserApi,
  id: string,
  body: { roleId: string; reseedPermissions: boolean; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PUT('/super-admin/admins/{id}/role', {
      params: { header, path: { id } },
      body,
    }),
    AdminCardSchema,
  );
}

export async function createRole(
  api: BrowserApi,
  body: CreateRoleBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/super-admin/roles', { params: { header }, body }),
    RoleSchema,
  );
}

export async function updateRole(
  api: BrowserApi,
  id: string,
  body: UpdateRoleBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PATCH('/super-admin/roles/{id}', {
      params: { header, path: { id } },
      body,
    }),
    RoleUpdateResultSchema,
  );
}

export async function duplicateRole(
  api: BrowserApi,
  id: string,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/super-admin/roles/{id}/duplicate', {
      params: { header, path: { id } },
      body: {},
    }),
    RoleSchema,
  );
}

export async function deleteRole(
  api: BrowserApi,
  id: string,
  reassignTo: string | undefined,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.DELETE('/super-admin/roles/{id}', {
      params: {
        header,
        path: { id },
        query: reassignTo ? { reassignTo } : {},
      },
    }),
    RoleDeletedSchema,
  );
}
