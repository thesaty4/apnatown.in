import type { z } from 'zod';
import {
  FUTURE_FEATURE_FLAGS,
  SETTING_VALUE_SCHEMAS,
  type FeatureFlagKey,
  type IntegrationStatus,
  type SettingKey,
  type SettingValue,
  type SettingsReadiness,
} from '@apnatown/shared/settings';
import type { RuntimeConfig } from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';

const FIELD_PATH = /^[A-Za-z][A-Za-z0-9_.]*$/;

/**
 * Integration status from deployment configuration presence only; never a
 * secret, adapter credential or sender value. No payment gateway, WhatsApp or
 * email adapter is wired in this deployment yet.
 */
export function integrationStatus(config: RuntimeConfig): IntegrationStatus {
  return {
    gateway: { configured: false },
    whatsapp: { configured: false },
    sms: { configured: config.OTP_DELIVERY_ADAPTER !== 'unavailable' },
    email: { configured: false },
  };
}

/** Future products are never enablable; channels need their adapter configured. */
export function flagEnablable(
  key: FeatureFlagKey,
  status: IntegrationStatus,
): boolean {
  if (FUTURE_FEATURE_FLAGS.includes(key)) return false;
  if (key === 'payments_online') return status.gateway.configured;
  if (key === 'whatsapp') return status.whatsapp.configured;
  return true;
}

function invalid(key: SettingKey, issues: readonly z.core.$ZodIssue[]) {
  const fields = [
    ...new Set(
      issues.map((issue) =>
        [key, ...issue.path.filter((part) => typeof part !== 'symbol')].join(
          '.',
        ),
      ),
    ),
  ]
    .filter((path) => path.length <= 100 && FIELD_PATH.test(path))
    .slice(0, 50);
  return new DomainError('SETTINGS_INVALID', { fields: fields.length ? fields : [key] });
}

/**
 * Per-key schema plus deployment-capability rules. Failures are
 * SETTINGS_INVALID with offending field paths (no values echoed).
 */
export function validateSetting<K extends SettingKey>(
  key: K,
  value: unknown,
  config: RuntimeConfig,
): SettingValue<K> {
  const parsed = SETTING_VALUE_SCHEMAS[key].safeParse(value);
  if (!parsed.success) throw invalid(key, parsed.error.issues);
  const data = parsed.data as SettingValue<K>;
  const fail = (field: string) =>
    new DomainError('SETTINGS_INVALID', { fields: [`${key}.${field}`] });
  if (key === 'payments') {
    // No gateway adapter is configured; a provider ID cannot be selected.
    const payments = data as SettingValue<'payments'>;
    if (payments.gatewayId !== null) throw fail('gatewayId');
  }
  if (key === 'integrations') {
    const integrations = data as SettingValue<'integrations'>;
    const sms = config.OTP_DELIVERY_ADAPTER;
    if (
      integrations.smsProviderId !== null &&
      (sms === 'unavailable' || integrations.smsProviderId !== sms)
    )
      throw fail('smsProviderId');
  }
  if (key === 'tax') {
    // No IRN/e-invoice adapter exists, so an IRN-requiring supplier is
    // incompatible with the deployment's capability.
    const tax = data as SettingValue<'tax'>;
    if (tax.platformSupplier.requiresIrn)
      throw fail('platformSupplier.requiresIrn');
  }
  return data;
}

export function readiness(values: {
  plans: SettingValue<'plans'> | null;
  promotion_fees: SettingValue<'promotion_fees'> | null;
  tax: SettingValue<'tax'> | null;
  uploads: SettingValue<'uploads'> | null;
}): SettingsReadiness {
  const state = (ready: boolean, field: string) => ({
    ready,
    missingFields: ready ? [] : [field],
  });
  return {
    plans: state(!!values.plans?.some((plan) => plan.enabled), 'plans'),
    promotions: state(
      !!values.promotion_fees?.some((fee) => fee.enabled),
      'promotion_fees',
    ),
    tax: state(values.tax !== null, 'tax'),
    images: state(values.uploads !== null, 'uploads'),
  };
}
