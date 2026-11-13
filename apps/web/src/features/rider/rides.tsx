'use client';

import { useTranslations } from 'next-intl';
import type { RiderHistory } from '@apnatown/shared/delivery';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { useIstTime, useMoney, useSignedMoney } from './parts';

const statusPresentation: Record<
  RiderHistory['status'],
  { icon: string; tone: BadgeTone }
> = {
  delivered: { icon: '✓', tone: 'st-delivered' },
  failed: { icon: '✕', tone: 'bad' },
  cancelled: { icon: '⊘', tone: 'st-cancelled' },
};

/** One terminal ride: earned snapshot when delivered, else estimate labelled. */
export function RideRow({
  ride,
  breakdown = false,
}: {
  ride: RiderHistory;
  breakdown?: boolean;
}) {
  const t = useTranslations('rider.history');
  const money = useMoney();
  const signed = useSignedMoney();
  const time = useIstTime();
  const presentation = statusPresentation[ride.status];
  const at =
    ride.timestamps.deliveredAt ??
    ride.timestamps.failedAt ??
    ride.timestamps.cancelledAt ??
    ride.timestamps.acceptedAt;
  return (
    <li className="grid min-w-0 gap-2 rounded-md border border-border bg-surface p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="grid min-w-0 flex-1 basis-48 gap-1">
          <p className="m-0 font-semibold [overflow-wrap:anywhere]">
            {ride.shopName}
          </p>
          <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
            {t('rowMeta', { order: ride.orderNumber, area: ride.dropArea })}
          </p>
          {at && <p className="m-0 text-caption text-muted">{time(at)}</p>}
        </div>
        <div className="grid justify-items-end gap-1">
          <StatusBadge
            tone={presentation.tone}
            icon={presentation.icon}
            label={t(`status.${ride.status}`)}
          />
          <p className="m-0 text-small font-semibold">
            {ride.earned
              ? t('earned', { amount: money(ride.earned.totalPaise) })
              : t('estimated', { amount: money(ride.estimate.totalPaise) })}
          </p>
        </div>
      </div>
      {breakdown && ride.earned && (
        <p className="m-0 text-caption text-text-2 [overflow-wrap:anywhere]">
          {t('breakdown', {
            base: money(ride.earned.basePaise),
            distance: money(ride.earned.distancePayPaise),
            rounding: signed(ride.earned.roundingPaise),
          })}
        </p>
      )}
    </li>
  );
}

/** Single-select filter chips (aria-pressed), wrapping for long Hindi. */
export function RangeChips<T extends string>({
  label,
  ranges,
  value,
  onChange,
  labelOf,
}: {
  label: string;
  ranges: readonly T[];
  value: T;
  onChange: (range: T) => void;
  labelOf: (range: T) => string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <Chip
          key={range}
          label={labelOf(range)}
          selected={range === value}
          onClick={() => onChange(range)}
        />
      ))}
    </div>
  );
}
