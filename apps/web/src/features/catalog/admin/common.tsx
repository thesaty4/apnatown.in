'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../../shared/api/result';
import { adminErrorKey, isDenied, useAdmin } from '../../admin';

type ReadLike = {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => unknown;
};

/**
 * Shared admin read states: skeleton, no-permission (re-checks authority),
 * error + retry and empty. Returns `null` when the caller renders data.
 */
export function useReadState(
  query: ReadLike,
  empty: boolean,
  emptyView: { title: string; message: string; action?: ReactNode },
): ReactNode {
  const t = useTranslations('catalog.admin.common');
  const te = useTranslations('admin.errors');
  const { recheck } = useAdmin();
  const code = query.isError ? failureCode(query.error) : undefined;
  useEffect(() => {
    if (code && isDenied(code)) recheck();
  }, [code, recheck]);
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (code && isDenied(code))
    return (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={t('forbidden')}
        action={<Button onClick={recheck}>{t('checkAgain')}</Button>}
      />
    );
  if (code && empty)
    return (
      <ErrorState
        title={t('errorTitle')}
        message={te(adminErrorKey(code))}
        action={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );
  if (empty)
    return (
      <EmptyState
        title={emptyView.title}
        message={emptyView.message}
        action={emptyView.action ?? null}
      />
    );
  return null;
}

export function ActiveBadge({ active }: { active: boolean }) {
  const t = useTranslations('catalog.admin.common');
  return (
    <Badge
      tone={active ? 'ap-approved' : 'ap-inactive'}
      icon={active ? '●' : '○'}
      label={t(active ? 'active' : 'inactive')}
    />
  );
}

/** Write boundary notice for admins without the global write (Q-39). */
export function ReadOnlyNotice({ message }: { message: string }) {
  return (
    <p className="flex gap-2 rounded-md border border-border bg-info-soft p-3 text-small text-text">
      <span aria-hidden="true">🔒</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{message}</span>
    </p>
  );
}

/** Form-level command error with localized text; values stay in the form. */
export function CommandError({ code }: { code: string | undefined }) {
  const te = useTranslations('admin.errors');
  if (!code) return null;
  return (
    <p
      role="alert"
      className="flex gap-2 rounded-md border border-error bg-error-soft p-3 text-text"
    >
      <span aria-hidden="true">⚠️</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {te(adminErrorKey(code))}
      </span>
    </p>
  );
}

export function SheetFooter({
  form,
  busy,
  onCancel,
  submitLabel,
  disabled = false,
}: {
  form: string;
  busy: boolean;
  onCancel: () => void;
  submitLabel: string;
  disabled?: boolean;
}) {
  const t = useTranslations('catalog.admin.common');
  return (
    <div className="flex items-center gap-row-gap">
      <Button
        variant="ghost"
        className="min-w-0 flex-1"
        disabled={busy}
        onClick={onCancel}
      >
        {t('cancel')}
      </Button>
      <Button
        type="submit"
        form={form}
        className="min-w-0 flex-1"
        loading={busy}
        disabled={disabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
