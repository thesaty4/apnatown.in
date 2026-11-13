'use client';

import { useTranslations } from 'next-intl';
import type {
  SettingValue,
  SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Input } from '@apnatown/ui/primitives/Input';
import { FormCard, useSectionForm, type Issues } from './form';

type Form = SettingValue<'branding'>;
const empty: Form = { nameEn: '', nameHi: '', taglineEn: '', taglineHi: '' };
const fields = ['nameEn', 'nameHi', 'taglineEn', 'taglineHi'] as const;

const toForm = (values: { branding?: unknown }): Form =>
  (values.branding as Form | null) ?? empty;
const toValues = (form: Form, _issues: Issues) => ({ branding: form });

/** Single-key Save: `branding`. */
export function BrandingSettingsForm({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.branding');
  const tf = useTranslations('superAdmin.settings');
  const section = useSectionForm({
    id: 'branding',
    data,
    keys: ['branding'],
    group: null,
    toForm,
    toValues,
  });
  return (
    <FormCard title={tf('sections.branding')} section={section}>
      <div className="grid gap-3 tablet:grid-cols-2">
        {fields.map((name) => (
          <Input
            key={name}
            label={t(name)}
            lang={name.endsWith('Hi') ? 'hi' : 'en'}
            maxLength={name.startsWith('name') ? 60 : 160}
            required
            value={section.form[name]}
            error={
              section.has(`branding.${name}`) ? tf('errors.text') : undefined
            }
            onChange={(event) =>
              section.change((form) => ({
                ...form,
                [name]: event.target.value,
              }))
            }
          />
        ))}
      </div>
    </FormCard>
  );
}
