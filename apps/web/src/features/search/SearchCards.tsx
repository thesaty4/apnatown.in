'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Category } from '@apnatown/shared/catalog';
import type { SearchCard, SearchResultTab, SearchVideoCard } from '@apnatown/shared/search';
import { formatCompactCount } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { ExploreCards } from '../explore';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';

export function SearchCards({
  tab, items, categories,
}: {
  tab: SearchResultTab;
  items: SearchCard[];
  categories: Category[];
}) {
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  if (tab !== 'videos')
    return <ExploreCards tab={tab} locale={locale} categories={categories}
      items={items.filter((item) => item.kind !== 'video')} />;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--at-product-card-min)),1fr))] gap-stack-gap">
      {items.filter((item): item is SearchVideoCard => item.kind === 'video')
        .map((item) => <li key={item.id}><VideoCard item={item} /></li>)}
    </ul>
  );
}

function VideoCard({ item }: { item: SearchVideoCard }) {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const business = locale === 'hi' && item.business.nameHi
    ? item.business.nameHi : item.business.nameEn;
  const title = item.caption || t('videoBy', { business });
  return (
    <Link href={publicHref(item.path, locale)} aria-label={title}
      className="block h-full rounded-lg focus-visible:ring-focus">
      <Card className="h-full overflow-hidden">
        <div className="relative">
          <Avatar label="" emoji={item.provider === 'youtube' ? '▶️' : '📷'} size="full"
            {...(item.image && { src: item.image.path, imageWidth: item.image.width,
              imageHeight: item.image.height })} />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-linear-to-t from-reel-canvas/85 to-reel-canvas/40 px-2 py-1.5 text-caption text-reel-text">
            <span className="inline-flex items-center gap-1">
              <NavIcon name="play" className="size-4" />
              <span aria-hidden="true">{formatCompactCount(item.viewCount, locale)}</span>
              <span className="sr-only">{t('views', { count: item.viewCount })}</span>
            </span>
            {item.durationSeconds !== null && <Duration seconds={item.durationSeconds} />}
          </div>
        </div>
        <div className="grid gap-1 px-2.5 py-2">
          <h3 className="text-small font-semibold [overflow-wrap:anywhere]">{title}</h3>
          <p className="text-caption text-muted [overflow-wrap:anywhere]">{business}</p>
        </div>
      </Card>
    </Link>
  );
}

function Duration({ seconds }: { seconds: number }) {
  const t = useTranslations('search.screen');
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return (
    <span>
      <span aria-hidden="true">{minutes}:{String(rest).padStart(2, '0')}</span>
      <span className="sr-only">{t('duration', { minutes, seconds: rest })}</span>
    </span>
  );
}
