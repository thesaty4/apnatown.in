'use client';

import { useTranslations } from 'next-intl';
import type {
  SettingValue,
  SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { FormCard, useSectionForm, type Issues } from './form';

type Form = SettingValue<'seo'>;
const empty: Form = {
  titleEn: '',
  titleHi: '',
  descriptionEn: '',
  descriptionHi: '',
};

const toForm = (values: { seo?: unknown }): Form =>
  (values.seo as Form | null) ?? empty;
const toValues = (form: Form, _issues: Issues) => ({ seo: form });

/** Single-key Save: `seo`, with a search-result preview per language. */
export function SeoSettingsForm({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.seo');
  const tf = useTranslations('superAdmin.settings');
  const section = useSectionForm({
    id: 'seo',
    data,
    keys: ['seo'],
    group: null,
    toForm,
    toValues,
  });
  const { form, change, has } = section;
  const error = (name: keyof Form) =>
    has(`seo.${name}`) ? tf('errors.text') : undefined;
  return (
    <FormCard title={tf('sections.seo')} section={section}>
      {(['En', 'Hi'] as const).map((suffix) => {
        const title = `title${suffix}` as const;
        const description = `description${suffix}` as const;
        const lang = suffix === 'Hi' ? 'hi' : 'en';
        return (
          <fieldset key={suffix} className="grid gap-3">
            <legend className="mb-2 text-h4">
              {tf(suffix === 'Hi' ? 'hindi' : 'english')}
            </legend>
            <Input
              label={t('title')}
              lang={lang}
              maxLength={120}
              required
              value={form[title]}
              error={error(title)}
              onChange={(event) =>
                change((current) => ({
                  ...current,
                  [title]: event.target.value,
                }))
              }
            />
            <TextArea
              label={t('description')}
              lang={lang}
              maxLength={300}
              required
              rows={3}
              value={form[description]}
              error={error(description)}
              onChange={(event) =>
                change((current) => ({
                  ...current,
                  [description]: event.target.value,
                }))
              }
            />
            <div
              lang={lang}
              className="grid gap-1 rounded-md border border-border bg-surface-2 p-3"
            >
              <p className="text-caption text-muted">{tf('preview')}</p>
              <p className="font-semibold text-info [overflow-wrap:anywhere]">
                {form[title] || '—'}
              </p>
              <p className="text-small text-text-2 [overflow-wrap:anywhere]">
                {form[description] || '—'}
              </p>
            </div>
          </fieldset>
        );
      })}
    </FormCard>
  );
}
