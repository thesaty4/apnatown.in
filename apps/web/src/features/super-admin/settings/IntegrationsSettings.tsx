'use client';

import { useTranslations } from 'next-intl';
import type {
  SettingValue,
  SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Card } from '@apnatown/ui/cards/Card';
import { Input } from '@apnatown/ui/primitives/Input';
import { FlagSwitches } from './FeatureFlagList';
import {
  ConfiguredBadge,
  FormCard,
  orNull,
  useSectionForm,
  type Issues,
} from './form';

const fields = [
  'whatsappNumber',
  'smsProviderId',
  'emailSender',
  'supportCallE164',
  'supportWhatsappE164',
] as const;
type Field = (typeof fields)[number];
type Form = Record<Field, string>;

function toForm(values: { integrations?: unknown }): Form {
  const value = values.integrations as SettingValue<'integrations'> | null;
  return Object.fromEntries(
    fields.map((name) => [name, value?.[name] ?? '']),
  ) as Form;
}
const toValues = (form: Form, _issues: Issues) => ({
  integrations: Object.fromEntries(
    fields.map((name) => [name, orNull(form[name])]),
  ),
});

/** Adapter status (never secrets), sender identities and the public support
 * Call/WhatsApp destinations used by Help. Single-key Save: `integrations`. */
export function IntegrationsSettings({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.integrations');
  const tf = useTranslations('superAdmin.settings');
  const status = data.integrationStatus;
  const section = useSectionForm({
    id: 'integrations',
    data,
    keys: ['integrations'],
    group: null,
    toForm,
    toValues,
  });
  const input = (
    name: Field,
    type: 'tel' | 'email' | 'text',
    hint?: string,
  ) => (
    <Input
      key={name}
      label={t(name)}
      type={type}
      dir={type === 'text' ? undefined : 'ltr'}
      {...(hint && { hint })}
      value={section.form[name]}
      error={
        section.has(`integrations.${name}`) ? t(`invalid.${type}`) : undefined
      }
      onChange={(event) =>
        section.change((current) => ({
          ...current,
          [name]: event.target.value,
        }))
      }
    />
  );
  return (
    <div className="grid gap-4">
      <Card padded className="grid gap-3">
        <h2 className="text-h3">{tf('sections.notifications')}</h2>
        <ul className="grid gap-2 tablet:grid-cols-2">
          {(['whatsapp', 'sms', 'email', 'gateway'] as const).map((name) => (
            <li
              key={name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
            >
              <span>{t(`adapters.${name}`)}</span>
              <ConfiguredBadge configured={status[name].configured} />
            </li>
          ))}
        </ul>
        <FlagSwitches data={data} flags={['whatsapp']} />
      </Card>
      <FormCard title={t('title')} section={section}>
        <div className="grid gap-3 tablet:grid-cols-2">
          {input('whatsappNumber', 'tel', t('phoneHint'))}
          {input('smsProviderId', 'text', t('smsHint'))}
          {input('emailSender', 'email')}
        </div>
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-h4">{t('supportTitle')}</legend>
          <p className="text-small text-muted">{t('supportHint')}</p>
          <div className="grid gap-3 tablet:grid-cols-2">
            {input('supportCallE164', 'tel', t('phoneHint'))}
            {input('supportWhatsappE164', 'tel', t('phoneHint'))}
          </div>
        </fieldset>
      </FormCard>
    </div>
  );
}
