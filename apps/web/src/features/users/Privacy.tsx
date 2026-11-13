'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type {
  DataRequestFailureCode,
  DataRequestStatus,
} from '@apnatown/shared/users';
import { Card } from '@apnatown/ui/cards/Card';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useSession } from '../../shared/auth/SessionProvider';
import { failureMessageKey } from '../../shared/auth/AccessState';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { failureCode } from '../../shared/api/result';
import {
  accountScope,
  queryKeys,
  type AccountScope,
} from '../../shared/api/query-keys';
import { publicHref } from '../../shared/i18n/preferences';
import { InlineAlert } from './address-parts';
import {
  dataExportOptions,
  dataRequestOptions,
  deletionCompletionOptions,
  isSettled,
} from './data-request-api';
import { useCreateDataRequest } from './data-request-queries';
import { markDeletionConfirmed } from './deletion-proof';

/** Active deletion flow. The completion capability lives only here, in memory. */
export type Deletion = {
  requestId: string;
  userId: string;
  token?: string | undefined;
  completed?: boolean;
};

const messages: Record<string, string> = {
  DATA_REQUEST_CONFLICT: 'errors.conflict',
  COMMON_CONFLICT: 'errors.inProgress',
  DATA_REQUEST_NOT_FOUND: 'errors.notFound',
  DATA_REQUEST_NOT_READY: 'export.notReady',
  DATA_EXPORT_EXPIRED: 'export.expired',
  COMMON_UNAVAILABLE: 'export.unavailable',
};

/** Localized privacy failure text; never server-provided messages. */
function useFailureMessage() {
  const t = useTranslations('privacy');
  const feedback = useTranslations('auth.feedback');
  return (code: string) => {
    const key = messages[code];
    return key ? t(key) : feedback(failureMessageKey(code));
  };
}

/** Status text always carries an icon and words, never colour alone. */
function Status({ icon, message }: { icon: string; message: string }) {
  return (
    <p role="status" className="flex gap-2 text-text-2">
      <span aria-hidden="true">{icon}</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{message}</span>
    </p>
  );
}

export function PrivacyActions({
  scope,
  onDeletionStarted,
}: {
  scope: AccountScope;
  onDeletionStarted: (deletion: Deletion) => void;
}) {
  const t = useTranslations('privacy');
  return (
    <Card padded className="grid gap-3">
      <h2 className="text-h3">{t('account.title')}</h2>
      <ExportAction scope={scope} />
      <DeleteAction userId={scope.userId} onStarted={onDeletionStarted} />
    </Card>
  );
}

function ExportAction({ scope }: { scope: AccountScope }) {
  const t = useTranslations('privacy');
  const message = useFailureMessage();
  const mutation = useCreateDataRequest();
  const keys = useIdempotencyKey();
  const [requestId, setRequestId] = useState<string>();
  const code = mutation.isError ? failureCode(mutation.error) : undefined;
  // The key is reused only when retrying this unacknowledged attempt.
  const request = () =>
    void mutation.run(
      { type: 'export', key: keys.for('export') },
      (accepted) => {
        keys.clear();
        mutation.reset();
        setRequestId(accepted.requestId);
      },
    );
  return (
    <div className="grid gap-2">
      <Button variant="ghost" loading={mutation.isPending} onClick={request}>
        <span aria-hidden="true">📄</span> {t('account.export')}
      </Button>
      {code && (
        <InlineAlert
          message={message(code)}
          action={
            <Button disabled={mutation.isPending} onClick={request}>
              {t('common.retry')}
            </Button>
          }
        />
      )}
      {requestId && (
        <ExportStatus
          key={requestId}
          scope={scope}
          requestId={requestId}
          requestAgain={request}
          requesting={mutation.isPending}
        />
      )}
    </div>
  );
}

function ExportStatus({
  scope,
  requestId,
  requestAgain,
  requesting,
}: {
  scope: AccountScope;
  requestId: string;
  requestAgain: () => void;
  requesting: boolean;
}) {
  const t = useTranslations('privacy');
  const message = useFailureMessage();
  const { api, lifecycle } = useSession();
  const query = useQuery(dataRequestOptions(api, scope, lifecycle, requestId));
  const [closed, setClosed] = useState(false);
  const check = () => void query.refetch();
  const again = (
    <Button disabled={requesting} onClick={requestAgain}>
      {t('common.requestAgain')}
    </Button>
  );
  let body;
  if (query.isPending)
    body = <Status icon="⏳" message={t('export.preparing')} />;
  else if (query.isError)
    body = (
      <InlineAlert
        message={`${t('errors.checkFailed')} ${message(failureCode(query.error))}`}
        action={
          <Button disabled={query.isFetching} onClick={check}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  else {
    const { status, failureCode: reason, downloadAvailable } = query.data;
    if (!isSettled(status))
      body = <Status icon="⏳" message={t('export.preparing')} />;
    else if (status === 'blocked')
      body = (
        <InlineAlert
          message={t(
            reason === 'POLICY_PENDING'
              ? 'export.policyPending'
              : 'export.blocked',
          )}
          action={
            <Button variant="ghost" disabled={query.isFetching} onClick={check}>
              {t('common.checkAgain')}
            </Button>
          }
        />
      );
    else if (status === 'failed')
      body = <InlineAlert message={t('export.failed')} action={again} />;
    else if (!downloadAvailable)
      body = <InlineAlert message={t('export.expired')} action={again} />;
    else
      body = (
        <>
          <Status icon="✅" message={t('export.ready')} />
          <Button variant="outline" onClick={() => setClosed(false)}>
            {t('export.view')}
          </Button>
          <Sheet
            open={!closed}
            onOpenChange={(open) => setClosed(!open)}
            title={t('export.sheetTitle')}
            closeLabel={t('common.close')}
            wide
          >
            {!closed && (
              <ExportDocument
                scope={scope}
                requestId={requestId}
                requestAgain={requestAgain}
                requesting={requesting}
              />
            )}
          </Sheet>
        </>
      );
  }
  return <div className="grid gap-2">{body}</div>;
}

function ExportDocument({
  scope,
  requestId,
  requestAgain,
  requesting,
}: {
  scope: AccountScope;
  requestId: string;
  requestAgain: () => void;
  requesting: boolean;
}) {
  const t = useTranslations('privacy');
  const message = useFailureMessage();
  const { api, lifecycle } = useSession();
  const query = useQuery(dataExportOptions(api, scope, lifecycle, requestId));
  const [copied, setCopied] = useState<'copied' | 'failed'>();
  if (query.isPending) return <Skeleton label={t('export.loading')} />;
  if (query.isError) {
    const code = failureCode(query.error);
    return (
      <InlineAlert
        message={message(code)}
        action={
          code === 'DATA_EXPORT_EXPIRED' ? (
            <Button disabled={requesting} onClick={requestAgain}>
              {t('common.requestAgain')}
            </Button>
          ) : (
            <Button
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t('common.retry')}
            </Button>
          )
        }
      />
    );
  }
  // Rendered as text only; the validated document is never interpreted as HTML.
  const text = JSON.stringify(query.data, null, 2);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('copied');
    } catch {
      setCopied('failed');
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `apnatown-data-${requestId}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return (
    <div className="grid gap-3">
      <p className="text-small text-text-2">{t('export.hint')}</p>
      <pre
        tabIndex={0}
        aria-label={t('export.documentLabel')}
        className="max-h-[50vh] overflow-auto rounded-md border border-border bg-surface-2 p-3 text-small whitespace-pre-wrap [overflow-wrap:anywhere] focus-visible:ring-focus"
      >
        <code>{text}</code>
      </pre>
      <div className="flex flex-wrap gap-2">
        <Button className="min-w-0 flex-1" onClick={() => void copy()}>
          {t('export.copy')}
        </Button>
        <Button variant="ghost" className="min-w-0 flex-1" onClick={download}>
          {t('export.download')}
        </Button>
      </div>
      <p role="status" className="text-small text-text-2">
        {copied === 'copied'
          ? `✓ ${t('export.copied')}`
          : copied === 'failed'
            ? `⚠️ ${t('export.copyFailed')}`
            : ''}
      </p>
    </div>
  );
}

function DeleteAction({
  userId,
  onStarted,
}: {
  userId: string;
  onStarted: (deletion: Deletion) => void;
}) {
  const t = useTranslations('privacy');
  const message = useFailureMessage();
  const mutation = useCreateDataRequest();
  const keys = useIdempotencyKey();
  const [confirm, setConfirm] = useState(false);
  const busy = mutation.isPending;
  const code = mutation.isError ? failureCode(mutation.error) : undefined;
  function submit() {
    void mutation.run(
      { type: 'delete', key: keys.for('delete') },
      (accepted) => {
        keys.clear();
        // Drop the response (and its capability) from the mutation cache.
        mutation.reset();
        setConfirm(false);
        onStarted({
          requestId: accepted.requestId,
          userId,
          token: accepted.completionToken,
        });
      },
    );
  }
  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          mutation.reset();
          setConfirm(true);
        }}
      >
        <span aria-hidden="true">🗑️</span> {t('account.delete')}
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t('delete.title')}
        impact={t('delete.impact')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('delete.confirm')}
        onConfirm={submit}
        busy={busy}
        tone="danger"
      >
        {code && (
          <InlineAlert
            message={message(code)}
            action={
              <Button disabled={busy} onClick={submit}>
                {t('common.retry')}
              </Button>
            }
          />
        )}
      </ConfirmDialog>
    </>
  );
}

type Progress = {
  status?: DataRequestStatus | undefined;
  reason?: DataRequestFailureCode | undefined;
  error?: string | undefined;
  checking: boolean;
  check: () => void;
};

/** Survives session revocation: rendered by Account outside the session gate. */
export function DeletionProgress({
  deletion,
  onCompleted,
  onDismiss,
}: {
  deletion: Deletion;
  onCompleted: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations('privacy');
  const { state, epoch } = useSession();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const owner =
    state.kind === 'ready' && state.data.userId === deletion.userId
      ? accountScope(state.data, epoch)
      : undefined;
  const view = (progress: Progress) => (
    <DeletionView
      progress={progress}
      requestId={deletion.requestId}
      canDismiss={owner !== undefined}
      onCompleted={onCompleted}
      onDismiss={onDismiss}
    />
  );
  let body;
  if (deletion.completed)
    body = <Status icon="✅" message={t('delete.completed')} />;
  else if (owner)
    body = (
      <OwnerProgress
        key={JSON.stringify(owner)}
        scope={owner}
        requestId={deletion.requestId}
      >
        {view}
      </OwnerProgress>
    );
  else if (deletion.token)
    body = (
      <CapabilityProgress requestId={deletion.requestId} token={deletion.token}>
        {view}
      </CapabilityProgress>
    );
  else body = <Unconfirmed />;
  return (
    <Card padded className="grid gap-3">
      <h2 ref={heading} tabIndex={-1} className="text-h3">
        {t('delete.heading')}
      </h2>
      {body}
    </Card>
  );
}

function OwnerProgress({
  scope,
  requestId,
  children,
}: {
  scope: AccountScope;
  requestId: string;
  children: (progress: Progress) => ReactNode;
}) {
  const { api, lifecycle } = useSession();
  const query = useQuery(dataRequestOptions(api, scope, lifecycle, requestId));
  return children({
    status: query.data?.status,
    reason: query.data?.failureCode,
    error: query.isError ? failureCode(query.error) : undefined,
    checking: query.isFetching,
    check: () => void query.refetch(),
  });
}

function CapabilityProgress({
  requestId,
  token,
  children,
}: {
  requestId: string;
  token: string;
  children: (progress: Progress) => ReactNode;
}) {
  const { api } = useSession();
  const query = useQuery(deletionCompletionOptions(api, requestId, token));
  const error = query.isError ? failureCode(query.error) : undefined;
  // An invalid/expired capability is indistinguishable from a missing request.
  if (error === 'DATA_REQUEST_NOT_FOUND') return <Unconfirmed />;
  return children({
    status: query.data?.status,
    error,
    checking: query.isFetching,
    check: () => void query.refetch(),
  });
}

function DeletionView({
  progress: { status, reason, error, checking, check },
  requestId,
  canDismiss,
  onCompleted,
  onDismiss,
}: {
  progress: Progress;
  requestId: string;
  canDismiss: boolean;
  onCompleted: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations('privacy');
  const message = useFailureMessage();
  const { lifecycle, broadcast } = useSession();
  const client = useQueryClient();
  const router = useRouter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const completed = status === 'completed';
  const finished = useRef(false);
  useEffect(() => {
    if (!completed || finished.current) return;
    finished.current = true;
    // Only a server-confirmed completion reaches /goodbye. Clear private
    // caches and the capability first; proof travels in memory, not the URL.
    markDeletionConfirmed();
    onCompleted();
    lifecycle.expire('SESSION_EXPIRED');
    client.removeQueries({
      queryKey: queryKeys.deletionCompletion(requestId),
    });
    broadcast();
    router.replace(publicHref('/goodbye', locale));
  }, [
    completed,
    onCompleted,
    lifecycle,
    client,
    requestId,
    broadcast,
    router,
    locale,
  ]);
  const back = canDismiss ? (
    <Button variant="ghost" onClick={onDismiss}>
      {t('common.back')}
    </Button>
  ) : (
    <Home />
  );
  if (error)
    return (
      <InlineAlert
        message={`${t('errors.checkFailed')} ${message(error)}`}
        action={
          <Button disabled={checking} onClick={check}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  if (status === 'blocked')
    return (
      <InlineAlert
        message={t(
          reason === 'POLICY_PENDING'
            ? 'delete.policyPending'
            : 'delete.blocked',
        )}
        action={
          <>
            <Button variant="ghost" disabled={checking} onClick={check}>
              {t('common.checkAgain')}
            </Button>
            {back}
          </>
        }
      />
    );
  if (status === 'failed')
    return <InlineAlert message={t('delete.failed')} action={back} />;
  if (completed) return <Status icon="✅" message={t('delete.completed')} />;
  return <Status icon="⏳" message={t('delete.processing')} />;
}

function Home() {
  const t = useTranslations('privacy');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (
    <Link className={buttonClassName} href={publicHref('/', locale)}>
      {t('common.home')}
    </Link>
  );
}

/** Never claims deletion without server confirmation for this browser. */
function Unconfirmed() {
  const t = useTranslations('privacy');
  return (
    <div className="grid gap-2">
      <Status icon="ℹ️" message={t('delete.unconfirmed')} />
      <div>
        <Home />
      </div>
    </div>
  );
}
