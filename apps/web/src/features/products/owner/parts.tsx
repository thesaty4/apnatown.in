'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@apnatown/shared';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { ProductIcon } from './icons';

type Named = { nameEn: string; nameHi: string | null };

/** Owner-entered Hindi name when present and the UI is Hindi. */
export const productName = (item: Named, locale: string) =>
  locale === 'hi' && item.nameHi ? item.nameHi : item.nameEn;

/** Shared INR formatter (Indian grouping); never reimplemented here. */
export function useMoney() {
  const locale = useLocale();
  return useCallback(
    (paise: number) => formatMoney(paise, locale === 'hi' ? 'hi' : 'en'),
    [locale],
  );
}

export type StockState = 'out' | 'low' | 'ok';

/** Out = 0 on hand; low = at/below the alert; availability is separate. */
export const stockState = (onHand: number, threshold: number): StockState =>
  onHand === 0 ? 'out' : onHand <= threshold ? 'low' : 'ok';

/** Prototype stock pill: tone + icon + localized words, never colour-only. */
export function StockBadge({
  onHand,
  threshold,
}: {
  onHand: number;
  threshold: number;
}) {
  const t = useTranslations('products.stock');
  const state = stockState(onHand, threshold);
  const tone = state === 'out' ? 'bad' : state === 'low' ? 'warn' : 'ok';
  const icon = state === 'out' ? '⛔' : state === 'low' ? '⚠️' : '✓';
  return (
    <StatusBadge
      tone={tone}
      icon={icon}
      label={t(state, { count: onHand })}
    />
  );
}

/** Product thumbnail placeholder (resolved images are not in owner lists). */
export function ProductArt({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-md bg-primary-soft text-primary ${size === 'sm' ? 'size-8' : 'size-14'}`}
    >
      <ProductIcon name="tag" className={size === 'sm' ? 'size-4' : 'size-6'} />
    </span>
  );
}

/** Prototype qty stepper (− n +): 44px targets, value announced politely. */
export function QuantityStepper({
  value,
  label,
  onChange,
  disabled,
}: {
  value: number;
  label: string;
  onChange: (delta: 1 | -1) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('products.inventory');
  const button =
    'grid min-h-touch min-w-touch place-items-center rounded-sm bg-primary-soft text-primary focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-stretch gap-0.5 rounded-md border-2 border-primary p-0.5"
    >
      <button
        type="button"
        className={button}
        disabled={disabled || value <= 0}
        aria-label={t('decrease', { name: label })}
        onClick={() => onChange(-1)}
      >
        <ProductIcon name="minus" className="size-4" />
      </button>
      <output
        aria-live="polite"
        className="grid min-w-12 place-items-center px-2 font-semibold tabular-nums"
      >
        {value}
      </output>
      <button
        type="button"
        className={button}
        disabled={disabled}
        aria-label={t('increase', { name: label })}
        onClick={() => onChange(1)}
      >
        <ProductIcon name="plus" className="size-4" />
      </button>
    </div>
  );
}

const TOAST_MS = 6_000;

/** Screen-local polite toast (same contract as the enquiries toast). */
export function useToast() {
  const [toast, setToast] = useState<{ id: number; message: string }>();
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const show = useCallback(
    (message: string) =>
      setToast((current) => ({ id: (current?.id ?? 0) + 1, message })),
    [],
  );
  const dismiss = useCallback(() => setToast(undefined), []);
  return { toast, show, dismiss };
}

export function ToastRegion({
  toast,
  dismiss,
}: ReturnType<typeof useToast>) {
  const t = useTranslations('products.list');
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-70 flex justify-center desktop:bottom-6"
    >
      {toast && (
        <p
          key={toast.id}
          className="pointer-events-auto m-0 flex max-w-full items-center gap-3 rounded-md bg-text px-4 py-3 text-surface shadow-3"
        >
          <span aria-hidden="true">✓</span>
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {toast.message}
          </span>
          <button
            type="button"
            className="min-h-touch min-w-touch shrink-0 rounded-sm font-semibold focus-visible:ring-focus"
            onClick={dismiss}
          >
            {t('dismiss')}
          </button>
        </p>
      )}
    </div>
  );
}

/** Table-shaped loading placeholder (rows, not a spinner). */
export function RowsSkeleton({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid gap-px overflow-hidden rounded-lg border border-border bg-border"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-center gap-3 bg-surface p-3"
        >
          <span className="size-14 shrink-0 rounded-md skeleton-fill animate-skeleton motion-reduce:animate-none" />
          <span className="grid flex-1 gap-2">
            <span className="h-4 w-1/2 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none" />
            <span className="h-3 w-1/3 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none" />
          </span>
        </div>
      ))}
    </div>
  );
}

const fill = 'skeleton-fill animate-skeleton motion-reduce:animate-none';

/** Editor-shaped placeholder: back link, title, field cards + side column. */
export function EditorSkeleton({ label }: { label: string }) {
  const field = (key: number) => (
    <span key={key} className="grid gap-2">
      <span className={`h-4 w-1/3 rounded-sm ${fill}`} />
      <span className={`h-11 rounded-md ${fill}`} />
    </span>
  );
  return (
    <div role="status" aria-busy="true" className="grid min-w-0 gap-4">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className={`h-5 w-24 rounded-sm ${fill}`} />
      <span aria-hidden="true" className={`h-9 w-48 rounded-sm ${fill}`} />
      <div
        aria-hidden="true"
        className="grid gap-4 desktop:grid-cols-[3fr_2fr] desktop:items-start"
      >
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-4">
          {[0, 1, 2, 3].map(field)}
        </div>
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-4">
          <span className={`h-32 rounded-md ${fill}`} />
          {[0, 1].map(field)}
        </div>
      </div>
    </div>
  );
}
