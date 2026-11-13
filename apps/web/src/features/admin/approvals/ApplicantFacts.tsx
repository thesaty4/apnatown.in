'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { AdminBusinessApprovalType } from '@apnatown/shared/admin';
import type { BusinessAdminDetail } from '@apnatown/shared/businesses';
import { Card } from '@apnatown/ui/cards/Card';
import { AreaName, CategoryName, CityName, useIstTime } from './parts';

/** Prototype "Applicant" facts grid. IDs are resolved to names client-side;
 * no private document data or storage reference is shown. */
export function ApplicantFacts({
  type,
  application,
}: {
  type: AdminBusinessApprovalType;
  application: BusinessAdminDetail;
}) {
  const t = useTranslations('admin.approvals');
  const time = useIstTime();
  const facts: { label: string; value: ReactNode }[] = [
    { label: t('facts.type'), value: t(`types.${type}`) },
    {
      label: t('facts.phone'),
      value: (
        <a
          href={`tel:${application.phoneE164}`}
          dir="ltr"
          className="text-primary underline-offset-2 hover:underline focus-visible:ring-focus"
        >
          {application.phoneE164}
        </a>
      ),
    },
    {
      label: t('facts.category'),
      value: <CategoryName categoryId={application.categoryId} />,
    },
    {
      label: t('facts.area'),
      value: (
        <AreaName cityId={application.cityId} areaId={application.areaId} />
      ),
    },
    { label: t('facts.city'), value: <CityName cityId={application.cityId} /> },
    {
      label: t('facts.address'),
      value: application.addressText ?? t('notSet'),
    },
    {
      label: t('facts.submitted'),
      value: application.submittedAt ? (
        <time dateTime={application.submittedAt}>
          {time(application.submittedAt)}
        </time>
      ) : (
        t('notSet')
      ),
    },
    {
      label: t('facts.created'),
      value: (
        <time dateTime={application.createdAt}>
          {time(application.createdAt)}
        </time>
      ),
    },
  ];
  return (
    <Card padded className="grid min-w-0 gap-3">
      <h2 className="m-0 text-h3">{t('facts.title')}</h2>
      <dl className="m-0 grid gap-x-4 gap-y-3 text-small tablet:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="grid min-w-0 gap-0.5">
            <dt className="text-text-2">{fact.label}</dt>
            <dd className="m-0 font-semibold [overflow-wrap:anywhere]">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
