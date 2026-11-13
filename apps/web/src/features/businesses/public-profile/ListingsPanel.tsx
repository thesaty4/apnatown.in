'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import type { Category } from '@apnatown/shared/catalog';
import { Pill } from '@apnatown/ui/primitives/Pill';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { useSession } from '../../../shared/auth/SessionProvider';
import type { Locale } from '../../../shared/i18n/preferences';
import { businessProductsOptions, businessServicesOptions } from './api';
import { ListingResults } from './ListingResults';
import { PillRow } from './PillRow';
import type { ProfileSegment, ProfileUrlState } from './url-state';

const label = (item: { labelEn: string; labelHi: string }, locale: Locale) =>
  locale === 'hi' ? item.labelHi : item.labelEn;
const sum = (items: readonly { count: number }[]) =>
  items.reduce((total, item) => total + item.count, 0);

/**
 * "Products & Services" tab. Both owning-module reads load so only the
 * segments that have customer-visible listings are offered (G-01); the
 * inactive segment's unfiltered first page doubles as its count. Pill counts
 * are the API's pre-filter counts, so they never jump while filtering.
 */
export function ListingsPanel({
  slug,
  kind,
  state,
  categories,
  locale,
  onChange,
}: {
  slug: string;
  kind: 'shop' | 'provider';
  state: ProfileUrlState;
  categories: Category[];
  locale: Locale;
  onChange: (patch: Pick<ProfileUrlState, 'type' | 'cat' | 'sub'>) => void;
}) {
  const t = useTranslations('business.publicProfile.listings');
  const profile = useTranslations('business.profile');
  const format = useFormatter();
  const { api } = useSession();
  const preferred: ProfileSegment = kind === 'shop' ? 'products' : 'services';
  const requested = state.type ?? preferred;
  const products = useInfiniteQuery(
    businessProductsOptions(api, slug, requested === 'products' ? state.sub : undefined),
  );
  const services = useInfiniteQuery(
    businessServicesOptions(
      api,
      slug,
      requested === 'services' ? state.cat : undefined,
      requested === 'services' ? state.sub : undefined,
    ),
  );
  const productPage = products.data?.pages[0];
  const servicePage = services.data?.pages[0];
  const totals = {
    products: productPage ? sum(productPage.pills) : null,
    services: servicePage ? sum(servicePage.categories) : null,
  };
  // A segment is offered unless it is known to be empty.
  const offered = (segment: ProfileSegment) => totals[segment] !== 0;
  const other: ProfileSegment = requested === 'products' ? 'services' : 'products';
  const segment =
    state.type === undefined && !offered(requested) && offered(other) ? other : requested;
  const filtered = Boolean(state.cat || state.sub);

  if (products.isPending && services.isPending)
    return <Skeleton label={t('loading')} />;
  if (totals.products === 0 && totals.services === 0)
    return (
      <EmptyState
        headingLevel="h2"
        icon={kind === 'shop' ? '🛍️' : '🛠️'}
        title={profile(kind === 'shop' ? 'noProducts' : 'noServices')}
        message={t(kind === 'shop' ? 'noProductsMessage' : 'noServicesMessage')}
        action={null}
      />
    );

  const segments = (['products', 'services'] as const).filter(
    (value) => offered(value) || value === segment,
  );
  const select = (patch: Pick<ProfileUrlState, 'cat' | 'sub'>) =>
    onChange({ type: segment === preferred ? undefined : segment, ...patch });
  const selectedCategory = servicePage?.categories.find((item) => item.slug === state.cat);

  return (
    <section aria-labelledby="profile-listings-title" className="grid min-w-0 gap-3">
      <h2 id="profile-listings-title" className="sr-only">{t('title')}</h2>
      <div className="sticky top-[calc(var(--spacing-sat)+var(--spacing-nav-h))] z-10 -mx-1 grid gap-2 bg-bg px-1 py-2">
        {segments.length > 1 && (
          <div role="group" aria-label={t('segmentLabel')} className="flex flex-wrap gap-2">
            {segments.map((value) => {
              const total = totals[value];
              return (
                <Pill
                  key={value}
                  label={t(value)}
                  {...(total !== null && { count: format.number(total) })}
                  selected={segment === value}
                  onClick={() =>
                    onChange({ type: value === preferred ? undefined : value, cat: undefined, sub: undefined })
                  }
                />
              );
            })}
          </div>
        )}
        {segment === 'products' && productPage && productPage.pills.length > 0 && (
          <PillRow
            label={t('productPills')}
            options={[
              { value: undefined, label: t('all'), count: sum(productPage.pills) },
              ...productPage.pills.map((pill) => ({
                value: pill.slug,
                label: label(pill, locale),
                count: pill.count,
              })),
            ]}
            selected={state.sub}
            onSelect={(sub) => select({ sub })}
          />
        )}
        {segment === 'services' && servicePage && servicePage.categories.length > 0 && (
          <PillRow
            label={t('categoryPills')}
            options={[
              { value: undefined, label: t('all'), count: sum(servicePage.categories) },
              ...servicePage.categories.map((item) => ({
                value: item.slug,
                label: label(item, locale),
                count: item.count,
              })),
            ]}
            selected={state.cat}
            onSelect={(cat) => select({ cat, sub: undefined })}
          />
        )}
        {segment === 'services' && servicePage && selectedCategory && (
          <PillRow
            label={t('subcategoryPills', { category: label(selectedCategory, locale) })}
            options={[
              { value: undefined, label: t('all'), count: selectedCategory.count },
              ...servicePage.subcategories
                .filter((item) => item.categoryId === selectedCategory.id)
                .map((item) => ({ value: item.slug, label: label(item, locale), count: item.count })),
            ]}
            selected={state.sub}
            onSelect={(sub) => select({ cat: state.cat, sub })}
          />
        )}
      </div>
      <ListingResults
        segment={segment}
        query={segment === 'products' ? products : services}
        categories={categories}
        locale={locale}
        filtered={filtered}
        onShowAll={() => select({ cat: undefined, sub: undefined })}
      />
    </section>
  );
}
