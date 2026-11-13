'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  formatLocalBusinessTime,
  formatMoney,
  parseRupees,
} from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { categoriesOptions, catalogName } from '../catalog';
import { areaOptions, geoName } from '../geo';
import { useSession } from '../../shared/auth/SessionProvider';
import type { ProfileForm } from './form-model';

/** Localized area name for a city/area pair (shared reference cache). */
export function useAreaName(cityId: string | null, areaId: string | null) {
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const areas = useInfiniteQuery({
    ...areaOptions(api, cityId ?? ''),
    enabled: Boolean(cityId),
  });
  const area = areas.data?.pages
    .flatMap((page) => page.items)
    .find((item) => item.id === areaId);
  return area ? geoName(area, locale) : undefined;
}

/** IST weekday (0 = Sunday) for "today" in the preview. */
function istWeekday() {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  }).format(new Date());
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
}

/**
 * Live preview of the unsaved form as customers will see the header card.
 * Presentation only: no rating/distance/verified values are invented.
 */
export function ProfilePreview({
  kind,
  form,
  verified,
}: {
  kind: BusinessKind;
  form: ProfileForm;
  verified: boolean;
}) {
  const t = useTranslations('business.preview');
  const th = useTranslations('business.hours');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const categories = useQuery(categoriesOptions(api, 'product'));
  const areaName = useAreaName(form.cityId, form.areaId);
  const primary = categories.data?.items.find(
    (item) => item.id === form.primaryCategoryId,
  );
  const name =
    (locale === 'hi' ? form.nameHi.trim() : '') ||
    form.nameEn.trim() ||
    t('namePlaceholder');
  const icon = primary?.icon ?? (kind === 'shop' ? '🏪' : '🔧');
  const today = form.hours[istWeekday()];
  const minimum = parseRupees(form.minimumOrder.trim());
  const meta = [primary && catalogName(primary, locale), areaName]
    .filter(Boolean)
    .join(' · ');
  return (
    <section aria-labelledby="business-preview" className="grid min-w-0 gap-2">
      <h2 id="business-preview" className="m-0 text-small font-semibold">
        {t('title')}
      </h2>
      <Card className="min-w-0 overflow-hidden" aria-hidden={false}>
        <div className="art-fill art-dim grid aspect-video place-items-center text-art">
          <span aria-hidden="true" className="art-shadow">
            {icon}
          </span>
        </div>
        <div className="grid min-w-0 gap-2 p-4">
          <div
            aria-hidden="true"
            className="art-fill -mt-12 grid size-16 place-items-center rounded-md border-4 border-surface text-h2"
          >
            {icon}
          </div>
          <p
            className="m-0 font-display text-h3 [overflow-wrap:anywhere]"
            lang={locale === 'hi' && form.nameHi.trim() ? 'hi' : undefined}
          >
            {name}
          </p>
          {verified && (
            <StatusBadge
              tone="sec"
              icon="🛡️"
              label={t('verified')}
              className="justify-self-start"
            />
          )}
          {meta && <p className="m-0 text-small text-text-2">{meta}</p>}
          <div className="flex flex-wrap gap-2">
            {form.temporarilyClosed ? (
              <StatusBadge tone="bad" icon="⏸" label={t('closed')} />
            ) : today?.open ? (
              <StatusBadge
                tone="ok"
                icon="🕒"
                label={t('todayHours', {
                  opens: formatLocalBusinessTime(today.opensAt, locale),
                  closes: formatLocalBusinessTime(today.closesAt, locale),
                })}
              />
            ) : (
              <StatusBadge tone="neutral" icon="🕒" label={th('closedToday')} />
            )}
            {kind === 'shop' && form.deliveryMethod && (
              <StatusBadge
                tone="sec"
                icon="🚚"
                label={
                  minimum !== null
                    ? t('deliversMin', { amount: formatMoney(minimum, locale) })
                    : t('delivers')
                }
              />
            )}
            {kind === 'shop' && form.pickupEnabled && (
              <StatusBadge tone="info" icon="🛍️" label={t('pickup')} />
            )}
            {kind === 'provider' && form.serviceArea.trim() && (
              <StatusBadge
                tone="info"
                icon="📍"
                label={form.serviceArea.trim()}
              />
            )}
          </div>
          {form.description.trim() && (
            <p className="m-0 line-clamp-4 text-small whitespace-pre-line text-text-2 [overflow-wrap:anywhere]">
              {form.description.trim()}
            </p>
          )}
        </div>
      </Card>
      <p className="m-0 text-caption text-muted">{t('note')}</p>
    </section>
  );
}
