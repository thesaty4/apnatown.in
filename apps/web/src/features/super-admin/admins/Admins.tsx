'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { IdSchema } from '@apnatown/shared/wire';
import { AdminStatusSchema, type AdminCard } from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../../shared/api/result';
import { areaOptions, cityOptions, geoName } from '../../geo/api';
import { adminErrorKey, isDenied, Notice, useAdmin } from '../../admin';
import { adminsOptions, useAllRoles } from '../queries';
import type { AdminFilters } from '../api';
import { AdminCardView } from './AdminCardView';
import {
  AreasSheet,
  CreateAdminSheet,
  PermissionsSheet,
  RoleSheet,
  StatusDialog,
} from './AdminSheets';

type FilterName = 'cityId' | 'areaId' | 'zoneId' | 'roleId' | 'status';

/** Validated URL state; unknown values are dropped, never sent. Exactly one of
 * areaId/zoneId survives (area wins), matching the API contract. */
function readFilters(params: URLSearchParams): AdminFilters {
  const id = (name: FilterName) => {
    const value = params.get(name);
    return value && IdSchema.safeParse(value).success ? value : undefined;
  };
  const status = AdminStatusSchema.safeParse(params.get('status'));
  const areaId = id('areaId');
  const filters: AdminFilters = {
    cityId: id('cityId'),
    areaId,
    zoneId: areaId ? undefined : id('zoneId'),
    roleId: id('roleId'),
    status: status.success ? status.data : undefined,
  };
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined),
  );
}

export type SheetState =
  | { kind: 'areas' | 'permissions' | 'role' | 'status'; card: AdminCard }
  | undefined;

/** S-SUPR-02 Admins and areas. */
export function Admins() {
  const context = useAdmin();
  const t = useTranslations('superAdmin.admins');
  const te = useTranslations('admin.errors');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramString = params.toString();
  const filters = useMemo(
    () => readFilters(new URLSearchParams(paramString)),
    [paramString],
  );
  const [text, setText] = useState('');
  const [search, setSearch] = useState({ q: '', revision: 0 });
  useEffect(() => {
    const q = text.trim().slice(0, 100);
    const timer = window.setTimeout(
      () =>
        setSearch((current) =>
          current.q === q ? current : { q, revision: current.revision + 1 },
        ),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [text]);
  const list = useInfiniteQuery(adminsOptions(context, filters, search));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetState>();
  const [notice, setNotice] = useState<string>();

  function setFilters(patch: Partial<Record<FilterName, string>>) {
    const next = new URLSearchParams(paramString);
    for (const [name, value] of Object.entries(patch))
      if (value) next.set(name, value);
      else next.delete(name);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }
  const clearAll = () => {
    setText('');
    setFilters({
      cityId: '',
      areaId: '',
      zoneId: '',
      roleId: '',
      status: '',
    });
  };
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.total;
  // The latest server copy wins; the snapshot only covers a card that left the list.
  const current =
    sheet && (items.find((item) => item.id === sheet.card.id) ?? sheet.card);
  const done = (message: string) => {
    setSheet(undefined);
    setNotice(message);
  };

  const filterControls = (
    <FilterControls filters={filters} onChange={setFilters} />
  );
  const code = list.isError ? failureCode(list.error) : undefined;
  const { recheck } = context;
  useEffect(() => {
    // A denial means authority changed: re-read /admin/me, which gates the shell.
    if (code && isDenied(code)) recheck();
  }, [code, recheck]);

  return (
    <div className="grid gap-stack-gap">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-h1">{t('title')}</h1>
        <Button
          onClick={() => {
            setNotice(undefined);
            setCreateOpen(true);
          }}
        >
          {t('add')}
        </Button>
      </div>
      <Input
        type="search"
        label={t('searchLabel')}
        placeholder={t('search')}
        value={text}
        maxLength={100}
        autoComplete="off"
        onChange={(event) => setText(event.target.value)}
      />
      <div className="hidden gap-3 desktop:grid desktop:grid-cols-4">
        {filterControls}
      </div>
      <div className="desktop:hidden">
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          {t('filters')}
        </Button>
        <Sheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          title={t('filters')}
          closeLabel={t('close')}
          footer={
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>
              {t('show')}
            </Button>
          }
        >
          <div className="grid gap-3">{filterControls}</div>
        </Sheet>
      </div>
      <ActiveChips
        filters={filters}
        onRemove={setFilters}
        onClearAll={clearAll}
        searching={search.q !== ''}
      />
      <Notice message={notice} />
      {list.isPending ? (
        <Skeleton label={t('loading')} />
      ) : code === 'COMMON_UNAVAILABLE' && filters.zoneId ? (
        <EmptyState
          title={t('zoneUnavailableTitle')}
          message={t('zoneUnavailableMessage')}
          action={
            <Button onClick={() => setFilters({ zoneId: '' })}>
              {t('clearZone')}
            </Button>
          }
        />
      ) : code && isDenied(code) ? (
        <NoPermissionState
          title={t('forbiddenTitle')}
          message={te(adminErrorKey(code))}
          action={<Button onClick={context.recheck}>{t('checkAgain')}</Button>}
        />
      ) : code ? (
        <ErrorState
          title={t('errorTitle')}
          message={te(adminErrorKey(code))}
          action={
            <Button
              disabled={list.isFetching}
              onClick={() => void list.refetch()}
            >
              {t('retry')}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={<Button onClick={clearAll}>{t('clearAll')}</Button>}
        />
      ) : (
        <>
          <p role="status" className="text-text-2">
            {t('count', { count: total ?? items.length })}
          </p>
          <ul className="m-0 grid list-none gap-3 p-0">
            {items.map((card) => (
              <li key={card.id}>
                <AdminCardView
                  card={card}
                  self={card.id === context.me.id}
                  onAction={(kind) => {
                    setNotice(undefined);
                    setSheet({ kind, card });
                  }}
                />
              </li>
            ))}
          </ul>
          {list.hasNextPage && (
            <Button
              variant="outline"
              loading={list.isFetchingNextPage}
              onClick={() => void list.fetchNextPage()}
            >
              {t('loadMore')}
            </Button>
          )}
          {list.isFetchNextPageError && (
            <ErrorState
              title={t('errorTitle')}
              message={te('failed')}
              action={
                <Button onClick={() => void list.fetchNextPage()}>
                  {t('retry')}
                </Button>
              }
            />
          )}
        </>
      )}
      <CreateAdminSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          setNotice(t('created'));
        }}
      />
      {current && sheet?.kind === 'areas' && (
        <AreasSheet
          key={current.id}
          card={current}
          onClose={() => setSheet(undefined)}
          onDone={done}
        />
      )}
      {current && sheet?.kind === 'permissions' && (
        <PermissionsSheet
          key={current.id}
          card={current}
          onClose={() => setSheet(undefined)}
          onDone={done}
        />
      )}
      {current && sheet?.kind === 'role' && (
        <RoleSheet
          key={current.id}
          card={current}
          onClose={() => setSheet(undefined)}
          onDone={done}
        />
      )}
      {current && sheet?.kind === 'status' && (
        <StatusDialog
          key={current.id}
          card={current}
          onClose={() => setSheet(undefined)}
          onDone={done}
        />
      )}
    </div>
  );
}

function useFilterNames(filters: AdminFilters) {
  const { api } = useAdmin();
  const locale: 'hi' | 'en' = useLocale() === 'hi' ? 'hi' : 'en';
  const cities = useInfiniteQuery(cityOptions(api));
  const areas = useInfiniteQuery({
    ...areaOptions(api, filters.cityId ?? ''),
    enabled: Boolean(filters.cityId),
  });
  const { roles } = useAllRoles();
  const cityItems = cities.data?.pages.flatMap((page) => page.items) ?? [];
  const areaItems = areas.data?.pages.flatMap((page) => page.items) ?? [];
  return {
    cities,
    areas,
    roles,
    cityItems,
    areaItems,
    locale,
    city: (id: string) => {
      const city = cityItems.find((item) => item.id === id);
      return city && geoName(city, locale);
    },
    area: (id: string) => {
      const area = areaItems.find((item) => item.id === id);
      return area && geoName(area, locale);
    },
    role: (id: string) => roles.find((role) => role.id === id)?.name,
  };
}

function FilterControls({
  filters,
  onChange,
}: {
  filters: AdminFilters;
  onChange: (patch: Partial<Record<FilterName, string>>) => void;
}) {
  const t = useTranslations('superAdmin.admins');
  const names = useFilterNames(filters);
  const scopeValue = filters.areaId
    ? `area:${filters.areaId}`
    : filters.zoneId
      ? `zone:${filters.zoneId}`
      : '';
  return (
    <>
      <Select
        label={t('city')}
        value={filters.cityId ?? ''}
        disabled={names.cities.isPending}
        options={[
          { value: '', label: t('allCities') },
          ...names.cityItems.map((city) => ({
            value: city.id,
            label: geoName(city, names.locale),
          })),
        ]}
        onChange={(event) =>
          onChange({ cityId: event.target.value, areaId: '', zoneId: '' })
        }
      />
      <Select
        label={t('areaZone')}
        value={scopeValue}
        disabled={!filters.cityId && !scopeValue}
        hint={filters.cityId ? t('zonesUnavailableHint') : t('areaNeedsCity')}
        options={[
          { value: '', label: t('allAreas') },
          ...names.areaItems.map((area) => ({
            value: `area:${area.id}`,
            label: geoName(area, names.locale),
          })),
          ...(filters.zoneId
            ? [{ value: scopeValue, label: t('zoneSelected') }]
            : []),
          ...(filters.areaId &&
          !names.areaItems.some((area) => area.id === filters.areaId)
            ? [{ value: scopeValue, label: t('areaSelected') }]
            : []),
          { value: 'zones', label: t('zonesUnavailable'), disabled: true },
        ]}
        onChange={(event) => {
          const [kind, id] = event.target.value.split(':');
          onChange({
            areaId: kind === 'area' ? (id ?? '') : '',
            zoneId: kind === 'zone' ? (id ?? '') : '',
          });
        }}
      />
      <Select
        label={t('role')}
        value={filters.roleId ?? ''}
        disabled={names.roles.length === 0 && !filters.roleId}
        options={[
          { value: '', label: t('allRoles') },
          ...names.roles.map((role) => ({ value: role.id, label: role.name })),
          ...(filters.roleId && !names.role(filters.roleId)
            ? [{ value: filters.roleId, label: t('roleSelected') }]
            : []),
        ]}
        onChange={(event) => onChange({ roleId: event.target.value })}
      />
      <Select
        label={t('status')}
        value={filters.status ?? ''}
        options={[
          { value: '', label: t('anyStatus') },
          { value: 'active', label: t('active') },
          { value: 'inactive', label: t('inactive') },
        ]}
        onChange={(event) => onChange({ status: event.target.value })}
      />
    </>
  );
}

function ActiveChips({
  filters,
  onRemove,
  onClearAll,
  searching,
}: {
  filters: AdminFilters;
  onRemove: (patch: Partial<Record<FilterName, string>>) => void;
  onClearAll: () => void;
  searching: boolean;
}) {
  const t = useTranslations('superAdmin.admins');
  const names = useFilterNames(filters);
  const chips = [
    filters.cityId && {
      key: 'cityId',
      label: names.city(filters.cityId) ?? t('city'),
      patch: { cityId: '', areaId: '', zoneId: '' },
    },
    filters.areaId && {
      key: 'areaId',
      label: names.area(filters.areaId) ?? t('areaSelected'),
      patch: { areaId: '' },
    },
    filters.zoneId && {
      key: 'zoneId',
      label: t('zoneSelected'),
      patch: { zoneId: '' },
    },
    filters.roleId && {
      key: 'roleId',
      label: names.role(filters.roleId) ?? t('roleSelected'),
      patch: { roleId: '' },
    },
    filters.status && {
      key: 'status',
      label: t(filters.status),
      patch: { status: '' },
    },
  ].filter((chip) => !!chip);
  if (chips.length === 0 && !searching) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          label={chip.label}
          removable
          removeLabel={t('removeFilter', { filter: chip.label })}
          onRemove={() => onRemove(chip.patch)}
        />
      ))}
      <Button variant="text" onClick={onClearAll}>
        {t('clearAll')}
      </Button>
    </div>
  );
}
