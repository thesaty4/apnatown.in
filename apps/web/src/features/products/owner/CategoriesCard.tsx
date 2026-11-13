'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { ProductPill } from '@apnatown/shared/products';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import {
  SuggestionStatusBadge,
  catalogName,
  categoriesOptions,
  useMySuggestions,
  useOwnerScope,
} from '../../catalog';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { ProductIcon } from './icons';

/** Customer-facing pill label: owner rename for the locale, else catalogue. */
export const pillLabel = (pill: ProductPill, locale: string) =>
  (locale === 'hi' ? pill.labelHi : pill.labelEn) ??
  (locale === 'hi' ? pill.catalogNameHi : pill.catalogNameEn);

const SUGGESTION_PREVIEW = 3;

/**
 * Prototype "Categories" card: fixed main categories, the visible pills that
 * customers see (read-only here; reordered/renamed in the pills sheet) and
 * the owner's latest subcategory suggestions with their review status.
 */
export function CategoriesCard({
  pills,
  pillsLoading,
  onSuggest,
  onManagePills,
}: {
  pills: ProductPill[] | undefined;
  pillsLoading: boolean;
  onSuggest: () => void;
  onManagePills: (() => void) | undefined;
}) {
  const t = useTranslations('products.categories');
  const locale = useLocale();
  const visible = (pills ?? []).filter((pill) => !pill.hidden);
  return (
    <Card padded className="grid gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="m-0 me-auto text-h4">{t('title')}</h2>
        <Button size="small" variant="text" onClick={onSuggest}>
          <NavIcon name="plus" className="size-4.5" />
          {t('suggest')}
        </Button>
        {onManagePills && (
          <Button size="small" variant="text" onClick={onManagePills}>
            <ProductIcon name="sliders" className="size-4.5" />
            {t('managePills')}
          </Button>
        )}
      </div>
      <p className="m-0 text-small text-text-2">{t('hint')}</p>
      {pillsLoading ? (
        <p className="m-0 text-small text-muted" role="status">
          {t('pillsLoading')}
        </p>
      ) : visible.length > 0 ? (
        <ul
          aria-label={t('pillsLabel')}
          className="m-0 flex min-w-0 list-none flex-wrap gap-2 p-0"
        >
          {visible.map((pill) => (
            <li
              key={pill.subcategoryId}
              className="inline-flex min-h-touch items-center rounded-pill border-(length:--at-chip-border) border-border-strong bg-surface px-field-inline py-1 text-chip font-medium [overflow-wrap:anywhere]"
            >
              {pillLabel(pill, locale)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-small text-muted">{t('pillsEmpty')}</p>
      )}
      <Suggestions />
    </Card>
  );
}

function Suggestions() {
  const t = useTranslations('products.categories');
  const locale = useLocale();
  const { api } = useOwnerScope();
  const query = useMySuggestions();
  const categories = useQuery(categoriesOptions(api, 'product'));
  const items = (query.data?.pages.flatMap((page) => page.items) ?? []).slice(
    0,
    SUGGESTION_PREVIEW,
  );
  if (items.length === 0) return null;
  const names = new Map(
    (categories.data?.items ?? []).map((item) => [
      item.id,
      catalogName(item, locale),
    ]),
  );
  return (
    <section aria-labelledby="product-my-suggestions" className="grid gap-2">
      <h3 id="product-my-suggestions" className="m-0 text-small font-semibold">
        {t('mySuggestions')}
      </h3>
      <ul className="m-0 grid list-none gap-2 p-0">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-small"
          >
            <span className="min-w-0 [overflow-wrap:anywhere]">
              <bdi className="font-semibold">
                {locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn}
              </bdi>
              {names.get(item.categoryId) && (
                <span className="text-text-2">
                  {' · '}
                  {names.get(item.categoryId)}
                </span>
              )}
            </span>
            <SuggestionStatusBadge value={item.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
