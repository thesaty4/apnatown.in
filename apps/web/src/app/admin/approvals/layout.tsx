import type { ReactNode } from 'react';
import { ApprovalsToastProvider } from '../../../features/admin/approvals/Toast';

/** Shared across queue → detail → next item, so a decision toast survives
 * the automatic navigation to the next pending application. */
export default function AdminApprovalsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ApprovalsToastProvider>{children}</ApprovalsToastProvider>;
}
