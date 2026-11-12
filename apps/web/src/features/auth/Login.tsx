'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Input } from '@apnatown/ui/primitives/Input';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { useSession } from '../../shared/auth/SessionProvider';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { landing, loginHref } from '../../shared/auth/return-to';
import { publicHref } from '../../shared/i18n/preferences';
import { OtpInput } from './OtpInput';
import { remainingSeconds } from './otp';
import { useLogin } from './use-login';

export function Login({ returnTo }: { returnTo?: string | undefined }) {
  const { state } = useSession();
  const [active, setActive] = useState(false);
  const t = useTranslations('auth.login');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  if (active)
    return <LoginForm returnTo={returnTo} onBegin={() => setActive(true)} />;
  if (state.kind === 'loading') return <Skeleton label={t('loading')} />;
  if (state.kind === 'error' && state.code !== 'SESSION_EXPIRED')
    return <AccessState />;
  if (state.kind === 'ready')
    return (
      <Card padded className="mx-auto grid max-w-state-copy gap-4">
        <h1 className="text-h1">{t('signedIn')}</h1>
        <Link
          className={buttonClassName}
          href={landing(state.data, returnTo, locale)}
        >
          {t('continue')}
        </Link>
        <Link className="min-h-touch underline" href="/account">
          {t('account')}
        </Link>
      </Card>
    );
  return <LoginForm returnTo={returnTo} onBegin={() => setActive(true)} />;
}

function LoginForm({
  returnTo,
  onBegin,
}: {
  returnTo?: string | undefined;
  onBegin: () => void;
}) {
  const flow = useLogin(returnTo);
  const t = useTranslations('auth.login');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const wait = flow.challenge
    ? remainingSeconds(flow.challenge.resendAfter, now)
    : 0;
  const expired =
    flow.challenge && remainingSeconds(flow.challenge.expiresAt, now) === 0;
  const stopped =
    expired ||
    [
      'OTP_LOCKED',
      'OTP_EXPIRED',
      'OTP_NOT_FOUND',
      'ACCOUNT_UNAVAILABLE',
    ].includes(flow.error ?? '');
  if (flow.verified)
    return flow.error ? (
      <Failure
        code={flow.error}
        retry={
          [
            'SESSION_EXPIRED',
            'SESSION_CHANGED',
            'ACCOUNT_UNAVAILABLE',
          ].includes(flow.error)
            ? () => window.location.replace(loginHref(locale, returnTo))
            : flow.finish
        }
      />
    ) : (
      <Skeleton label={t('loading')} />
    );
  return (
    <Card padded className="mx-auto grid max-w-state-copy gap-4">
      <header className="grid gap-2 text-center">
        <span aria-hidden="true" className="text-h1">
          📱
        </span>
        <h1 className="text-h1">{t(flow.challenge ? 'enterCode' : 'title')}</h1>
        <p className="text-text-2">
          {t(flow.challenge ? 'codeSent' : 'intro')}
        </p>
      </header>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onBegin();
          if (flow.challenge && stopped) return;
          if (flow.challenge) flow.verify();
          else flow.requestCode();
        }}
      >
        {flow.challenge ? (
          <>
            <Button disabled={flow.busy} onClick={flow.changeNumber}>
              {t('changeNumber')}
            </Button>
            <OtpInput
              key={flow.challenge.challengeId}
              digits={flow.digits}
              onChange={flow.setDigits}
              disabled={flow.busy}
              invalid={Boolean(flow.error)}
            />
            {expired && (
              <p role="status" className="text-error">
                {t('expired')}
              </p>
            )}
          </>
        ) : (
          <Input
            label={t('phone')}
            hint={t('phoneHint')}
            prefix={t('countryCode')}
            className="flex-1 basis-0"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={flow.phone}
            disabled={flow.busy}
            required
            error={
              flow.error === 'PHONE_INVALID' ? t('invalidPhone') : undefined
            }
            onChange={(event) => flow.setPhone(event.target.value)}
          />
        )}
        {flow.error === 'CODE_INCOMPLETE' && (
          <p role="alert" className="text-error">
            {t('incompleteCode')}
          </p>
        )}
        <Button
          type="submit"
          loading={flow.busy}
          disabled={Boolean(flow.challenge && stopped)}
        >
          {t(flow.challenge ? 'verify' : 'send')}
        </Button>
      </form>
      {flow.error &&
        !['PHONE_INVALID', 'CODE_INCOMPLETE'].includes(flow.error) && (
          <Failure
            code={flow.error}
            retryDisabled={flow.busy || Boolean(stopped && wait > 0)}
            retry={() => {
              if (flow.error === 'ACCOUNT_UNAVAILABLE') flow.changeNumber();
              else if (flow.challenge && stopped) flow.requestCode();
              else if (flow.challenge) {
                flow.clearError();
                document
                  .querySelector<HTMLInputElement>(
                    'input[autocomplete="one-time-code"]',
                  )
                  ?.focus();
              } else flow.requestCode();
            }}
          />
        )}
      {flow.challenge ? (
        <Button disabled={flow.busy || wait > 0} onClick={flow.requestCode}>
          {wait > 0 ? t('resendWait', { seconds: wait }) : t('resend')}
        </Button>
      ) : (
        <>
          <Button disabled>{t('email')}</Button>
          <Button disabled>{t('google')}</Button>
          <p className="text-small text-muted">{t('alternativeUnavailable')}</p>
          <p className="text-small text-muted">{t('legalUnavailable')}</p>
        </>
      )}
      <p role="status" className="sr-only">
        {flow.challenge && wait === 0 ? t('resendReady') : ''}
      </p>
      <Link
        href={publicHref('/', locale)}
        className="min-h-touch text-center underline"
      >
        {t('guest')}
      </Link>
    </Card>
  );
}
