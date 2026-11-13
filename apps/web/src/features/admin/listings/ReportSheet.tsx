'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { AdminBusinessListingType } from '@apnatown/shared/admin';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { useAdmin } from '../AdminShell';
import { useListingError } from './parts';
import { listingReportOptions } from './queries';
import { ReportCard } from './ReportCard';

/** `?reportId=` deep link (overview alert / notification): one report with
 * resolve/dismiss, plus a way into its listing for any listing action. */
export function ReportSheet({
  reportId,
  onClose,
  onOpenListing,
}: {
  reportId: string;
  onClose: () => void;
  onOpenListing: (target: {
    type: AdminBusinessListingType;
    id: string;
  }) => void;
}) {
  const context = useAdmin();
  const t = useTranslations('admin.listings');
  const ts = useTranslations('admin.state');
  const message = useListingError();
  const report = useQuery(listingReportOptions(context, reportId));
  const data = report.data;

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={t('reports.sheetTitle')}
      closeLabel={t('close')}
      footer={
        data ? (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() =>
                onOpenListing({ type: data.targetType, id: data.targetId })
              }
            >
              {t('reports.openListing')}
            </Button>
          </div>
        ) : undefined
      }
    >
      {report.isPending ? (
        <Skeleton label={ts('loading')} />
      ) : data ? (
        <ReportCard key={data.version} report={data} headingLevel="h3" />
      ) : (
        <ErrorState
          headingLevel="h2"
          title={t('reports.loadErrorTitle')}
          message={message(failureCode(report.error))}
          action={
            <Button
              loading={report.isFetching}
              onClick={() => void report.refetch()}
            >
              {ts('retry')}
            </Button>
          }
        />
      )}
    </Sheet>
  );
}
