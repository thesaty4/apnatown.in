'use client';

import type { ReactNode } from 'react';
import type { CityStatus } from '@apnatown/shared/geo';
import type { BadgeTone } from '@apnatown/ui/primitives/Badge';

/** Status always pairs an icon with text; never colour alone. */
export const cityStatusIcon: Record<CityStatus, string> = {
  enabled: '●',
  coming_soon: '◐',
  disabled: '○',
};
export const cityStatusTone: Record<CityStatus, BadgeTone> = {
  enabled: 'ok',
  coming_soon: 'warn',
  disabled: 'neutral',
};
/** `geo.*.status.<key>` message segment for a city status. */
export const cityStatusKey = (status: CityStatus) =>
  status === 'coming_soon' ? 'comingSoon' : status;

const tones = {
  info: { icon: 'ℹ️', className: 'border-info bg-info-soft', role: 'status' },
  warn: { icon: '⚠️', className: 'border-warning bg-warning-soft', role: 'status' },
  bad: { icon: '⚠️', className: 'border-error bg-error-soft', role: 'alert' },
  ok: { icon: '✓', className: 'border-success bg-success-soft', role: 'status' },
} as const;

/** Inline message with an icon and optional single action. */
export function GeoNote({
  tone,
  message,
  title,
  action,
}: {
  tone: keyof typeof tones;
  message: string;
  title?: string | undefined;
  action?: ReactNode;
}) {
  const style = tones[tone];
  return (
    <div
      role={style.role}
      className={`grid gap-2 rounded-md border p-3 text-text ${style.className}`}
    >
      <p className="flex gap-2">
        <span aria-hidden="true">{style.icon}</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {title && <strong className="block">{title}</strong>}
          {message}
        </span>
      </p>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
