import type {
  FeatureFlagKey,
  SettingKey,
  SettingValue,
  SettingsGroup,
  SupplierTaxProfile,
  SupportMessageAccepted,
  SupportMessageDetail,
  TaxClassification,
} from '@apnatown/shared/settings';
import type { AdminReadContext } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

/**
 * Typed settings read port for other modules (never hard-code these values).
 * `get`/`getGroup` may serve a short-lived cache (<= 60 s, invalidated on
 * local commit); `getCurrentFlag` is always an authoritative current read and
 * must gate maintenance, WhatsApp and money/eligibility decisions.
 */
export const SETTINGS_READ = Symbol('SETTINGS_READ');
export interface VersionedSetting<K extends SettingKey> {
  readonly key: K;
  readonly value: SettingValue<K>;
  readonly version: number;
}
export interface SettingsReadPort {
  /** null when never configured: an explicit unavailable gate, never a sample default. */
  get<K extends SettingKey>(
    key: K,
    tx?: TxContext,
  ): Promise<VersionedSetting<K> | null>;
  /** Coherent version tuple read in one statement; never independently cached halves. */
  getGroup(
    group: SettingsGroup,
    tx?: TxContext,
  ): Promise<
    readonly { key: SettingKey; value: unknown | null; version: number }[]
  >;
  getCurrentFlag(
    key: FeatureFlagKey,
    tx?: TxContext,
  ): Promise<{ enabled: boolean; version: number }>;
}

export const SETTINGS_TAX = Symbol('SETTINGS_TAX');
export interface TaxPolicySnapshot {
  readonly status: 'resolved';
  readonly settingsVersion: number;
  readonly supplier: SupplierTaxProfile;
  readonly placeOfSupplyStateCode: string;
  readonly interState: boolean;
  readonly classifications: readonly TaxClassification[];
}
export interface SettingsTaxPort {
  /**
   * Complete immutable policy snapshot for new quotes from the current
   * committed tax version, or `configuration_required` (never guessed/zero
   * tax). Callers freeze the returned snapshot/version.
   */
  resolve(
    input: {
      taxCodes: readonly string[];
      supplierRef: string;
      placeOfSupplyStateCode: string;
      at: Date;
    },
    tx?: TxContext,
  ): Promise<TaxPolicySnapshot | { status: 'configuration_required' }>;
}

export const SUPPORT_READ = Symbol('SUPPORT_READ');
export interface Page<T> {
  readonly items: readonly T[];
  /** Signed cursor bound to the caller's scope revision. */
  readonly nextCursor: string | null;
}
export interface SupportAlert {
  readonly id: string;
  readonly createdAt: string;
  readonly linkPath: string;
}
/** Admin/Notifications read side for the existing Admin overview alert. */
export interface SettingsSupportReadPort {
  alerts(
    ctx: AdminReadContext,
    input: { cursor?: string; limit?: number },
  ): Promise<Page<SupportAlert>>;
  detail(
    ctx: AdminReadContext,
    input: { messageId: string },
  ): Promise<SupportMessageDetail>;
  notificationContext(input: { messageId: string }): Promise<{
    scope: { cityId: string | null; areaId: string | null };
    linkPath: string;
  }>;
}

export const SUPPORT_INTAKE = Symbol('SUPPORT_INTAKE');
/** Delegated intake (e.g. jobless rider support); the caller verifies the actor. */
export interface SupportIntakePort {
  create(input: {
    userId: string;
    message: string;
    source: 'rider';
    sourceKey: string;
  }): Promise<SupportMessageAccepted>;
}
