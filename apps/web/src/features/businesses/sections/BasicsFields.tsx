'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { useFieldError, type SectionProps } from './shared';

export function NameFields({ form, set, errors, disabled }: SectionProps) {
  const t = useTranslations('business.fields');
  const error = useFieldError(errors);
  return (
    <>
      <Input
        label={t('nameEn')}
        required
        maxLength={80}
        autoComplete="organization"
        value={form.nameEn}
        disabled={disabled}
        error={error('nameEn')}
        onChange={(event) => set({ nameEn: event.target.value })}
      />
      <Input
        label={t('nameHi')}
        lang="hi"
        maxLength={80}
        value={form.nameHi}
        disabled={disabled}
        error={error('nameHi')}
        onChange={(event) => set({ nameHi: event.target.value })}
      />
    </>
  );
}

export function DescriptionField({
  form,
  set,
  errors,
  disabled,
}: SectionProps) {
  const t = useTranslations('business.fields');
  const error = useFieldError(errors);
  return (
    <TextArea
      label={t('description')}
      hint={t('descriptionHint')}
      maxLength={1000}
      value={form.description}
      disabled={disabled}
      error={error('description')}
      onChange={(event) => set({ description: event.target.value })}
    />
  );
}
