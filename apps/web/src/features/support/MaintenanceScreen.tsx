'use client';

import { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { MaintenanceState } from '@apnatown/ui/feedback/StateViews';
import { useSession } from '../../shared/auth/SessionProvider';
import { safeReturnPath } from '../../shared/api/maintenance';
import { publicHref } from '../../shared/i18n/preferences';
import { healthOptions } from './api';

type Outcome = 'idle' | 'checking' | 'maintenance' | 'failed';

/** S-CUST-37: Check again is an explicit no-store `/health` probe. `ok` retries
 * the validated intended GET route once; maintenance/failure stay here. */
export function MaintenanceScreen() {
  const t = useTranslations();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const from = safeReturnPath(useSearchParams().get('from'));
  const { api } = useSession();
  const client = useQueryClient();
  const [outcome, setOutcome] = useState<Outcome>('idle');
  const retried = useRef(false);

  async function check() {
    if (outcome === 'checking' || retried.current) return;
    setOutcome('checking');
    try {
      const health = await client.fetchQuery({
        ...healthOptions(api),
        staleTime: 0,
      });
      if (health.status !== 'ok') return setOutcome('maintenance');
      retried.current = true;
      // A full GET navigation so the server re-admits the page; never a POST.
      window.location.replace(from ?? publicHref('/', locale));
    } catch {
      setOutcome('failed');
    }
  }

  const busy = outcome === 'checking' || retried.current;
  return (
    <MaintenanceState
      title={t('common.maintenance.title')}
      message={t('common.maintenance.message')}
      action={
        <div className="grid justify-items-center gap-2">
          <Button onClick={() => void check()} disabled={busy} aria-busy={busy}>
            {busy
              ? t('system.maintenance.checking')
              : t('common.actions.checkAgain')}
          </Button>
          <p
            role="status"
            aria-live="polite"
            className="max-w-state-copy text-small text-text-2"
          >
            {outcome === 'maintenance'
              ? t('system.maintenance.still')
              : outcome === 'failed'
                ? t('system.maintenance.failed')
                : ''}
          </p>
        </div>
      }
    />
  );
}
