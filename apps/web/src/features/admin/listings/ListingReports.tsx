'use client';

import { useId, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type {
  AdminListingDetail,
  ListingReportStatus,
} from '@apnatown/shared/admin';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { failureCode } from '../../../shared/api/result';
import { useAdmin } from '../AdminShell';
import { AdminFailure, Notice } from '../parts';
import { ReportCard } from './ReportCard';
import { listingReportsOptions } from './queries';

const STATUSES: readonly ListingReportStatus[] = ['open', 'resolved'];

/** Reports of this listing, open first (newest first), with resolve/dismiss. */
export function ListingReports({ detail }: { detail: AdminListingDetail }) {
  const context = useAdmin();
  const t = useTranslations('admin.listings.reports');
  const ts = useTranslations('admin.state');
  const headingId = useId();
  const [status, setStatus] = useState<ListingReportStatus>('open');
  const [notice, setNotice] = useState<string>();
  const reports = useInfiniteQuery(
    listingReportsOptions(context, detail.listing.id, status),
  );
  const items = reports.data?.pages.flatMap((page) => page.items) ?? [];
  const code = reports.isError ? failureCode(reports.error) : undefined;

  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-3 border-t border-border pt-4"
    >
      <h3 id={headingId} className="m-0 text-h3 font-semibold">
        {t('title', { count: detail.reports.openCount })}
      </h3>
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="flex flex-wrap gap-2"
      >
        {STATUSES.map((value) => (
          <Chip
            key={value}
            label={t(`filter.${value}`)}
            selected={status === value}
            onClick={() => {
              setNotice(undefined);
              setStatus(value);
            }}
          />
        ))}
      </div>
      <Notice message={notice} />
      <div aria-busy={reports.isFetching} className="grid gap-3">
        {reports.isPending ? (
          <Skeleton label={ts('loading')} />
        ) : code && !reports.data ? (
          <AdminFailure
            code={code}
            busy={reports.isFetching}
            retry={() => void reports.refetch()}
          />
        ) : items.length === 0 ? (
          <p className="m-0 text-small text-text-2">{t(`empty.${status}`)}</p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {items.map((report) => (
              <li key={`${report.id}-${report.version}`}>
                <ReportCard report={report} onResolved={setNotice} />
              </li>
            ))}
          </ul>
        )}
        {reports.isFetchNextPageError && (
          <AdminFailure
            code={failureCode(reports.error)}
            busy={reports.isFetchingNextPage}
            retry={() => void reports.fetchNextPage()}
          />
        )}
        {reports.hasNextPage && !reports.isFetchNextPageError && (
          <Button
            variant="outline"
            size="small"
            className="justify-self-center"
            loading={reports.isFetchingNextPage}
            onClick={() => void reports.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        )}
      </div>
    </section>
  );
}
