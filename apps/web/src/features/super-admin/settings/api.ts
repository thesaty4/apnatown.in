import {
  FeatureFlagSchema,
  LegalPageAdminSchema,
  SavedSettingSchema,
  SavedSettingsGroupSchema,
  SuperAdminSettingsSchema,
  type FeatureFlagKey,
  type LegalSlug,
  type SettingKey,
  type SettingsGroup,
} from '@apnatown/shared/settings';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';
import { commandHeaders, type Command } from '../api';

type SettingValueBody = components['schemas']['UpdateSettingDto']['value'];
export type SettingUpdate = {
  key: SettingKey;
  value: unknown;
  expectedVersion: number;
};
export type LegalBody = components['schemas']['UpdateLegalPageDto'];

export async function getSettings(
  api: Pick<BrowserApi, 'GET'>,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/super-admin/settings', signal ? { signal } : {}),
    SuperAdminSettingsSchema,
  );
}

/** Ungrouped keys only (branding, payments, uploads, integrations, seo, tax). */
export async function putSetting(
  api: BrowserApi,
  { key, value, expectedVersion }: SettingUpdate,
  { key: idempotencyKey, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, idempotencyKey, assertCurrent);
  return unwrap(
    await api.PUT('/super-admin/settings/{key}', {
      params: { header, path: { key } },
      body: { value: value as SettingValueBody, expectedVersion },
    }),
    SavedSettingSchema,
  );
}

/** One atomic request with every group member and its expected version. */
export async function putSettingsGroup(
  api: BrowserApi,
  { group, updates }: { group: SettingsGroup; updates: SettingUpdate[] },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PUT('/super-admin/settings/groups/{group}', {
      params: { header, path: { group } },
      body: {
        updates: updates.map((update) => ({
          ...update,
          value: update.value as SettingValueBody,
        })),
      },
    }),
    SavedSettingsGroupSchema,
  );
}

export async function putFeatureFlag(
  api: BrowserApi,
  {
    key,
    enabled,
    expectedVersion,
  }: { key: FeatureFlagKey; enabled: boolean; expectedVersion: number },
  command: Command,
) {
  const header = await commandHeaders(api, command.key, command.assertCurrent);
  return unwrap(
    await api.PUT('/super-admin/feature-flags/{key}', {
      params: { header, path: { key } },
      body: { enabled, expectedVersion },
    }),
    FeatureFlagSchema,
  );
}

export async function putLegalPage(
  api: BrowserApi,
  { slug, body }: { slug: LegalSlug; body: LegalBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PUT('/super-admin/legal/{slug}', {
      params: { header, path: { slug } },
      body,
    }),
    LegalPageAdminSchema,
  );
}
