'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { ErrorState, NoPermissionState, OfflineState } from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../shared/api/result';
import { NavIcon } from '../../shared/ui/NavIcon';

const deniedCodes = ['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE', 'SESSION_EXPIRED'];
const invalidCodes = ['SEARCH_FILTER_INVALID', 'COMMON_VALIDATION_FAILED'];

/** One-line status for small regions (suggestions, popular terms). Text always
 * carries the meaning; the icon is decorative. */
export function SearchNotice({
  tone = 'info', role, children, action,
}: {
  tone?: 'info' | 'error';
  role?: 'status' | 'alert' | undefined;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div role={role} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-2">
      <NavIcon name="info" className={`size-4 shrink-0 ${tone === 'error' ? 'text-error' : 'text-info'}`} />
      <p className="m-0 min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</p>
      {action}
    </div>
  );
}

export function SearchFailure({
  error,
  retry,
  busy = false,
  reset,
  chooseLocation,
  compact = false,
}: {
  error: unknown;
  retry: () => void;
  busy?: boolean;
  reset?: (() => void) | undefined;
  chooseLocation?: (() => void) | undefined;
  compact?: boolean;
}) {
  const t = useTranslations('search.screen');
  const permission = useTranslations('common.noPermission');
  const code = failureCode(error);
  const retryButton = (
    <Button variant={compact ? 'text' : 'primary'} size={compact ? 'card' : 'default'}
      loading={busy} disabled={busy} onClick={retry}>{t('retry')}</Button>
  );
  if (deniedCodes.includes(code))
    return compact
      ? <SearchNotice role="alert" tone="error">{permission('message')}</SearchNotice>
      : <NoPermissionState headingLevel="h2" title={permission('title')}
          message={permission('message')} action={null} />;
  const invalid = invalidCodes.includes(code);
  const location = code === 'SEARCH_LOCATION_REQUIRED';
  if (compact)
    return <SearchNotice role="alert" tone="error" action={retryButton}>{t('errorMessage')}</SearchNotice>;
  return (
    <ErrorState
      headingLevel="h2"
      title={t(location ? 'locationRequired' : invalid ? 'invalidFilters' : 'errorTitle')}
      message={t(location ? 'locationMessage' : invalid ? 'invalidFiltersMessage' : 'errorMessage')}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {location && chooseLocation
            ? <Button onClick={chooseLocation}>{t('chooseLocation')}</Button>
            : retryButton}
          {reset && <Button variant="outline" onClick={reset}>{t('clearFilters')}</Button>}
        </div>
      }
    />
  );
}

export function SearchOffline({
  retry, busy = false, compact = false,
}: {
  retry?: (() => void) | undefined;
  busy?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations('search.screen');
  if (compact) return <SearchNotice role="status">{t('offlineMessage')}</SearchNotice>;
  return <OfflineState headingLevel="h2" title={t('offlineTitle')}
    message={t('offlineMessage')}
    action={retry ? <Button loading={busy} disabled={busy} onClick={retry}>{t('retry')}</Button> : null} />;
}
