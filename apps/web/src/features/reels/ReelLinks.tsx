'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { VideoFeedItem, VideoFeedLink } from '@apnatown/shared';
import { formatMoney } from '@apnatown/shared/formatters';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';

function LinkPrice({ link, locale }: { link: VideoFeedLink; locale: Locale }) {
  const t = useTranslations('explore.screen');
  const reels = useTranslations('reels.feed');
  if (link.pricePaise === null || link.priceType === 'enquiry')
    return reels('linkPriceOnEnquiry');
  if (link.priceType === 'range' && link.priceMaxPaise !== null)
    return t('priceRange', {
      min: formatMoney(link.pricePaise, locale),
      max: formatMoney(link.priceMaxPaise, locale),
    });
  if (link.priceType === 'from')
    return t('fromPrice', { price: formatMoney(link.pricePaise, locale) });
  return formatMoney(link.pricePaise, locale);
}

/** Prototype "Linked products & services" rows; View opens the listing. */
export function ReelLinkList({
  links,
  onNavigate,
}: {
  links: readonly VideoFeedLink[];
  onNavigate?: () => void;
}) {
  const t = useTranslations('reels.feed');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  if (!links.length)
    return <p className="m-0 text-small text-text-2">{t('nothingLinked')}</p>;
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {links.map((link) => {
        const name = (locale === 'hi' && link.nameHi) || link.nameEn;
        return (
          <li key={`${link.targetType}:${link.targetId}`}>
            <Link
              href={publicHref(`/${link.targetType}/${link.slug}`, locale)}
              aria-label={t('linkView', { name })}
              onClick={() => onNavigate?.()}
              className="flex min-h-touch items-center gap-3 rounded-md border border-border bg-surface p-2.5 text-text no-underline transition-colors duration-2 ease-standard hover:bg-surface-2 focus-visible:ring-focus motion-reduce:transition-none"
            >
              <span aria-hidden="true" className="shrink-0 text-h3">
                {link.targetType === 'product' ? '🛍️' : '🔧'}
              </span>
              <span className="grid min-w-0 flex-1">
                <b className="text-small [overflow-wrap:anywhere]">{name}</b>
                <span className="text-caption text-text-2">
                  {t(
                    link.targetType === 'product'
                      ? 'linkKindProduct'
                      : 'linkKindService',
                  )}{' '}
                  · <LinkPrice link={link} locale={locale} />
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`${buttonClassName} pointer-events-none shrink-0`}
              >
                {t('linkViewShort')}
              </span>
              <NavIcon name="cr" className="size-4 shrink-0" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Prototype `A.vshop` "Shop this video" sheet, opened from the rail. */
export function ReelShopSheet({
  item,
  renderTrigger,
}: {
  item: VideoFeedItem;
  renderTrigger: (open: () => void) => ReactNode;
}) {
  const t = useTranslations('reels.feed');
  const [open, setOpen] = useState(false);
  if (!item.links.length) return null;
  return (
    <>
      {renderTrigger(() => setOpen(true))}
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t('shopVideo')}
        closeLabel={t('closeShop')}
      >
        <ReelLinkList links={item.links} onNavigate={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
