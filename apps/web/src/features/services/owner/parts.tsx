'use client';

import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@apnatown/shared/formatters';
import type { ServiceOwner, ServiceUnit } from '@apnatown/shared/services';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { useSession } from '../../../shared/auth/SessionProvider';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { catalogName, categoriesOptions, categoryOptions } from '../../catalog';

/** `sq_ft` is the only unit whose message key differs from its wire value. */
export const unitKey = (unit: ServiceUnit) =>
  unit === 'sq_ft' ? 'squareFoot' : unit;

/** Localized price line, reusing the public card wording (Explore). */
export function useServicePrice() {
  const t = useTranslations('explore.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (
    service: Pick<
      ServiceOwner,
      'priceType' | 'priceFromPaise' | 'priceToPaise' | 'unit'
    >,
  ) => {
    const from = service.priceFromPaise;
    if (service.priceType === 'enquiry' || from === null)
      return t('priceOnEnquiry');
    const amount =
      service.priceType === 'range' && service.priceToPaise !== null
        ? t('priceRange', {
            min: formatMoney(from, locale),
            max: formatMoney(service.priceToPaise, locale),
          })
        : service.priceType === 'from'
          ? t('fromPrice', { price: formatMoney(from, locale) })
          : formatMoney(from, locale);
    return service.unit
      ? `${amount} ${t('perUnit', { unit: t(`unit.${unitKey(service.unit)}`) })}`
      : amount;
  };
}

/**
 * Category › subcategory names for the listed services from the public,
 * long-cached catalogue reads (one detail read per distinct category).
 */
export function useTaxonomyNames(services: readonly ServiceOwner[]) {
  const { api } = useSession();
  const locale = useLocale();
  const categories = useQuery(categoriesOptions(api, 'service'));
  const used = new Set(services.map((service) => service.categoryId));
  const slugs = (categories.data?.items ?? [])
    .filter((item) => used.has(item.id))
    .map((item) => item.slug);
  const details = useQueries({
    queries: slugs.map((slug) => categoryOptions(api, slug)),
  });
  return (service: ServiceOwner) => {
    const category = categories.data?.items.find(
      (item) => item.id === service.categoryId,
    );
    const subcategory = details
      .flatMap((detail) => detail.data?.subcategories ?? [])
      .find((item) => item.id === service.subcategoryId);
    return [category, subcategory]
      .filter((item) => item !== undefined)
      .map((item) => catalogName(item, locale))
      .join(' › ');
  };
}

/** Active / Paused with icon + text (never colour alone). */
export function ServiceStatusBadge({
  status,
}: {
  status: ServiceOwner['status'];
}) {
  const t = useTranslations('service.manager.status');
  return status === 'active' ? (
    <StatusBadge tone="ok" icon="●" label={t('active')} className="shrink-0" />
  ) : (
    <StatusBadge
      tone="neutral"
      icon="❚❚"
      label={t('paused')}
      className="shrink-0"
    />
  );
}

/** Public canonical service page (absolute, for copying/sharing). */
export const serviceUrl = (baseUrl: string, slug: string) =>
  new URL(`/service/${encodeURIComponent(slug)}`, baseUrl).toString();

/** Clipboard write that reports success instead of throwing. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Read-only canonical link with a copy button and a polite result. */
export function PublicLinkField({ url }: { url: string }) {
  const t = useTranslations('service.manager');
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  return (
    <div className="grid min-w-0 gap-2 border-t border-border pt-4">
      <Input label={t('publicLink')} readOnly value={url} dir="ltr" />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="small"
          variant="outline"
          onClick={() =>
            void copyText(url).then((ok) => setCopied(ok ? 'copied' : 'failed'))
          }
        >
          <NavIcon name="copy" className="size-4" />
          {t('copyLink')}
        </Button>
        <span role="status" className="text-small text-text-2">
          {copied === 'copied'
            ? t('linkCopied')
            : copied === 'failed'
              ? t('copyFailed')
              : ''}
        </span>
      </div>
    </div>
  );
}
