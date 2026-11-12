import type { ComponentPropsWithRef } from 'react';

/** Shared native-button behavior; Chip has its own catalogue appearance. */
export const buttonInteractionClassName =
  'focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 ' +
  'motion-reduce:transition-none';

const baseClassName =
  'inline-flex min-h-button-min-height max-w-full items-center justify-center gap-2 ' +
  'rounded-md border-2 px-button-inline py-2 ' +
  'text-button font-semibold whitespace-normal break-words text-center ' +
  'transition-colors duration-2 ease-standard hover:brightness-95 ' +
  buttonInteractionClassName;

const variants = {
  primary: 'border-transparent bg-primary text-on-primary',
  secondary: 'border-transparent bg-secondary text-surface',
  outline: 'border-primary bg-transparent text-primary',
  text: 'border-transparent bg-transparent text-primary hover:bg-primary-soft',
  danger: 'border-transparent bg-error text-on-primary',
  ghost: 'border-border bg-surface-2 text-text',
} as const;

export const buttonClassName = `${baseClassName} ${variants.primary}`;

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  loading?: boolean;
  variant?: keyof typeof variants;
};

export function Button({
  loading = false,
  disabled,
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${baseClassName} ${variants[variant]} ${className}`}
    >
      {children}
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 rounded-pill border-2 border-current border-r-transparent animate-spinner motion-reduce:animate-none"
        />
      )}
    </button>
  );
}
