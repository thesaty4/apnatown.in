'use client';

import { useState } from 'react';
import type { DehydratedState } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card } from '@apnatown/ui/cards/Card';
import { Select } from '@apnatown/ui/primitives/Select';
import { Button } from '@apnatown/ui/primitives/Button';
import {
  PreferencesSchema,
  type Preferences as PreferencesData,
} from '@apnatown/shared/users';
import { Failure } from '../../shared/auth/AccessState';
import { failureCode } from '../../shared/api/result';
import { applyPreferences } from '../../shared/i18n/browser-preferences';
import { preferencesOptions } from '../../shared/i18n/preferences-api';
import { useSavePreferences } from '../../shared/i18n/preferences-query';
import { OwnBoundary, ResourceBody } from './OwnResource';
import { Consents } from './Consents';

export function Preferences({
  initial,
  owner,
}: {
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const t = useTranslations('account.preferences');
  return (
    <div className="grid gap-6">
      <h1 className="text-h1">{t('title')}</h1>
      <OwnBoundary
        initial={initial}
        owner={owner}
        guestMessage={t('guestMessage')}
      >
        {(context) => (
          <>
            <ResourceBody
              options={preferencesOptions(
                context.api,
                context.scope,
                context.lifecycle,
              )}
            >
              {(preferences) => <PreferencesForm preferences={preferences} />}
            </ResourceBody>
            <Consents {...context} />
          </>
        )}
      </OwnBoundary>
      <p className="text-small text-muted">{t('cookiesUnavailable')}</p>
    </div>
  );
}

function PreferencesForm({ preferences }: { preferences: PreferencesData }) {
  const mutation = useSavePreferences();
  const router = useRouter();
  const t = useTranslations('account.preferences');
  const common = useTranslations('common');
  const [locale, setLocale] = useState<string>(preferences.locale);
  const [theme, setTheme] = useState<string>(preferences.theme);
  const busy = mutation.isPending;
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState<string>();
  const error =
    validationError ??
    (mutation.isError ? failureCode(mutation.error) : undefined);
  async function save() {
    if (busy) return;
    setSaved(false);
    setValidationError(undefined);
    mutation.reset();
    const parsed = PreferencesSchema.safeParse({ locale, theme });
    if (!parsed.success) {
      setValidationError('VALIDATION_ERROR');
      return;
    }
    await mutation.run(parsed.data, (next) => {
      setLocale(next.locale);
      setTheme(next.theme);
      applyPreferences(next);
      setSaved(true);
      mutation.reset();
      router.refresh(); // Re-render private text using the confirmed locale cookie, same URL.
    });
  }
  return (
    <div className="grid gap-4">
      <Card padded>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Select
            label={common('language.label')}
            value={locale}
            disabled={busy}
            onChange={(event) => {
              setLocale(event.target.value);
              setSaved(false);
            }}
            options={['en', 'hi'].map((value) => ({
              value,
              label: common(
                value === 'en' ? 'language.english' : 'language.hindi',
              ),
            }))}
          />
          <Select
            label={common('theme.label')}
            value={theme}
            disabled={busy}
            onChange={(event) => {
              setTheme(event.target.value);
              setSaved(false);
            }}
            options={['light', 'dark', 'auto'].map((value) => ({
              value,
              label: common(`theme.${value}`),
            }))}
          />
          <Button type="submit" loading={busy}>
            {t('save')}
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
    </div>
  );
}
