import { Suspense } from 'react';
import { AuditScreen } from '../../../features/admin/audit/AuditList';
import { hydrateAuditFirstPage } from '../../../features/admin/audit/server';
import {
  readAuditFilters,
  recordReader,
} from '../../../features/admin/audit/filters';

/** S-ADMN-16: private no-store SSR first page, then client search/paging. */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = readAuditFilters(recordReader(await searchParams), 'audit');
  const { initial, owner } = await hydrateAuditFirstPage('audit', filters);
  return (
    <Suspense>
      <AuditScreen section="audit" initial={initial} owner={owner} />
    </Suspense>
  );
}
