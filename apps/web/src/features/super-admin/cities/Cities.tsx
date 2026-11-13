'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { AdminCity } from '@apnatown/shared/geo';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../../shared/api/result';
import {
  AdminFailure,
  adminErrorKey,
  isDenied,
  Notice,
  useAdmin,
} from '../../admin';
import {
  CityStatusBadge,
  CityStatusDialog,
  CreateCitySheet,
  cityName,
} from './CitySheets';
import { citiesOptions } from './queries';

/** S-SUPR-04 Cities & zones: paged city cards with real counts, create, and
 * confirmed enable/disable. Opening a city goes to its detail route. */
export function Cities() {
  const context = useAdmin();
  const t = useTranslations('geo.cities');
  const te = useTranslations('admin.errors');
  const query = useInfiniteQuery(citiesOptions(context));
  const [createOpen, setCreateOpen] = useState(false);
  const [toggling, setToggling] = useState<AdminCity>();
  const [notice, setNotice] = useState<string>();
  const locale = useLocale();
  const cities = query.data?.pages.flatMap((page) => page.items) ?? [];
  const code = query.isError ? failureCode(query.error) : undefined;
  const { recheck } = context;
  useEffect(() => {
    if (code && isDenied(code)) recheck();
  }, [code, recheck]);

  const create = () => {
    setNotice(undefined);
    setCreateOpen(true);
  };

  let body;
  if (query.isPending) body = <Skeleton label={t('loading')} />;
  else if (code && isDenied(code))
    body = (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={te(adminErrorKey(code))}
        action={<Button onClick={recheck}>{t('checkAgain')}</Button>}
      />
    );
  else if (code && cities.length === 0)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={te(adminErrorKey(code))}
        action={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );
  else if (cities.length === 0)
    body = (
      <EmptyState
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={<Button onClick={create}>{t('add')}</Button>}
      />
    );
  else
    body = (
      <>
        <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
          {cities.map((city) => (
            <li key={city.id}>
              <CityCard city={city} onToggle={() => setToggling(city)} />
            </li>
          ))}
        </ul>
        {query.hasNextPage && (
          <Button
            variant="outline"
            loading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        )}
      </>
    );

  return (
    <div className="grid gap-stack-gap">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-h1">{t('title')}</h1>
        <Button onClick={create}>
          <span aria-hidden="true">＋</span>
          {t('add')}
        </Button>
      </div>
      <p className="text-text-2 [overflow-wrap:anywhere]">{t('intro')}</p>
      <Notice message={notice} />
      {code && cities.length > 0 && !isDenied(code) && (
        <AdminFailure
          code={code}
          retry={() =>
            void (query.isFetchNextPageError
              ? query.fetchNextPage()
              : query.refetch())
          }
          busy={query.isFetching}
        />
      )}
      {body}
      <CreateCitySheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(city) => {
          setCreateOpen(false);
          setNotice(t('created', { city: cityName(city, locale) }));
        }}
      />
      {toggling && (
        <CityStatusDialog
          key={toggling.id}
          city={cities.find((item) => item.id === toggling.id) ?? toggling}
          onClose={() => setToggling(undefined)}
          onDone={(city) => {
            setToggling(undefined);
            setNotice(
              t(city.status === 'enabled' ? 'enabled' : 'disabled', {
                city: cityName(city, locale),
              }),
            );
          }}
        />
      )}
    </div>
  );
}

function CityCard({
  city,
  onToggle,
}: {
  city: AdminCity;
  onToggle: () => void;
}) {
  const t = useTranslations('geo.cities');
  const locale = useLocale();
  const name = cityName(city, locale);
  const enabled = city.status === 'enabled';
  return (
    <Card padded className="grid h-full gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 text-h3 [overflow-wrap:anywhere]">{name}</h2>
        <CityStatusBadge status={city.status} />
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-small text-text-2">
        <li>
          <span aria-hidden="true">🗺️ </span>
          {t('zoneCount', { count: city.counts.zones })}
        </li>
        <li>
          <span aria-hidden="true">📍 </span>
          {t('areaCount', { count: city.counts.areas })}
        </li>
        <li>
          <span aria-hidden="true">🔔 </span>
          {t('waitlistCount', { count: city.counts.waitlist })}
        </li>
      </ul>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={`/super-admin/cities/${city.id}`}
          className={`${buttonClassName} min-w-0 flex-1`}
          aria-label={t('openName', { city: name })}
        >
          {t('open')}
          <span aria-hidden="true">→</span>
        </Link>
        <Button
          variant={enabled ? 'outline' : 'secondary'}
          aria-label={t(enabled ? 'disableName' : 'enableName', { city: name })}
          onClick={onToggle}
        >
          {t(enabled ? 'disable' : 'enable')}
        </Button>
      </div>
    </Card>
  );
}
