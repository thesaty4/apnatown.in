import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AdminApprovalParamsSchema } from '@apnatown/shared/admin';
import { ApprovalDetailScreen } from '../../../../../features/admin/approvals/ApprovalDetail';
import { hydrateApprovalDetail } from '../../../../../features/admin/approvals/server';

/** S-ADMN-02 detail: only shipped types (business/provider) and UUID ids. */
export default async function AdminApprovalDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const parsed = AdminApprovalParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const { type, id } = parsed.data;
  const { initial, owner } = await hydrateApprovalDetail(type, id);
  return (
    <Suspense>
      <ApprovalDetailScreen
        type={type}
        id={id}
        initial={initial}
        owner={owner}
      />
    </Suspense>
  );
}
