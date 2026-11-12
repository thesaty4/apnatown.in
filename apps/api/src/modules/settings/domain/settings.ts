import type {
  FeatureFlagKey,
  LegalSlug,
  SettingKey,
} from '@apnatown/shared/settings';
import type { TxContext } from '../../../shared/persistence/ports';

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY');

/** Persisted value is re-validated against its key schema on read. */
export interface StoredSetting {
  key: SettingKey;
  value: unknown;
  version: number;
  updatedAt: string;
}
export interface StoredFlag {
  key: FeatureFlagKey;
  enabled: boolean;
  version: number;
  updatedAt: string;
}
export interface StoredLegalPage {
  slug: LegalSlug;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  version: number;
  publishedAt: string;
}
interface Write {
  /** 0 inserts a never-configured row; otherwise a CAS on the current version. */
  expectedVersion: number;
  updatedBy: string;
  at: Date;
}

export interface SettingsRepository {
  readSettings(
    tx: TxContext,
    keys?: readonly SettingKey[],
  ): Promise<StoredSetting[]>;
  /** Row locks in stable key order; absent keys are simply not returned. */
  lockSettings(
    tx: TxContext,
    keys: readonly SettingKey[],
  ): Promise<StoredSetting[]>;
  /** False when the expected version no longer matches (or a racing insert won). */
  writeSetting(
    tx: TxContext,
    input: Write & { key: SettingKey; value: unknown },
  ): Promise<boolean>;
  readFlags(
    tx: TxContext,
    keys?: readonly FeatureFlagKey[],
  ): Promise<StoredFlag[]>;
  lockFlag(tx: TxContext, key: FeatureFlagKey): Promise<StoredFlag | null>;
  writeFlag(
    tx: TxContext,
    input: Write & { key: FeatureFlagKey; enabled: boolean },
  ): Promise<boolean>;
  readLegal(
    tx: TxContext,
    slugs?: readonly LegalSlug[],
  ): Promise<StoredLegalPage[]>;
  lockLegal(tx: TxContext, slug: LegalSlug): Promise<StoredLegalPage | null>;
  writeLegal(
    tx: TxContext,
    input: Write &
      Omit<StoredLegalPage, 'version' | 'publishedAt'> & { publishedAt: Date },
  ): Promise<boolean>;
}

export const SUPPORT_MESSAGE_REPOSITORY = Symbol('SUPPORT_MESSAGE_REPOSITORY');
export type SupportSource = 'web' | 'rider';
export interface StoredSupportMessage {
  id: string;
  userId: string | null;
  message: string;
  cityId: string | null;
  areaId: string | null;
  createdAt: string;
}
/** Server-resolved admin visibility; unscoped rows are platform-wide only. */
export interface SupportVisibility {
  platformWide: boolean;
  cityIds: readonly string[];
  areaIds: readonly string[];
}
export interface SupportPosition {
  createdAt: string;
  id: string;
}
export interface SupportMessageRepository {
  /** Returns the existing ID instead when (source, sourceKey) already exists. */
  insert(
    tx: TxContext,
    input: {
      id: string;
      userId: string | null;
      message: string;
      source: SupportSource;
      sourceKey: string | null;
      cityId: string | null;
      areaId: string | null;
      at: Date;
    },
  ): Promise<{ id: string; created: boolean }>;
  read(tx: TxContext, id: string): Promise<StoredSupportMessage | null>;
  /** createdAt DESC, id DESC within the visibility filter. */
  page(
    tx: TxContext,
    visibility: SupportVisibility,
    limit: number,
    after?: SupportPosition,
  ): Promise<StoredSupportMessage[]>;
  /** Own account intake, createdAt ASC, id ASC. */
  pageByUser(
    tx: TxContext,
    userId: string,
    limit: number,
    after?: SupportPosition,
  ): Promise<StoredSupportMessage[]>;
  existsForUser(tx: TxContext, userId: string): Promise<boolean>;
}
