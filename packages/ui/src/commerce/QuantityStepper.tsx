import type { ComponentPropsWithRef } from 'react';

export type QuantityStepperProps = Omit<
  ComponentPropsWithRef<'div'>,
  'onChange' | 'children'
> & {
  value: number;
  min: number;
  max: number;
  /** Localized group label, e.g. "Quantity, Basmati rice". */
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (next: number) => void;
  disabled?: boolean;
};

const step =
  'grid min-h-touch min-w-touch place-items-center rounded-sm bg-primary-soft text-primary-ink text-h3 font-bold leading-none focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none';

/** Prototype `.stepper` (− n +). Bounds are owned by the caller; the buttons
 * disable at min/max and the value is announced politely. */
export function QuantityStepper({
  value,
  min,
  max,
  label,
  decreaseLabel,
  increaseLabel,
  onChange,
  disabled = false,
  className = '',
  ...props
}: QuantityStepperProps) {
  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={`inline-flex items-stretch gap-0.5 rounded-md border-2 border-primary p-0.5 ${className}`}
    >
      <button
        type="button"
        className={step}
        disabled={disabled || value <= min}
        aria-label={decreaseLabel}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output
        aria-live="polite"
        className="grid min-w-10 place-items-center px-2 font-semibold tabular-nums"
      >
        {value}
      </output>
      <button
        type="button"
        className={step}
        disabled={disabled || value >= max}
        aria-label={increaseLabel}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
