import { Injectable } from '@nestjs/common';
import type {
  FeatureFlagKey,
  LegalSlug,
  SettingKey,
} from '@apnatown/shared/settings';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  SettingsRepository,
  StoredFlag,
  StoredLegalPage,
  StoredSetting,
} from '../domain/settings';

const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );
const settingColumns = Prisma.sql`key, value, version,
  ${timestamp('updated_at')} AS "updatedAt"`;
const flagColumns = Prisma.sql`key, enabled, version,
  ${timestamp('updated_at')} AS "updatedAt"`;
const legalColumns = Prisma.sql`slug, title_en AS "titleEn", title_hi AS "titleHi",
  body_en AS "bodyEn", body_hi AS "bodyHi", version,
  ${timestamp('published_at')} AS "publishedAt"`;
const keyFilter = (column: string, keys?: readonly string[]) =>
  keys
    ? Prisma.sql`WHERE ${Prisma.raw(column)} = ANY(${[...keys]}::text[])`
    : Prisma.empty;

@Injectable()
export class PrismaSettingsRepository implements SettingsRepository {
  constructor(private readonly database: PrismaDatabase) {}

  readSettings(
    tx: TxContext,
    keys?: readonly SettingKey[],
  ): Promise<StoredSetting[]> {
    return this.database.client(tx).$queryRaw<StoredSetting[]>(
      Prisma.sql`SELECT ${settingColumns} FROM settings
        ${keyFilter('key', keys)} ORDER BY key`,
    );
  }

  lockSettings(
    tx: TxContext,
    keys: readonly SettingKey[],
  ): Promise<StoredSetting[]> {
    // Stable key order prevents lock-order deadlocks between grouped saves.
    return this.database.client(tx).$queryRaw<StoredSetting[]>(
      Prisma.sql`SELECT ${settingColumns} FROM settings
        ${keyFilter('key', keys)} ORDER BY key FOR UPDATE`,
    );
  }

  async writeSetting(
    tx: TxContext,
    input: {
      key: SettingKey;
      value: unknown;
      expectedVersion: number;
      updatedBy: string;
      at: Date;
    },
  ): Promise<boolean> {
    const value = JSON.stringify(input.value);
    const count =
      input.expectedVersion === 0
        ? await this.database.client(tx).$executeRaw`
          INSERT INTO settings (key, value, version, updated_by, updated_at)
          VALUES (${input.key}, ${value}::jsonb, 1, ${input.updatedBy}::uuid, ${input.at})
          ON CONFLICT (key) DO NOTHING`
        : await this.database.client(tx).$executeRaw`
          UPDATE settings SET value = ${value}::jsonb, version = version + 1,
            updated_by = ${input.updatedBy}::uuid, updated_at = ${input.at}
          WHERE key = ${input.key} AND version = ${input.expectedVersion}`;
    return count === 1;
  }

  readFlags(
    tx: TxContext,
    keys?: readonly FeatureFlagKey[],
  ): Promise<StoredFlag[]> {
    return this.database.client(tx).$queryRaw<StoredFlag[]>(
      Prisma.sql`SELECT ${flagColumns} FROM feature_flags
        ${keyFilter('key', keys)} ORDER BY key`,
    );
  }

  async lockFlag(
    tx: TxContext,
    key: FeatureFlagKey,
  ): Promise<StoredFlag | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredFlag[]>(
      Prisma.sql`SELECT ${flagColumns} FROM feature_flags
        WHERE key = ${key} FOR UPDATE`,
    );
    return rows[0] ?? null;
  }

  async writeFlag(
    tx: TxContext,
    input: {
      key: FeatureFlagKey;
      enabled: boolean;
      expectedVersion: number;
      updatedBy: string;
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE feature_flags SET enabled = ${input.enabled}, version = version + 1,
        updated_by = ${input.updatedBy}::uuid, updated_at = ${input.at}
      WHERE key = ${input.key} AND version = ${input.expectedVersion}`;
    return count === 1;
  }

  readLegal(
    tx: TxContext,
    slugs?: readonly LegalSlug[],
  ): Promise<StoredLegalPage[]> {
    return this.database.client(tx).$queryRaw<StoredLegalPage[]>(
      Prisma.sql`SELECT ${legalColumns} FROM legal_pages
        ${keyFilter('slug', slugs)} ORDER BY slug`,
    );
  }

  async lockLegal(
    tx: TxContext,
    slug: LegalSlug,
  ): Promise<StoredLegalPage | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredLegalPage[]>(
      Prisma.sql`SELECT ${legalColumns} FROM legal_pages
        WHERE slug = ${slug} FOR UPDATE`,
    );
    return rows[0] ?? null;
  }

  async writeLegal(
    tx: TxContext,
    input: Omit<StoredLegalPage, 'version' | 'publishedAt'> & {
      publishedAt: Date;
      expectedVersion: number;
      updatedBy: string;
      at: Date;
    },
  ): Promise<boolean> {
    const count =
      input.expectedVersion === 0
        ? await this.database.client(tx).$executeRaw`
          INSERT INTO legal_pages (slug, title_en, title_hi, body_en, body_hi,
            version, published_at, updated_by)
          VALUES (${input.slug}, ${input.titleEn}, ${input.titleHi}, ${input.bodyEn},
            ${input.bodyHi}, 1, ${input.publishedAt}, ${input.updatedBy}::uuid)
          ON CONFLICT (slug) DO NOTHING`
        : await this.database.client(tx).$executeRaw`
          UPDATE legal_pages SET title_en = ${input.titleEn}, title_hi = ${input.titleHi},
            body_en = ${input.bodyEn}, body_hi = ${input.bodyHi},
            version = version + 1, published_at = ${input.publishedAt},
            updated_by = ${input.updatedBy}::uuid
          WHERE slug = ${input.slug} AND version = ${input.expectedVersion}`;
    return count === 1;
  }
}
