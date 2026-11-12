'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useFormatter, useTranslations } from 'next-intl';
import { AUDIT_ACTOR_ROLES } from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { areaOptions, cityOptions, geoName } from '../../geo/api';
import { useAdmin } from '../AdminShell';
import {
  roleKey,
  type AuditFilterName,
  type AuditFilters,
  type AuditSection,
} from './filters';

export type FilterPatch = Partial<Record<AuditFilterName, string>>;

/** City/area names for pickers and chips. A non-super admin only sees the
 * places their grants name (whole cities, or exact areas); options never widen
 * what the server returns. */
function usePlaces(cityId: string | undefined) {
  const { api, me } = useAdmin();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const cities = useInfiniteQuery(cityOptions(api));
  const wholeCity = me.isSuper || (!!cityId && me.cityWideIds.includes(cityId));
  const areas = useInfiniteQuery({
    ...areaOptions(api, cityId ?? ''),
    enabled: Boolean(cityId) && wholeCity,
  });
  const allowedCities = new Set([
    ...me.cityWideIds,
    ...me.areas.map((area) => area.cityId),
  ]);
  const cityItems = (cities.data?.pages.flatMap((page) => page.items) ?? [])
    .filter((city) => me.isSuper || allowedCities.has(city.id))
    .map((city) => ({ id: city.id, name: geoName(city, locale) }));
  const areaItems = (
    wholeCity
      ? (areas.data?.pages.flatMap((page) => page.items) ?? [])
      : me.areas.filter((area) => area.cityId === cityId)
  ).map((area) => ({ id: area.id, name: geoName(area, locale) }));
  return {
    citiesPending: cities.isPending,
    cityItems,
    areaItems,
    city: (id: string) => cityItems.find((item) => item.id === id)?.name,
    area: (id: string) =>
      areaItems.find((item) => item.id === id)?.name ??
      me.areas.find((area) => area.id === id)?.[
        locale === 'hi' ? 'nameHi' : 'nameEn'
      ],
  };
}

/** S-ADMN-16 scope label: the admin's actual grants, whole cities first. An
 * exact area never reads as its whole city. */
export function AuditScopeNote() {
  const t = useTranslations('admin.audit');
  const { me } = useAdmin();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const places = usePlaces(undefined);
  if (me.isSuper) return null;
  const cities = me.cityWideIds.map((id) =>
    t('wholeCity', { city: places.city(id) ?? t('citySelected') }),
  );
  const areas = me.areas
    .filter((area) => !me.cityWideIds.includes(area.cityId))
    .map((area) => (locale === 'hi' ? area.nameHi : area.nameEn));
  const list = [...cities, ...areas];
  return (
    <p className="text-small text-text-2 [overflow-wrap:anywhere]">
      {list.length ? t('scope', { places: list.join(', ') }) : t('scopeNone')}
    </p>
  );
}

export function AuditFilterControls({
  section,
  filters,
  onChange,
}: {
  section: AuditSection;
  filters: AuditFilters;
  onChange: (patch: FilterPatch) => void;
}) {
  const t = useTranslations('admin.audit');
  const places = usePlaces(filters.cityId);
  return (
    <>
      <Input
        type="date"
        label={t('from')}
        value={filters.from ?? ''}
        max={filters.to}
        onChange={(event) => onChange({ from: event.target.value })}
      />
      <Input
        type="date"
        label={t('to')}
        value={filters.to ?? ''}
        min={filters.from}
        onChange={(event) => onChange({ to: event.target.value })}
      />
      <Select
        label={t('city')}
        value={filters.cityId ?? ''}
        disabled={places.citiesPending}
        options={[
          { value: '', label: t('allCities') },
          ...places.cityItems.map((city) => ({
            value: city.id,
            label: city.name,
          })),
          ...(filters.cityId && !places.city(filters.cityId)
            ? [{ value: filters.cityId, label: t('citySelected') }]
            : []),
        ]}
        onChange={(event) =>
          onChange({ cityId: event.target.value, areaId: '' })
        }
      />
      <Select
        label={t('area')}
        value={filters.areaId ?? ''}
        disabled={!filters.cityId && !filters.areaId}
        hint={filters.cityId ? undefined : t('areaNeedsCity')}
        options={[
          { value: '', label: t('allAreas') },
          ...places.areaItems.map((area) => ({
            value: area.id,
            label: area.name,
          })),
          ...(filters.areaId &&
          !places.areaItems.some((area) => area.id === filters.areaId)
            ? [{ value: filters.areaId, label: t('areaSelected') }]
            : []),
        ]}
        onChange={(event) => onChange({ areaId: event.target.value })}
      />
      {section === 'activity' && (
        <Select
          label={t('role')}
          value={filters.actorRole ?? ''}
          options={[
            { value: '', label: t('allRoles') },
            ...AUDIT_ACTOR_ROLES.map((role) => ({
              value: role,
              label: t(roleKey(role)),
            })),
          ]}
          onChange={(event) => onChange({ actorRole: event.target.value })}
        />
      )}
    </>
  );
}

/** Removable chips for every active URL filter, plus Clear all. The actor chip
 * shows a label from loaded rows for display only; the ID stays the filter. */
export function AuditFilterChips({
  filters,
  actorLabel,
  onRemove,
  onClearAll,
}: {
  filters: AuditFilters;
  actorLabel: string | undefined;
  onRemove: (patch: FilterPatch) => void;
  onClearAll: () => void;
}) {
  const t = useTranslations('admin.audit');
  const format = useFormatter();
  const places = usePlaces(filters.cityId);
  // An IST calendar date, shown in the user's locale; the URL keeps YYYY-MM-DD.
  const day = (date: string | undefined) =>
    date
      ? format.dateTime(new Date(`${date}T12:00:00+05:30`), {
          dateStyle: 'medium',
          timeZone: 'Asia/Kolkata',
        })
      : '';
  const chip = (key: AuditFilterName, label: string, patch?: FilterPatch) =>
    filters[key] ? [{ key, label, patch: patch ?? { [key]: '' } }] : [];
  const chips = [
    ...chip(
      'actorId',
      t('actorChip', { actor: actorLabel ?? t('actorSelected') }),
    ),
    ...chip('action', t('actionChip', { action: filters.action ?? '' })),
    ...chip(
      'entityType',
      t('entityChip', { entity: filters.entityType ?? '' }),
    ),
    ...chip(
      'actorRole',
      filters.actorRole ? t(roleKey(filters.actorRole)) : '',
    ),
    ...chip('from', t('fromChip', { date: day(filters.from) })),
    ...chip('to', t('toChip', { date: day(filters.to) })),
    ...chip(
      'cityId',
      (filters.cityId && places.city(filters.cityId)) || t('citySelected'),
      { cityId: '', areaId: '' },
    ),
    ...chip(
      'areaId',
      (filters.areaId && places.area(filters.areaId)) || t('areaSelected'),
    ),
  ];
  if (chips.length === 0 && !filters.q) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((item) => (
        <Chip
          key={item.key}
          label={item.label}
          removable
          removeLabel={t('removeFilter', { filter: item.label })}
          onRemove={() => onRemove(item.patch)}
        />
      ))}
      <Button variant="text" onClick={onClearAll}>
        {t('clearFilters')}
      </Button>
    </div>
  );
}
