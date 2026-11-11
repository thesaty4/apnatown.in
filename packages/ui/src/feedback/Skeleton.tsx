import type { ComponentPropsWithRef } from 'react';

export type SkeletonProps = ComponentPropsWithRef<'div'> & {
  label: string;
  shape?: 'lines' | 'block';
};

/** Static under reduced motion; never announces each decorative line. */
export function Skeleton({
  label,
  shape = 'lines',
  className = '',
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      role="status"
      aria-busy="true"
      className={`${shape === 'block' ? 'size-full skeleton-fill animate-skeleton motion-reduce:animate-none' : 'grid gap-4 py-state-block'} ${className}`}
    >
      <span className="sr-only">{label}</span>
      {shape === 'lines' &&
        [0, 1, 2].map((line) => (
          <div
            key={line}
            aria-hidden="true"
            className="h-6 rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none"
          />
        ))}
    </div>
  );
}
