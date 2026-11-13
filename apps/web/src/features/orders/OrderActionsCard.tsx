'use client';

import { useTranslations } from 'next-intl';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';

const NOTE_ID = 'order-help-unavailable';

/** Server `allowedActions` drive Cancel. Invoice, refund and help requests
 * are not built yet: they are shown disabled with an explicit note. */
export function OrderActionsCard({
  order,
  onCancel,
}: {
  order: OrderDetail;
  onCancel: () => void;
}) {
  const t = useTranslations('orders.detail');
  const canCancel =
    order.viewer === 'customer' && order.allowedActions.includes('cancel');
  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h4">{t('helpTitle')}</h2>
      <div className="flex flex-wrap gap-2">
        {canCancel && (
          <Button variant="danger" size="small" onClick={onCancel}>
            {t('cancelOrder')}
          </Button>
        )}
        {(['invoice', 'refund', 'report'] as const).map((action) => (
          <Button
            key={action}
            variant="ghost"
            size="small"
            disabled
            aria-describedby={NOTE_ID}
          >
            {t(`actions.${action}`)}
          </Button>
        ))}
      </div>
      <p id={NOTE_ID} className="m-0 text-small text-text-2">
        {t('helpUnavailable')}
      </p>
    </Card>
  );
}
