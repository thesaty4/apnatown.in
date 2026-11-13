import type {
  ComponentPropsWithRef,
  MouseEventHandler,
  ReactNode,
} from 'react';
import { buttonInteractionClassName } from './Button.js';

type ChipContentProps = {
  label: string;
  selected?: boolean;
  /** Already localized/formatted by the caller, including zero. */
  count?: string;
  icon?: ReactNode;
};

export type ChipProps = Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'aria-pressed' | 'onClick'
> &
  ChipContentProps &
  (
    | {
        onClick?: MouseEventHandler<HTMLButtonElement>;
        removable?: false;
        onRemove?: never;
        removeLabel?: never;
      }
    | {
        removable: true;
        /** Localized action name including the visible chip label. */
        removeLabel: string;
        onRemove: MouseEventHandler<HTMLButtonElement>;
        onClick?: never;
      }
  );

/** A filter action/toggle or a single removal action; never nests buttons. */
export function Chip({
  label,
  count,
  icon,
  selected,
  removable,
  onRemove,
  removeLabel,
  onClick,
  className = '',
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      {...props}
      aria-label={removable ? removeLabel : props['aria-label']}
      aria-pressed={removable ? undefined : selected}
      onClick={removable ? onRemove : onClick}
      className={`inline-flex min-h-touch min-w-touch max-w-full items-center justify-center gap-field-gap rounded-pill border-(length:--at-chip-border) px-field-inline py-1 text-chip font-medium whitespace-normal text-start [overflow-wrap:anywhere] transition-colors duration-2 ease-standard enabled:hover:brightness-95 ${buttonInteractionClassName} ${selected ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface text-text'} ${className}`}
    >
      {(selected || icon) && (
        <span aria-hidden="true" className="shrink-0">
          {icon ?? '✓'}
        </span>
      )}
      <span className="min-w-0">{label}</span>
      {count != null && (
        <span className="min-w-count min-h-0 rounded-pill bg-surface-2 px-2 py-count-block text-caption font-semibold text-text-2 text-center [overflow-wrap:anywhere]">
          {count}
        </span>
      )}
      {removable && (
        <span aria-hidden="true" className="shrink-0">
          ×
        </span>
      )}
    </button>
  );
}
