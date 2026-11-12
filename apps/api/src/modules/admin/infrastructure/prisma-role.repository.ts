import { Injectable } from '@nestjs/common';
import type { PermissionMatrix } from '@apnatown/shared/admin';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { RoleRepository, RoleRow } from '../domain/admin';
import { toGrants, toMatrix } from './grants';

const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );
const roleColumns = Prisma.sql`
  r.id, r.name, r.description, r.is_system AS "isSystem", r.version,
  (SELECT count(*)::int FROM admin_accounts a WHERE a.role_id = r.id) AS "adminCount",
  ${timestamp('r.created_at')} AS "createdAt",
  ${timestamp('r.updated_at')} AS "updatedAt"`;
type RoleBase = Omit<RoleRow, 'permissions'>;

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async lockNames(tx: TxContext): Promise<void> {
    await this.database.client(tx)
      .$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin:roles:names', 0))`;
  }

  async nameTaken(
    tx: TxContext,
    name: string,
    exceptId?: string,
  ): Promise<boolean> {
    const except = exceptId
      ? Prisma.sql`AND id <> ${exceptId}::uuid`
      : Prisma.empty;
    const rows = await this.database.client(tx).$queryRaw<{ one: number }[]>(
      Prisma.sql`SELECT 1 AS one FROM roles
        WHERE lower(name) = lower(${name}) ${except} LIMIT 1`,
    );
    return rows.length > 0;
  }

  async lock(
    tx: TxContext,
    id: string,
    mode: 'update' | 'share',
  ): Promise<RoleRow | null> {
    const lock =
      mode === 'update' ? Prisma.sql`FOR UPDATE` : Prisma.sql`FOR SHARE`;
    const rows = await this.database
      .client(tx)
      .$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT id FROM roles WHERE id = ${id}::uuid ${lock}`,
      );
    return rows.length ? this.read(tx, id) : null;
  }

  async read(tx: TxContext, id: string): Promise<RoleRow | null> {
    const rows = await this.database
      .client(tx)
      .$queryRaw<RoleBase[]>(
        Prisma.sql`SELECT ${roleColumns} FROM roles r WHERE r.id = ${id}::uuid`,
      );
    return (await this.withPermissions(tx, rows))[0] ?? null;
  }

  async insert(
    tx: TxContext,
    role: {
      id: string;
      name: string;
      description: string | null;
      permissions: PermissionMatrix;
      now: Date;
    },
  ): Promise<void> {
    await this.database.client(tx).$executeRaw`
      INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
      VALUES (${role.id}::uuid, ${role.name}, ${role.description}, false,
        ${role.now}, ${role.now})`;
    await this.insertPermissions(tx, role.id, role.permissions);
  }

  async update(
    tx: TxContext,
    id: string,
    patch: {
      name?: string;
      description?: string | null;
      permissions?: PermissionMatrix;
    },
    now: Date,
  ): Promise<void> {
    const db = this.database.client(tx);
    const description =
      patch.description === undefined
        ? Prisma.sql`description`
        : Prisma.sql`${patch.description}::text`;
    await db.$executeRaw(Prisma.sql`
      UPDATE roles SET name = COALESCE(${patch.name ?? null}::text, name),
        description = ${description}, version = version + 1, updated_at = ${now}
      WHERE id = ${id}::uuid`);
    if (patch.permissions) {
      await db.$executeRaw`DELETE FROM role_permissions WHERE role_id = ${id}::uuid`;
      await this.insertPermissions(tx, id, patch.permissions);
    }
  }

  async delete(tx: TxContext, id: string): Promise<void> {
    await this.database.client(tx)
      .$executeRaw`DELETE FROM roles WHERE id = ${id}::uuid AND NOT is_system`;
  }

  async page(
    tx: TxContext,
    limit: number,
    after?: { name: string; id: string },
  ): Promise<RoleRow[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50)
      throw new Error('INVALID_ROLE_PAGE_LIMIT');
    const position = after
      ? Prisma.sql`WHERE (r.name, r.id) > (${after.name}, ${after.id}::uuid)`
      : Prisma.empty;
    const rows = await this.database.client(tx).$queryRaw<RoleBase[]>(
      Prisma.sql`SELECT ${roleColumns} FROM roles r ${position}
        ORDER BY r.name, r.id LIMIT ${limit + 1}`,
    );
    return this.withPermissions(tx, rows);
  }

  private async insertPermissions(
    tx: TxContext,
    roleId: string,
    permissions: PermissionMatrix,
  ): Promise<void> {
    const grants = toGrants(permissions);
    if (!grants.length) return;
    await this.database.client(tx).$executeRaw(Prisma.sql`
      INSERT INTO role_permissions (role_id, module, action) VALUES ${Prisma.join(
        grants.map(
          (grant) =>
            Prisma.sql`(${roleId}::uuid, ${grant.module}, ${grant.action})`,
        ),
      )}`);
  }

  private async withPermissions(
    tx: TxContext,
    rows: RoleBase[],
  ): Promise<RoleRow[]> {
    if (!rows.length) return [];
    const permissions = await this.database.client(tx).$queryRaw<
      { roleId: string; module: string; action: string }[]
    >(Prisma.sql`
      SELECT role_id AS "roleId", module, action FROM role_permissions
      WHERE role_id IN (${Prisma.join(rows.map((row) => Prisma.sql`${row.id}::uuid`))})`);
    return rows.map((row) => ({
      ...row,
      permissions: toMatrix(
        permissions.filter((permission) => permission.roleId === row.id),
      ),
    }));
  }
}
