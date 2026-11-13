'use client';

import { useTranslations } from 'next-intl';
import type { AdminApprovalItem } from '@apnatown/shared/admin';
import { Card } from '@apnatown/ui/cards/Card';
import type { ApprovalFilters } from './filters';
import {
  ApprovalStatusBadge,
  AreaName,
  CategoryName,
  statusKey,
  useApplicationName,
  useIstTime,
} from './parts';
import { ReviewLink } from './ReviewLink';

/** Desktop table (prototype `tbl`): Applicant, Category, Area, Submitted,
 * Status, Review. Owner and phone are not in the queue projection. */
export function QueueTable({
  items,
  filters,
}: {
  items: AdminApprovalItem[];
  filters: ApprovalFilters;
}) {
  const t = useTranslations('admin.approvals');
  const name = useApplicationName();
  const time = useIstTime();
  const head = 'px-3 py-3 text-start text-small font-semibold text-text';
  return (
    <Card className="hidden desktop:block">
      <table className="w-full border-collapse text-small">
        <caption className="sr-only">
          {t('tableCaption', {
            type: t(`types.${filters.type}`),
            status: t(`status.${statusKey[filters.status]}`),
          })}
        </caption>
        <thead className="bg-primary-soft">
          <tr>
            <th scope="col" className={head}>
              {t('columns.applicant')}
            </th>
            <th scope="col" className={head}>
              {t('columns.category')}
            </th>
            <th scope="col" className={head}>
              {t('columns.area')}
            </th>
            <th scope="col" className={head}>
              {t('columns.submitted')}
            </th>
            <th scope="col" className={head}>
              {t('columns.status')}
            </th>
            <th scope="col" className={head}>
              <span className="sr-only">{t('columns.action')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const label = name(item);
            return (
              <tr key={item.id} className="border-t border-border">
                <th
                  scope="row"
                  className="px-3 py-3 text-start font-semibold [overflow-wrap:anywhere]"
                >
                  {label}
                </th>
                <td className="px-3 py-3 [overflow-wrap:anywhere]">
                  <CategoryName categoryId={item.categoryId} />
                </td>
                <td className="px-3 py-3 [overflow-wrap:anywhere]">
                  <AreaName cityId={item.cityId} areaId={item.areaId} />
                </td>
                <td className="px-3 py-3">
                  {item.submittedAt ? (
                    <time dateTime={item.submittedAt}>
                      {time(item.submittedAt)}
                    </time>
                  ) : (
                    t('notSet')
                  )}
                </td>
                <td className="px-3 py-3">
                  <ApprovalStatusBadge status={item.status} />
                </td>
                <td className="px-3 py-3 text-end">
                  <ReviewLink item={item} filters={filters} name={label} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
