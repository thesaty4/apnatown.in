import type { ComponentPropsWithRef } from 'react';

/** Shared native-button behavior; Chip has its own catalogue appearance. */
export const buttonInteractionClassName =
  'focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 ' +
  'motion-reduce:transition-none';

const baseClassName =
  'inline-flex max-w-full items-center justify-center gap-2 border-2 ' +
  'font-semibold whitespace-normal break-words text-center ' +
  'transition-colors duration-2 ease-standard hover:brightness-95 ' +
  buttonInteractionClassName;

const variants = {
  primary: 'border-transparent bg-primary text-on-primary',
  secondary: 'border-transparent bg-secondary text-surface',
  outline: 'border-primary bg-transparent text-primary',
  text: 'border-transparent bg-transparent text-primary hover:bg-primary-soft',
  danger: 'border-transparent bg-error text-on-primary',
  ghost: 'border-border bg-surface-2 text-text',
  /** Light-on-dark action for always-dark immersive surfaces such as Reels. */
  inverse: 'border-transparent bg-reel-text text-reel-canvas',
} as const;

export type ButtonVariant = keyof typeof variants;
type ButtonSize = 'default' | 'small' | 'card';
const sizes = {
  default:
    'min-h-button-min-height rounded-md px-button-inline py-2 text-button',
  small: 'min-h-button-small rounded-sm px-field-inline py-1 text-chip',
  card: 'min-h-11 rounded-md px-2.5 py-1 text-small',
} as const;

/** Button appearance for non-button elements such as links. */
export function buttonVariantClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'default',
) {
  return `${baseClassName} ${sizes[size]} ${variants[variant]}`;
}

export const buttonClassName = buttonVariantClassName('primary');

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  loading = false,
  disabled,
  variant = 'primary',
  size = 'default',
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
      className={`${buttonVariantClassName(variant, size)} ${className}`}
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
