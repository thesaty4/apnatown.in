'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { useSession } from '../../../shared/auth/SessionProvider';
import { businessGalleryOptions } from '../../gallery/api';
import { imageSources } from '../../gallery/media';

type Photo = { path: string; width: number; height: number };

type Slide = {
  key: string;
  src: string;
  srcSet?: string;
  width: number;
  height: number;
};

const MAX_SLIDES = 8;

/**
 * Business cover carousel: the stored cover first, then the approved public
 * gallery photos (the same public gallery read as the Gallery tab). Native
 * scroll-snap keeps swiping and keyboard scrolling; dots are the only added
 * control and there is no autoplay (reduced-motion safe).
 */
export function ProfileCover({
  cover,
  slug,
  name,
  fallback,
  style,
}: {
  cover: Photo | null;
  slug: string;
  name: string;
  /** Category emoji shown when no cover/photo exists. */
  fallback: string;
  style?: CSSProperties;
}) {
  const t = useTranslations('business.publicProfile');
  const { api } = useSession();
  const gallery = useInfiniteQuery(businessGalleryOptions(api, slug, 'photos'));
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const artClass =
    'aspect-[16/9]! w-full rounded-lg tablet:aspect-[3/1]! text-listing-art!';

  const slides: Slide[] = [];
  if (cover)
    slides.push({
      key: cover.path,
      src: cover.path,
      width: cover.width,
      height: cover.height,
    });
  const seen = new Set(slides.map((slide) => slide.src));
  for (const item of gallery.data?.pages.flatMap((page) => page.items) ?? []) {
    if (
      item.kind !== 'photo' ||
      item.placementType !== 'gallery_photo' ||
      slides.length >= MAX_SLIDES
    )
      continue;
    const { src, srcSet } = imageSources(item.image);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    slides.push({
      key: `${item.assetId}:${item.placementType}:${item.placementId}`,
      src,
      srcSet,
      width: item.image.width,
      height: item.image.height,
    });
  }

  if (slides.length === 0)
    return (
      <Avatar label="" emoji={fallback} size="4:3" style={style} className={artClass} />
    );

  const go = (next: number) => {
    const element = track.current;
    if (!element) return;
    element.scrollTo({ left: next * element.clientWidth, behavior: 'smooth' });
  };

  return (
    <section
      aria-label={t('coverLabel')}
      aria-roledescription="carousel"
      className="relative min-w-0"
    >
      <ul
        ref={track}
        onScroll={(event) => {
          const element = event.currentTarget;
          setIndex(
            Math.min(
              slides.length - 1,
              Math.max(0, Math.round(element.scrollLeft / element.clientWidth)),
            ),
          );
        }}
        className="m-0 flex list-none snap-x snap-mandatory overflow-x-auto overscroll-x-contain p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, position) => (
          <li
            key={slide.key}
            aria-roledescription="slide"
            aria-label={`${position + 1} / ${slides.length}`}
            className="w-full flex-none snap-start"
          >
            <Avatar
              label={
                position === 0
                  ? t('coverAlt', { name })
                  : t('photoAlt', { name, number: position + 1 })
              }
              emoji={fallback}
              size="4:3"
              style={style}
              className={artClass}
              src={slide.src}
              {...(slide.srcSet && { srcSet: slide.srcSet })}
              imageWidth={slide.width}
              imageHeight={slide.height}
            />
          </li>
        ))}
      </ul>
      {slides.length > 1 && (
        <div className="absolute end-3 top-3 flex gap-1.5 rounded-pill bg-surface/90 px-2 py-1 shadow-1">
          {slides.map((slide, position) => (
            <button
              key={slide.key}
              type="button"
              aria-label={t('goToPhoto', { number: position + 1 })}
              aria-current={position === index ? 'true' : undefined}
              onClick={() => go(position)}
              className={`size-2.5 rounded-pill transition-colors focus-visible:ring-focus ${position === index ? 'bg-primary' : 'bg-border-strong'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
