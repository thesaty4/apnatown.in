import type { ComponentPropsWithRef } from 'react';

export type CardProps = ComponentPropsWithRef<'div'> & {
  padded?: boolean;
};

/** Prototype .card / .card.pad. Links, headings and feedback are composed inside,
 * not implicit click handlers or nested interactive card wrappers.
 */
export function Card({ padded = false, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`min-w-0 overflow-hidden rounded-lg border border-border bg-surface text-text shadow-1 [overflow-wrap:anywhere] ${padded ? 'p-4' : ''} ${className}`}
    />
  );
}
