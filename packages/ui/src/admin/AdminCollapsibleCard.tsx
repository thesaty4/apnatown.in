'use client';

import { useId, useState, type ReactNode } from 'react';

export type AdminCollapsibleCardProps = {
  /** Already-escaped plain text; never raw HTML. */
  title: string;
  subtitle?: string;
  /** Status/role badges; status must carry text or icon, not colour only. */
  badges?: ReactNode;
  /** Localized accessible label for the expand/collapse toggle. */
  toggleLabel: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

/** Collapsed summary row with a disclosure button; details render only when open. */
export function AdminCollapsibleCard({
  title,
  subtitle,
  badges,
  toggleLabel,
  defaultExpanded = false,
  children,
}: AdminCollapsibleCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const id = useId();
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface text-text shadow-1 [overflow-wrap:anywhere]">
      <div className="flex items-start gap-row-gap p-4">
        <div className="grid min-w-0 flex-1 gap-1">
          <h3 className="font-display text-h4">{title}</h3>
          {subtitle && <p className="text-small text-text-2">{subtitle}</p>}
          {badges && <div className="flex flex-wrap gap-2">{badges}</div>}
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={toggleLabel}
          onClick={() => setExpanded((open) => !open)}
          className="grid size-touch shrink-0 place-items-center rounded-md text-text-2 hover:bg-surface-2 focus-visible:ring-focus"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`size-5 transition-transform duration-2 motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div
        id={id}
        hidden={!expanded}
        className="grid gap-stack-gap border-t border-border p-4"
      >
        {expanded && children}
      </div>
    </article>
  );
}
