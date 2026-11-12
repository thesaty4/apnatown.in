'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import type {
  ConsentChannel,
  ConsentChoice,
  ConsentPurpose,
} from '@apnatown/shared/users';
import { Card } from '@apnatown/ui/cards/Card';
import { Toggle } from '@apnatown/ui/primitives/Selection';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { Failure, failureMessageKey } from '../../shared/auth/AccessState';
import { failureCode } from '../../shared/api/result';
import type { OwnContext } from './OwnResource';
import { InlineAlert } from './address-parts';
import { consentsOptions } from './consent-api';
import { useSaveConsent } from './consent-queries';

const purposeKeys: Record<ConsentPurpose, string> = {
  marketing: 'marketing',
  order_updates: 'orderUpdates',
  enquiry_updates: 'enquiryUpdates',
};
const channelKeys: Record<ConsentChannel, string> = {
  in_app: 'inApp',
  email: 'email',
  whatsapp: 'whatsapp',
};
// Repeating the same request cannot succeed; the user must reload or re-login.
const noRetry = new Set([
  'CONSENT_PURPOSE_INVALID',
  'ACCOUNT_UNAVAILABLE',
  'SESSION_EXPIRED',
]);

export function Consents({ api, scope, lifecycle }: OwnContext) {
  const t = useTranslations('consent.preferences');
  const query = useQuery(consentsOptions(api, scope, lifecycle));
  const refresh = () => void query.refetch();
  let body;
  if (query.isPending) body = <Skeleton label={t('loading')} />;
  else if (query.isError)
    body = (
      <Failure
        code={failureCode(query.error)}
        retry={refresh}
        retryDisabled={query.isFetching}
      />
    );
  else if (query.data.items.length === 0)
    body = (
      <EmptyState
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={
          <Button disabled={query.isFetching} onClick={refresh}>
            {t('refresh')}
          </Button>
        }
      />
    );
  else {
    const notice = query.data.currentNoticeVersion;
    const groups = new Map<ConsentPurpose, ConsentChoice[]>();
    for (const item of query.data.items)
      groups.set(item.purpose, [...(groups.get(item.purpose) ?? []), item]);
    body = (
      <>
        {notice === null && (
          <p className="rounded-md border border-border bg-surface-2 p-3 text-small text-text-2">
            {t('noticeUnavailable')}
          </p>
        )}
        {[...groups].map(([purpose, items]) => (
          <Card key={purpose} padded className="grid gap-2">
            <h3 className="text-h3">
              {t(`purposes.${purposeKeys[purpose]}.title`)}
            </h3>
            <p className="text-small text-text-2">
              {t(`purposes.${purposeKeys[purpose]}.about`)}
            </p>
            {items.map((item) => (
              <ConsentToggle
                key={item.channel}
                item={item}
                notice={notice}
                refresh={refresh}
                refreshing={query.isFetching}
              />
            ))}
          </Card>
        ))}
      </>
    );
  }
  return (
    <section aria-labelledby="consent-title" className="grid gap-3">
      <h2 id="consent-title" className="text-h2">
        {t('title')}
      </h2>
      {body}
    </section>
  );
}

function ConsentToggle({
  item,
  notice,
  refresh,
  refreshing,
}: {
  item: ConsentChoice;
  notice: string | null;
  refresh: () => void;
  refreshing: boolean;
}) {
  const t = useTranslations('consent.preferences');
  const feedback = useTranslations('auth.feedback');
  const format = useFormatter();
  const mutation = useSaveConsent();
  const [intent, setIntent] = useState<boolean>();
  const [saved, setSaved] = useState(false);
  const pending = mutation.isPending;
  const code = mutation.isError ? failureCode(mutation.error) : undefined;
  // Opt-in needs the current notice; opt-out is always available.
  const blocked = (granted: boolean) => granted && notice === null;

  function save(granted: boolean) {
    if (pending || blocked(granted)) return;
    setIntent(granted);
    setSaved(false);
    mutation.reset();
    void mutation.run(
      {
        purpose: item.purpose,
        channel: item.channel,
        granted,
        noticeVersion: notice,
      },
      () => {
        mutation.reset();
        setSaved(true);
      },
    );
  }

  const label = t(
    `purposes.${purposeKeys[item.purpose]}.${channelKeys[item.channel]}`,
  );
  const evidence = item.recordedAt
    ? t('recordedAt', {
        time: format.dateTime(new Date(item.recordedAt), {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }),
      })
    : t('neverRecorded');
  const message =
    code === undefined
      ? undefined
      : code === 'CONSENT_NOTICE_INVALID'
        ? t('errors.noticeChanged')
        : code === 'CONSENT_PURPOSE_INVALID'
          ? t('errors.purposeInvalid')
          : noRetry.has(code)
            ? feedback(failureMessageKey(code))
            : t('errors.saveFailed');
  const canRetry =
    code !== undefined &&
    code !== 'CONSENT_NOTICE_INVALID' &&
    !noRetry.has(code) &&
    intent !== undefined &&
    !blocked(intent);

  return (
    <div className="grid gap-2 border-t border-border pt-2">
      <Toggle
        label={label}
        description={`${t(item.granted ? 'granted' : 'notGranted')} · ${evidence}`}
        checked={item.granted}
        disabled={pending || blocked(!item.granted)}
        aria-busy={pending}
        onChange={(event) => save(event.target.checked)}
      />
      <p role="status" className="text-small text-text-2">
        {pending ? t('saving') : saved ? `✓ ${t('saved')}` : ''}
      </p>
      {message && (
        <InlineAlert
          message={message}
          action={
            canRetry ? (
              <Button
                disabled={pending}
                onClick={() => intent !== undefined && save(intent)}
              >
                {t('retry')}
              </Button>
            ) : (
              <Button
                variant="ghost"
                disabled={refreshing}
                onClick={() => {
                  mutation.reset();
                  refresh();
                }}
              >
                {t('refresh')}
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
