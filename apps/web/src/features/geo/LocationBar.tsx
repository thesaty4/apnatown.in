'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { LocationResolution } from '@apnatown/shared/geo';
import {
  Button,
  buttonInteractionClassName,
} from '@apnatown/ui/primitives/Button';
import Link from 'next/link';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { geoName } from './api';
import { useBrowseLocation } from './location-store';
import { LocationPicker, type PickerStep } from './LocationPicker';
import { GeoNote } from './parts';

function placeLabel(
  selection: LocationResolution,
  locale: Locale,
  current: string,
) {
  const city = geoName(selection.city, locale);
  if (selection.area) return `${geoName(selection.area, locale)}, ${city}`;
  if (selection.source === 'gps') return `${current}, ${city}`;
  return city;
}

/**
 * S-CUST-01 sticky home location bar with the picker overlay. Browsing never
 * depends on it: with no selection the bar only offers the optional picker,
 * and an unserviceable selection shows the outside-area banner with notify-me.
 */
export function LocationBar() {
  const t = useTranslations('geo.location');
  const searchT = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { selection } = useBrowseLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<PickerStep>({ kind: 'choose' });
  const [announcement, setAnnouncement] = useState('');
  const place =
    selection && placeLabel(selection, locale, t('currentLocation'));

  const show = (next: PickerStep) => {
    setAnnouncement('');
    setStep(next);
    setOpen(true);
  };

  return (
    <section
      aria-label={t('barLabel')}
      className="sticky top-[calc(var(--spacing-sat)+var(--spacing-nav-h))] z-10 mb-stack-gap grid gap-2 bg-bg py-2"
    >
      <div className="grid gap-2 desktop:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={place ? t('changeNamed', { place }) : t('title')}
          className={`flex min-h-touch w-full max-w-full items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-start text-text shadow-1 ${buttonInteractionClassName}`}
          onClick={() => show({ kind: 'choose' })}
        >
          <span aria-hidden="true" className="shrink-0 text-h3">
            📍
          </span>
          <span className="grid min-w-0 flex-1">
            <small className="text-small text-text-2">
              {place ? t('browsingNear') : t('optional')}
            </small>
            <strong className="[overflow-wrap:anywhere]">
              {place ?? t('title')}
            </strong>
          </span>
          <span aria-hidden="true" className="shrink-0">
            ▾
          </span>
        </button>
        {/* Prototype `.sbtn`: the customer's primary entry to Search. */}
        <Link
          href={publicHref('/search', locale)}
          className={`flex min-h-touch w-full items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-text-2 shadow-1 ${buttonInteractionClassName}`}
        >
          <NavIcon name="search" className="size-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {searchT('placeholder')}
          </span>
        </Link>
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {selection && !selection.serviceable && (
        <GeoNote
          tone="warn"
          title={t('waitlistTitle')}
          message={t('outsideMessage', {
            city: geoName(selection.city, locale),
          })}
          action={
            <Button
              variant="outline"
              onClick={() => show({ kind: 'waitlist', city: selection.city })}
            >
              {t('notifyMe')}
            </Button>
          }
        />
      )}
      <LocationPicker
        open={open}
        step={step}
        onStep={setStep}
        onClose={() => {
          setOpen(false);
          setStep({ kind: 'choose' });
        }}
        onResolved={(resolved) => {
          setOpen(false);
          setStep({ kind: 'choose' });
          setAnnouncement(
            t('locationSet', {
              place: placeLabel(resolved, locale, t('currentLocation')),
            }),
          );
        }}
      />
    </section>
  );
}
