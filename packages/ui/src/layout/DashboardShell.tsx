import type { ElementType, ReactNode } from 'react';

export type DashboardNavItem = {
  href: string;
  /** Already localized. */
  label: string;
  current?: boolean;
  icon?: string;
};
export type DashboardNavGroup = {
  /** Already localized group heading. */
  label: string;
  items: readonly DashboardNavItem[];
};
export type DashboardShellProps = {
  /** Localized role label shown above the navigation, e.g. "Admin". */
  roleLabel: string;
  /** Accessible name of the navigation landmark. */
  navLabel: string;
  groups: readonly DashboardNavGroup[];
  /** Router link component (e.g. next/link); defaults to a plain anchor. */
  linkAs?: ElementType;
  children: ReactNode;
};

/** Role dashboard frame: sidebar on desktop, horizontally scrollable bar on
 * mobile. Visible entries never grant access; the caller passes only items the
 * current role and permission matrix allow. */
export function DashboardShell({
  roleLabel,
  navLabel,
  groups,
  linkAs: Link = 'a',
  children,
}: DashboardShellProps) {
  return (
    <div className="grid min-w-0 gap-stack-gap desktop:grid-cols-4">
      <nav
        aria-label={navLabel}
        className="min-w-0 border-b border-border pb-2 desktop:col-span-1 desktop:border-e desktop:border-b-0 desktop:pe-4 desktop:pb-0"
      >
        <p className="mb-2 text-caption font-semibold text-muted [overflow-wrap:anywhere]">
          {roleLabel}
        </p>
        <div className="flex gap-4 overflow-x-auto desktop:grid desktop:overflow-visible">
          {groups.map((group) => (
            <div key={group.label} className="grid min-w-0 shrink-0 gap-1">
              <p className="hidden text-caption text-muted desktop:block">
                {group.label}
              </p>
              <ul className="m-0 flex list-none gap-1 p-0 desktop:grid">
                {group.items.map((item) => (
                  <li key={item.href} className="min-w-0 shrink-0">
                    <Link
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      className={`flex min-h-touch items-center gap-2 rounded-md px-3 whitespace-nowrap no-underline desktop:whitespace-normal ${item.current ? 'bg-primary-soft font-semibold text-text' : 'text-text-2 hover:bg-surface-2'}`}
                    >
                      {item.icon && <span aria-hidden="true">{item.icon}</span>}
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="min-w-0 desktop:col-span-3">{children}</div>
    </div>
  );
}
