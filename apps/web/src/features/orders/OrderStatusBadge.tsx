'use client';

import { useTranslations } from 'next-intl';
import type { OrderMode, OrderStatus } from '@apnatown/shared/orders';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { statusKey, statusView } from './status';

/** Order status badge: icon + localized text + status token colour. */
export function OrderStatusBadge({
  status,
  mode,
}: {
  status: OrderStatus;
  mode: OrderMode;
}) {
  const t = useTranslations('orders.status');
  const view = statusView[status];
  return (
    <StatusBadge
      tone={view.tone}
      icon={view.icon}
      label={t(statusKey(status, mode))}
    />
  );
}

/** Neutral mode badge (home delivery / self-pickup), icon + text. */
export function OrderModeBadge({ mode }: { mode: OrderMode }) {
  const t = useTranslations('orders.mode');
  return (
    <StatusBadge
      tone="neutral"
      icon={mode === 'pickup' ? '🏪' : '🚚'}
      label={t(mode)}
    />
  );
}
