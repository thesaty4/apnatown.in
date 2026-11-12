'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { IdSchema } from '@apnatown/shared/wire';
import type {
  AdminCity,
  AdminCityDetail,
  GstStateCode,
  Zone,
} from '@apnatown/shared/geo';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { Select } from '@apnatown/ui/primitives/Select';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  NotFoundState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../../shared/api/result';
import { formatInr } from '../../../shared/lib/money';
import {
  AdminFailure,
  adminErrorKey,
  isDenied,
  Notice,
  useAdmin,
} from '../../admin';
import { useIdempotentCommand } from '../queries';
import { deleteZone, setCityStateCode } from './api';
import {
  CityStatusBadge,
  CityStatusDialog,
  cityName,
  useStateOptions,
} from './CitySheets';
import { cityOptions } from './queries';
import {
  draftOfZone,
  emptyZoneDraft,
  isZoneDraftDirty,
  type ZoneDraft,
} from './zone-form';
import { ZoneEditor } from './ZoneEditor';
import { ZoneOutline } from './ZoneOutline';

const notFoundCodes = ['CITY_NOT_FOUND', 'NOT_FOUND', 'COMMON_NOT_FOUND'];

/** S-SUPR-05 city detail. The open zone editor is URL state (`?zone=new|id`);
 * its unsaved draft lives here so Back/navigation can ask before discarding. */
export function CityDetail({ cityId }: { cityId: string }) {
  const context = useAdmin();
  const t = useTranslations('geo.cities');
  const tz = useTranslations('geo.zones');
  const te = useTranslations('admin.errors');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('zone');
  const zoneParam =
    requested === 'new' ||
    (requested && IdSchema.safeParse(requested).success)
      ? requested
      : undefined;
  const query = useQuery(cityOptions(context, cityId));
  const detail = query.data;
  const [draft, setDraft] = useState<{ target: string; value: ZoneDraft }>();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState<Zone>();
  const [notice, setNotice] = useState<string>();
  const zones = detail?.zones ?? [];
  const findZone = (target: string | undefined) =>
    target && target !== 'new'
      ? zones.find((zone) => zone.id === target)
      : undefined;
  const editing = findZone(zoneParam);
  const baseDraft = (target: string) => {
    const zone = findZone(target);
    return zone ? draftOfZone(zone) : emptyZoneDraft();
  };
  const active =
    zoneParam &&
    (draft?.target === zoneParam ? draft.value : baseDraft(zoneParam));
  const dirty = Boolean(
    draft &&
      (draft.target === 'new' || findZone(draft.target)) &&
      isZoneDraftDirty(draft.value, findZone(draft.target)),
  );

  const go = (target?: string) =>
    router.push(
      target ? `${pathname}?${new URLSearchParams({ zone: target })}` : pathname,
      { scroll: false },
    );
  const closeEditor = () => {
    setDraft(undefined);
    setDiscardOpen(false);
    go();
  };
  const leave = () => (dirty ? setDiscardOpen(true) : closeEditor());
  const openZone = (target: string) => {
    setNotice(undefined);
    go(target);
  };

  // Browser Back left the editor with unsaved edits: restore it and ask.
  useEffect(() => {
    if (!zoneParam && draft && dirty) {
      router.push(`${pathname}?${new URLSearchParams({ zone: draft.target })}`, {
        scroll: false,
      });
      setDiscardOpen(true);
    } else if (!zoneParam && draft) setDraft(undefined);
  }, [zoneParam, draft, dirty, pathname, router]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const code = query.isError ? failureCode(query.error) : undefined;
  const { recheck } = context;
  useEffect(() => {
    if (code && isDenied(code)) recheck();
  }, [code, recheck]);

  if (query.isPending) return <Skeleton label={t('detailLoading')} />;
  if (code && isDenied(code))
    return (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={te(adminErrorKey(code))}
        action={<Button onClick={recheck}>{t('checkAgain')}</Button>}
      />
    );
  if (code && (!detail || notFoundCodes.includes(code)))
    return notFoundCodes.includes(code) ? (
      <NotFoundState
        title={t('notFoundTitle')}
        message={t('notFoundMessage')}
        action={<AllCitiesLink />}
      />
    ) : (
      <ErrorState
        title={t('detailErrorTitle')}
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
  if (!detail) return null;
  const { city } = detail;
  const name = cityName(city, locale);
  const otherName = locale === 'hi' ? city.nameEn : city.nameHi;

  return (
    <div className="grid gap-stack-gap">
      <div>
        <AllCitiesLink />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid min-w-0 gap-1">
          <h1 className="text-h1 [overflow-wrap:anywhere]">{name}</h1>
          <p className="text-small text-text-2 [overflow-wrap:anywhere]">
            {otherName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CityStatusBadge status={city.status} />
          <Button
            variant={city.status === 'enabled' ? 'outline' : 'primary'}
            onClick={() => {
              setNotice(undefined);
              setToggling(true);
            }}
          >
            {t(city.status === 'enabled' ? 'disableCity' : 'enableCity')}
          </Button>
        </div>
      </div>
      <Notice message={notice} />
      {code && (
        <AdminFailure
          code={code}
          retry={() => void query.refetch()}
          busy={query.isFetching}
        />
      )}

      {zoneParam && active ? (
        zoneParam !== 'new' && !editing ? (
          <NotFoundState
            title={tz('notFoundTitle')}
            message={tz('notFoundMessage')}
            action={<Button onClick={closeEditor}>{tz('back')}</Button>}
          />
        ) : (
          <ZoneEditor
            key={zoneParam}
            cityId={city.id}
            zone={editing}
            draft={active}
            dirty={isZoneDraftDirty(active, editing)}
            others={zones}
            onChange={(value) => setDraft({ target: zoneParam, value })}
            onSaved={() => {
              setNotice(tz('saved'));
              closeEditor();
            }}
            onBack={leave}
            onDelete={setDeleting}
          />
        )
      ) : (
        <>
          <ZonesCard detail={detail} onOpen={openZone} onDelete={setDeleting} />
          <StateCard city={city} onSaved={() => setNotice(t('stateSaved'))} />
          <AreasCard detail={detail} />
          <Card padded className="grid gap-2">
            <h2 className="text-h3">{t('adminsTitle')}</h2>
            <p className="text-small text-text-2 [overflow-wrap:anywhere]">
              {t('adminsHint')}
            </p>
            <div>
              <Link
                href={`/super-admin/admins?${new URLSearchParams({ cityId: city.id })}`}
                className={buttonClassName}
              >
                {t('manageAdmins')}
              </Link>
            </div>
          </Card>
        </>
      )}

      {toggling && (
        <CityStatusDialog
          city={city}
          onClose={() => setToggling(false)}
          onDone={(updated) => {
            setToggling(false);
            setNotice(
              t(updated.status === 'enabled' ? 'enabled' : 'disabled', {
                city: cityName(updated, locale),
              }),
            );
          }}
        />
      )}
      {deleting && (
        <DeleteZoneDialog
          key={deleting.id}
          zone={zones.find((zone) => zone.id === deleting.id) ?? deleting}
          onClose={() => setDeleting(undefined)}
          onDeleted={() => {
            setDeleting(undefined);
            setNotice(tz('deleted'));
            if (zoneParam) closeEditor();
          }}
        />
      )}
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={tz('discardTitle')}
        impact={tz('discardMessage')}
        cancelLabel={tz('keepEditing')}
        confirmLabel={tz('discard')}
        tone="danger"
        onConfirm={closeEditor}
      />
    </div>
  );
}

function AllCitiesLink() {
  const t = useTranslations('geo.cities');
  return (
    <Link
      href="/super-admin/cities"
      className="inline-flex min-h-touch items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
    >
      <span aria-hidden="true">←</span>
      {t('allCities')}
    </Link>
  );
}

function ZonesCard({
  detail,
  onOpen,
  onDelete,
}: {
  detail: AdminCityDetail;
  onOpen: (target: string) => void;
  onDelete: (zone: Zone) => void;
}) {
  const t = useTranslations('geo.zones');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const format = useFormatter();
  const { zones, city } = detail;
  return (
    <Card padded className="grid gap-stack-gap">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h2">{t('title')}</h2>
        {zones.length > 0 && (
          <Button onClick={() => onOpen('new')}>
            <span aria-hidden="true">＋</span>
            {t('drawNew')}
          </Button>
        )}
      </div>
      {zones.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={<Button onClick={() => onOpen('new')}>{t('drawFirst')}</Button>}
        />
      ) : (
        <>
          <ZoneOutline
            shapes={zones.map((zone) => ({
              id: zone.id,
              rings: zone.polygon.coordinates,
            }))}
          />
          <p className="text-small text-muted">{t('outlineAlt')}</p>
          {city.counts.zones > zones.length && (
            <p className="text-small text-text-2">
              {t('showing', { shown: zones.length, total: city.counts.zones })}
            </p>
          )}
          <ul className="m-0 grid list-none gap-3 p-0">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="grid gap-2 rounded-md border border-border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="min-w-0 text-h4 [overflow-wrap:anywhere]">
                    {zone.name}
                  </h3>
                  <Badge
                    tone={zone.status === 'active' ? 'ok' : 'warn'}
                    icon={zone.status === 'active' ? '●' : '⏸'}
                    label={t(zone.status)}
                  />
                </div>
                {zone.feeSlabs.length === 0 ? (
                  <p className="text-small text-text-2">{t('noSlabs')}</p>
                ) : (
                  <ul
                    aria-label={t('slabs')}
                    className="m-0 flex list-none flex-wrap gap-2 p-0 text-small"
                  >
                    {zone.feeSlabs.map((slab) => (
                      <li
                        key={slab.upperDistanceKm}
                        className="rounded-md bg-surface-2 px-2 py-1"
                      >
                        {t('slabSummary', {
                          km: format.number(slab.upperDistanceKm, {
                            maximumFractionDigits: 2,
                          }),
                          fee: formatInr(slab.feePaise, locale),
                        })}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    aria-label={t('editName', { zone: zone.name })}
                    onClick={() => onOpen(zone.id)}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={t('deleteName', { zone: zone.name })}
                    onClick={() => onDelete(zone)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/** GST state of the city (fiscal quotes). Versioned; a conflict refetches and
 * keeps the chosen value so the admin can save again. */
function StateCard({
  city,
  onSaved,
}: {
  city: AdminCity;
  onSaved: () => void;
}) {
  const t = useTranslations('geo.cities');
  const states = useStateOptions();
  const [choice, setChoice] = useState<GstStateCode>();
  const value = choice ?? city.stateCode;
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof setCityStateCode>[1], cmd) =>
      setCityStateCode(api, body, cmd),
  );
  const changed = value !== city.stateCode;
  return (
    <Card padded className="grid gap-3">
      <h2 className="text-h3">{t('stateTitle')}</h2>
      <form
        noValidate
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!changed) return;
          command.submit(
            { cityId: city.id, stateCode: value, expectedVersion: city.version },
            () => {
              setChoice(undefined);
              onSaved();
            },
          );
        }}
      >
        <Select
          label={t('state')}
          hint={t('stateEditHint')}
          value={value}
          options={states}
          error={
            command.fields.includes('stateCode') ? t('stateRequired') : undefined
          }
          onChange={(event) => setChoice(event.target.value as GstStateCode)}
        />
        {command.code && !command.fields.includes('stateCode') && (
          <AdminFailure code={command.code} />
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={command.busy} disabled={!changed}>
            {t('saveState')}
          </Button>
          {changed && (
            <Button
              variant="ghost"
              disabled={command.busy}
              onClick={() => setChoice(undefined)}
            >
              {t('reset')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function AreasCard({ detail }: { detail: AdminCityDetail }) {
  const t = useTranslations('geo.cities');
  const locale = useLocale();
  const { areas, city } = detail;
  return (
    <Card padded className="grid gap-3">
      <h2 className="text-h3">{t('areasTitle')}</h2>
      {areas.length === 0 ? (
        <p className="text-small text-text-2">{t('areasEmpty')}</p>
      ) : (
        <>
          {city.counts.areas > areas.length && (
            <p className="text-small text-text-2">
              {t('showing', { shown: areas.length, total: city.counts.areas })}
            </p>
          )}
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {areas.map((area) => (
              <li
                key={area.id}
                className="rounded-md bg-surface-2 px-2 py-1 text-small [overflow-wrap:anywhere]"
              >
                {locale === 'hi' ? area.nameHi : area.nameEn}
                {area.pinCode && (
                  <span className="text-text-2"> · {area.pinCode}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="text-small text-muted">{t('areasHint')}</p>
    </Card>
  );
}

function DeleteZoneDialog({
  zone,
  onClose,
  onDeleted,
}: {
  zone: Zone;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations('geo.zones');
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof deleteZone>[1], cmd) =>
      deleteZone(api, body, cmd),
  );
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && !command.busy && onClose()}
      title={t('deleteTitle', { zone: zone.name })}
      impact={t('deleteImpact')}
      cancelLabel={t('cancel')}
      confirmLabel={t('delete')}
      tone="danger"
      busy={command.busy}
      onConfirm={() =>
        command.submit(
          { zoneId: zone.id, expectedVersion: zone.version },
          onDeleted,
        )
      }
    >
      {command.code && <AdminFailure code={command.code} />}
    </ConfirmDialog>
  );
}
