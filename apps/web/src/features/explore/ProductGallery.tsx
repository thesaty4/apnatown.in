'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
type Image = {
  path: string;
  width: number;
  height: number;
};

/** Prototype `.stage` + `.thumbs`: one large image with a selectable strip. */
export function ProductGallery({
  name,
  images,
  mediaLabel,
  fallback = '🛍️',
}: {
  name: string;
  images: readonly Image[];
  /** Screen-owned media label (product default, service override). */
  mediaLabel?: string;
  fallback?: string;
}) {
  const t = useTranslations('explore.product');
  const screen = useTranslations('explore.screen');
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)];
  if (!current)
    return (
      <div
        aria-hidden="true"
        className="grid aspect-square place-items-center rounded-lg bg-surface-2 text-[4rem]"
      >
        {fallback}
      </div>
    );
  return (
    <div className="grid min-w-0 gap-3">
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface-2">
        <img
          src={current.path}
          alt={screen('imageOf', { name, number: index + 1 })}
          width={current.width}
          height={current.height}
          decoding="async"
          className="aspect-square size-full object-cover"
        />
        <span className="absolute start-2.5 bottom-2.5 rounded-pill bg-surface px-2 py-0.5 text-caption font-semibold text-text shadow-1">
          {t('counter', { current: index + 1, total: images.length })}
        </span>
      </div>
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={mediaLabel ?? t('media')}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {images.map((image, position) => (
            <button
              key={image.path}
              type="button"
              role="tab"
              aria-selected={position === index}
              aria-label={t('imageTab', { number: position + 1 })}
              onClick={() => setIndex(position)}
              className={`size-16 shrink-0 overflow-hidden rounded-md border-2 focus-visible:ring-focus ${position === index ? 'border-primary' : 'border-border'}`}
            >
              <img
                src={image.path}
                alt=""
                width={image.width}
                height={image.height}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
