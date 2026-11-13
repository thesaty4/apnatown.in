import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminArea } from '../../features/admin/AdminArea';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminArea section="super">{children}</AdminArea>;
}
