'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from '@apnatown/shared/notifications';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { OfflineState } from '@apnatown/ui/feedback/StateViews';
import { Toggle } from '@apnatown/ui/primitives/Selection';
import { Failure } from '../../shared/auth/AccessState';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import type { OwnContext } from '../users/OwnResource';
import type { PreferencesBody } from './api';
import { useChannelError } from './channel-errors';
import { ConsentAckDialog } from './ConsentAckDialog';
import {
  useNotificationPreferences,
  useSaveNotificationPreferences,
} from './preference-queries';
import { UnsubscribeMarketing } from './UnsubscribeMarketing';

type Key = NotificationPreferenceKey;
const channelKeys = ['inapp', 'email'] as const satisfies readonly Key[];
const whatsappKeys = [
  'wa_orders',
  'wa_offers',
  'wa_enq',
] as const satisfies readonly Key[];
const labelKeys: Record<Key, string> = {
  inapp: 'inapp',
  email: 'email',
  wa_orders: 'waOrders',
  wa_offers: 'waOffers',
  wa_enq: 'waEnq',
};
/** Consent pair per key (shared schema / BE `PREFERENCE_PAIRS`); used when
 * the DTO omits a consent row so an acknowledgement can still be sent. */
const pairs = {
  inapp: { purpose: 'marketing', channel: 'in_app' },
  email: { purpose: 'marketing', channel: 'email' },
  wa_orders: { purpose: 'order_updates', channel: 'whatsapp' },
  wa_offers: { purpose: 'marketing', channel: 'whatsapp' },
  wa_enq: { purpose: 'enquiry_updates', channel: 'whatsapp' },
} as const satisfies Record<Key, { purpose: string; channel: string }>;
const isWhatsapp = (key: Key) => pairs[key].channel === 'whatsapp';

/**
 * S-CUST-23 channel section inside the users-owned `/account/preferences`.
 * Toggles are preferences/consent only: no channel availability flag exists,
 * so nothing here promises that an email or WhatsApp message will be sent.
 */
export function ChannelPreferences(context: OwnContext) {
  const t = useTranslations('notifications.channels');
  const online = useOnline();
  const query = useNotificationPreferences(context);
  let body;
  if (query.isPending)
    body =
      query.fetchStatus === 'paused' || !online ? (
        <OfflineState
          headingLevel="h2"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={null}
        />
      ) : (
        <Skeleton label={t('loading')} className="h-40" />
      );
  else if (query.isError && !query.data)
    body = (
      <Failure
        headingLevel="h2"
        code={failureCode(query.error)}
        retry={() => void query.refetch()}
        retryDisabled={query.isFetching}
      />
    );
  else
    body = (
      <ChannelForm context={context} preferences={query.data} online={online} />
    );
  return (
    <section aria-label={t('sectionLabel')} className="grid gap-3">
      {body}
    </section>
  );
}

function ChannelForm({
  context,
  preferences,
  online,
}: {
  context: OwnContext;
  preferences: NotificationPreferences;
  online: boolean;
}) {
  const t = useTranslations('notifications.channels');
  const format = useFormatter();
  const message = useChannelError();
  const mutation = useSaveNotificationPreferences(context);
  const [last, setLast] = useState<{
    key: Key;
    value: boolean;
    ack: boolean;
  }>();
  const [ackKey, setAckKey] = useState<Key>();
  const [saved, setSaved] = useState(false);
  const notice = preferences.currentNoticeVersion;
  const consent = (key: Key) =>
    preferences.consents.find((item) => item.key === key);
  const granted = (key: Key) => consent(key)?.granted === true;
  // A WhatsApp switch is shown on only with BOTH the preference and a live
  // grant, even if a stale/legacy DTO says otherwise (fail closed).
  const effective = (key: Key) =>
    preferences[key] && (!isWhatsapp(key) || granted(key));
  // Every WhatsApp enable goes through the explicit acknowledgement; other
  // keys only when the server marks them required and ungranted.
  const needsAck = (key: Key) =>
    isWhatsapp(key) || (consent(key)?.required === true && !granted(key));
  // Without a current notice, enabling is impossible unless a live grant
  // already exists (then no acknowledgement is required by the API).
  const unavailable = (key: Key) =>
    !effective(key) && needsAck(key) && notice === null && !granted(key);
  const code = mutation.isError ? failureCode(mutation.error) : undefined;
  // A 422 on a plain enable asks for the explicit acknowledgement instead.
  const dialogKey =
    ackKey ??
    (code === 'CONSENT_REQUIRED' && last?.value && !last.ack && notice
      ? last.key
      : undefined);

  function submit(key: Key, value: boolean, ack: boolean) {
    if (mutation.isPending) return;
    const pair = consent(key) ?? pairs[key];
    setLast({ key, value, ack });
    setSaved(false);
    mutation.reset();
    const body: PreferencesBody = {
      expectedVersion: preferences.version,
      ...(ack &&
        value &&
        notice && {
          consentAcknowledgements: [
            {
              purpose: pair.purpose,
              channel: pair.channel,
              noticeVersion: notice,
            },
          ],
        }),
    };
    body[key] = value; // Only the changed key, never a blanket payload.
    void mutation
      .run(body, () => setSaved(true))
      // Success or failure closes the dialog; a failure is shown inline.
      .then(() => setAckKey(undefined));
  }
  function change(key: Key, value: boolean) {
    if (value && needsAck(key)) {
      if (notice === null) {
        // Live grant but no current notice: the API needs no ack here.
        if (granted(key)) submit(key, true, false);
        return;
      }
      mutation.reset();
      setAckKey(key);
      return;
    }
    submit(key, value, false);
  }

  const toggle = (key: Key) => (
    <Toggle
      key={key}
      label={t(`labels.${labelKeys[key]}`)}
      {...(unavailable(key) && { description: t('noticeUnavailable') })}
      checked={effective(key)}
      disabled={mutation.isPending || !online || unavailable(key)}
      aria-busy={mutation.isPending && last?.key === key}
      onChange={(event) => change(key, event.target.checked)}
    />
  );
  const recordedAt = preferences.consents
    .filter((item) => item.channel === 'whatsapp' && item.recordedAt)
    .map((item) => item.recordedAt as string)
    .sort()
    .at(-1);

  return (
    <>
      <Card padded className="grid gap-2">
        <h2 className="m-0 text-h3">{t('channelsTitle')}</h2>
        {channelKeys.map(toggle)}
      </Card>
      <Card padded className="grid gap-2">
        <h2 className="m-0 text-h3">{t('whatsappTitle')}</h2>
        <p className="m-0 rounded-md border border-info bg-info-soft p-3 text-small text-text">
          <span aria-hidden="true">ℹ </span>
          {t('whatsappNotice')}
        </p>
        {whatsappKeys.map(toggle)}
        <p className="m-0 text-caption text-muted">
          {recordedAt
            ? t('recordedAt', {
                time: format.dateTime(new Date(recordedAt), {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'Asia/Kolkata',
                }),
              })
            : t('neverRecorded')}
        </p>
      </Card>
      <p className="m-0 text-caption text-muted">{t('choiceOnly')}</p>
      {!online && (
        <p role="status" className="m-0 text-small text-text-2">
          {t('offlineMessage')}
        </p>
      )}
      <p role="status" className="m-0 text-small text-text-2 empty:hidden">
        {mutation.isPending ? t('saving') : saved ? `✓ ${t('saved')}` : ''}
      </p>
      {code && !dialogKey && (
        <p role="alert" className="m-0 text-small text-error">
          {message(code)}
        </p>
      )}
      <UnsubscribeMarketing
        context={context}
        version={preferences.version}
        disabled={mutation.isPending || !online}
      />
      {dialogKey && notice && (
        <ConsentAckDialog
          open
          label={t(`labels.${labelKeys[dialogKey]}`)}
          noticeVersion={notice}
          busy={mutation.isPending}
          onCancel={() => {
            setAckKey(undefined);
            mutation.reset();
          }}
          onConfirm={() => submit(dialogKey, true, true)}
        />
      )}
    </>
  );
}
