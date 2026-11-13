import Link from 'next/link';
import type { ReactNode, Ref } from 'react';
import type { Category } from '@apnatown/shared/catalog';
import type { ExploreCard, ExploreTab } from '@apnatown/shared/search';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ExploreCards } from '../../explore';
import type { Locale } from '../../../shared/i18n/preferences';
import { NavIcon } from '../../../shared/ui/NavIcon';

/**
 * Prototype `js4.js` V.home layouts: `.shopgrid` (1/2/3/4 columns, Explore's
 * shop grid), `.hscroll` (product rail) and `.hscroll.wide` (business rail).
 * `grid` keeps ExploreCards' own per-tab columns.
 */
export type HomeListingLayout = 'grid' | 'rail' | 'wideRail';

const railBase =
  'grid-flow-col overflow-x-auto overscroll-x-contain pb-2 snap-x snap-proximity [scrollbar-width:thin] [&>li]:snap-start';
const railClassName: Record<HomeListingLayout, string | undefined> = {
  grid: undefined,
  rail: `${railBase} auto-cols-[minmax(var(--at-product-card-min),44%)] sheet:auto-cols-[minmax(--spacing(50),--spacing(57.5))]`,
  wideRail: `${railBase} auto-cols-[minmax(var(--at-service-card-min),82%)] sheet:auto-cols-[--spacing(75)]`,
};
const skeletonGridClassName: Record<ExploreTab, string> = {
  products:
    'grid-cols-[repeat(auto-fill,minmax(min(100%,var(--at-product-card-min)),1fr))]',
  shops: 'shop-grid:grid-cols-2 desktop:grid-cols-3 wide:grid-cols-4',
  services:
    'grid-cols-[repeat(auto-fill,minmax(min(100%,var(--at-service-card-min)),1fr))]',
};

export type HomeViewAll = { href: string; label: string };

/** Section frame: `h2` heading plus an optional "View all" Explore link. */
function HomeSectionFrame({
  id,
  title,
  viewAll,
  headingRef,
  children,
}: {
  id: string;
  title: string;
  viewAll?: HomeViewAll | undefined;
  /** Lets a client island move focus here after its trigger unmounts. */
  headingRef?: Ref<HTMLHeadingElement> | undefined;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id={id}
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="min-w-0 text-h2 [overflow-wrap:anywhere] focus-visible:ring-focus"
        >
          {title}
        </h2>
        {viewAll && (
          <Link
            href={viewAll.href}
            aria-describedby={id}
            className="inline-flex min-h-touch max-w-full items-center gap-1 rounded-sm font-semibold text-primary underline [overflow-wrap:anywhere] focus-visible:ring-focus"
          >
            {viewAll.label}
            <NavIcon name="cr" className="size-4 rtl:rotate-180" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * One Home listing section. Without cards nothing renders (no zero or sample
 * data) unless `children` supplies a section state (skeleton, location
 * prompt, error) in place of the cards, keeping the same heading element.
 */
export function HomeListingSection({
  id,
  title,
  viewAll,
  tab,
  layout,
  items,
  locale,
  categories,
  headingRef,
  children,
}: {
  id: string;
  title: string;
  viewAll?: HomeViewAll | undefined;
  tab: ExploreTab;
  layout: HomeListingLayout;
  items: ExploreCard[];
  locale: Locale;
  categories: Category[];
  headingRef?: Ref<HTMLHeadingElement> | undefined;
  children?: ReactNode;
}) {
  if (!children && items.length === 0) return null;
  return (
    <HomeSectionFrame
      id={id}
      title={title}
      viewAll={children ? undefined : viewAll}
      headingRef={headingRef}
    >
      {children ?? (
        <ExploreCards
          tab={tab}
          items={items}
          locale={locale}
          categories={categories}
          listClassName={railClassName[layout]}
          headingLevel="h3"
        />
      )}
    </HomeSectionFrame>
  );
}

/** Loading placeholder with the same columns/rail and card proportions. */
export function HomeListingSkeleton({
  label,
  tab,
  layout,
  count,
}: {
  /** Announced once for the whole section. */
  label: string;
  tab: ExploreTab;
  layout: HomeListingLayout;
  count: number;
}) {
  return (
    <div role="status" aria-busy="true" className="min-w-0">
      <span className="sr-only">{label}</span>
      <ul
        aria-hidden="true"
        className={`grid gap-stack-gap ${railClassName[layout] ?? skeletonGridClassName[tab]}`}
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="min-w-0">
            <Card className="grid h-full overflow-hidden">
              <div
                className={tab === 'products' ? 'aspect-square' : 'aspect-[16/10]'}
              >
                <Skeleton label="" shape="block" />
              </div>
              <div className="grid gap-2 p-3">
                <div className="h-5 w-3/4">
                  <Skeleton label="" shape="block" className="rounded-sm" />
                </div>
                <div className="h-4 w-1/2">
                  <Skeleton label="" shape="block" className="rounded-sm" />
                </div>
                <div className="h-touch">
                  <Skeleton label="" shape="block" className="rounded-md" />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
