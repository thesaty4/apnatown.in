import type { ComponentPropsWithRef } from 'react';

/** Shared native-button behavior; Chip has its own catalogue appearance. */
export const buttonInteractionClassName =
  'focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 ' +
  'motion-reduce:transition-none';

export const buttonClassName =
  'inline-flex min-h-button-min-height max-w-full items-center justify-center gap-2 ' +
  'rounded-md border-2 border-transparent bg-primary px-button-inline py-2 ' +
  'text-button font-semibold text-on-primary whitespace-normal break-words text-center ' +
  'transition-colors duration-2 ease-standard hover:brightness-95 ' +
  buttonInteractionClassName;

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  loading?: boolean;
};

/** C00's single primary action. Additional library variants belong to C03. */
export function Button({
  loading = false,
  disabled,
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
      className={`${buttonClassName} ${className}`}
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
