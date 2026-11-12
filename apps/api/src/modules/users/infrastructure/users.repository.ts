import { Injectable } from '@nestjs/common';
import {
  AccountStatusSchema,
  LocaleSchema,
  ThemeSchema,
  UserRoleSchema,
  type Preferences,
} from '@apnatown/shared/users';
import type {
  User,
  UserRole,
} from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { UserIdentity, UsersRepository } from '../domain/identity';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly database: PrismaDatabase) {}
  async lockPhone(tx: TxContext, hash: Uint8Array): Promise<void> {
    const key = `users:phone:${Buffer.from(hash).toString('hex')}`;
    await this.database.client(tx)
      .$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  }
  async findPhone(
    tx: TxContext,
    hash: Uint8Array,
  ): Promise<UserIdentity | null> {
    const row = await this.database.client(tx).user.findUnique({
      where: { phoneLookupHash: Uint8Array.from(hash) },
      select: { id: true },
    });
    return row ? this.lock(tx, row.id) : null;
  }
  async lock(tx: TxContext, id: string): Promise<UserIdentity | null> {
    const db = this.database.client(tx);
    await db.$queryRaw`SELECT id FROM users WHERE id = ${id}::uuid FOR UPDATE`;
    const row = await db.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    return row ? fromRow(row) : null;
  }
  async insert(tx: TxContext, user: UserIdentity): Promise<void> {
    await this.database.client(tx).user.create({
      data: {
        id: user.id,
        phoneCiphertext: user.phoneCiphertext,
        phoneLookupHash: user.phoneLookupHash
          ? Uint8Array.from(user.phoneLookupHash)
          : null,
        emailCiphertext: null,
        displayName: null,
        preferredLocale: user.preferences.locale,
        themePreference: user.preferences.theme,
        accountStatus: user.accountStatus,
        version: user.version,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: { create: [{ role: 'customer', createdAt: user.createdAt }] },
      },
    });
  }
  async updateProfile(
    tx: TxContext,
    id: string,
    patch: { displayName?: string; emailCiphertext?: string | null },
    now: Date,
  ): Promise<UserIdentity> {
    const row = await this.database.client(tx).user.update({
      where: { id },
      data: {
        ...(patch.displayName !== undefined
          ? { displayName: patch.displayName }
          : {}),
        ...(patch.emailCiphertext !== undefined
          ? { emailCiphertext: patch.emailCiphertext }
          : {}),
        version: { increment: 1 },
        updatedAt: now,
      },
      include: { roles: true },
    });
    return fromRow(row);
  }
  async updatePreferences(
    tx: TxContext,
    id: string,
    patch: Partial<Preferences>,
    now: Date,
  ): Promise<Preferences> {
    const row = await this.database.client(tx).user.update({
      where: { id },
      data: {
        ...(patch.locale !== undefined
          ? { preferredLocale: patch.locale }
          : {}),
        ...(patch.theme !== undefined ? { themePreference: patch.theme } : {}),
        version: { increment: 1 },
        updatedAt: now,
      },
      include: { roles: true },
    });
    return fromRow(row).preferences;
  }
  async markDeleting(
    tx: TxContext,
    id: string,
    now: Date,
  ): Promise<UserIdentity> {
    const row = await this.database.client(tx).user.update({
      where: { id },
      data: {
        accountStatus: 'deleting',
        version: { increment: 1 },
        updatedAt: now,
      },
      include: { roles: true },
    });
    return fromRow(row);
  }
  async eraseProfile(tx: TxContext, id: string, now: Date): Promise<void> {
    await this.database.client(tx).user.update({
      where: { id },
      data: {
        displayName: null,
        emailCiphertext: null,
        version: { increment: 1 },
        updatedAt: now,
      },
    });
  }
  async markDeleted(
    tx: TxContext,
    id: string,
    now: Date,
  ): Promise<UserIdentity> {
    const row = await this.database.client(tx).user.update({
      where: { id },
      data: { deletedAt: now, version: { increment: 1 }, updatedAt: now },
      include: { roles: true },
    });
    return fromRow(row);
  }
}
function fromRow(row: User & { roles: UserRole[] }): UserIdentity {
  return {
    id: row.id,
    phoneCiphertext: row.phoneCiphertext,
    phoneLookupHash: row.phoneLookupHash,
    emailCiphertext: row.emailCiphertext,
    displayName: row.displayName,
    preferences: {
      locale: LocaleSchema.parse(row.preferredLocale),
      theme: ThemeSchema.parse(row.themePreference),
    },
    accountStatus: AccountStatusSchema.parse(row.accountStatus),
    version: row.version,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    roles: row.roles
      .map((membership) => UserRoleSchema.parse(membership.role))
      .sort(),
  };
}
