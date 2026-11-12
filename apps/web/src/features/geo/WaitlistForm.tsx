'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { WaitlistRequestSchema, type City } from '@apnatown/shared/geo';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { useSession } from '../../shared/auth/SessionProvider';
import { failureCode } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useOnline } from '../../shared/hooks/use-online';
import { geoName, joinWaitlist } from './api';
import { GeoNote } from './parts';

const errors: Record<string, string> = {
  COMMON_RATE_LIMITED: 'rateLimited',
  RATE_LIMITED: 'rateLimited',
  COMMON_CONFLICT: 'waitlistInProgress',
  CITY_NOT_FOUND: 'waitlistCityGone',
  CSRF_INVALID: 'sessionInvalid',
  COMMON_FORBIDDEN: 'sessionInvalid',
  FORBIDDEN: 'sessionInvalid',
};
const fieldCodes = ['VALIDATION_ERROR', 'COMMON_VALIDATION_FAILED'];

/** Notify-me for an unserviceable/unknown place. The phone is sent only on
 * explicit submit, is never cached or echoed, and the acknowledgement does not
 * claim that any message was sent. */
export function WaitlistForm({
  city,
  onBack,
  onDone,
}: {
  city: City | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('geo.location');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api, lifecycle } = useSession();
  const online = useOnline();
  const keys = useIdempotencyKey();
  const [phone, setPhone] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const join = usePrivateMutation(
    lifecycle,
    async (
      input: { body: { cityId?: string; phone: string }; key: string },
      assertCurrent,
    ) => joinWaitlist(api, input.body, input.key, assertCurrent),
  );
  const code = join.isError ? failureCode(join.error) : undefined;
  const cityName = city ? geoName(city, locale) : undefined;

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = {
      ...(city && { cityId: city.id }),
      phone: phone.trim(),
    };
    if (!WaitlistRequestSchema.safeParse(body).success) {
      setInvalid(true);
      return;
    }
    // Same payload → same key, so a manual retry replays instead of repeating.
    const key = keys.for(JSON.stringify(body));
    void join.run({ body, key }, () => {
      keys.clear();
      setPhone('');
      setAccepted(true);
    });
  }

  if (accepted)
    return (
      <div className="grid gap-stack-gap">
        <GeoNote
          tone="ok"
          title={t('waitlistDoneTitle')}
          message={
            cityName
              ? t('waitlistDoneCity', { city: cityName })
              : t('waitlistDone')
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={onDone}>{t('done')}</Button>
          <Button variant="text" onClick={onBack}>
            {t('chooseAnother')}
          </Button>
        </div>
      </div>
    );

  return (
    <form noValidate className="grid gap-stack-gap" onSubmit={submit}>
      <p className="flex gap-2 [overflow-wrap:anywhere]">
        <span aria-hidden="true">🗺️</span>
        <span className="min-w-0">
          {cityName
            ? t('waitlistCity', { city: cityName })
            : t('waitlistUnknown')}
        </span>
      </p>
      {!online && <GeoNote tone="warn" message={t('offline')} />}
      <Input
        label={t('phone')}
        hint={t('phoneHint')}
        prefix="+91"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        required
        value={phone}
        disabled={join.isPending}
        error={
          invalid || (code && fieldCodes.includes(code))
            ? t('phoneInvalid')
            : undefined
        }
        onChange={(event) => {
          setPhone(event.target.value.replace(/\D/g, ''));
          setInvalid(false);
        }}
      />
      <p className="text-small text-muted [overflow-wrap:anywhere]">
        {t('waitlistNote')}
      </p>
      {code && !fieldCodes.includes(code) && (
        <GeoNote
          tone="bad"
          message={t(errors[code] ?? 'waitlistFailed')}
          action={
            !errors[code] ? (
              <Button type="submit" variant="outline" disabled={!online}>
                {t('retry')}
              </Button>
            ) : undefined
          }
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={join.isPending} disabled={!online}>
          {t('notifyMe')}
        </Button>
        <Button variant="text" disabled={join.isPending} onClick={onBack}>
          {t('chooseAnother')}
        </Button>
      </div>
    </form>
  );
}
