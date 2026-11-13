'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AdminApprovalItem } from '@apnatown/shared/admin';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { approvalDetailHref, type ApprovalFilters } from './filters';

export function ReviewLink({
  item,
  filters,
  name,
}: {
  item: AdminApprovalItem;
  filters: ApprovalFilters;
  name: string;
}) {
  const t = useTranslations('admin.approvals');
  // Rider rows cannot exist yet (owning module unavailable); never link them.
  if (item.type === 'rider') return null;
  return (
    <Link
      href={approvalDetailHref(item.type, item.id, filters.status)}
      className={buttonVariantClassName('primary', 'card')}
    >
      {t('review')}
      <span className="sr-only">: {name}</span>
    </Link>
  );
}
