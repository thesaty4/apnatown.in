'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { BusinessOwner } from '@apnatown/shared/businesses';
import { formatLocalBusinessTime } from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Alert, maskPhone } from '../parts';
import { useOwnerPhone } from '../queries';
import type { useProfileDraft } from '../use-profile-draft';
import type { Step } from './steps';

export function Review({
  owner,
  draft,
  onEdit,
}: {
  owner: BusinessOwner;
  draft: ReturnType<typeof useProfileDraft>;
  onEdit: (step: Step) => void;
}) {
  const t = useTranslations('business.onboarding');
  const th = useTranslations('business.hours');
  const tf = useTranslations('business.fields');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const phone = useOwnerPhone();
  const form = draft.form;
  const openDays = form.hours
    .map((day, index) => ({ ...day, index }))
    .filter((day) => day.open);
  const sample = openDays[0];
  const rows: { label: string; value: string; step: Step }[] = [
    {
      label: t('reviewType'),
      value: t(owner.kind === 'shop' ? 'typeShop' : 'typeProvider'),
      step: 2,
    },
    { label: tf('nameEn'), value: form.nameEn.trim() || '—', step: 3 },
    { label: tf('nameHi'), value: form.nameHi.trim() || '—', step: 3 },
    {
      label: t('reviewCategories'),
      value: form.categoryIds.length
        ? t('reviewCategoryCount', { count: form.categoryIds.length })
        : '—',
      step: 3,
    },
    {
      label: t('mobile'),
      value: phone.data?.phone ? maskPhone(phone.data.phone) : '—',
      step: 1,
    },
    { label: tf('address'), value: form.addressText.trim() || '—', step: 4 },
    {
      label: t('reviewHours'),
      value: form.temporarilyClosed
        ? th('temporarilyClosed')
        : sample
          ? t('reviewHoursValue', {
              days: openDays.length,
              opens: formatLocalBusinessTime(sample.opensAt, locale),
              closes: formatLocalBusinessTime(sample.closesAt, locale),
            })
          : th('closed'),
      step: 5,
    },
  ];
  return (
    <div className="grid gap-3">
      <Card padded>
        <dl className="m-0 grid gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <dt className="w-40 shrink-0 text-small text-text-2">
                {row.label}
              </dt>
              <dd className="m-0 min-w-0 flex-1 basis-40 font-semibold [overflow-wrap:anywhere]">
                {row.value}
              </dd>
              <Button
                size="small"
                variant="ghost"
                aria-label={t('editRow', { field: row.label })}
                onClick={() => onEdit(row.step)}
              >
                {t('edit')}
              </Button>
            </div>
          ))}
        </dl>
      </Card>
      <Alert tone="info" role="note">
        <p className="m-0">{t('reviewNote')}</p>
      </Alert>
    </div>
  );
}
