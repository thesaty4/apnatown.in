import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ServicePublic } from '@apnatown/shared/public-listings';
import { ExploreResponseSchema } from '@apnatown/shared/search';
import { formatDistanceKm, formatMoney } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { createPublicServerApi } from '../../shared/api/server';
import { resource, unwrap } from '../../shared/api/result';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { ShareAction } from '../businesses';
import { ServiceBookmarkAction } from '../engagement';
import { LinkedVideosStrip } from '../gallery';
import { ReviewsSection } from '../reviews';
import { EnquiryForm } from '../services';
import { readCategories } from '../catalog/server';
import { ExploreCards } from './ExploreCards';
import { ProductGallery } from './ProductGallery';

const RELATED_LIMIT = 6;
const localized = (
  value: { nameEn: string; nameHi: string | null },
  locale: Locale,
) => (locale === 'hi' && value.nameHi ? value.nameHi : value.nameEn);

async function readRelated(service: ServicePublic) {
  const category = service.item.category?.slug;
  if (!category) return [];
  const api = createPublicServerApi();
  const result = await resource(async () =>
    unwrap(
      await api.GET('/explore', {
        params: {
          query: { tab: 'services', category, limit: RELATED_LIMIT + 1 },
        },
      }),
      ExploreResponseSchema,
    ),
  );
  if (result.kind !== 'ready') return [];
  return result.data.page.items
    .filter((item) => item.id !== service.item.id && item.kind === 'service')
    .slice(0, RELATED_LIMIT);
}

/** S-CUST-09 service profile in the S-CUST-08 product-detail layout. */
export async function ServiceDetail({
  data,
  locale,
}: {
  data: ServicePublic;
  locale: Locale;
}) {
  const t = await getTranslations('explore.service');
  const screen = await getTranslations('explore.screen');
  const enquiry = await getTranslations('service.enquiry');
  const { item, description, images } = data;
  const name = localized(item, locale);
  const [related, categories] = await Promise.all([
    readRelated(data),
    readCategories('service', item.path, locale),
  ]);
  const businessHref = publicHref(
    `/${item.business.kind === 'shop' ? 'shop' : 'provider'}/${item.business.slug}`,
    locale,
  );
  return (
    <article className="grid gap-stack-gap">
      <nav aria-label={t('breadcrumb')} className="text-small text-text-2">
        <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          <li>
            <Link href={publicHref('/', locale)} className="underline">
              {t('home')}
            </Link>{' '}
            /
          </li>
          <li>
            <Link href={publicHref('/services', locale)} className="underline">
              {t('services')}
            </Link>{' '}
            /
          </li>
          {item.category && (
            <li>
              <Link
                href={publicHref(`/category/${item.category.slug}`, locale)}
                className="underline"
              >
                {localized(item.category, locale)}
              </Link>{' '}
              /
            </li>
          )}
          <li aria-current="page" className="text-text [overflow-wrap:anywhere]">
            {name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-stack-gap desktop:grid-cols-2">
        <ProductGallery
          name={name}
          images={images}
          mediaLabel={t('media')}
          fallback="🛠️"
        />
        <div className="grid content-start gap-3">
          <h1 className="m-0 text-h1 [overflow-wrap:anywhere]">{name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-small">
            {item.rating !== null && (
              <span className="font-semibold">★ {item.rating.toFixed(1)}</span>
            )}
            <span className="text-text-2">
              {t('reviewsCount', { count: item.reviewCount })}
            </span>
            {item.verified && (
              <StatusBadge tone="ok" icon="✓" label={screen('verified')} />
            )}
            {item.featured && (
              <StatusBadge tone="offer" icon="★" label={screen('featured')} />
            )}
            {item.offers && (
              <StatusBadge tone="offer" icon="%" label={screen('offers')} />
            )}
          </div>
          <div>
            <p className="m-0 font-display text-h1 font-bold">
              {item.pricePaise === null
                ? screen('priceOnEnquiry')
                : item.priceType === 'range' && item.priceMaxPaise !== null
                  ? screen('priceRange', {
                      min: formatMoney(item.pricePaise, locale),
                      max: formatMoney(item.priceMaxPaise, locale),
                    })
                  : item.priceType === 'from'
                    ? screen('fromPrice', {
                        price: formatMoney(item.pricePaise, locale),
                      })
                    : formatMoney(item.pricePaise, locale)}
            </p>
            {item.area && (
              <p className="m-0 text-caption text-muted">
                📍 {localized(item.area, locale)}
              </p>
            )}
          </div>
          <a
            href="#svenq"
            className={`${buttonVariantClassName('primary')} tablet:justify-self-start`}
          >
            <NavIcon name="send" className="size-4.5" />
            {enquiry('cta')}
          </a>
          <p className="m-0 flex min-w-0 items-start gap-3 rounded-md border border-info bg-info-soft px-3.5 py-3 text-small text-text">
            <span aria-hidden="true" className="shrink-0">
              ℹ️
            </span>
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {enquiry('notice')}
            </span>
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <ServiceBookmarkAction serviceId={item.id} />
            <ShareAction name={name} path={item.path} label={t('share')} />
            {item.phone && (
              <a
                className="inline-flex min-h-touch items-center gap-2 rounded-md px-3 font-semibold text-primary underline"
                href={`tel:${item.phone}`}
                aria-label={`${screen('call')} ${name}`}
              >
                <NavIcon name="phone" className="size-4.5" />
                {screen('call')}
              </a>
            )}
          </div>
        </div>
      </div>

      <Card padded className="grid gap-3">
        <h2 className="m-0 text-h3">{t('offeredBy')}</h2>
        <Link href={businessHref} className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="text-h2">
            {item.business.kind === 'shop' ? '🏪' : '🛠️'}
          </span>
          <span className="grid min-w-0 flex-1">
            <b className="[overflow-wrap:anywhere]">
              {localized(item.business, locale)}
            </b>
            <span className="text-small text-text-2">
              {[
                item.distanceKm !== null &&
                  t('distance', {
                    km: formatDistanceKm(item.distanceKm, locale),
                  }),
                item.openNow !== null &&
                  screen(item.openNow ? 'openNow' : 'closed'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
          <NavIcon name="cr" className="size-5" />
        </Link>
        {data.serviceArea && (
          <>
            <hr className="m-0 border-border" />
            <p className="m-0 flex items-center gap-2 text-small">
              <NavIcon name="pin" className="size-4" />
              {t('serviceArea', { area: data.serviceArea })}
            </p>
          </>
        )}
        {data.experienceYears !== null && (
          <p className="m-0 flex items-center gap-2 text-small">
            <NavIcon name="check" className="size-4" />
            {t('experience', { years: data.experienceYears })}
          </p>
        )}
      </Card>

      {description && (
        <Card padded className="grid gap-2">
          <h2 className="m-0 text-h3">{t('details')}</h2>
          <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
            {description}
          </p>
        </Card>
      )}

      {(data.included.length > 0 || data.excluded.length > 0) && (
        <div className="grid gap-stack-gap tablet:grid-cols-2">
          {data.included.length > 0 && (
            <Card padded className="grid gap-2">
              <h2 className="m-0 text-h3">{t('included')}</h2>
              <ul className="m-0 list-inside list-disc">
                {data.included.map((value, index) => (
                  <li key={index}>{value}</li>
                ))}
              </ul>
            </Card>
          )}
          {data.excluded.length > 0 && (
            <Card padded className="grid gap-2">
              <h2 className="m-0 text-h3">{t('excluded')}</h2>
              <ul className="m-0 list-inside list-disc">
                {data.excluded.map((value, index) => (
                  <li key={index}>{value}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <LinkedVideosStrip targetType="service" targetId={item.id} />

      <ReviewsSection
        targetType="service"
        targetId={item.id}
        name={name}
        returnPath={item.path}
      />

      <EnquiryForm serviceId={item.id} serviceName={name} />

      {related.length > 0 && (
        <section aria-labelledby="service-related" className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="service-related" className="m-0 text-h2">
              {t('related')}
            </h2>
            {item.category && (
              <Link
                href={`${publicHref('/explore', locale)}?${new URLSearchParams({ tab: 'services', category: item.category.slug })}`}
                className="inline-flex min-h-touch items-center gap-1 font-semibold text-primary"
              >
                {t('viewAll')}
                <NavIcon name="cr" className="size-4" />
              </Link>
            )}
          </div>
          <ExploreCards
            tab="services"
            items={related}
            locale={locale}
            categories={categories ?? []}
            headingLevel="h3"
            listClassName="grid-flow-col auto-cols-[minmax(var(--at-service-card-min),44%)] sheet:auto-cols-[minmax(--spacing(50),--spacing(57.5))] overflow-x-auto overscroll-x-contain pb-2 snap-x snap-proximity [&>li]:snap-start"
          />
        </section>
      )}
    </article>
  );
}
