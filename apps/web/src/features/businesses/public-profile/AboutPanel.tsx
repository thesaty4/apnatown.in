import Link from 'next/link';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';
import type { PublicProviderExpertise } from '@apnatown/shared/services';
import { Card } from '@apnatown/ui/cards/Card';
import { categoryPath } from '../../catalog';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';
import { businessTime, orderedWeek } from './hours';
import { ReportListingAction } from './ReportListingAction';

const chip =
  'inline-flex min-h-touch max-w-full items-center rounded-pill border border-border-strong bg-surface px-field-inline py-1 text-chip font-medium [overflow-wrap:anywhere]';

/**
 * About: description, provider expertise (Services-owned, multi-select),
 * product categories, fulfilment and the IST weekly hours with today marked
 * by text, not colour alone.
 */
export async function AboutPanel({
  detail,
  expertise,
  locale,
}: {
  detail: BusinessDiscoveryDetail;
  /** `null` when the provider expertise read failed; shops pass `[]`. */
  expertise: PublicProviderExpertise['items'] | null;
  locale: Locale;
}) {
  const t = await getTranslations('business.publicProfile.about');
  const day = await getTranslations('explore.screen.day');
  const { profile, description, hours } = detail;
  const name = (item: { nameEn: string; nameHi: string | null }) =>
    locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn;
  const week = orderedWeek(hours);
  return (
    <section aria-labelledby="profile-about-title" className="grid min-w-0 gap-stack-gap desktop:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <h2 id="profile-about-title" className="sr-only">{t('title')}</h2>
      <div className="grid min-w-0 content-start gap-stack-gap">
        <Card padded className="grid gap-2">
          <h3 className="m-0 font-display text-h3">{t('description')}</h3>
          <p className={`m-0 whitespace-pre-wrap [overflow-wrap:anywhere] ${description ? '' : 'text-text-2'}`}>
            {description ?? t('noDescription')}
          </p>
        </Card>
        {profile.kind === 'provider' && expertise === null && (
          <p role="note" className="m-0 text-small text-text-2">
            <span aria-hidden="true">⚠ </span>
            {t('expertiseError')}
          </p>
        )}
        {expertise && expertise.length > 0 && (
          <Card padded className="grid gap-3">
            <h3 className="m-0 font-display text-h3">{t('expertise')}</h3>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {expertise.map((item) => (
                <li key={item.id} className={chip}>{name(item)}</li>
              ))}
            </ul>
          </Card>
        )}
        {profile.categories.length > 0 && (
          <Card padded className="grid gap-3">
            <h3 className="m-0 font-display text-h3">{t('categories')}</h3>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {profile.categories.map((category) => (
                <li key={category.id}>
                  <Link href={publicHref(categoryPath(category.slug), locale)} className={`${chip} text-primary no-underline focus-visible:ring-focus`}>
                    {name(category)}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card padded className="grid gap-2">
          <h3 className="m-0 font-display text-h3">
            {profile.kind === 'shop' ? t('fulfilment') : t('serviceCoverage')}
          </h3>
          <ul className="m-0 grid list-none gap-1 p-0">
            {profile.kind === 'shop' && (
              <>
                <Fact icon={profile.delivery?.enabled ? '✓' : '✕'}>
                  {profile.delivery?.enabled
                    ? profile.delivery.radiusKm !== null
                      ? t('deliveryRadius', { km: profile.delivery.radiusKm })
                      : t('deliveryYes')
                    : t('deliveryNo')}
                </Fact>
                <Fact icon={profile.pickup ? '✓' : '✕'}>
                  {profile.pickup ? t('pickupYes') : t('pickupNo')}
                </Fact>
              </>
            )}
            {profile.serviceArea && <Fact icon="📍">{t('serviceArea', { area: profile.serviceArea })}</Fact>}
            {profile.serviceRadiusKm !== null && (
              <Fact icon="📍">{t('serviceRadius', { km: profile.serviceRadiusKm })}</Fact>
            )}
            {profile.kind === 'provider' && !profile.serviceArea && profile.serviceRadiusKm === null && (
              <Fact icon="ℹ️">{t('coverageUnknown')}</Fact>
            )}
          </ul>
        </Card>
        <ReportListingAction
          targetType={detail.item.business.kind === 'shop' ? 'business' : 'provider'}
          targetId={detail.item.business.id}
          name={name(detail.item.business)}
        />
      </div>
      <Card padded className="grid content-start gap-3">
        <h3 className="m-0 font-display text-h3">{t('hours')}</h3>
        {week.length === 0 ? (
          <p className="m-0 text-text-2">{t('noHours')}</p>
        ) : (
          <dl className="m-0 grid gap-1">
            {week.map((entry) => {
              const today = profile.today?.dayOfWeek === entry.dayOfWeek;
              const opens = businessTime(entry.opensAt, locale);
              const closes = businessTime(entry.closesAt, locale);
              return (
                <div
                  key={entry.dayOfWeek}
                  className={`flex flex-wrap justify-between gap-x-3 rounded-sm px-2 py-1.5 ${today ? 'bg-primary-soft font-semibold' : ''}`}
                >
                  <dt>
                    {day(`d${entry.dayOfWeek}`)}
                    {today && <span className="ms-1">({t('today')})</span>}
                  </dt>
                  <dd className="m-0">
                    {entry.isClosed
                      ? t('closed')
                      : opens && closes
                        ? t('range', { opens, closes })
                        : t('hoursUnavailable')}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </Card>
    </section>
  );
}

function Fact({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span aria-hidden="true" className="shrink-0">{icon}</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </li>
  );
}
