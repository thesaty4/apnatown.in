import type { Metadata } from 'next';
import { Login } from '../../../../features/auth/Login';
import { safeReturnTo } from '../../../../shared/auth/return-to';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <Login returnTo={safeReturnTo((await searchParams).returnTo)} />;
}
