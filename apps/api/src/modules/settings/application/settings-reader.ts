import { Inject, Injectable } from '@nestjs/common';
import {
  SETTING_KEYS,
  SETTING_VALUE_SCHEMAS,
  SETTINGS_GROUPS,
  type FeatureFlagKey,
  type SettingKey,
  type SettingValue,
  type SettingsGroup,
} from '@apnatown/shared/settings';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  SETTINGS_REPOSITORY,
  type SettingsRepository,
  type StoredSetting,
} from '../domain/settings';
import type {
  SettingsReadPort,
  SettingsTaxPort,
  TaxPolicySnapshot,
  VersionedSetting,
} from './settings-ports';

/** Noncritical cache horizon (spec: <= 60 s, invalidated on local commit). */
const CACHE_TTL_MS = 30_000;
type GroupTuple = readonly {
  key: SettingKey;
  value: unknown | null;
  version: number;
}[];
interface Cached<T> {
  readonly value: T;
  readonly expiresAt: number;
}

/**
 * A persisted value that no longer matches its schema is treated as
 * unconfigured (explicit unavailable gate), never a guessed fallback.
 */
export function parseStored<K extends SettingKey>(
  key: K,
  value: unknown,
): SettingValue<K> | null {
  const parsed = SETTING_VALUE_SCHEMAS[key].safeParse(value);
  return parsed.success ? (parsed.data as SettingValue<K>) : null;
}

@Injectable()
export class SettingsReader implements SettingsReadPort, SettingsTaxPort {
  private readonly keys = new Map<SettingKey, Cached<StoredSetting | null>>();
  private readonly groups = new Map<SettingsGroup, Cached<GroupTuple>>();

  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SETTINGS_REPOSITORY)
    private readonly repository: SettingsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async get<K extends SettingKey>(
    key: K,
    tx?: TxContext,
  ): Promise<VersionedSetting<K> | null> {
    const row = await this.row(key, tx);
    const value = row ? parseStored(key, row.value) : null;
    return row && value ? { key, value, version: row.version } : null;
  }

  async getGroup(group: SettingsGroup, tx?: TxContext): Promise<GroupTuple> {
    const now = this.clock.now().getTime();
    const cached = tx ? undefined : this.groups.get(group);
    if (cached && cached.expiresAt > now) return cached.value;
    const keys = SETTINGS_GROUPS[group];
    // One statement reads the whole tuple so halves never mix versions.
    const rows = await this.read(
      (t) => this.repository.readSettings(t, keys as readonly SettingKey[]),
      tx,
    );
    const tuple: GroupTuple = (keys as readonly SettingKey[]).map((key) => {
      const row = rows.find((item) => item.key === key);
      return {
        key,
        value: row ? parseStored(key, row.value) : null,
        version: row?.version ?? 0,
      };
    });
    if (!tx)
      this.groups.set(group, { value: tuple, expiresAt: now + CACHE_TTL_MS });
    return tuple;
  }

  async getCurrentFlag(
    key: FeatureFlagKey,
    tx?: TxContext,
  ): Promise<{ enabled: boolean; version: number }> {
    // Authoritative current read; never served from cache.
    const [flag] = await this.read(
      (t) => this.repository.readFlags(t, [key]),
      tx,
    );
    // A missing seed row is treated as disabled (fail closed for features).
    return flag
      ? { enabled: flag.enabled, version: flag.version }
      : { enabled: false, version: 0 };
  }

  async resolve(
    input: {
      taxCodes: readonly string[];
      supplierRef: string;
      placeOfSupplyStateCode: string;
      at: Date;
    },
    tx?: TxContext,
  ): Promise<TaxPolicySnapshot | { status: 'configuration_required' }> {
    // Money decisions read the current committed version (no cache). Only the
    // current version is retained, so `at` must be "now" for new quotes;
    // historical quotes use their own frozen snapshots.
    const [row] = await this.read(
      (t) => this.repository.readSettings(t, ['tax']),
      tx,
    );
    const tax = row ? parseStored('tax', row.value) : null;
    const unavailable = { status: 'configuration_required' } as const;
    if (!row || !tax) return unavailable;
    if (!/^\d{2}$/.test(input.placeOfSupplyStateCode)) return unavailable;
    if (tax.platformSupplier.supplierRef !== input.supplierRef)
      return unavailable;
    const classifications = input.taxCodes.map((code) =>
      tax.classifications.find((item) => item.code === code),
    );
    if (!input.taxCodes.length || classifications.some((item) => !item))
      return unavailable;
    return Object.freeze({
      status: 'resolved',
      settingsVersion: row.version,
      supplier: tax.platformSupplier,
      placeOfSupplyStateCode: input.placeOfSupplyStateCode,
      interState:
        tax.platformSupplier.stateCode !== input.placeOfSupplyStateCode,
      classifications: Object.freeze(
        classifications.filter((item) => item !== undefined),
      ),
    });
  }

  /** Called after a settings command commits in this process. */
  invalidate(keys: readonly SettingKey[] = SETTING_KEYS): void {
    for (const key of keys) this.keys.delete(key);
    for (const [group, members] of Object.entries(SETTINGS_GROUPS))
      if (members.some((key) => keys.includes(key)))
        this.groups.delete(group as SettingsGroup);
  }

  private async row(
    key: SettingKey,
    tx?: TxContext,
  ): Promise<StoredSetting | null> {
    const now = this.clock.now().getTime();
    const cached = tx ? undefined : this.keys.get(key);
    if (cached && cached.expiresAt > now) return cached.value;
    const [row] = await this.read(
      (t) => this.repository.readSettings(t, [key]),
      tx,
    );
    if (!tx)
      this.keys.set(key, { value: row ?? null, expiresAt: now + CACHE_TTL_MS });
    return row ?? null;
  }

  private read<T>(
    work: (tx: TxContext) => Promise<T>,
    tx?: TxContext,
  ): Promise<T> {
    return tx ? work(tx) : this.uow.run(work);
  }
}
