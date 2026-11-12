import type { ComponentPropsWithRef, CSSProperties } from 'react';
import { Skeleton } from '../feedback/Skeleton.js';
import { AvatarImage } from './AvatarImage.js';

export type AvatarProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** Localized alternative; empty string makes art decorative, like the prototype. */
  label: string;
  /** Caller-supplied art/initials, also used if the image fails. */
  emoji: string;
  /** Only currently authorized/resolved media URLs, never raw user-submitted links. */
  src?: string;
  srcSet?: string | undefined;
  imageWidth?: number | undefined;
  imageHeight?: number | undefined;
  hue?: number;
  size?: 'mini' | 'full' | '4:3';
  loading?: boolean;
};

const sizes = {
  mini: 'size-avatar-mini shrink-0 rounded-md text-art-mini',
  full: 'aspect-square w-full text-art',
  '4:3': 'aspect-[4/3] w-full text-art',
} as const;

/** .art / .mini / .art.f. Emoji-only rendering stays server-compatible; only
 * image load/error handling introduces a small client island.
 */
export function Avatar({
  label,
  emoji,
  src,
  srcSet,
  imageWidth,
  imageHeight,
  hue,
  size = 'mini',
  loading = false,
  className = '',
  style,
  ...props
}: AvatarProps) {
  const artStyle = {
    ...style,
    ...(hue != null && Number.isFinite(hue) ? { '--at-art-hue': hue } : {}),
  } as CSSProperties;
  return (
    <div
      {...props}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      aria-busy={loading || undefined}
      style={artStyle}
      className={`relative grid min-w-0 place-items-center overflow-hidden art-fill art-dim ${sizes[size]} ${className}`}
    >
      <span aria-hidden="true" className="art-shadow [overflow-wrap:anywhere]">
        {emoji}
      </span>
      {loading ? (
        <Skeleton
          label={label}
          shape="block"
          aria-hidden="true"
          className="absolute inset-0"
        />
      ) : src ? (
        <AvatarImage key={src} src={src} srcSet={srcSet}
          sizes={size === 'mini' ? '56px' : '100vw'} width={imageWidth} height={imageHeight} />
      ) : null}
    </div>
  );
}
