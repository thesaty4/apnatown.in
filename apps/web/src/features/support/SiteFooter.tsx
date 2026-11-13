import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getWebEnvironment } from '../../shared/config/server';
import { publicHref } from '../../shared/i18n/preferences';
import { BrandLogo } from '../../shared/ui/BrandLogo';
import { LanguageSwitch } from '../../shared/ui/LanguageSwitch';

/** Public footer (prototype `.foot`): brand + tagline, help and legal links
 * (S-CUST-30..33, 38) and the language switch. "Join us" signup links wait
 * for the onboarding routes. */
export async function SiteFooter() {
  const t = await getTranslations('legal.footer');
  const copy = await getTranslations('common.copy');
  const nav = await getTranslations('common.navigation');
  const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
  const internal = getWebEnvironment().APP_ENV !== 'production';
  const groups = [
    [
      t('company'),
      [
        ['/about', t('about')],
        ['/help', t('help')],
        ...(internal ? [['/design-system', t('design')] as const] : []),
      ],
    ],
    [
      t('legal'),
      [
        ['/terms', t('terms')],
        ['/privacy', t('privacy')],
        ['/refund-policy', t('refund')],
      ],
    ],
  ] as const;
  return (
    <footer className="mt-8 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-page gap-6 px-page-gutter pt-7 pb-5 tablet:grid-cols-2 desktop:grid-cols-4">
        <div>
          <Link
            href={publicHref('/', locale)}
            aria-label={nav('logo')}
            className="inline-flex rounded-sm focus-visible:ring-focus"
          >
            <BrandLogo />
          </Link>
          <p className="mt-2 text-small text-muted">
            {copy('apnaSheharApniDukaan')}
          </p>
        </div>
        {groups.map(([title, links], index) => (
          <nav key={title} aria-label={title} className="grid content-start">
            <h2 className="mb-1 text-body font-semibold">{title}</h2>
            <ul>
              {links.map(([path, label]) => (
                <li key={path}>
                  <Link
                    href={publicHref(path, locale)}
                    className="inline-flex min-h-touch items-center text-text-2 hover:text-primary focus-visible:ring-focus"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            {index === groups.length - 1 && (
              <div className="mt-2">
                <LanguageSwitch />
              </div>
            )}
          </nav>
        ))}
      </div>
    </footer>
  );
}
