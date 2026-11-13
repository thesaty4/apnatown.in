'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { isDashboardPath, publicHref } from '../i18n/preferences';
import { NavIcon } from './NavIcon';

/**
 * Header search entry (prototype `.sbtn`). A plain GET form keeps the query
 * in the URL so Search owns its own state; no keystrokes commit to shared
 * state here.
 */
export function HeaderSearch() {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const path = usePathname().replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/';
  if (isDashboardPath(path)) return null;
  return (
    <form
      role="search"
      action={publicHref('/search', locale)}
      method="get"
      aria-label={t('title')}
      className="hidden min-w-0 flex-1 basis-40 tablet:block desktop:max-w-[26rem]"
    >
      <div className="flex min-h-touch items-center gap-2 rounded-pill border border-border bg-surface-2 px-3 focus-within:ring-focus">
        <NavIcon name="search" className="size-4.5 text-muted" />
        <label htmlFor="header-search" className="sr-only">
          {t('placeholder')}
        </label>
        <input
          id="header-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder={t('placeholder')}
          className="min-h-touch min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="inline-flex min-h-touch shrink-0 items-center rounded-sm font-semibold text-primary focus-visible:ring-focus"
        >
          {t('submit')}
        </button>
      </div>
    </form>
  );
}
