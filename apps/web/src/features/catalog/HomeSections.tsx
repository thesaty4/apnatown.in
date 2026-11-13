'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { CatalogHomeSection } from '@apnatown/shared/catalog';
import { Pill } from '@apnatown/ui/primitives/Pill';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import type { Locale } from '../../shared/i18n/preferences';
import {
  CatalogSection,
  TileGrid,
  catalogName,
  exploreHref,
  subcategoryTiles,
} from './parts';

type Curated = Extract<CatalogHomeSection, { kind: 'curated_categories' }>;
type Dedicated = Extract<CatalogHomeSection, { kind: 'single_category' }>;

/**
 * S-CUST-01 Catalog-owned Home sections. Search composes the localized,
 * active-only projection; this renders it. Sections with nothing to show are
 * omitted; a curated pill without subcategories keeps the section and shows
 * the empty state.
 */
export function HomeSections({
  sections,
}: {
  sections: readonly CatalogHomeSection[];
}) {
  const ordered = [...sections].sort((a, b) => a.position - b.position);
  return (
    <>
      {ordered.map((section) =>
        section.kind === 'single_category' ? (
          <DedicatedSection key={section.id} section={section} />
        ) : (
          <CuratedSection key={section.id} section={section} />
        ),
      )}
    </>
  );
}

function DedicatedSection({ section }: { section: Dedicated }) {
  const locale: Locale = useLocale() === 'hi' ? 'hi' : 'en';
  const id = useId();
  const active = section.subcategories.filter((item) => item.active);
  if (!section.category.active || active.length === 0) return null;
  const { category } = section;
  return (
    <CatalogSection
      id={id}
      title={section.heading}
      intro={section.supportingText}
    >
      <TileGrid
        label={section.heading}
        tiles={subcategoryTiles(category, active, locale, (sub) =>
          exploreHref(category.kind, locale, category.slug, sub.slug),
        )}
      />
    </CatalogSection>
  );
}

function CuratedSection({ section }: { section: Curated }) {
  const t = useTranslations('catalog.categories');
  const locale: Locale = useLocale() === 'hi' ? 'hi' : 'en';
  const id = useId();
  const pills = [...section.categories]
    .filter((item) => item.category.active)
    .sort((a, b) => a.position - b.position);
  const initial =
    pills.find((item) => item.category.id === section.initialCategoryId) ??
    pills[0];
  // Local UI state only: never written to the URL or Explore/Search filters.
  const [selectedId, setSelectedId] = useState(initial?.category.id);
  const selected =
    pills.find((item) => item.category.id === selectedId) ?? initial;
  if (!selected) return null;
  const { category } = selected;
  const subcategories = selected.subcategories.filter((item) => item.active);
  const name = catalogName(category, locale);
  return (
    <CatalogSection
      id={id}
      title={section.heading}
      intro={section.supportingText}
    >
      <div
        role="group"
        aria-label={t('pillsLabel', { section: section.heading })}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {pills.map((item) => (
          <Pill
            key={item.category.id}
            label={catalogName(item.category, locale)}
            icon={item.category.icon}
            selected={item.category.id === category.id}
            className="shrink-0"
            onClick={() => setSelectedId(item.category.id)}
          />
        ))}
      </div>
      <p role="status" className="sr-only">
        {t('showing', { category: name })}
      </p>
      {subcategories.length ? (
        <TileGrid
          label={name}
          tiles={subcategoryTiles(category, subcategories, locale, (sub) =>
            exploreHref(category.kind, locale, category.slug, sub.slug),
          )}
        />
      ) : (
        <EmptyState
          title={t('noSubcategoriesTitle')}
          message={t('noSubcategoriesMessage')}
          action={null}
        />
      )}
    </CatalogSection>
  );
}
