'use client';

import { useTranslations } from 'next-intl';
import type { AdminApprovalItem } from '@apnatown/shared/admin';
import { Card } from '@apnatown/ui/cards/Card';
import type { ApprovalFilters } from './filters';
import {
  ApprovalStatusBadge,
  AreaName,
  CategoryName,
  useApplicationName,
  useIstTime,
} from './parts';
import { ReviewLink } from './ReviewLink';

/** Mobile list (hidden on desktop, where the table is shown instead). */
export function QueueCardList({
  items,
  filters,
}: {
  items: AdminApprovalItem[];
  filters: ApprovalFilters;
}) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0 desktop:hidden">
      {items.map((item) => (
        <li key={item.id}>
          <QueueCard item={item} filters={filters} />
        </li>
      ))}
    </ul>
  );
}

/** Mobile card (prototype m-admin-aappr): label/value rows, Review at the end. */
function QueueCard({
  item,
  filters,
}: {
  item: AdminApprovalItem;
  filters: ApprovalFilters;
}) {
  const t = useTranslations('admin.approvals');
  const name = useApplicationName();
  const time = useIstTime();
  const label = name(item);
  const row = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1';
  return (
    <Card padded className="grid gap-3">
      <dl className="m-0 grid gap-2 text-small">
        <div className={row}>
          <dt className="text-text-2">{t('columns.applicant')}</dt>
          <dd className="m-0 min-w-0 text-end font-semibold [overflow-wrap:anywhere]">
            {label}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-text-2">{t('columns.category')}</dt>
          <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">
            <CategoryName categoryId={item.categoryId} />
          </dd>
        </div>
        <div className={row}>
          <dt className="text-text-2">{t('columns.area')}</dt>
          <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">
            <AreaName cityId={item.cityId} areaId={item.areaId} />
          </dd>
        </div>
        <div className={row}>
          <dt className="text-text-2">{t('columns.submitted')}</dt>
          <dd className="m-0 text-end">
            {item.submittedAt ? (
              <time dateTime={item.submittedAt}>{time(item.submittedAt)}</time>
            ) : (
              t('notSet')
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-text-2">{t('columns.status')}</dt>
          <dd className="m-0">
            <ApprovalStatusBadge status={item.status} />
          </dd>
        </div>
      </dl>
      <div className="flex justify-end">
        <ReviewLink item={item} filters={filters} name={label} />
      </div>
    </Card>
  );
}
