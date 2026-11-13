import { notFound } from 'next/navigation';
import { DesignSystem } from '../../../../features/support/DesignSystem';
import { noindex } from '../../../../features/support/metadata';
import { getWebEnvironment } from '../../../../shared/config/server';

// Internal design QA only (S-CUST-38): never served in production.
export const metadata = noindex;

export default function DesignSystemPage() {
  if (getWebEnvironment().APP_ENV === 'production') notFound();
  return <DesignSystem />;
}
