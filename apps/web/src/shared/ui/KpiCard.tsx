import type { ReactNode } from 'react';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';

/**
 * Dashboard KPI tile. `value === null` means the source is unavailable and
 * is shown as "—" plus a text badge, never as an invented zero.
 */
export function KpiCard({
  label,
  value,
  hint,
  unavailableLabel,
}: {
  label: string;
  value: ReactNode | null;
  hint?: string | undefined;
  unavailableLabel: string;
}) {
  return (
    <Card padded className="grid h-full min-w-0 content-start gap-1">
      <p className="m-0 text-small text-muted [overflow-wrap:anywhere]">
        {label}
      </p>
      {value !== null ? (
        <>
          <p className="m-0 text-kpi-value">{value}</p>
          {hint && <p className="m-0 text-caption text-muted">{hint}</p>}
        </>
      ) : (
        <>
          <p className="m-0 text-kpi-value text-muted" aria-hidden="true">
            —
          </p>
          <StatusBadge
            tone="neutral"
            icon="⌛"
            label={unavailableLabel}
            className="justify-self-start"
          />
        </>
      )}
    </Card>
  );
}
