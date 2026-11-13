'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@apnatown/ui/primitives/Input';
import { useFieldError, type SectionProps } from './shared';

export function ContactFields({ form, set, errors, disabled }: SectionProps) {
  const t = useTranslations('business.fields');
  const error = useFieldError(errors);
  const phone = (field: 'businessPhone' | 'whatsapp', required: boolean) => (
    <Input
      label={t(field)}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      maxLength={10}
      prefix="+91"
      required={required}
      value={form[field]}
      disabled={disabled}
      error={error(field)}
      onChange={(event) =>
        set({ [field]: event.target.value.replace(/\D/g, '') })
      }
    />
  );
  const url = (
    field: 'instagramUrl' | 'youtubeUrl' | 'facebookUrl',
    placeholder: string,
  ) => (
    <Input
      label={t(field)}
      type="url"
      inputMode="url"
      placeholder={placeholder}
      maxLength={500}
      value={form[field]}
      disabled={disabled}
      error={error(field)}
      onChange={(event) => set({ [field]: event.target.value })}
    />
  );
  return (
    <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
      {phone('businessPhone', true)}
      {phone('whatsapp', false)}
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        maxLength={254}
        value={form.email}
        disabled={disabled}
        error={error('email')}
        onChange={(event) => set({ email: event.target.value })}
      />
      {url('instagramUrl', 'https://instagram.com/…')}
      {url('youtubeUrl', 'https://youtube.com/@…')}
      {url('facebookUrl', 'https://facebook.com/…')}
    </div>
  );
}
