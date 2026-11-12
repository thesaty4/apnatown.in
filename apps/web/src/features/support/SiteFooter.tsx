import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getWebEnvironment } from '../../shared/config/server';
import { publicHref } from '../../shared/i18n/preferences';

/** Public footer links to help and legal pages (S-CUST-30..33, 38). */
export async function SiteFooter() {
  const t = await getTranslations('legal.footer');
  const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
  const internal = getWebEnvironment().APP_ENV !== 'production';
  const groups = [
    [
      t('company'),
      [
        ['/about', t('about')],
        ['/help', t('help')],
      ],
    ],
    [
      t('legal'),
      [
        ['/terms', t('terms')],
        ['/privacy', t('privacy')],
        ['/refund-policy', t('refund')],
        ...(internal ? [['/design-system', t('design')] as const] : []),
      ],
    ],
  ] as const;
  return (
    <footer className="grid gap-4 border-t border-border py-page-gutter tablet:grid-cols-2">
      {groups.map(([title, links]) => (
        <nav
          key={title}
          aria-label={title}
          className="grid content-start gap-1"
        >
          <h2 className="text-small font-semibold text-text-2">{title}</h2>
          <ul className="flex flex-wrap gap-x-4">
            {links.map(([path, label]) => (
              <li key={path}>
                <Link
                  href={publicHref(path, locale)}
                  className="inline-flex min-h-touch items-center underline focus-visible:ring-focus"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </footer>
  );
}
