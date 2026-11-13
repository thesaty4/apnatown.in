'use client';

import { useTranslations } from 'next-intl';
import type { AdminListingCard } from '@apnatown/shared/admin';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import {
  ApprovalStatusBadge,
  AreaName,
  CategoryName,
} from '../approvals/parts';
import { OpenReportsBadge, useListingName } from './parts';

export type ListingOpen = (
  item: AdminListingCard,
  sheet: 'edit' | 'products',
) => void;

type Props = {
  items: AdminListingCard[];
  caption: string;
  /** View-only admins get a read-only "View" instead of Edit. */
  canEdit: boolean;
  onOpen: ListingOpen;
};

/** Rating stays "—" until Reviews ships (`unavailable: ['rating']`). */
function RatingValue({ rating }: { rating: AdminListingCard['rating'] }) {
  const t = useTranslations('admin.listings');
  if (!rating)
    return (
      <span>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t('ratingUnavailable')}</span>
      </span>
    );
  return <>{rating.average.toFixed(1)}</>;
}

function RowActions({
  item,
  name,
  canEdit,
  onOpen,
}: Omit<Props, 'items' | 'caption'> & {
  item: AdminListingCard;
  name: string;
}) {
  const t = useTranslations('admin.listings');
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button
        variant="ghost"
        size="small"
        aria-label={t(canEdit ? 'editNamed' : 'viewNamed', { name })}
        onClick={() => onOpen(item, 'edit')}
      >
        {t(canEdit ? 'editAction' : 'view')}
      </Button>
      <Button
        variant="ghost"
        size="small"
        aria-label={t('productsNamed', { name })}
        onClick={() => onOpen(item, 'products')}
      >
        {t('productsAction')}
      </Button>
    </div>
  );
}

/** Desktop table (prototype `tbl`): Name, Category / vehicle, Area, Rating,
 * Status, actions. Hidden on mobile, where labelled cards are shown. */
export function ListingsTable({ items, caption, canEdit, onOpen }: Props) {
  const t = useTranslations('admin.listings.columns');
  const name = useListingName();
  const head = 'px-3 py-3 text-start text-small font-semibold text-text';
  return (
    <Card className="hidden overflow-x-auto desktop:block">
      <table className="w-full border-collapse text-small">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-primary-soft">
          <tr>
            <th scope="col" className={head}>
              {t('name')}
            </th>
            <th scope="col" className={head}>
              {t('category')}
            </th>
            <th scope="col" className={head}>
              {t('area')}
            </th>
            <th scope="col" className={head}>
              {t('rating')}
            </th>
            <th scope="col" className={head}>
              {t('status')}
            </th>
            <th scope="col" className={head}>
              <span className="sr-only">{t('actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const label = name(item);
            return (
              <tr key={item.id} className="border-t border-border">
                <th scope="row" className="px-3 py-3 text-start font-semibold">
                  <span className="flex flex-wrap items-center gap-2 [overflow-wrap:anywhere]">
                    {label}
                    <OpenReportsBadge count={item.openReportCount} />
                  </span>
                </th>
                <td className="px-3 py-3 [overflow-wrap:anywhere]">
                  <CategoryName categoryId={item.categoryId} />
                </td>
                <td className="px-3 py-3 [overflow-wrap:anywhere]">
                  <AreaName cityId={item.cityId} areaId={item.areaId} />
                </td>
                <td className="px-3 py-3">
                  <RatingValue rating={item.rating} />
                </td>
                <td className="px-3 py-3">
                  <ApprovalStatusBadge status={item.status} />
                </td>
                <td className="px-3 py-3">
                  <RowActions
                    item={item}
                    name={label}
                    canEdit={canEdit}
                    onOpen={onOpen}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/** Mobile cards (prototype m-admin-alistings): label/value rows, actions last. */
export function ListingCards({
  items,
  canEdit,
  onOpen,
}: Omit<Props, 'caption'>) {
  const t = useTranslations('admin.listings.columns');
  const name = useListingName();
  const row = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1';
  return (
    <ul className="m-0 grid list-none gap-3 p-0 desktop:hidden">
      {items.map((item) => {
        const label = name(item);
        return (
          <li key={item.id}>
            <Card padded className="grid gap-3">
              <dl className="m-0 grid gap-2 text-small">
                <div className={row}>
                  <dt className="text-text-2">{t('name')}</dt>
                  <dd className="m-0 min-w-0 text-end font-semibold [overflow-wrap:anywhere]">
                    {label}
                  </dd>
                </div>
                {item.openReportCount > 0 && (
                  <div className="flex justify-end">
                    <OpenReportsBadge count={item.openReportCount} />
                  </div>
                )}
                <div className={row}>
                  <dt className="text-text-2">{t('category')}</dt>
                  <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">
                    <CategoryName categoryId={item.categoryId} />
                  </dd>
                </div>
                <div className={row}>
                  <dt className="text-text-2">{t('area')}</dt>
                  <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">
                    <AreaName cityId={item.cityId} areaId={item.areaId} />
                  </dd>
                </div>
                <div className={row}>
                  <dt className="text-text-2">{t('rating')}</dt>
                  <dd className="m-0 text-end">
                    <RatingValue rating={item.rating} />
                  </dd>
                </div>
                <div className={row}>
                  <dt className="text-text-2">{t('status')}</dt>
                  <dd className="m-0">
                    <ApprovalStatusBadge status={item.status} />
                  </dd>
                </div>
              </dl>
              <RowActions
                item={item}
                name={label}
                canEdit={canEdit}
                onOpen={onOpen}
              />
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
