import type { ElementType } from 'react';
import { Avatar } from '../data/Avatar.js';

export type CategoryTileProps = {
  href: string;
  /** Localized category/subcategory name; the visible text labels the link. */
  label: string;
  /** Caller-supplied icon (emoji); a shared placeholder is used when absent. */
  icon?: string | undefined;
  /** Only Media-authorized public URLs. Missing/failed images fall back to the icon. */
  imageSrc?: string | undefined;
  /** Router link component (e.g. next/link); defaults to a plain anchor. */
  linkAs?: ElementType;
  className?: string;
};

/** Prototype .tile: decorative art (image → icon → placeholder) above the
 * localized name. Server-compatible; only a loading image adds a client island. */
export function CategoryTile({
  href,
  label,
  icon,
  imageSrc,
  linkAs: Link = 'a',
  className = '',
}: CategoryTileProps) {
  return (
    <Link
      href={href}
      className={`grid min-h-touch min-w-0 content-start justify-items-center gap-2 rounded-md px-1 py-3 text-center text-small font-medium text-text no-underline transition-colors duration-2 ease-standard hover:bg-surface-2 focus-visible:ring-focus motion-reduce:transition-none ${className}`}
    >
      <Avatar
        label=""
        emoji={icon || '🏷️'}
        {...(imageSrc ? { src: imageSrc } : {})}
      />
      <span className="min-w-0 max-w-full [overflow-wrap:anywhere]">
        {label}
      </span>
    </Link>
  );
}
