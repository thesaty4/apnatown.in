import type { ComponentPropsWithRef } from 'react';

type SkeletonProps = ComponentPropsWithRef<'div'> & { label: string };

/** Static under reduced motion; never announces each decorative line. */
export function Skeleton({ label, className = '', ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      role="status"
      aria-busy="true"
      className={`grid gap-4 py-state-block ${className}`}
    >
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((line) => (
        <div
          key={line}
          aria-hidden="true"
          className="h-6 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
