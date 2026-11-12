'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { parseTheme, type Theme } from '../i18n/preferences';
import { applyTheme } from '../i18n/browser-preferences';
import { useSession } from '../auth/SessionProvider';
import { useSavePreferences } from '../i18n/preferences-query';

/** Theme select; signed-in users persist the choice. Language lives in
 * `LanguageSwitch`. */
export function Preferences({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState(initialTheme);
  const mutation = useSavePreferences();
  const busy = mutation.isPending;
  const { state } = useSession();
  const t = useTranslations('common');
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
    <>
      <label className="flex items-center text-small">
        <span className="sr-only">{t('theme.label')}</span>
        <select
          value={theme}
          disabled={busy || state.kind === 'loading'}
          onChange={(event) => changeTheme(event.target.value)}
          className="h-11 rounded-pill border border-border bg-surface px-3 text-text"
        >
          {(['light', 'dark', 'auto'] as const).map((value) => (
            <option key={value} value={value}>
              {t(`theme.${value}`)}
            </option>
          ))}
        </select>
      </label>
      {mutation.isError && (
        <p role="alert" className="text-small text-error">
          {t('preferences.saveFailed')}
        </p>
      )}
    </>
  );
}
