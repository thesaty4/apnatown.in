'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { QuantityStepper } from '@apnatown/ui/commerce/QuantityStepper';
import { ToastRegion, type ToastMessage } from '@apnatown/ui/feedback/Toast';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { useLoginHref } from '../../shared/auth/AccessState';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { useAddToCart } from './add';
import { cartErrorKey } from './errors';
import { VariantPicker, type ProductVariant } from './VariantPicker';

const TOAST_MS = 6_000;

/**
 * Product page add-to-cart (prototype PDP: required variant chips when the
 * product has variants, stepper 1..inventory.maxQuantity, "Max n", add action,
 * toast with a cart link). Guests are supported; the first add reads the cart
 * so the guest cookie exists before the POST. The server stays authoritative
 * for stock, price and variants.
 */
export function AddToCart({
  productId,
  name,
  purchasable,
  variants,
  inventory,
}: {
  productId: string;
  name: string;
  /** A fixed public price exists. */
  purchasable: boolean;
  /** Active variants in display order; empty → `variantId: null`. */
  variants: readonly ProductVariant[];
  /** `maxQuantity` is already min(10, available stock). */
  inventory: { inStock: boolean; maxQuantity: number };
}) {
  const t = useTranslations('cart.add');
  const line = useTranslations('cart.line');
  const errors = useTranslations('cart.errors');
  const router = useRouter();
  const online = useOnline();
  const login = useLoginHref();
  const { mutation, ready } = useAddToCart(productId);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [needsVariant, setNeedsVariant] = useState(false);
  const stockId = useId();
  const [toast, setToast] = useState<ToastMessage>();
  const dismiss = useCallback(() => setToast(undefined), []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  if (!inventory.inStock || inventory.maxQuantity < 1)
    return (
      <section aria-label={t('action')} className="grid gap-3">
        <span id={stockId} className="justify-self-start">
          <StatusBadge
            tone="bad"
            icon={<NavIcon name="alert" className="size-3.5" />}
            label={t('outOfStock')}
          />
        </span>
        <Button
          variant="outline"
          className="tablet:justify-self-start"
          disabled
          aria-describedby={stockId}
        >
          <NavIcon name="cart" className="size-4.5" />
          {t('action')}
        </Button>
      </section>
    );
  if (!purchasable)
    return <p className="m-0 text-small text-text-2">{t('unavailable')}</p>;

  const max = inventory.maxQuantity;
  const hasVariants = variants.length > 0;
  const errorKey = mutation.isError ? cartErrorKey(mutation.error) : undefined;
  function add(mode: 'cart' | 'buy') {
    const selected = hasVariants
      ? variants.find((variant) => variant.id === variantId)?.id
      : null;
    if (selected === undefined) {
      setNeedsVariant(true);
      return;
    }
    void mutation.run(
      { quantity: Math.min(quantity, max), variantId: selected },
      () => {
        setQuantity(1);
        if (mode === 'buy') {
          router.push('/checkout');
          return;
        }
        setToast((current) => ({
          id: (current?.id ?? 0) + 1,
          message: t('added'),
          action: (
            <Link
              href="/cart"
              className="inline-flex min-h-touch items-center rounded-sm px-2 font-semibold underline focus-visible:ring-focus"
            >
              {t('viewCart')}
            </Link>
          ),
        }));
      },
    );
  }
  return (
    <section aria-label={t('action')} className="grid gap-3">
      {hasVariants && (
        <VariantPicker
          variants={variants}
          value={variantId}
          onChange={setVariantId}
          showRequired={needsVariant}
          disabled={mutation.isPending}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={Math.min(quantity, max)}
          min={1}
          max={max}
          label={line('quantity', { name })}
          decreaseLabel={line('decrease', { name })}
          increaseLabel={line('increase', { name })}
          disabled={mutation.isPending}
          onChange={setQuantity}
        />
        <span className="text-small text-text-2">
          {line('max', { count: max })}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="min-w-0 flex-1 basis-40 tablet:flex-none"
          loading={mutation.isPending}
          disabled={!ready || !online}
          onClick={() => add('cart')}
        >
          <NavIcon name="cart" className="size-4.5" />
          {t('action')}
        </Button>
        <Button
          className="min-w-0 flex-1 basis-40 tablet:flex-none"
          loading={mutation.isPending}
          disabled={!ready || !online}
          onClick={() => add('buy')}
        >
          {t('buyNow')}
        </Button>
      </div>
      {!online && <p className="m-0 text-small text-text-2">{t('offline')}</p>}
      {errorKey && (
        <p
          role="alert"
          className="m-0 flex flex-wrap items-start gap-2 rounded-md border border-error bg-error-soft px-3 py-2 text-small text-text"
        >
          <NavIcon name="alert" className="mt-0.5 size-4" />
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            {errors(errorKey)}
          </span>
          {errorKey === 'guestUnavailable' && (
            <Link
              className={buttonVariantClassName('primary', 'small')}
              href={login}
            >
              {t('logIn')}
            </Link>
          )}
        </p>
      )}
      <ToastRegion
        toast={toast}
        dismissLabel={t('dismiss')}
        onDismiss={dismiss}
      />
    </section>
  );
}
