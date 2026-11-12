'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  parseTheme,
  publicHref,
  isPrivatePath,
  type Theme,
} from '../i18n/preferences';
import { applyLocale, applyTheme } from '../i18n/browser-preferences';
import { useSession } from '../auth/SessionProvider';
import { useSavePreferences } from '../i18n/preferences-query';

export function Preferences({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState(initialTheme);
  const mutation = useSavePreferences();
  const busy = mutation.isPending;
  const failed = mutation.isError;
  const { state } = useSession();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const path = usePathname().replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/';
  const t = useTranslations('common');
  const target = locale === 'en' ? 'hi' : 'en';
  const privatePath = isPrivatePath(path);
  useEffect(() => {
    const sync = () =>
      setTheme(parseTheme(document.documentElement.dataset.theme));
    window.addEventListener('apnatown-theme', sync);
    return () => window.removeEventListener('apnatown-theme', sync);
  }, []);

  function changeTheme(value: string) {
    const next = parseTheme(value);
    const apply = (confirmed: Theme) => {
      applyTheme(confirmed);
      setTheme(confirmed);
      mutation.reset();
    };
    if (state.kind === 'ready')
      void mutation.run({ theme: next }, (confirmed) => apply(confirmed.theme));
    else apply(next);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-4 text-small">
      <a
        href={privatePath ? path : publicHref(path, target)}
        hrefLang={target}
        aria-label={t('language.switch', {
          language: t(target === 'hi' ? 'language.hindi' : 'language.english'),
        })}
        aria-disabled={busy || state.kind === 'loading'}
        className="inline-flex min-h-touch items-center rounded-sm px-3 underline focus-visible:ring-focus"
        onClick={(event) => {
          event.preventDefault();
          if (busy || state.kind === 'loading') return;
          const apply = (confirmed: 'en' | 'hi') => {
            mutation.reset();
            applyLocale(confirmed);
            if (privatePath) window.location.reload();
            else
              window.location.assign(
                publicHref(path, confirmed) + location.search + location.hash,
              );
          };
          if (state.kind === 'ready')
            void mutation.run({ locale: target }, (confirmed) =>
              apply(confirmed.locale),
            );
          else apply(target);
        }}
      >
        {t(target === 'hi' ? 'language.hindi' : 'language.english')}
      </a>
      <label className="flex flex-wrap items-center gap-2">
        {t('theme.label')}
        <select
          value={theme}
          disabled={busy || state.kind === 'loading'}
          onChange={(event) => changeTheme(event.target.value)}
          className="min-h-touch rounded-sm border border-border bg-surface px-3 text-text"
        >
          {(['light', 'dark', 'auto'] as const).map((value) => (
            <option key={value} value={value}>
              {t(`theme.${value}`)}
            </option>
          ))}
        </select>
      </label>
      {failed && (
        <p role="alert" className="text-error">
          {t('preferences.saveFailed')}
        </p>
      )}
    </div>
  );
}
