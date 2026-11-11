'use client';

import type { ComponentPropsWithRef } from 'react';

type SkipLinkProps = Omit<
  ComponentPropsWithRef<'a'>,
  'href' | 'onClick' | 'children'
> & {
  label: string;
  targetId: string;
};

/** Keep first in document order; the destination must have tabIndex={-1}. */
export function SkipLink({
  label,
  targetId,
  className = '',
  ...props
}: SkipLinkProps) {
  return (
    <a
      {...props}
      href={`#${targetId}`}
      onClick={() => document.getElementById(targetId)?.focus()}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:min-h-touch focus:rounded-sm focus:bg-primary focus:p-4 focus:text-on-primary focus-visible:ring-focus ${className}`}
    >
      {label}
    </a>
  );
}
