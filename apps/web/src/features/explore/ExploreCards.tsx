'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import type { ExploreCard, ExploreTab } from '@apnatown/shared/search';
import type { Locale } from '../../shared/i18n/preferences';

const localized = (
  item: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn);

/** Prototype shopgrid (Shops) and auto grid (Services) result cards. */
export function ExploreCards({
  tab,
  items,
  locale,
}: {
  tab: ExploreTab;
  items: ExploreCard[];
  locale: Locale;
}) {
  const t = useTranslations('explore.screen');
  return (
    <ul
      className={`grid gap-3 ${tab === 'shops' ? 'tablet:grid-cols-2 desktop:grid-cols-3' : 'tablet:grid-cols-2'}`}
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <Card padded className="grid h-full gap-2">
            <h2 className="text-h3 [overflow-wrap:anywhere]">
              {localized(item, locale)}
            </h2>
            {item.category && (
              <p className="text-small text-text-2">
                {localized(item.category, locale)}
              </p>
            )}
            {item.area && (
              <p className="text-small text-muted">
                <span aria-hidden="true">📍 </span>
                {localized(item.area, locale)}
              </p>
            )}
            {item.verified && (
              <StatusBadge
                tone="ok"
                icon="✓"
                label={t('verified')}
                className="justify-self-start"
              />
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
