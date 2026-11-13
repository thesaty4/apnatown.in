'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { Category } from '@apnatown/shared/catalog';
import { SEARCH_HOME_SECTION_LIMITS } from '@apnatown/shared/search';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../../shared/auth/SessionProvider';
import { failureCode } from '../../../shared/api/result';
import {
  GeoNote,
  LocationPicker,
  preciseBrowseLocation,
  useBrowseLocation,
  type PickerStep,
} from '../../geo';
import { HomeListingSection, HomeListingSkeleton } from './HomeListingSection';
import { homeExploreHref } from './links';
import { homeLocatedOptions, type HomeLocation } from './queries';

const headingId = 'home-nearby-shops';

/**
 * S-CUST-01 Nearby shops (HM6), a client island over the shared browse
 * location. Without a location (or when the API needs one) it shows the
 * optional prompt wired to the shared LocationPicker; it never blocks Home.
 * Only this section reads the located, no-store `GET /search/home`; the
 * rest of Home stays public SSR.
 */
export function NearbyShops({ categories }: { categories: Category[] }) {
  const t = useTranslations('search.home');
  const geo = useTranslations('geo.location');
  const screen = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api } = useSession();
  const { selection, revision } = useBrowseLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<PickerStep>({ kind: 'choose' });
  const location: HomeLocation | null = selection && {
    cityId: selection.city.id,
    areaId: selection.area?.id ?? null,
    position: selection.source === 'gps' ? preciseBrowseLocation() : null,
    revision,
  };
  const query = useQuery(homeLocatedOptions(api, locale, location));

  const closePicker = () => {
    setOpen(false);
    setStep({ kind: 'choose' });
  };
  const prompt = (message: string) => (
    <GeoNote
      tone="info"
      message={message}
      action={
        <Button
          variant="outline"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {geo('title')}
        </Button>
      }
    />
  );

  const section = query.data?.nearbyShops;
  let body;
  if (!location || section?.state === 'location_required')
    body = prompt(t('locationPrompt'));
  else if (query.isError && !section)
    body =
      // A stale session city/area that the API no longer accepts.
      failureCode(query.error) === 'SEARCH_FILTER_INVALID' ? (
        prompt(geo('areaGone'))
      ) : (
        <GeoNote
          tone="bad"
          message={t('nearbyError')}
          action={
            <Button
              variant="outline"
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {screen('retry')}
            </Button>
          }
        />
      );
  else if (query.isPending)
    body =
      query.fetchStatus === 'paused' ? (
        <GeoNote tone="warn" message={t('nearbyOffline')} />
      ) : (
        <HomeListingSkeleton
          label={t('nearbyLoading')}
          tab="shops"
          layout="grid"
          count={SEARCH_HOME_SECTION_LIMITS.nearbyShops}
        />
      );

  // `empty`/`unavailable`: omitted on Home (no zero or sample data).
  const items = section?.state === 'ok' ? section.items : [];
  return (
    <>
      <HomeListingSection
        id={headingId}
        title={t('nearbyShops')}
        viewAll={{
          href: homeExploreHref(locale, { tab: 'shops', sort: 'distance' }),
          label: t('viewAllShops'),
        }}
        tab="shops"
        layout="grid"
        items={items}
        locale={locale}
        categories={categories}
        headingRef={headingRef}
      >
        {body}
      </HomeListingSection>
      <LocationPicker
        open={open}
        step={step}
        onStep={setStep}
        onClose={closePicker}
        onResolved={() => {
          closePicker();
          // The prompt button unmounts; keep focus in this section after the
          // dialog restores focus.
          window.setTimeout(() => headingRef.current?.focus(), 0);
        }}
      />
    </>
  );
}
