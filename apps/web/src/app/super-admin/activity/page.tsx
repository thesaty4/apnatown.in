import { Suspense } from 'react';
import { AuditScreen } from '../../../features/admin/audit/AuditList';
import { hydrateAuditFirstPage } from '../../../features/admin/audit/server';
import {
  readAuditFilters,
  recordReader,
} from '../../../features/admin/audit/filters';

/** S-SUPR-08: private no-store SSR first page, then client search/paging. */
export default async function SuperAdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = readAuditFilters(
    recordReader(await searchParams),
    'activity',
  );
  const { initial, owner } = await hydrateAuditFirstPage('activity', filters);
  return (
    <Suspense>
      <AuditScreen section="activity" initial={initial} owner={owner} />
    </Suspense>
  );
}
