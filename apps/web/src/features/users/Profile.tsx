'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { DehydratedState } from '@tanstack/react-query';
import { Card } from '@apnatown/ui/cards/Card';
import { Input } from '@apnatown/ui/primitives/Input';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import {
  UpdateProfileSchema,
  type Profile as ProfileData,
} from '@apnatown/shared/users';
import { useSession } from '../../shared/auth/SessionProvider';
import { Failure } from '../../shared/auth/AccessState';
import { landing } from '../../shared/auth/return-to';
import { ApiFailure, failureCode } from '../../shared/api/result';
import { OwnResource } from './OwnResource';
import { profileOptions } from './api';
import { useSaveProfile } from './queries';

export function Profile({
  initial,
  owner,
  onboarding,
  returnTo,
}: {
  initial: DehydratedState;
  owner?: string | undefined;
  onboarding: boolean;
  returnTo?: string | undefined;
}) {
  return (
    <OwnResource initial={initial} owner={owner} options={profileOptions}>
      {(profile) => (
        <ProfileForm
          profile={profile}
          onboarding={onboarding}
          returnTo={returnTo}
        />
      )}
    </OwnResource>
  );
}

function ProfileForm({
  profile,
  onboarding,
  returnTo,
}: {
  profile: ProfileData;
  onboarding: boolean;
  returnTo?: string | undefined;
}) {
  const { state } = useSession();
  const mutation = useSaveProfile();
  const router = useRouter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const t = useTranslations('account.profile');
  const [name, setName] = useState(profile.displayName ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
  const [fields, setFields] = useState<readonly string[]>([]);
  const [saved, setSaved] = useState(false);
  const busy = mutation.isPending;
  const error = mutation.isError ? failureCode(mutation.error) : undefined;
  const form = useRef<HTMLFormElement>(null);
  const destination =
    state.kind === 'ready' ? landing(state.data, returnTo, locale) : '/account';

  async function save() {
    if (busy) return;
    setSaved(false);
    mutation.reset();
    const body = { displayName: name.trim(), email: email.trim() || null };
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      setFields(parsed.error.issues.map((issue) => String(issue.path[0])));
      return;
    }
    setFields([]);
    await mutation.run(body, (next) => {
      setName(next.displayName ?? '');
      setEmail(next.email ?? '');
      setSaved(true);
      mutation.reset(); // Discard the private response after copying editable fields.
      if (onboarding) router.replace(destination);
      router.refresh();
    });
  }
  const serverFields =
    mutation.error instanceof ApiFailure ? mutation.error.fields : [];
  const invalidFields = [...fields, ...serverFields];
  useEffect(() => {
    if (fields.length || mutation.isError)
      form.current
        ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
        ?.focus();
  }, [fields, mutation.isError]);
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t(onboarding ? 'completeTitle' : 'title')}</h1>
      {!profile.displayName && (
        <EmptyState
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={
            <Button
              onClick={() =>
                form.current?.querySelector<HTMLInputElement>('input')?.focus()
              }
            >
              {t('addName')}
            </Button>
          }
        />
      )}
      <Card padded>
        <form
          ref={form}
          className="grid gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Input
            label={t('name')}
            value={name}
            autoComplete="name"
            maxLength={60}
            required
            disabled={busy}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            error={
              invalidFields.includes('displayName')
                ? t('invalidName')
                : undefined
            }
          />
          <Input
            label={t('phone')}
            value={profile.phone}
            type="tel"
            readOnly
            hint={t('phoneReadOnly')}
          />
          <Input
            label={t('email')}
            value={email}
            type="email"
            autoComplete="email"
            maxLength={254}
            disabled={busy}
            onChange={(event) => {
              setEmail(event.target.value);
              setSaved(false);
            }}
            error={
              invalidFields.includes('email') ? t('invalidEmail') : undefined
            }
          />
          <Button type="submit" loading={busy}>
            {t(onboarding ? 'finish' : 'save')}
          </Button>
          {saved && <p role="status">✓ {t('saved')}</p>}
        </form>
      </Card>
      {error && (
        <Failure
          code={error}
          retryDisabled={busy}
          retry={() => {
            void save();
          }}
        />
      )}
      {onboarding && (
        <Link
          className="inline-flex min-h-touch items-center underline"
          href={destination}
        >
          {t('skip')}
        </Link>
      )}
    </div>
  );
}
