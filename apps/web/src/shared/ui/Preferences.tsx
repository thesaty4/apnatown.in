'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  parseTheme,
  publicHref,
  themeCookie,
  type Theme,
} from '../i18n/preferences';

export function Preferences({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState(initialTheme);
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const path = usePathname().replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/';
  const t = useTranslations('common');
  const target = locale === 'en' ? 'hi' : 'en';

  function changeTheme(value: string) {
    const next = parseTheme(value);
    document.documentElement.dataset.theme = next;
    document.cookie = `${themeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    setTheme(next);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-4 text-small">
      <a
        href={publicHref(path, target)}
        hrefLang={target}
        aria-label={t('language.label')}
        className="inline-flex min-h-touch items-center rounded-sm px-3 underline focus-visible:ring-focus"
        onClick={(event) => {
          // Preserve current query and fragment without serializing request state
          // into the global shell; normal Next navigation still restores Back.
          event.currentTarget.href =
            publicHref(path, target) + location.search + location.hash;
        }}
      >
        {t(target === 'hi' ? 'language.hindi' : 'language.english')}
      </a>
      <label className="flex flex-wrap items-center gap-2">
        {t('theme.label')}
        <select
          value={theme}
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
    </div>
  );
}
