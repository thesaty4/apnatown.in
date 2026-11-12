import { Injectable } from '@nestjs/common';
import { LocaleSchema, type UserRole } from '@apnatown/shared/users';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { UserRolesRepository } from '../domain/user-roles';

const ids = (values: readonly string[]) =>
  Prisma.join(values.map((id) => Prisma.sql`${id}::uuid`));

@Injectable()
export class PrismaUserRolesRepository implements UserRolesRepository {
  constructor(private readonly database: PrismaDatabase) {}
  async insert(
    tx: TxContext,
    userId: string,
    role: UserRole,
    now: Date,
  ): Promise<void> {
    await this.database.client(tx).$executeRaw`
      INSERT INTO user_roles (user_id, role, created_at)
      VALUES (${userId}::uuid, ${role}, ${now})
      ON CONFLICT (user_id, role) DO NOTHING`;
  }
  async hasActive(
    tx: TxContext,
    userId: string,
    role: UserRole,
  ): Promise<boolean> {
    const rows = await this.database.client(tx).$queryRaw<{ one: number }[]>`
      SELECT 1 AS one FROM user_roles r JOIN users u ON u.id = r.user_id
      WHERE r.user_id = ${userId}::uuid AND r.role = ${role}
        AND u.deleted_at IS NULL AND u.account_status = 'active'`;
    return rows.length === 1;
  }
  async activeHolders(
    tx: TxContext,
    role: UserRole,
    page: { afterUserId?: string; limit: number },
  ): Promise<string[]> {
    if (!Number.isSafeInteger(page.limit) || page.limit < 1 || page.limit > 501)
      throw new Error('INVALID_ROLE_HOLDER_LIMIT');
    const after = page.afterUserId
      ? Prisma.sql`AND r.user_id > ${page.afterUserId}::uuid`
      : Prisma.empty;
    const rows = await this.database.client(tx).$queryRaw<
      { userId: string }[]
    >(Prisma.sql`
      SELECT r.user_id AS "userId" FROM user_roles r JOIN users u ON u.id = r.user_id
      WHERE r.role = ${role} AND u.deleted_at IS NULL
        AND u.account_status = 'active' ${after}
      ORDER BY r.user_id LIMIT ${page.limit}`);
    return rows.map((row) => row.userId);
  }
  async contacts(
    tx: TxContext,
    role: UserRole,
    userIds: readonly string[],
  ): Promise<{ userId: string; phoneCiphertext: string | null }[]> {
    if (!userIds.length) return [];
    return this.database.client(tx).$queryRaw<
      { userId: string; phoneCiphertext: string | null }[]
    >(Prisma.sql`
      SELECT u.id AS "userId", u.phone_ciphertext AS "phoneCiphertext"
      FROM users u JOIN user_roles r ON r.user_id = u.id AND r.role = ${role}
      WHERE u.id IN (${ids(userIds)}) AND u.deleted_at IS NULL
      ORDER BY u.id`);
  }
  async findIdByPhoneHash(
    tx: TxContext,
    hash: Uint8Array,
  ): Promise<string | null> {
    const row = await this.database.client(tx).user.findUnique({
      where: { phoneLookupHash: Uint8Array.from(hash) },
      select: { id: true, deletedAt: true },
    });
    return row && !row.deletedAt ? row.id : null;
  }
  async describe(
    tx: TxContext,
    userIds: readonly string[],
  ): Promise<
    { userId: string; displayName: string | null; locale: 'en' | 'hi' }[]
  > {
    if (!userIds.length) return [];
    const rows = await this.database.client(tx).$queryRaw<
      { userId: string; displayName: string | null; locale: string }[]
    >(Prisma.sql`
      SELECT id AS "userId", display_name AS "displayName",
        preferred_locale AS locale
      FROM users WHERE id IN (${ids(userIds)}) ORDER BY id`);
    return rows.map((row) => ({
      ...row,
      locale: LocaleSchema.parse(row.locale),
    }));
  }
}
