import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

// Presentation tokens only. Domain-to-tone/icon/translated-label mappings stay
// with the caller; a badge never decides or transitions a business status.
// TODO(verify): prototype light success/warning on the 12% mixed background
// calculate to 4.27:1 / 4.26:1. Keep source parity pending an approved AA fix.
const tones = {
  ok: 'text-success',
  warn: 'text-warning',
  bad: 'text-error',
  info: 'text-info',
  neutral: 'text-text-2',
  neu: 'text-text-2',
  offer: 'text-offer',
  secondary: 'text-secondary',
  sec: 'text-secondary',
  security: 'text-secondary',
  'st-placed': 'text-st-placed',
  'st-accepted': 'text-st-accepted',
  'st-preparing': 'text-st-preparing',
  'st-ready': 'text-st-ready',
  'st-out': 'text-st-out',
  'st-delivered': 'text-st-delivered',
  'st-cancelled': 'text-st-cancelled',
  'st-refunded': 'text-st-refunded',
  'ap-pending': 'text-ap-pending',
  'ap-approved': 'text-ap-approved',
  'ap-rejected': 'text-ap-rejected',
  'ap-suspended': 'text-ap-suspended',
  'ap-inactive': 'text-ap-inactive',
} as const;

export type BadgeTone = keyof typeof tones;
export type BadgeProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
  label: string;
  tone?: BadgeTone;
  icon?: ReactNode;
};
export type StatusBadgeProps = Omit<BadgeProps, 'icon'> & {
  /** Required: status is conveyed by icon AND localized text, never just color. */
  icon: ReactElement | string;
};

export function Badge({
  tone = 'neutral',
  label,
  icon,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex max-w-full items-center gap-1 rounded-pill border border-current badge-fill px-badge-inline py-badge-block text-caption-min font-semibold leading-normal whitespace-normal ${tones[tone]} ${className}`}
    >
      {icon != null && (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      )}
      <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
    </span>
  );
}

export function StatusBadge(props: StatusBadgeProps) {
  return <Badge {...props} />;
}
