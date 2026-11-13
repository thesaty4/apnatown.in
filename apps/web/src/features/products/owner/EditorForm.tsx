'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessOwner } from '@apnatown/shared/businesses';
import type { ProductOwner } from '@apnatown/shared/products';
import { Button } from '@apnatown/ui/primitives/Button';
import { ApiFailure, failureCode } from '../../../shared/api/result';
import {
  SubcategorySuggestionSheet,
  catalogName,
  categoriesOptions,
  categoryOptions,
  useOwnerScope,
} from '../../catalog';
import { Alert } from '../../businesses/parts';
import { EditorDetails, fieldId } from './EditorDetails';
import { EditorPricing } from './EditorPricing';
import { EditorSide, SaveBar } from './EditorSide';
import {
  FIELD_ORDER,
  emptyDraft,
  fromProduct,
  serverField,
  toCreate,
  toUpdate,
  validate,
  type Draft,
  type FieldName,
} from './editor-model';
import { productErrorKey } from './errors';
import { productEditorHref, productsHref, readProductFilters } from './filters';
import { ProductIcon } from './icons';
import { useLeaveGuard } from './leave-guard';
import { ToastRegion, useToast } from './parts';
import { useSaveProduct } from './queries';

const fieldCodes: Record<string, string> = {
  PRODUCT_SKU_CONFLICT: 'skuTaken',
  PRODUCT_STOCK_INVALID: 'stockInvalid',
  FEATURED_ENTITLEMENT_UNAVAILABLE: 'featuredUnavailable',
  PRODUCT_INVALID: 'serverInvalid',
};
const fallbackField: Record<string, FieldName> = {
  PRODUCT_SKU_CONFLICT: 'sku',
  PRODUCT_STOCK_INVALID: 'onHand',
  FEATURED_ENTITLEMENT_UNAVAILABLE: 'featuredSelected',
};

const focusField = (field: FieldName) =>
  window.requestAnimationFrame(() => {
    const element = document.getElementById(fieldId(field));
    element?.focus();
    element?.scrollIntoView({ block: 'center' });
  });

/** S-VEND-06 / S-PROV-07 form. `product` null = create. */
export function EditorForm({
  business,
  product,
  baseUrl,
  onReload,
}: {
  business: BusinessOwner;
  product: ProductOwner | null;
  baseUrl: string;
  onReload: () => Promise<ProductOwner | undefined>;
}) {
  const kind = business.kind;
  const t = useTranslations('products.editor');
  const tv = useTranslations('products.validation');
  const te = useTranslations('products.errors');
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const filters = useMemo(() => readProductFilters((n) => params.get(n)), [params]);
  const { api } = useOwnerScope();
  const save = useSaveProduct(kind);
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() =>
    product ? fromProduct(product) : emptyDraft(business.primaryCategoryId ?? ''),
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));
  const [submitted, setSubmitted] = useState(false);
  const [suggest, setSuggest] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryDefault, setGalleryDefault] = useState(
    business.settings.galleryMediaDefault,
  );
  const dirty = JSON.stringify(draft) !== baseline;
  const guard = useLeaveGuard(dirty && !save.isPending);

  const categories = useQuery(categoriesOptions(api, 'product'));
  const category = categories.data?.items.find((c) => c.id === draft.categoryId);
  const detail = useQuery({
    ...categoryOptions(api, category?.slug ?? ''),
    enabled: Boolean(category),
  });

  const clientErrors = submitted ? validate(draft) : {};
  const failure = save.error instanceof ApiFailure ? save.error : undefined;
  const code = save.isError ? failureCode(save.error) : undefined;
  const serverKey = code ? fieldCodes[code] : undefined;
  const serverAt = code
    ? (serverField(failure?.fields[0]) ?? fallbackField[code])
    : undefined;
  const error = (field: FieldName) => {
    const key = clientErrors[field] ?? (serverAt === field ? serverKey : undefined);
    return key ? tv(key) : undefined;
  };
  useEffect(() => {
    if (serverAt) focusField(serverAt);
  }, [serverAt, save.error]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function reload() {
    const latest = await onReload();
    if (!latest) return;
    const next = fromProduct(latest);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setSubmitted(false);
    save.reset();
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const errors = validate(draft);
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) return void focusField(first);
    if (uploading) return;
    save.reset();
    if (!product)
      return void save.run({ mode: 'create', body: toCreate(draft) }, (saved) => {
        setBaseline(JSON.stringify(draft));
        router.replace(productEditorHref(kind, saved.id, filters), { scroll: true });
      });
    void save.run(
      { mode: 'update', id: product.id, body: toUpdate(draft, product) },
      (saved) => {
        const next = fromProduct(saved);
        setDraft(next);
        setBaseline(JSON.stringify(next));
        setSubmitted(false);
        toast.show(t('saved'));
      },
    );
  }

  const invalidCount = Object.keys(clientErrors).length;
  const options = (items: { id: string; nameEn: string; nameHi: string }[]) =>
    items.map((item) => ({ value: item.id, label: catalogName(item, locale) }));
  return (
    <div className="grid min-w-0 gap-4">
      <Link
        href={productsHref(kind, filters)}
        className="inline-flex min-h-touch items-center gap-1 justify-self-start font-semibold text-primary focus-visible:ring-focus"
      >
        <ProductIcon name="back" className="size-4.5" />
        {t('back')}
      </Link>
      <h1 className="m-0 text-h1">{product ? t('editTitle') : t('addTitle')}</h1>
      {code === 'PRODUCT_VERSION_CONFLICT' ? (
        <Alert
          tone="warn"
          role="alert"
          title={t('conflictTitle')}
          action={
            <Button size="small" variant="outline" onClick={() => void reload()}>
              {t('conflictReload')}
            </Button>
          }
        >
          <p className="m-0">{t('conflictBody')}</p>
        </Alert>
      ) : code && !serverAt ? (
        <Alert tone="bad" role="alert">
          <p className="m-0">{te(productErrorKey(code))}</p>
        </Alert>
      ) : null}
      {submitted && invalidCount > 0 && (
        <p role="alert" className="m-0 text-small font-medium text-error">
          {t('fixErrors', { count: invalidCount })}
        </p>
      )}
      <form noValidate onSubmit={submit} className="grid min-w-0 gap-4 desktop:grid-cols-[3fr_2fr] desktop:items-start">
        <div className="grid min-w-0 gap-4">
          <EditorDetails
            draft={draft}
            set={set}
            error={error}
            disabled={save.isPending}
            categories={options(categories.data?.items ?? [])}
            subcategories={options(detail.data?.subcategories ?? [])}
            subcategoriesLoading={Boolean(category) && detail.isPending}
            onSuggest={() => setSuggest(true)}
          />
          <EditorPricing draft={draft} set={set} error={error} disabled={save.isPending} />
        </div>
        <EditorSide
          draft={draft}
          set={set}
          error={error}
          disabled={save.isPending}
          galleryDefault={galleryDefault}
          onGalleryDefault={setGalleryDefault}
          shareUrl={product ? new URL(`/product/${product.slug}`, baseUrl).toString() : undefined}
          saving={save.isPending}
          businessId={business.id}
          uploading={uploading}
          onUploadPending={setUploading}
        />
        <div className="sticky bottom-0 z-10 -mx-1 rounded-md border border-border bg-surface p-3 shadow-2 desktop:hidden">
          <SaveBar saving={save.isPending} disabled={save.isPending} uploading={uploading} />
        </div>
      </form>
      <SubcategorySuggestionSheet
        open={suggest}
        onClose={() => setSuggest(false)}
        kind="product"
        defaultCategoryId={draft.categoryId || undefined}
        onSubmitted={() => toast.show(t('suggestionSent'))}
      />
      {guard.dialog}
      <ToastRegion {...toast} />
    </div>
  );
}
