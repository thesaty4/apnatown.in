import { Injectable } from '@nestjs/common';
import {
  AdminStatusSchema,
  CommunicationScopeSchema,
  type AdminStatus,
  type PermissionMatrix,
  type ScopeRef,
} from '@apnatown/shared/admin';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  AdminAccountRow,
  AdminGrants,
  AdminListFilters,
  AdminRepository,
  AreaGrant,
  Grant,
  NewAdminAccount,
} from '../domain/admin';
import { toGrants, toMatrix } from './grants';

const uuids = (values: readonly string[]) =>
  Prisma.join(values.map((id) => Prisma.sql`${id}::uuid`));
const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );
const accountColumns = Prisma.sql`
  a.user_id AS "userId", a.display_name AS "displayName",
  a.email_ciphertext AS "emailCiphertext", a.role_id AS "roleId",
  r.name AS "roleName", a.status,
  a.communication_scopes AS "communicationScopes",
  ${timestamp('a.last_active_at')} AS "lastActiveAt", a.version,
  ${timestamp('a.created_at')} AS "createdAt"`;

function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}
/** Shared predicate in SQL: exact area grant or explicit whole-city grant. */
function scopeClause(scope: ScopeRef): Prisma.Sql {
  if (scope.cityId === null) return Prisma.sql`FALSE`;
  if (scope.areaId === null)
    return Prisma.sql`EXISTS (SELECT 1 FROM admin_scopes s
      WHERE s.user_id = a.user_id AND s.authority = 'city'
        AND s.city_id = ${scope.cityId}::uuid)`;
  return Prisma.sql`EXISTS (SELECT 1 FROM admin_scopes s
    WHERE s.user_id = a.user_id AND s.city_id = ${scope.cityId}::uuid
      AND (s.authority = 'city' OR
        (s.authority = 'area' AND s.area_id = ${scope.areaId}::uuid)))`;
}

@Injectable()
export class PrismaAdminRepository implements AdminRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async lock(tx: TxContext, userId: string): Promise<AdminGrants | null> {
    const rows = await this.database.client(tx).$queryRaw<{ id: string }[]>`
      SELECT user_id AS id FROM admin_accounts
      WHERE user_id = ${userId}::uuid FOR UPDATE`;
    return rows.length ? this.read(tx, userId) : null;
  }

  async read(tx: TxContext, userId: string): Promise<AdminGrants | null> {
    return (await this.readMany(tx, [userId]))[0] ?? null;
  }

  async readMany(
    tx: TxContext,
    userIds: readonly string[],
  ): Promise<AdminGrants[]> {
    if (!userIds.length) return [];
    const db = this.database.client(tx);
    const accounts = await db.$queryRaw<
      (Omit<AdminAccountRow, 'status' | 'communicationScopes'> & {
        status: string;
        communicationScopes: string[];
      })[]
    >(Prisma.sql`
      SELECT ${accountColumns}
      FROM admin_accounts a JOIN roles r ON r.id = a.role_id
      WHERE a.user_id IN (${uuids(userIds)})`);
    if (!accounts.length) return [];
    const ids = accounts.map((account) => account.userId);
    const [permissions, scopes] = await Promise.all([
      db.$queryRaw<{ userId: string; module: string; action: string }[]>(
        Prisma.sql`SELECT user_id AS "userId", module, action
          FROM admin_permissions WHERE user_id IN (${uuids(ids)})`,
      ),
      db.$queryRaw<
        {
          userId: string;
          authority: string;
          areaId: string | null;
          cityId: string;
        }[]
      >(Prisma.sql`SELECT user_id AS "userId", authority, area_id AS "areaId",
          city_id AS "cityId"
        FROM admin_scopes WHERE user_id IN (${uuids(ids)})
        ORDER BY city_id, area_id NULLS FIRST`),
    ]);
    const byId = new Map(accounts.map((account) => [account.userId, account]));
    return userIds.flatMap((userId) => {
      const account = byId.get(userId);
      if (!account) return [];
      const own = scopes.filter((scope) => scope.userId === userId);
      return [
        {
          account: {
            ...account,
            status: AdminStatusSchema.parse(account.status),
            communicationScopes: account.communicationScopes.map((scope) =>
              CommunicationScopeSchema.parse(scope),
            ),
          },
          permissions: toMatrix(
            permissions.filter((permission) => permission.userId === userId),
          ),
          areaGrants: own.flatMap((scope) =>
            scope.authority === 'area' && scope.areaId
              ? [{ areaId: scope.areaId, cityId: scope.cityId }]
              : [],
          ),
          cityWideIds: own
            .filter((scope) => scope.authority === 'city')
            .map((scope) => scope.cityId),
        },
      ];
    });
  }

  async insert(tx: TxContext, account: NewAdminAccount): Promise<void> {
    await this.database.client(tx).$executeRaw`
      INSERT INTO admin_accounts (user_id, display_name, email_ciphertext,
        role_id, status, created_by, created_at, updated_at)
      VALUES (${account.userId}::uuid, ${account.displayName},
        ${account.emailCiphertext}, ${account.roleId}::uuid, 'active',
        ${account.createdBy}::uuid, ${account.now}, ${account.now})`;
  }

  async update(
    tx: TxContext,
    userId: string,
    patch: { status?: AdminStatus; roleId?: string },
    now: Date,
  ): Promise<number> {
    const rows = await this.database.client(tx).$queryRaw<
      { version: number }[]
    >(Prisma.sql`
      UPDATE admin_accounts SET
        status = COALESCE(${patch.status ?? null}::text, status),
        role_id = COALESCE(${patch.roleId ?? null}::uuid, role_id),
        version = version + 1, updated_at = ${now}
      WHERE user_id = ${userId}::uuid RETURNING version`);
    if (rows.length !== 1) throw new Error('ADMIN_UPDATE_FAILED');
    return rows[0]!.version;
  }

  async replacePermissions(
    tx: TxContext,
    userId: string,
    permissions: PermissionMatrix,
  ): Promise<void> {
    const db = this.database.client(tx);
    await db.$executeRaw`
      DELETE FROM admin_permissions WHERE user_id = ${userId}::uuid`;
    const grants = toGrants(permissions);
    if (grants.length)
      await db.$executeRaw(Prisma.sql`
        INSERT INTO admin_permissions (user_id, module, action) VALUES ${Prisma.join(
          grants.map(
            (grant) =>
              Prisma.sql`(${userId}::uuid, ${grant.module}, ${grant.action})`,
          ),
        )}`);
  }

  async replaceAreaGrants(
    tx: TxContext,
    userId: string,
    grants: readonly (AreaGrant & { id: string })[],
  ): Promise<void> {
    const db = this.database.client(tx);
    await db.$executeRaw`
      DELETE FROM admin_scopes
      WHERE user_id = ${userId}::uuid AND authority = 'area'`;
    if (grants.length)
      await db.$executeRaw(Prisma.sql`
        INSERT INTO admin_scopes (id, user_id, authority, area_id, city_id)
        VALUES ${Prisma.join(
          grants.map(
            (grant) =>
              Prisma.sql`(${grant.id}::uuid, ${userId}::uuid, 'area',
                ${grant.areaId}::uuid, ${grant.cityId}::uuid)`,
          ),
        )}`);
  }

  async touchLastActive(
    tx: TxContext,
    userId: string,
    now: Date,
  ): Promise<void> {
    // Coarse presence marker; not a versioned edit and never blocks on locks.
    await this.database.client(tx).$executeRaw`
      UPDATE admin_accounts SET last_active_at = ${now}
      WHERE user_id = ${userId}::uuid
        AND (last_active_at IS NULL
          OR last_active_at < ${now}::timestamptz - interval '5 minutes')
        AND user_id = (SELECT user_id FROM admin_accounts
          WHERE user_id = ${userId}::uuid FOR UPDATE SKIP LOCKED)`;
  }

  async page(
    tx: TxContext,
    filters: AdminListFilters,
    limit: number,
    after?: { createdAt: string; userId: string },
  ): Promise<string[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50)
      throw new Error('INVALID_ADMIN_PAGE_LIMIT');
    const position = after
      ? Prisma.sql`AND (a.created_at, a.user_id) <
          (${after.createdAt}::timestamptz, ${after.userId}::uuid)`
      : Prisma.empty;
    const rows = await this.database.client(tx).$queryRaw<
      { userId: string }[]
    >(Prisma.sql`
      SELECT a.user_id AS "userId" FROM admin_accounts a
      WHERE ${this.where(filters)} ${position}
      ORDER BY a.created_at DESC, a.user_id DESC LIMIT ${limit + 1}`);
    return rows.map((row) => row.userId);
  }

  async count(tx: TxContext, filters: AdminListFilters): Promise<number> {
    const rows = await this.database.client(tx).$queryRaw<{ total: number }[]>(
      Prisma.sql`SELECT count(*)::int AS total FROM admin_accounts a
        WHERE ${this.where(filters)}`,
    );
    return rows[0]?.total ?? 0;
  }

  async coveredAreas(
    tx: TxContext,
    areas: readonly AreaGrant[],
    excludeUserId: string,
  ): Promise<string[]> {
    if (!areas.length) return [];
    const values = Prisma.join(
      areas.map(
        (area) => Prisma.sql`(${area.areaId}::uuid, ${area.cityId}::uuid)`,
      ),
    );
    const rows = await this.database.client(tx).$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT DISTINCT v.area_id AS id FROM (VALUES ${values}) AS v(area_id, city_id)
        JOIN admin_scopes s ON s.city_id = v.city_id
          AND (s.authority = 'city' OR s.area_id = v.area_id)
        JOIN admin_accounts a ON a.user_id = s.user_id AND a.status = 'active'
        WHERE s.user_id <> ${excludeUserId}::uuid`,
    );
    return rows.map((row) => row.id);
  }

  async authorizedAdmins(
    tx: TxContext,
    input: {
      grant: Grant;
      scopes: readonly ScopeRef[];
      afterUserId?: string;
      limit: number;
    },
  ): Promise<string[]> {
    if (
      !Number.isSafeInteger(input.limit) ||
      input.limit < 1 ||
      input.limit > 501
    )
      throw new Error('INVALID_RECIPIENT_LIMIT');
    const scopes = input.scopes.map(scopeClause);
    const after = input.afterUserId
      ? Prisma.sql`AND a.user_id > ${input.afterUserId}::uuid`
      : Prisma.empty;
    const rows = await this.database.client(tx).$queryRaw<
      { userId: string }[]
    >(Prisma.sql`
      SELECT a.user_id AS "userId" FROM admin_accounts a
      WHERE a.status = 'active'
        AND EXISTS (SELECT 1 FROM admin_permissions p WHERE p.user_id = a.user_id
          AND p.module = ${input.grant.module} AND p.action = ${input.grant.action})
        ${scopes.length ? Prisma.sql`AND ${Prisma.join(scopes, ' AND ')}` : Prisma.empty}
        ${after}
      ORDER BY a.user_id LIMIT ${input.limit}`);
    return rows.map((row) => row.userId);
  }

  async reassignRole(
    tx: TxContext,
    fromRoleId: string,
    toRoleId: string,
    now: Date,
  ): Promise<{ userId: string; version: number }[]> {
    return this.database.client(tx).$queryRaw<
      { userId: string; version: number }[]
    >(Prisma.sql`
      UPDATE admin_accounts SET role_id = ${toRoleId}::uuid,
        version = version + 1, updated_at = ${now}
      WHERE role_id = ${fromRoleId}::uuid
      RETURNING user_id AS "userId", version`);
  }

  private where(filters: AdminListFilters): Prisma.Sql {
    const clauses: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (filters.q) {
      const name = Prisma.sql`a.display_name ILIKE ${likePattern(filters.q.name)} ESCAPE '\\'`;
      clauses.push(
        filters.q.userId
          ? Prisma.sql`(${name} OR a.user_id = ${filters.q.userId}::uuid)`
          : name,
      );
    }
    if (filters.cityId)
      clauses.push(Prisma.sql`EXISTS (SELECT 1 FROM admin_scopes s
        WHERE s.user_id = a.user_id AND s.city_id = ${filters.cityId}::uuid)`);
    if (filters.area)
      clauses.push(
        scopeClause({
          cityId: filters.area.cityId,
          areaId: filters.area.areaId,
        }),
      );
    if (filters.roleId)
      clauses.push(Prisma.sql`a.role_id = ${filters.roleId}::uuid`);
    if (filters.status) clauses.push(Prisma.sql`a.status = ${filters.status}`);
    return Prisma.join(clauses, ' AND ');
  }
}
