'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { PlacementPublic } from '@apnatown/shared/offers';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';

const AUTOPLAY_MS = 4500;

/**
 * S-CUST-01 hero banners (prototype `.hero`). Scroll-snap keeps native
 * swiping/keyboard scrolling; dots are the only added control. Autoplay stops
 * for `prefers-reduced-motion` and pauses while the pointer or focus is inside.
 */
export function HeroCarousel({
  items,
  locale,
}: {
  items: readonly PlacementPublic[];
  locale: Locale;
}) {
  const t = useTranslations('offers.hero');
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = (next: number) => {
    const element = track.current;
    if (!element) return;
    element.scrollTo({ left: next * element.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (items.length < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element) return;
      const next = (Math.round(element.scrollLeft / element.clientWidth) + 1) % items.length;
      element.scrollTo({ left: next * element.clientWidth, behavior: 'smooth' });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  return (
    <section
      aria-label={t('label')}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="grid min-w-0 gap-2"
    >
      <ul
        ref={track}
        onScroll={(event) => {
          const element = event.currentTarget;
          setIndex(
            Math.min(
              items.length - 1,
              Math.max(0, Math.round(element.scrollLeft / element.clientWidth)),
            ),
          );
        }}
        className="m-0 flex list-none snap-x snap-mandatory overflow-x-auto overscroll-x-contain p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, position) => (
          <HeroSlide
            key={item.id}
            item={item}
            locale={locale}
            position={position}
            total={items.length}
          />
        ))}
      </ul>
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {items.map((item, position) => (
            <button
              key={item.id}
              type="button"
              aria-label={t('goTo', { number: position + 1 })}
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

function HeroSlide({
  item,
  locale,
  position,
  total,
}: {
  item: PlacementPublic;
  locale: Locale;
  position: number;
  total: number;
}) {
  const t = useTranslations('offers.hero');
  const cta = {
    business: t('viewBusiness'),
    category: t('browse'),
    offers: t('viewOffers'),
    product: t('viewProduct'),
    service: t('viewService'),
    explore: t('explore'),
  }[item.destination.kind];
  const title = locale === 'hi' && item.titleHi ? item.titleHi : item.titleEn;
  const subtitle =
    locale === 'hi' && item.subtitleHi ? item.subtitleHi : item.subtitleEn;
  const banner = item.banner;
  return (
    <li
      aria-roledescription="slide"
      aria-label={`${position + 1} / ${total}`}
      className="relative isolate grid min-h-[10.5rem] w-full flex-none snap-start content-center gap-2 overflow-hidden rounded-lg p-5 text-reel-text tablet:min-h-[13rem] tablet:p-7"
      style={{
        backgroundImage: banner
          ? undefined
          : 'linear-gradient(120deg, var(--at-primary), var(--at-secondary))',
      }}
    >
      {banner && (
        <>
          <img
            src={banner.path}
            alt=""
            width={banner.width}
            height={banner.height}
            loading={position === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={position === 0 ? 'high' : 'auto'}
            className="absolute inset-0 -z-20 size-full object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-overlay),transparent)]"
          />
        </>
      )}
      {title && (
        <h2 className="m-0 max-w-[36ch] font-display text-h2 text-reel-text [overflow-wrap:anywhere]">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="m-0 max-w-[48ch] text-body text-reel-text-2 [overflow-wrap:anywhere]">
          {subtitle}
        </p>
      )}
      <Link
        href={publicHref(item.destination.href, locale)}
        className={`${buttonVariantClassName('inverse', 'small')} mt-1 justify-self-start`}
      >
        {cta}
      </Link>
    </li>
  );
}
