'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import {
  ENQUIRY_MESSAGE_MAX,
  EnquiryMessageSchema,
  EnquiryNameSchema,
  type EnquiryCreate,
} from '@apnatown/shared/services';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { ApiFailure, failureCode } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { createEnquiry, istDateToday, normalizeMobile } from './api';

type Field = 'name' | 'phone' | 'message' | 'preferredDate';
const FIELDS: readonly Field[] = ['name', 'phone', 'message', 'preferredDate'];
type Values = Record<Field, string>;

const fieldId = (field: Field) => `enquiry-${field}`;

/** Client-side mirror of the shared create schema; the API stays authoritative. */
function validate(values: Values, today: string) {
  const name = EnquiryNameSchema.safeParse(values.name);
  const phone = normalizeMobile(values.phone);
  const message = EnquiryMessageSchema.safeParse(values.message);
  const date = values.preferredDate;
  const dateValid = !date || (/^\d{4}-\d{2}-\d{2}$/u.test(date) && date >= today);
  const invalid = new Set<Field>();
  if (!name.success) invalid.add('name');
  if (!phone) invalid.add('phone');
  if (!message.success) invalid.add('message');
  if (!dateValid) invalid.add('preferredDate');
  if (invalid.size > 0 || !name.success || !phone || !message.success)
    return { invalid };
  const body: EnquiryCreate = {
    name: name.data,
    phone,
    message: message.data,
    ...(date && { preferredDate: date }),
  };
  return { invalid, body };
}

function errorKey(error: unknown) {
  const code = failureCode(error);
  if (code === 'VALIDATION_ERROR' || code === 'COMMON_VALIDATION_FAILED')
    return 'summary';
  if (code === 'COMMON_NOT_FOUND') return 'unavailable';
  if (code === 'COMMON_RATE_LIMITED' || code === 'RATE_LIMITED')
    return 'rateLimited';
  if (code === 'CSRF_INVALID' || code === 'SESSION_EXPIRED') return 'security';
  if (code === 'MAINTENANCE') return 'maintenance';
  if (error instanceof ApiFailure && error.status === 409) return 'inProgress';
  return 'failed';
}

/**
 * S-CUST-09 guest enquiry form (prototype `#svenq` card). Works without login;
 * one Idempotency-Key per payload so a manual retry replays instead of
 * duplicating. Fields are never prefilled from private data (SessionDto has no
 * name/phone) and never leave this component except in the API request.
 */
export function EnquiryForm({
  serviceId,
  serviceName,
}: {
  serviceId: string;
  serviceName: string;
}) {
  const t = useTranslations('service.enquiry');
  const { api } = useSession();
  const online = useOnline();
  const keys = useIdempotencyKey();
  const initial = (): Values => ({
    name: '',
    phone: '',
    message: t('messageDefault', { service: serviceName }),
    preferredDate: '',
  });
  const [values, setValues] = useState<Values>(initial);
  const [invalid, setInvalid] = useState<ReadonlySet<Field>>(new Set());
  const [touched, setTouched] = useState<ReadonlySet<Field>>(new Set());
  const [sent, setSent] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const today = istDateToday();
  const send = useMutation({
    mutationFn: (input: { body: EnquiryCreate; key: string }) =>
      createEnquiry(api, serviceId, input.body, input.key),
    retry: false,
    networkMode: 'always',
  });

  const recheck = (next: Values, fields: ReadonlySet<Field>) => {
    const { invalid: now } = validate(next, today);
    setInvalid(new Set([...now].filter((field) => fields.has(field))));
  };

  const update = (field: Field, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (send.isError) send.reset();
    if (touched.has(field) || invalid.has(field)) recheck(next, touched);
  };

  const blur = (field: Field) => {
    const next = new Set(touched).add(field);
    setTouched(next);
    recheck(values, next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (send.isPending || unavailable) return;
    const all = new Set(FIELDS);
    setTouched(all);
    const result = validate(values, today);
    setInvalid(result.invalid);
    if (!result.body) {
      const first = FIELDS.find((field) => result.invalid.has(field));
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }
    if (!online) return;
    const body = result.body;
    send.reset();
    send.mutate(
      { body, key: keys.for(JSON.stringify({ serviceId, body })) },
      {
        onSuccess: (created) => {
          keys.clear();
          setSent(created.enquiryId);
          window.requestAnimationFrame(() => successRef.current?.focus());
        },
        onError: (error) => {
          if (failureCode(error) === 'COMMON_NOT_FOUND') setUnavailable(true);
          const fields =
            error instanceof ApiFailure
              ? error.fields
                  .map((field) => field.split('.').pop())
                  .filter((field): field is Field =>
                    FIELDS.includes(field as Field),
                  )
              : [];
          if (fields.length > 0) {
            setInvalid(new Set(fields));
            document.getElementById(fieldId(fields[0]!))?.focus();
          }
        },
      },
    );
  };

  const done = () => {
    setValues(initial());
    setInvalid(new Set());
    setTouched(new Set());
    setSent(undefined);
    send.reset();
    window.requestAnimationFrame(() => titleRef.current?.focus());
  };

  const failure = send.isError ? errorKey(send.error) : undefined;
  const error = (field: Field, key: string) =>
    invalid.has(field) ? t(`errors.${key}`) : undefined;

  return (
    <Card
      padded
      id="svenq"
      tabIndex={-1}
      aria-labelledby="svenq-title"
      className="grid scroll-mt-24 gap-4 focus-visible:ring-focus"
    >
      {sent ? (
        <div className="grid justify-items-center gap-3 py-4 text-center">
          <span aria-hidden="true" className="text-state-icon">
            ✅
          </span>
          <h2
            id="svenq-title"
            ref={successRef}
            tabIndex={-1}
            aria-describedby="svenq-sent"
            className="m-0 text-h3 focus-visible:ring-focus"
          >
            {t('sentTitle')}
          </h2>
          <p
            id="svenq-sent"
            className="m-0 max-w-state-copy text-text-2 [overflow-wrap:anywhere]"
          >
            {t('sentMessage')}{' '}
            <span className="font-semibold">
              {t('reference', { id: sent })}
            </span>
          </p>
          <Button onClick={done}>{t('done')}</Button>
        </div>
      ) : (
        <>
          <h2
            id="svenq-title"
            ref={titleRef}
            tabIndex={-1}
            className="m-0 text-h3 focus-visible:ring-focus"
          >
            {t('title')}
          </h2>
          {!online && (
            <p
              role="status"
              className="m-0 flex gap-2 rounded-md border border-warning bg-warning-soft p-3 text-small text-text"
            >
              <span aria-hidden="true">📡</span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {t('offline')}
              </span>
            </p>
          )}
          <form noValidate className="grid gap-3" onSubmit={submit}>
            <Input
              id={fieldId('name')}
              name="name"
              label={t('name')}
              required
              autoComplete="name"
              maxLength={60}
              value={values.name}
              error={error('name', 'name')}
              onChange={(event) => update('name', event.target.value)}
              onBlur={() => blur('name')}
            />
            <Input
              id={fieldId('phone')}
              name="phone"
              type="tel"
              label={t('phone')}
              hint={t('phoneHint')}
              required
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={16}
              value={values.phone}
              error={error('phone', 'phone')}
              onChange={(event) => update('phone', event.target.value)}
              onBlur={() => blur('phone')}
            />
            <TextArea
              id={fieldId('message')}
              name="message"
              label={t('message')}
              required
              rows={4}
              maxLength={ENQUIRY_MESSAGE_MAX}
              value={values.message}
              error={error('message', 'message')}
              onChange={(event) => update('message', event.target.value)}
              onBlur={() => blur('message')}
            />
            <Input
              id={fieldId('preferredDate')}
              name="preferredDate"
              type="date"
              label={t('preferredDate')}
              min={today}
              value={values.preferredDate}
              error={error('preferredDate', 'date')}
              onChange={(event) => update('preferredDate', event.target.value)}
              onBlur={() => blur('preferredDate')}
            />
            {failure && (
              <p
                role="alert"
                className="m-0 flex gap-2 rounded-md border border-error bg-error-soft p-3 text-small text-text"
              >
                <span aria-hidden="true">⚠️</span>
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {t(`errors.${failure}`)}
                </span>
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={!online || unavailable}
              loading={send.isPending}
            >
              <NavIcon name="send" className="size-4.5" />
              {send.isPending ? t('sending') : t('submit')}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
