import type {
  AdminAction,
  AdminModule,
  AdminStatus,
  PermissionMatrix,
  ScopeRef,
} from '@apnatown/shared/admin';
import type { TxContext } from '../../../shared/persistence/ports';

export type Grant = { module: AdminModule; action: AdminAction };
export type CommunicationScope = 'city' | 'zone';
export interface AreaGrant {
  areaId: string;
  cityId: string;
}
export interface AdminAccountRow {
  userId: string;
  displayName: string;
  emailCiphertext: string;
  roleId: string;
  roleName: string;
  status: AdminStatus;
  communicationScopes: CommunicationScope[];
  lastActiveAt: string | null;
  version: number;
  createdAt: string;
}
/** Account plus its current grants, read per request. */
export interface AdminGrants {
  account: AdminAccountRow;
  permissions: PermissionMatrix;
  areaGrants: AreaGrant[];
  cityWideIds: string[];
}
export interface AdminListFilters {
  /** Display-name substring OR the exact user matched by verified phone. */
  q?: { name: string; userId: string | null };
  cityId?: string | undefined;
  /** Exact area grant or whole-city grant of the area's (Geo-resolved) city. */
  area?: AreaGrant;
  /**
   * Whole-city grant of the zone's city, or an area grant among the zone's
   * authoritative areas (Geo supplies none yet; never inferred by city).
   */
  zone?: { cityId: string; areaIds: readonly string[] };
  roleId?: string | undefined;
  status?: AdminStatus | undefined;
}
export interface NewAdminAccount {
  userId: string;
  displayName: string;
  emailCiphertext: string;
  roleId: string;
  createdBy: string;
  now: Date;
}

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');
export interface AdminRepository {
  /** Row lock through commit; serializes every write to one admin. */
  lock(tx: TxContext, userId: string): Promise<AdminGrants | null>;
  read(tx: TxContext, userId: string): Promise<AdminGrants | null>;
  readMany(tx: TxContext, userIds: readonly string[]): Promise<AdminGrants[]>;
  insert(tx: TxContext, account: NewAdminAccount): Promise<void>;
  update(
    tx: TxContext,
    userId: string,
    patch: { status?: AdminStatus; roleId?: string },
    now: Date,
  ): Promise<number>;
  replacePermissions(
    tx: TxContext,
    userId: string,
    permissions: PermissionMatrix,
  ): Promise<void>;
  /** Replaces area grants only; explicit whole-city grants are untouched. */
  replaceAreaGrants(
    tx: TxContext,
    userId: string,
    grants: readonly (AreaGrant & { id: string })[],
  ): Promise<void>;
  touchLastActive(tx: TxContext, userId: string, now: Date): Promise<void>;
  /** Filtered keyset page ordered by `(createdAt DESC, userId DESC)`. */
  page(
    tx: TxContext,
    filters: AdminListFilters,
    limit: number,
    after?: { createdAt: string; userId: string },
  ): Promise<string[]>;
  count(tx: TxContext, filters: AdminListFilters): Promise<number>;
  /** Areas (of `areaIds`) still covered by another active admin's grant. */
  coveredAreas(
    tx: TxContext,
    areas: readonly AreaGrant[],
    excludeUserId: string,
  ): Promise<string[]>;
  /** Active admins holding module/action and authority over every scope. */
  authorizedAdmins(
    tx: TxContext,
    input: {
      grant: Grant;
      scopes: readonly ScopeRef[];
      afterUserId?: string | undefined;
      limit: number;
    },
  ): Promise<string[]>;
  /** Moves all admins of a role (bumping their versions); returns moved IDs. */
  reassignRole(
    tx: TxContext,
    fromRoleId: string,
    toRoleId: string,
    now: Date,
  ): Promise<{ userId: string; version: number }[]>;
}

export interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionMatrix;
  adminCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
export interface RoleRepository {
  /** Serializes role-name writes so case-insensitive uniqueness holds. */
  lockNames(tx: TxContext): Promise<void>;
  nameTaken(tx: TxContext, name: string, exceptId?: string): Promise<boolean>;
  /** `share` lets concurrent assignments proceed but blocks delete/update. */
  lock(
    tx: TxContext,
    id: string,
    mode: 'update' | 'share',
  ): Promise<RoleRow | null>;
  read(tx: TxContext, id: string): Promise<RoleRow | null>;
  insert(
    tx: TxContext,
    role: {
      id: string;
      name: string;
      description: string | null;
      permissions: PermissionMatrix;
      now: Date;
    },
  ): Promise<void>;
  update(
    tx: TxContext,
    id: string,
    patch: {
      name?: string | undefined;
      description?: string | null | undefined;
      permissions?: PermissionMatrix | undefined;
    },
    now: Date,
  ): Promise<void>;
  delete(tx: TxContext, id: string): Promise<void>;
  page(
    tx: TxContext,
    limit: number,
    after?: { name: string; id: string },
  ): Promise<RoleRow[]>;
}
