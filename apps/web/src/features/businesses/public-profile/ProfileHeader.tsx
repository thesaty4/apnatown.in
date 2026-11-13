import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { categoryPath } from '../../catalog';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';
import { openStatus } from './hours';

export type HeaderCategory = { slug: string; name: string; icon: string | null };

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('');
  return letters.toLocaleUpperCase() || '🏪';
}

/**
 * Prototype `profileHead`: cover art with the logo overlapping, name with the
 * stored Verified flag (never derived from approval), category · area, rating,
 * today's IST status and fulfilment chips. Status always pairs icon + text.
 */
export async function ProfileHeader({
  detail,
  name,
  category,
  locale,
}: {
  detail: BusinessDiscoveryDetail;
  name: string;
  category: HeaderCategory | null;
  locale: Locale;
}) {
  const t = await getTranslations('business.publicProfile');
  const { item, profile } = detail;
  const kind = profile.kind;
  const area =
    item.area && (locale === 'hi' && item.area.nameHi ? item.area.nameHi : item.area.nameEn);
  const status = openStatus(item.openNow, profile, locale);
  const hue = {
    '--at-art-hue': `var(--at-listing-hue-${category?.slug ?? ''}, var(--at-art-hue-default))`,
  } as CSSProperties;
  const fallback = category?.icon || (kind === 'shop' ? '🏪' : '🛠️');
  return (
    <header className="grid min-w-0 gap-3">
      <nav aria-label={t('breadcrumb')} className="text-small text-text-2">
        <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
          <li>
            <Link href={publicHref('/', locale)} className="inline-flex min-h-touch items-center rounded-sm text-primary underline focus-visible:ring-focus">
              {t('home')}
            </Link>
          </li>
          {category && (
            <li className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              <Link href={publicHref(categoryPath(category.slug), locale)} className="inline-flex min-h-touch items-center rounded-sm text-primary underline [overflow-wrap:anywhere] focus-visible:ring-focus">
                {category.name}
              </Link>
            </li>
          )}
          <li className="flex min-w-0 items-center gap-1">
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="[overflow-wrap:anywhere]">{name}</span>
          </li>
        </ol>
      </nav>
      <div className="relative">
        <Avatar
          label={profile.cover ? t('coverAlt', { name }) : ''}
          emoji={fallback}
          size="4:3"
          style={hue}
          className="aspect-[16/9]! rounded-lg tablet:aspect-[3/1]! text-listing-art!"
          {...(profile.cover && {
            src: profile.cover.path,
            imageWidth: profile.cover.width,
            imageHeight: profile.cover.height,
          })}
        />
        <Avatar
          label={profile.logo ? t('logoAlt', { name }) : ''}
          emoji={profile.logo ? fallback : initials(name)}
          size="mini"
          style={hue}
          className="absolute bottom-0 start-4 size-20! translate-y-1/2 rounded-lg! border-4 border-bg shadow-1 font-display font-bold"
          {...(profile.logo && {
            src: profile.logo.path,
            imageWidth: profile.logo.width,
            imageHeight: profile.logo.height,
          })}
        />
      </div>
      <div className="grid min-w-0 gap-2 pt-10">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="m-0 min-w-0 font-display text-h1 [overflow-wrap:anywhere]">{name}</h1>
          {item.verified && <StatusBadge tone="ok" icon="✓" label={t('verified')} />}
        </div>
        {(category || area) && (
          <p className="m-0 text-text-2 [overflow-wrap:anywhere]">
            {[category?.name, area].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="m-0 text-small text-text-2">
          {item.rating !== null && item.reviewCount > 0 ? (
            <>
              <span aria-hidden="true" className="text-star">★ </span>
              {t('rating', { rating: item.rating, count: item.reviewCount })}
            </>
          ) : (
            t('noRating')
          )}
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={t('statusLabel')}>
          <li><StatusLine status={status} t={t} /></li>
          {kind === 'shop' && profile.delivery?.enabled && (
            <li>
              <StatusBadge
                tone="ok"
                icon="🛵"
                label={profile.delivery.radiusKm !== null ? t('deliveryRadius', { km: profile.delivery.radiusKm }) : t('delivery')}
              />
            </li>
          )}
          {kind === 'shop' && profile.pickup && (
            <li><StatusBadge tone="info" icon="🛍️" label={t('pickup')} /></li>
          )}
          {profile.serviceArea && (
            <li><StatusBadge tone="info" icon="📍" label={t('serviceArea', { area: profile.serviceArea })} /></li>
          )}
          {profile.serviceRadiusKm !== null && (
            <li><StatusBadge tone="info" icon="📍" label={t('serviceRadius', { km: profile.serviceRadiusKm })} /></li>
          )}
        </ul>
      </div>
    </header>
  );
}

function StatusLine({
  status,
  t,
}: {
  status: ReturnType<typeof openStatus>;
  t: Awaited<ReturnType<typeof getTranslations<'business.publicProfile'>>>;
}) {
  switch (status.kind) {
    case 'temporarilyClosed':
      return <StatusBadge tone="bad" icon="⛔" label={t('status.temporarilyClosed')} />;
    case 'closedToday':
      return <StatusBadge tone="bad" icon="🕒" label={t('status.closedToday')} />;
    case 'open':
      return (
        <StatusBadge
          tone="ok"
          icon="🕒"
          label={status.closes ? t('status.openUntil', { time: status.closes }) : t('status.open')}
        />
      );
    case 'opensAt':
      return <StatusBadge tone="warn" icon="🕒" label={t('status.opensAt', { time: status.opens })} />;
    case 'closedNow':
      return (
        <StatusBadge
          tone="bad"
          icon="🕒"
          label={status.range ? t('status.closedNowHours', status.range) : t('status.closedNow')}
        />
      );
    default:
      return <StatusBadge tone="neutral" icon="🕒" label={t('status.hoursUnknown')} />;
  }
}
