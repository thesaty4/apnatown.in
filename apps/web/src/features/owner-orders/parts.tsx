'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@apnatown/shared/formatters';
import type {
  OrderMode,
  OrderStatus,
  PAYMENT_STATUSES,
  PaymentMethod,
} from '@apnatown/shared/orders';

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
import {
  Badge,
  StatusBadge,
  type BadgeTone,
} from '@apnatown/ui/primitives/Badge';

/** Message keys are camelCase; API enums are snake_case. */
export const statusKey = {
  placed: 'placed',
  accepted: 'accepted',
  preparing: 'preparing',
  ready: 'ready',
  out_for_delivery: 'outForDelivery',
  delivered: 'delivered',
  picked_up: 'pickedUp',
  cancelled: 'cancelled',
  refunded: 'refunded',
} as const satisfies Record<OrderStatus, string>;

export const paymentMethodKey = {
  upi: 'upi',
  card: 'card',
  net_banking: 'netBanking',
  wallet: 'wallet',
  cash: 'cash',
} as const satisfies Record<PaymentMethod, string>;

/** Prototype OST: icon + localized text + status token, never colour alone. */
const statusPresentation: Record<
  OrderStatus,
  { icon: string; tone: BadgeTone }
> = {
  placed: { icon: '◔', tone: 'st-placed' },
  accepted: { icon: '✓', tone: 'st-accepted' },
  preparing: { icon: '◐', tone: 'st-preparing' },
  ready: { icon: '▣', tone: 'st-ready' },
  out_for_delivery: { icon: '➜', tone: 'st-out' },
  delivered: { icon: '✔', tone: 'st-delivered' },
  picked_up: { icon: '✔', tone: 'st-delivered' },
  cancelled: { icon: '✕', tone: 'st-cancelled' },
  refunded: { icon: '↺', tone: 'st-refunded' },
};

export function useStatusLabel() {
  const t = useTranslations('ownerOrders.status');
  return (status: OrderStatus, mode: OrderMode) =>
    status === 'ready' && mode === 'pickup'
      ? t('readyForPickup')
      : t(statusKey[status]);
}

export function OrderStatusBadge({
  status,
  mode,
}: {
  status: OrderStatus;
  mode: OrderMode;
}) {
  const label = useStatusLabel();
  const { icon, tone } = statusPresentation[status];
  return <StatusBadge tone={tone} icon={icon} label={label(status, mode)} />;
}

export function ModeBadge({ mode }: { mode: OrderMode }) {
  const t = useTranslations('ownerOrders.mode');
  return (
    <Badge
      tone="neutral"
      icon={mode === 'pickup' ? '🛍️' : '🛵'}
      label={t(mode)}
    />
  );
}

/** "Cash on delivery · Pending": method + payment status, both localized. */
export function usePaymentLabel() {
  const t = useTranslations('ownerOrders.payment');
  return (method: PaymentMethod, status: PaymentStatus, mode: OrderMode) => {
    const methodLabel =
      method === 'cash'
        ? t(mode === 'pickup' ? 'payAtPickup' : 'cashOnDelivery')
        : t(`method.${paymentMethodKey[method]}`);
    return t('summary', { method: methodLabel, status: t(`status.${status}`) });
  };
}

export function useMoney() {
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (paise: number) => formatMoney(paise, locale);
}

/** UTC instant → IST, 12-hour, in the active locale. */
export function useIstDateTime() {
  const format = useFormatter();
  return (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
}

/** Snapshot names carry both languages; Hindi falls back to English. */
export function useLocalName() {
  const locale = useLocale();
  return (name: { nameEn: string; nameHi: string | null }) =>
    (locale === 'hi' ? name.nameHi : null) ?? name.nameEn;
}

/** "Atta 5 kg + 2 more" from the card summary. */
export function useItemSummary() {
  const t = useTranslations('ownerOrders.list');
  const name = useLocalName();
  return (summary: {
    nameEn: string;
    nameHi: string | null;
    moreCount: number;
  }) =>
    summary.moreCount > 0
      ? t('itemSummaryMore', { name: name(summary), count: summary.moreCount })
      : name(summary);
}
