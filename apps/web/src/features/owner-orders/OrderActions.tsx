'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type {
  OrderAllowedAction,
  OrderDetail,
  OrderTransitionEvent,
} from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { Alert } from '../businesses/parts';
import { STALE_CODES, orderErrorKey } from './errors';
import { HandoverSheet, type HandoverAction } from './HandoverSheet';
import { useOwnerOrderCommand } from './queries';
import { RejectSheet } from './RejectSheet';
import { showsRiderDispatch } from './RiderDispatchCard';

type Direct = Extract<
  OrderAllowedAction,
  'accept' | 'start_preparing' | 'mark_ready' | 'self_dispatch'
>;
const DIRECT: readonly Direct[] = [
  'accept',
  'start_preparing',
  'mark_ready',
  'self_dispatch',
];
const labelKey = {
  accept: 'accept',
  start_preparing: 'startPreparing',
  mark_ready: 'markReady',
  self_dispatch: 'selfDispatch',
} as const satisfies Record<Direct, string>;
const doneKey = {
  accept: 'accepted',
  start_preparing: 'preparing',
  mark_ready: 'ready',
  self_dispatch: 'dispatched',
  reject: 'rejected',
  self_complete: 'delivered',
  verify_pickup: 'pickedUp',
} as const;

/**
 * "Update status" card. Buttons render ONLY from server `allowedActions`
 * and send the rendered versions; the UI never decides a transition.
 */
export function OrderActions({
  kind,
  order,
  reload,
  reloading,
}: {
  kind: BusinessKind;
  order: OrderDetail;
  reload: () => void;
  reloading: boolean;
}) {
  const t = useTranslations('ownerOrders.actions');
  const te = useTranslations('ownerOrders.errors');
  const online = useOnline();
  const command = useOwnerOrderCommand(kind, order.id);
  const [running, setRunning] = useState<Direct>();
  const [sheet, setSheet] = useState<'reject' | HandoverAction>();
  const [done, setDone] = useState<keyof typeof doneKey>();
  const allowed = new Set(order.allowedActions);
  const pending = command.mutation.isPending;
  const code = command.mutation.isError
    ? failureCode(command.mutation.error)
    : undefined;
  const stale = Boolean(code && STALE_CODES.has(code));
  const disabled = !online || pending || stale;

  const direct = (action: Direct) => {
    if (pending || !allowed.has(action)) return;
    setRunning(action);
    setDone(undefined);
    command.mutation.reset();
    command.run(
      action === 'self_dispatch'
        ? { type: 'self_dispatch', expectedOrderVersion: order.version }
        : {
            type: 'transition',
            event: action as OrderTransitionEvent,
            expectedVersion: order.version,
          },
      () => setDone(action),
    );
  };

  const label = (action: Direct) =>
    t(
      action === 'mark_ready' && order.mode === 'pickup'
        ? 'markReadyPickup'
        : labelKey[action],
    );
  const shown = DIRECT.filter((action) => allowed.has(action));
  // Rider dispatch actions live in the Rider dispatch card.
  const hasAny =
    shown.length > 0 ||
    allowed.has('reject') ||
    allowed.has('self_complete') ||
    allowed.has('verify_pickup');

  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h3">{t('title')}</h2>
      <p role="status" className="m-0 empty:hidden">
        {done ? (
          <span className="inline-flex gap-2 rounded-md bg-success-soft px-3 py-2 text-small text-text">
            <span aria-hidden="true">✓</span>
            {t(`done.${doneKey[done]}`)}
          </span>
        ) : null}
      </p>
      {order.handover?.state === 'locked' && (
        <Alert tone="warn" role="note">
          <p className="m-0">{te('codeLocked')}</p>
        </Alert>
      )}
      {stale ? (
        <Alert
          tone="warn"
          role="alert"
          action={
            <Button
              size="small"
              variant="outline"
              disabled={reloading || !online}
              loading={reloading}
              onClick={() => {
                command.mutation.reset();
                reload();
              }}
            >
              {t('reload')}
            </Button>
          }
        >
          {te(orderErrorKey(code!))}
        </Alert>
      ) : (
        code && (
          <Alert tone="bad" role="alert">
            {te(orderErrorKey(code))}
          </Alert>
        )
      )}
      {!hasAny ? (
        <p className="m-0 text-small text-text-2">
          {t(showsRiderDispatch(order) ? 'seeRiderDispatch' : 'noActions')}
        </p>
      ) : (
        <div className="grid gap-2 tablet:grid-cols-2">
          {shown.map((action, index) => (
            <Button
              key={action}
              variant={index === 0 ? 'primary' : 'outline'}
              disabled={disabled}
              loading={pending && running === action}
              onClick={() => direct(action)}
            >
              {label(action)}
            </Button>
          ))}
          {allowed.has('self_complete') && (
            <Button
              disabled={disabled}
              aria-haspopup="dialog"
              onClick={() => setSheet('self_complete')}
            >
              {t('selfComplete')}
            </Button>
          )}
          {allowed.has('verify_pickup') && (
            <Button
              disabled={disabled}
              aria-haspopup="dialog"
              onClick={() => setSheet('verify_pickup')}
            >
              {t('verifyPickup')}
            </Button>
          )}
          {allowed.has('reject') && (
            <Button
              variant="danger"
              disabled={disabled}
              aria-haspopup="dialog"
              onClick={() => setSheet('reject')}
            >
              {t('reject')}
            </Button>
          )}
        </div>
      )}
      <UnavailableTools />
      {/* Sheets stay mounted while the order is shown: a success re-reads
          the order (allowedActions change) and must still report back. */}
      <RejectSheet
        kind={kind}
        order={order}
        open={sheet === 'reject' && allowed.has('reject')}
        onClose={() => setSheet(undefined)}
        onDone={() => {
          setSheet(undefined);
          setDone('reject');
        }}
      />
      <HandoverSheet
        kind={kind}
        order={order}
        action={order.mode === 'delivery' ? 'self_complete' : 'verify_pickup'}
        open={
          (sheet === 'self_complete' || sheet === 'verify_pickup') &&
          allowed.has(sheet)
        }
        onClose={() => setSheet(undefined)}
        onDone={() => {
          setSheet(undefined);
          setDone(
            order.mode === 'delivery' ? 'self_complete' : 'verify_pickup',
          );
        }}
      />
    </Card>
  );
}

/** Prototype tools without a shipped backend: stated, never faked. */
function UnavailableTools() {
  const t = useTranslations('ownerOrders.actions');
  return (
    <div className="grid gap-1 border-t border-border pt-3">
      <p className="m-0 text-small font-semibold">{t('moreTools')}</p>
      <ul className="m-0 grid list-none gap-1 p-0 text-small text-text-2">
        {(['itemAvailability', 'packingSlip', 'invoice'] as const).map(
          (key) => (
            <li key={key} className="flex flex-wrap gap-x-2">
              <span>{t(`tools.${key}`)}</span>
              <span className="text-muted">· {t('notAvailableYet')}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
