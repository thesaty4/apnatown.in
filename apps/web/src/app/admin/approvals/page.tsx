import { Suspense } from 'react';
import { ApprovalQueueScreen } from '../../../features/admin/approvals/ApprovalQueue';
import { readApprovalFilters } from '../../../features/admin/approvals/filters';
import { hydrateApprovalQueue } from '../../../features/admin/approvals/server';

/** S-ADMN-02 queue: private no-store SSR first page, then client paging. */
export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = readApprovalFilters((name) => params[name]);
  const { initial, owner } = await hydrateApprovalQueue(filters);
  return (
    <Suspense>
      <ApprovalQueueScreen initial={initial} owner={owner} />
    </Suspense>
  );
}
