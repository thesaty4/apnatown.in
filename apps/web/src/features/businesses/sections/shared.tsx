'use client';

import { useId, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import type { FieldErrors, ProfileForm } from '../form-model';

export type SectionProps = {
  form: ProfileForm;
  set: (patch: Partial<ProfileForm>) => void;
  errors: FieldErrors;
  disabled?: boolean | undefined;
};

/** Localized message for a `FieldErrors` value. */
export function useFieldError(errors: FieldErrors) {
  const t = useTranslations('business.fields.errors');
  return (field: keyof FieldErrors) => {
    const key = errors[field];
    return key ? t(key) : undefined;
  };
}

/** Prototype form card: heading + fields. */
export function FormCard({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  id?: string | undefined;
}) {
  const heading = useId();
  return (
    <Card
      padded
      className="grid min-w-0 gap-3"
      aria-labelledby={heading}
      role="group"
      id={id}
    >
      <h2 id={heading} className="m-0 text-h4">
        {title}
      </h2>
      {description && (
        <p className="m-0 text-small text-text-2">{description}</p>
      )}
      {children}
    </Card>
  );
}
