import type { ReactNode } from 'react';
import { Card } from '../cards/Card.js';
import { StatusBadge } from '../primitives/Badge.js';

export type AddressCardProps = {
  label: string;
  addressText: string;
  /** Localized secondary lines (landmark, PIN, pin state), formatted by the caller. */
  details?: readonly string[];
  /** Localized default marker; shown as icon AND text, never colour alone. */
  defaultLabel?: string | undefined;
  /** Permitted actions (edit, set default, delete) with their own accessible names. */
  actions?: ReactNode;
  headingLevel?: 2 | 3;
};

/** Plain-text saved address. Copy is supplied by the caller; content wraps, never truncates. */
export function AddressCard({
  label,
  addressText,
  details = [],
  defaultLabel,
  actions,
  headingLevel = 2,
}: AddressCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Card padded className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Heading className="min-w-0 font-display text-h4 [overflow-wrap:anywhere]">
          {label}
        </Heading>
        {defaultLabel && (
          <StatusBadge tone="ok" icon="★" label={defaultLabel} />
        )}
      </div>
      <p className="[overflow-wrap:anywhere]">{addressText}</p>
      {details.map((detail, index) => (
        <p
          key={index}
          className="text-small text-text-2 [overflow-wrap:anywhere]"
        >
          {detail}
        </p>
      ))}
      {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
    </Card>
  );
}
