'use client';

import Link from 'next/link';
import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  EmptyState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { accountScope } from '../../shared/api/query-keys';
import { AccessState } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { loginHref } from '../../shared/auth/return-to';
import { SavedNavigation } from './SavedNavigation';
import { SavedList } from './SavedList';
import { savedHref, savedRequest, type SavedView } from './saved-state';

export function SavedScreen({
  view,
  initial,
  owner,
}: {
  view: SavedView;
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const t = useTranslations('engagement.saved');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { state, epoch } = useSession();
  const request = savedRequest(view);
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      <SavedNavigation view={view} />
      <div
        id="saved-panel"
        role="tabpanel"
        aria-labelledby={`saved-tab-${view.tab}`}
        tabIndex={0}
      >
        {state.kind !== 'ready' ? (
          state.kind === 'error' && state.code === 'SESSION_EXPIRED' ? (
            <EmptyState
              title={t('guestTitle')}
              message={t('guestMessage')}
              action={
                <Link
                  className={buttonClassName}
                  href={loginHref(locale, savedHref(view))}
                >
                  {t('login')}
                </Link>
              }
            />
          ) : (
            <AccessState guest />
          )
        ) : !state.data.roles.includes('customer') ? (
          <NoPermissionState
            title={t('restrictedTitle')}
            message={t('restrictedMessage')}
            action={null}
          />
        ) : !request ? (
          <EmptyState
            title={t('notReadyTitle')}
            message={t('notReadyMessage')}
            action={null}
          />
        ) : (
          <HydrationBoundary
            state={
              owner === state.data.userId && epoch === 0 ? initial : undefined
            }
          >
            <SavedList
              key={`${state.data.userId}:${epoch}:${view.tab}:${view.media}`}
              scope={accountScope(state.data, epoch)}
              request={request}
            />
          </HydrationBoundary>
        )}
      </div>
    </div>
  );
}
