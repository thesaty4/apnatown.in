'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  E164Schema,
  SupportMessageTextSchema,
} from '@apnatown/shared/settings';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { failureCode } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import {
  callHref,
  publicSettingsOptions,
  sendSupportMessage,
  whatsappHref,
} from './api';

const errorKey = (code: string) =>
  ({
    VALIDATION_ERROR: 'invalid',
    COMMON_VALIDATION_FAILED: 'invalid',
    COMMON_RATE_LIMITED: 'rateLimited',
    RATE_LIMITED: 'rateLimited',
    COMMON_CONFLICT: 'inProgress',
    IDEMPOTENCY_CONFLICT: 'inProgress',
    MAINTENANCE: 'maintenance',
  })[code] ?? 'failed';

function ContactAction({
  kind,
  e164,
  state,
}: {
  kind: 'call' | 'whatsapp';
  e164: string | null | undefined;
  state: 'loading' | 'error' | 'ready';
}) {
  const t = useTranslations('help.contact');
  const valid = e164 && E164Schema.safeParse(e164).success ? e164 : undefined;
  const label = t(kind);
  if (valid)
    return kind === 'call' ? (
      <a className={`${buttonClassName} grow`} href={callHref(valid)}>
        <span aria-hidden="true">📞</span> {label}
      </a>
    ) : (
      <a
        className={`${buttonClassName} grow`}
        href={whatsappHref(valid)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span aria-hidden="true">💬</span> {label}
        <span className="sr-only"> {t('newWindow')}</span>
      </a>
    );
  const id = `support-${kind}-unavailable`;
  return (
    <div className="grid grow gap-1">
      <Button variant="outline" disabled aria-describedby={id}>
        {label}
      </Button>
      <p id={id} className="text-small text-muted">
        {state === 'loading'
          ? t('checking')
          : state === 'error'
            ? t('loadFailed')
            : t(`${kind}Unavailable`)}
      </p>
    </div>
  );
}

/** S-CUST-30 message-only support intake for guests and signed-in users. */
export function SupportForm() {
  const t = useTranslations('help');
  const { api } = useSession();
  const online = useOnline();
  const keys = useIdempotencyKey();
  const [message, setMessage] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [notice, setNotice] = useState<string>();
  const settings = useQuery(publicSettingsOptions(api));
  const send = useMutation({
    mutationFn: (input: { message: string; key: string }) =>
      sendSupportMessage(api, input),
    retry: false,
    networkMode: 'always',
  });
  const code = send.isError ? failureCode(send.error) : undefined;
  const support = settings.data?.support;
  const contactState = settings.isPending
    ? 'loading'
    : settings.isError
      ? 'error'
      : 'ready';

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(undefined);
    const parsed = SupportMessageTextSchema.safeParse(message);
    setInvalid(!parsed.success);
    if (!parsed.success || !online || send.isPending) {
      if (!parsed.success) document.getElementById('support-message')?.focus();
      return;
    }
    const text = parsed.data;
    send.reset();
    // One key per message text: a retry of the same draft replays.
    send.mutate(
      { message: text, key: keys.for(text) },
      {
        onSuccess: () => {
          keys.clear();
          setMessage('');
          setNotice(t('form.sent'));
        },
      },
    );
  };

  return (
    <Card padded className="grid gap-4">
      <h2 className="text-h3">{t('form.title')}</h2>
      {!online && (
        <p
          role="status"
          className="flex gap-2 rounded-md border border-warning bg-warning-soft p-3 text-text"
        >
          <span aria-hidden="true">📡</span>
          <span>{t('form.offline')}</span>
        </p>
      )}
      <form noValidate className="grid gap-3" onSubmit={submit}>
        <TextArea
          id="support-message"
          label={t('form.message')}
          rows={5}
          maxLength={1000}
          required
          value={message}
          error={invalid ? t('form.errors.empty') : undefined}
          onChange={(event) => {
            setMessage(event.target.value);
            setNotice(undefined);
          }}
        />
        {code && (
          <p
            role="alert"
            className="flex gap-2 rounded-md border border-error bg-error-soft p-3 text-text"
          >
            <span aria-hidden="true">⚠️</span>
            <span>{t(`form.errors.${errorKey(code)}`)}</span>
          </p>
        )}
        <Button
          type="submit"
          disabled={!online || send.isPending}
          aria-busy={send.isPending}
        >
          {send.isPending ? t('form.sending') : t('form.send')}
        </Button>
      </form>
      <p role="status" className="min-h-0">
        {notice && (
          <span className="inline-flex gap-2 rounded-md bg-success-soft px-3 py-2 text-text">
            <span aria-hidden="true">✓</span>
            {notice}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        <ContactAction
          kind="call"
          e164={support?.callPhoneE164}
          state={contactState}
        />
        <ContactAction
          kind="whatsapp"
          e164={support?.whatsappPhoneE164}
          state={contactState}
        />
      </div>
      {settings.isError && (
        <Button
          variant="text"
          className="justify-self-start"
          disabled={settings.isFetching}
          onClick={() => void settings.refetch()}
        >
          {t('contact.retry')}
        </Button>
      )}
    </Card>
  );
}
