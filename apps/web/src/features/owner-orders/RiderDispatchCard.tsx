'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { OrderDeliveryBlock } from '@apnatown/shared/delivery';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { Alert, type AlertTone } from '../businesses/parts';
import { failReasonKey } from '../rider/fail-reasons';
import { AssignRiderSheet } from './AssignRiderSheet';
import { useDispatchCommand } from './dispatch-queries';
import { orderErrorKey } from './errors';
import { useSecondsLeft } from './parts';

type Presentation = {
  icon: string;
  tone: AlertTone;
  key: string;
  detail?: 'countdown' | 'reason' | 'retry' | 'intro';
};

const jobPresentation: Partial<
  Record<OrderDeliveryBlock['jobStatus'], Presentation>
> = {
  accepted: { icon: '🛵', tone: 'ok', key: 'toShop' },
  reached_shop: { icon: '🏪', tone: 'ok', key: 'atShop' },
  picked_up: { icon: '➜', tone: 'info', key: 'outForDelivery' },
  reached_drop: { icon: '📍', tone: 'info', key: 'atDrop' },
  delivered: { icon: '✔', tone: 'ok', key: 'delivered' },
  failed: { icon: '⛔', tone: 'bad', key: 'failed', detail: 'reason' },
  cancelled: { icon: '✕', tone: 'warn', key: 'cancelled' },
};

/** Job/offer projection → icon + localized text (never colour alone). */
function present(delivery: OrderDeliveryBlock | null): Presentation {
  if (!delivery)
    return { icon: '🛵', tone: 'info', key: 'notRequested', detail: 'intro' };
  const job = jobPresentation[delivery.jobStatus];
  if (job) return job;
  if (delivery.assignmentState === 'offered')
    return { icon: '⏳', tone: 'info', key: 'offered', detail: 'countdown' };
  if (delivery.assignmentState === 'unassigned')
    return { icon: '⚠️', tone: 'warn', key: 'unassigned', detail: 'retry' };
  return { icon: '🔎', tone: 'info', key: 'finding' };
}

/** Platform-rider orders with a job or a dispatch action. */
export const showsRiderDispatch = (order: OrderDetail) =>
  order.mode === 'delivery' &&
  order.deliveryMethod === 'apna_town_rider' &&
  (order.delivery !== null ||
    order.allowedActions.includes('request_rider') ||
    order.allowedActions.includes('assign_rider'));

/**
 * S-VEND-04 / S-PROV-05 rider dispatch: live job/offer state from the
 * order's `delivery` block (order realtime events keep it current), plus
 * Auto-assign (`request_rider`) and Assign rider (`assign_rider`) rendered
 * only from server `allowedActions`. Assignment is an offer the rider must
 * accept; nothing is shown as assigned before the server says so.
 */
export function RiderDispatchCard({
  kind,
  order,
}: {
  kind: BusinessKind;
  order: OrderDetail;
}) {
  const t = useTranslations('ownerOrders.dispatch');
  const te = useTranslations('ownerOrders.errors');
  const reasons = useTranslations('rider.failReasons');
  const online = useOnline();
  const command = useDispatchCommand(kind, order.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [done, setDone] = useState<string>();
  const delivery = order.delivery;
  const seconds = useSecondsLeft(
    delivery?.assignmentState === 'offered' ? delivery.offerExpiresAt : null,
  );
  const allowed = new Set(order.allowedActions);
  const canRequest = allowed.has('request_rider');
  const canAssign = allowed.has('assign_rider');
  const pending = command.mutation.isPending;
  const code = command.mutation.isError
    ? failureCode(command.mutation.error)
    : undefined;
  const state = present(delivery);
  const rider = delivery?.rider ?? null;
  const name = rider?.displayName ?? t('riderFallback');

  const request = () => {
    if (pending || !canRequest) return;
    setDone(undefined);
    command.mutation.reset();
    command.run({ type: 'request', expectedOrderVersion: order.version }, () =>
      setDone(t('requested')),
    );
  };

  return (
    <Card padded className="grid gap-3" aria-labelledby="rider-dispatch">
      <h2 id="rider-dispatch" className="m-0 text-h3">
        {t('title')}
      </h2>
      <div role="status" aria-live="polite" className="grid gap-2">
        <Alert
          tone={state.tone}
          icon={state.icon}
          title={t(state.key, { name })}
        >
          {state.detail === 'intro' && <p className="m-0">{t('intro')}</p>}
          {state.detail === 'retry' && <p className="m-0">{t('retryHint')}</p>}
          {state.detail === 'reason' && delivery?.failReason && (
            <p className="m-0">
              {t('reason', {
                reason: reasons(failReasonKey[delivery.failReason]),
              })}
            </p>
          )}
          {state.detail === 'countdown' && delivery?.offerExpiresAt && (
            <p className="m-0" aria-hidden="true">
              {seconds > 0 ? t('secondsLeft', { seconds }) : t('waitingReply')}
            </p>
          )}
        </Alert>
        {done && (
          <p className="m-0 inline-flex gap-2 justify-self-start rounded-md bg-success-soft px-3 py-2 text-small text-text">
            <span aria-hidden="true">✓</span>
            {done}
          </p>
        )}
      </div>
      {rider && (
        <dl className="m-0 grid gap-x-4 gap-y-1 text-small tablet:grid-cols-[max-content_1fr]">
          <dt className="text-muted">{t('rider')}</dt>
          <dd className="m-0 font-semibold [overflow-wrap:anywhere]">
            {rider.displayName}
          </dd>
          <dt className="text-muted">{t('vehicle')}</dt>
          <dd className="m-0 [overflow-wrap:anywhere]">
            {rider.vehicleLabel ?? t('vehicleUnknown')}
          </dd>
        </dl>
      )}
      {code && (
        <Alert tone="bad" role="alert">
          {te(orderErrorKey(code))}
        </Alert>
      )}
      {(canRequest || canAssign) && (
        <div className="grid gap-2 tablet:grid-cols-2">
          {canRequest && (
            <Button
              disabled={!online || pending}
              loading={pending}
              onClick={request}
            >
              {t(delivery ? 'autoAssignAgain' : 'autoAssign')}
            </Button>
          )}
          {canAssign && (
            <Button
              variant="outline"
              disabled={!online || pending}
              aria-haspopup="dialog"
              onClick={() => {
                command.mutation.reset();
                setDone(undefined);
                setSheetOpen(true);
              }}
            >
              {t('assign')}
            </Button>
          )}
        </div>
      )}
      <AssignRiderSheet
        kind={kind}
        order={order}
        open={sheetOpen && canAssign}
        onClose={() => setSheetOpen(false)}
        onDone={(riderName) => {
          setSheetOpen(false);
          setDone(t('offerSent', { name: riderName }));
        }}
      />
    </Card>
  );
}
