import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import {
  EmptyState,
  NotFoundState,
  OfflineState,
  MaintenanceState,
  ErrorState,
} from '@apnatown/ui/feedback/StateViews';
import { publicHref } from '../i18n/preferences';
import { RetryButton } from './RetryButton';

const states = {
  empty: EmptyState,
  notFound: NotFoundState,
  offline: OfflineState,
  maintenance: MaintenanceState,
  error: ErrorState,
};

export async function SystemShell({ kind }: { kind: keyof typeof states }) {
  const t = await getTranslations('common');
  const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
  const State = states[kind];
  return (
    <State
      title={t(kind === 'error' ? 'error.snag' : `${kind}.title`)}
      message={t(kind === 'offline' ? 'error.message' : `${kind}.message`)}
      action={
        kind === 'notFound' ? (
          <Link href={publicHref('/', locale)} className={buttonClassName}>
            {t('actions.home')}
          </Link>
        ) : (
          <RetryButton>
            {t(
              kind === 'maintenance' || kind === 'empty'
                ? 'actions.checkAgain'
                : 'actions.retry',
            )}
          </RetryButton>
        )
      }
    />
  );
}
