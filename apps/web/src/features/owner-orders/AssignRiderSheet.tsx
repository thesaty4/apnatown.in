'use client';

import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { RiderCandidate } from '@apnatown/shared/delivery';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Badge, StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { Alert } from '../businesses/parts';
import { useDispatchCommand, useRiderCandidates } from './dispatch-queries';
import { ORDER_DENIED_CODES, orderErrorKey } from './errors';
import { useKm } from './parts';

const unavailableKey = {
  busy: 'busy',
  pending_offer: 'pendingOffer',
  declined: 'declined',
} as const;

/**
 * "Assign a rider" picker: the nearest online riders the server scoped to
 * this order's city, with distance and availability. Assign sends a directed
 * 60 s offer with the versions the list was read at; availability is
 * re-checked by the server, so a stale row fails safely and the list reloads.
 */
export function AssignRiderSheet({
  kind,
  order,
  open,
  onClose,
  onDone,
}: {
  kind: BusinessKind;
  order: OrderDetail;
  open: boolean;
  onClose: () => void;
  onDone: (riderName: string) => void;
}) {
  const t = useTranslations('ownerOrders.dispatch');
  const te = useTranslations('ownerOrders.errors');
  const online = useOnline();
  const riders = useRiderCandidates(kind, order.id, open);
  const command = useDispatchCommand(kind, order.id);
  const busy = command.mutation.isPending;
  const code = command.mutation.isError
    ? failureCode(command.mutation.error)
    : undefined;

  const close = () => {
    if (busy) return;
    command.mutation.reset();
    onClose();
  };

  const assign = (rider: RiderCandidate) => {
    const page = riders.data;
    if (!page || busy || !rider.available) return;
    command.mutation.reset();
    command.run(
      {
        type: 'assign',
        riderUserId: rider.riderUserId,
        expectedOrderVersion: page.orderVersion,
        expectedJobVersion:
          page.jobVersion ?? order.delivery?.jobVersion ?? null,
      },
      () => onDone(rider.displayName),
    );
  };

  let body;
  if (riders.data)
    body =
      riders.data.items.length === 0 ? (
        <EmptyState
          headingLevel="h2"
          icon="🛵"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={null}
        />
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {riders.data.items.map((rider) => (
            <CandidateRow
              key={rider.riderUserId}
              rider={rider}
              disabled={!online || busy}
              onAssign={() => assign(rider)}
            />
          ))}
        </ul>
      );
  else if (riders.isPending) body = <Skeleton label={t('loadingRiders')} />;
  else if (ORDER_DENIED_CODES.has(failureCode(riders.error)))
    body = (
      <NoPermissionState
        headingLevel="h2"
        title={t('deniedTitle')}
        message={te('forbidden')}
        action={null}
      />
    );
  else
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('ridersErrorTitle')}
        message={te(orderErrorKey(failureCode(riders.error)))}
        action={
          <Button
            loading={riders.isFetching}
            onClick={() => void riders.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={t('sheetTitle')}
      description={t('sheetDescription', { number: order.orderNumber })}
      closeLabel={t('close')}
      busy={busy}
    >
      <div className="grid gap-3">
        {code && (
          <Alert tone="bad" role="alert">
            {te(orderErrorKey(code))}
          </Alert>
        )}
        {body}
      </div>
    </Sheet>
  );
}

function CandidateRow({
  rider,
  disabled,
  onAssign,
}: {
  rider: RiderCandidate;
  disabled: boolean;
  onAssign: () => void;
}) {
  const t = useTranslations('ownerOrders.dispatch');
  const km = useKm();
  const meta = [
    rider.vehicleLabel,
    rider.distanceM === null
      ? t('distanceUnknown')
      : t('distanceAway', { distance: km(rider.distanceM) }),
  ].filter(Boolean);
  return (
    <li className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-border p-3">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-pill bg-surface-2"
      >
        🛵
      </span>
      <div className="grid min-w-0 flex-1 basis-40 gap-1">
        <p className="m-0 font-semibold [overflow-wrap:anywhere]">
          {rider.displayName}
        </p>
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {meta.join(' · ')}
        </p>
        <div className="flex flex-wrap gap-1">
          {rider.available ? (
            <StatusBadge tone="ok" icon="✓" label={t('available')} />
          ) : (
            <StatusBadge
              tone="warn"
              icon="⏸"
              label={t(
                rider.unavailableReason
                  ? unavailableKey[rider.unavailableReason]
                  : 'unavailable',
              )}
            />
          )}
          {!rider.online && <Badge tone="neutral" label={t('offline')} />}
        </div>
      </div>
      <Button
        size="small"
        disabled={disabled || !rider.available}
        onClick={onAssign}
        aria-label={t('assignTo', { name: rider.displayName })}
      >
        {t('assignOne')}
      </Button>
    </li>
  );
}
