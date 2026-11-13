'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { publicHref, isUnprefixedPath } from '../i18n/preferences';
import { applyLocale } from '../i18n/browser-preferences';
import { useSession } from '../auth/SessionProvider';
import { useSavePreferences } from '../i18n/preferences-query';

/** Prototype `.lang` pill: "हिं"/"EN" in the header, full name in the footer.
 * Signed-in users persist the choice before navigating. */
export function LanguageSwitch({ short = false }: { short?: boolean }) {
  const mutation = useSavePreferences();
  const busy = mutation.isPending;
  const { state } = useSession();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const path = usePathname().replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/';
  const t = useTranslations('common');
  const target = locale === 'en' ? 'hi' : 'en';
  const unprefixed = isUnprefixedPath(path);
  const name = t(target === 'hi' ? 'language.hindi' : 'language.english');
  return (
    <>
      <a
        href={unprefixed ? path : publicHref(path, target)}
        hrefLang={target}
        lang={target}
        aria-label={t('language.switch', { language: name })}
        aria-disabled={busy || state.kind === 'loading'}
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-pill border-chip-border border-border-strong bg-surface px-3 text-small font-semibold text-text focus-visible:ring-focus"
        onClick={(event) => {
          event.preventDefault();
          if (busy || state.kind === 'loading') return;
          const apply = (confirmed: 'en' | 'hi') => {
            mutation.reset();
            applyLocale(confirmed);
            if (unprefixed) window.location.reload();
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
        {short
          ? t(target === 'hi' ? 'language.hindiShort' : 'language.englishShort')
          : name}
      </a>
      {mutation.isError && (
        <p role="alert" className="text-small text-error">
          {t('preferences.saveFailed')}
        </p>
      )}
    </>
  );
}
