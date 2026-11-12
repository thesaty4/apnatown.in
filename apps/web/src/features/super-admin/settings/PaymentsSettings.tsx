'use client';

import { useTranslations } from 'next-intl';
import type {
  SettingValue,
  SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Select } from '@apnatown/ui/primitives/Select';
import { Card } from '@apnatown/ui/cards/Card';
import { FlagSwitches } from './FeatureFlagList';
import { TaxSettingsCard } from './TaxSettingsCard';
import {
  ConfiguredBadge,
  FormCard,
  orNull,
  useSectionForm,
  type Issues,
} from './form';

type Form = { gatewayId: string };
const toForm = (values: { payments?: unknown }): Form => ({
  gatewayId:
    (values.payments as SettingValue<'payments'> | null)?.gatewayId ?? '',
});
const toValues = (form: Form, _issues: Issues) => ({
  payments: { gatewayId: orNull(form.gatewayId) },
});

function GatewayForm({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.payments');
  const configured = data.integrationStatus.gateway.configured;
  const section = useSectionForm({
    id: 'payments',
    data,
    keys: ['payments'],
    group: null,
    toForm,
    toValues,
  });
  const current = section.form.gatewayId;
  // Only approved configured adapters; never a silently selected provider.
  const options = [
    { value: '', label: t('noGateway') },
    ...(current ? [{ value: current, label: current }] : []),
  ];
  return (
    <FormCard
      title={t('gateway')}
      section={section}
      status={<ConfiguredBadge configured={configured} />}
    >
      <Select
        label={t('gateway')}
        hint={configured ? undefined : t('gatewayHint')}
        value={current}
        options={options}
        disabled={!configured && !current}
        error={
          section.has('payments.gatewayId') ? t('gatewayInvalid') : undefined
        }
        onChange={(event) =>
          section.change(() => ({ gatewayId: event.target.value }))
        }
      />
    </FormCard>
  );
}

/** Online/COD switches (immediate), gateway choice and tax configuration. */
export function PaymentsSettings({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings');
  return (
    <div className="grid gap-4">
      <Card padded className="grid gap-3">
        <h2 className="text-h3">{t('sections.payments')}</h2>
        <FlagSwitches data={data} flags={['payments_online', 'payments_cod']} />
      </Card>
      <GatewayForm data={data} />
      <TaxSettingsCard data={data} />
    </div>
  );
}
