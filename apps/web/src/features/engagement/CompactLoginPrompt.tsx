'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLoginHref } from '../../shared/auth/AccessState';

/**
 * Inline guest affordance for card/detail actions. A full guest EmptyState
 * reads as a page error inside a card, so only the reason plus a login link
 * is rendered; the login returns to the current screen.
 */
export function CompactLoginPrompt({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  const t = useTranslations('auth.feedback');
  const href = useLoginHref();
  return (
    <p
      role="status"
      className={`m-0 text-small text-text-2 [overflow-wrap:anywhere] ${className ?? ''}`}
    >
      {message}{' '}
      <Link
        href={href}
        className="inline-flex min-h-touch items-center rounded-sm font-semibold text-primary underline focus-visible:ring-focus"
      >
        {t('login')}
      </Link>
    </p>
  );
}
