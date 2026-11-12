'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { CreateZone, Zone } from '@apnatown/shared/geo';
import { Button } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { formatInr } from '../../../shared/lib/money';
import { AdminFailure } from '../../admin';
import { GeoNote } from '../../geo/parts';
import { useIdempotentCommand } from '../queries';
import { createZone, updateZone, type UpdateZoneBody } from './api';
import {
  MAX_CORNERS,
  MAX_SLABS,
  MIN_CORNERS,
  parseZoneDraft,
  serverZoneIssues,
  zonePatch,
  type ZoneDraft,
} from './zone-form';
import { ZoneOutline, type OutlineShape } from './ZoneOutline';

type Save =
  | { kind: 'create'; cityId: string; zone: CreateZone }
  | { kind: 'update'; zoneId: string; patch: UpdateZoneBody };

/**
 * S-SUPR-05 zone create/edit. Until the shared Leaflet/Geoman editor is wired,
 * the boundary is edited as an ordered corner list (lat/lng) with a schematic
 * outline preview; fee slabs take INR and are sent as integer paise. A version
 * conflict refetches the zone (shared command) while this draft is kept.
 */
export function ZoneEditor({
  cityId,
  zone,
  draft,
  dirty,
  others,
  onChange,
  onSaved,
  onBack,
  onDelete,
}: {
  cityId: string;
  zone: Zone | undefined;
  draft: ZoneDraft;
  dirty: boolean;
  /** Other zones of this city, outlined for context. */
  others: readonly Zone[];
  onChange: (draft: ZoneDraft) => void;
  onSaved: (zone: Zone) => void;
  onBack: () => void;
  onDelete: (zone: Zone) => void;
}) {
  const t = useTranslations('geo.zones');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [checked, setChecked] = useState(false);
  const [undo, setUndo] = useState<ZoneDraft['corners'][]>([]);
  const command = useIdempotentCommand((api, body: Save, cmd) =>
    body.kind === 'create'
      ? createZone(api, { cityId: body.cityId, zone: body.zone }, cmd)
      : updateZone(api, { zoneId: body.zoneId, patch: body.patch }, cmd),
  );
  const parsed = parseZoneDraft(draft);
  const issues = new Set([
    ...(checked ? parsed.issues : []),
    ...serverZoneIssues(command.code, command.fields),
  ]);
  const fieldCode = ['ZONE_INVALID', 'FEE_SLAB_INVALID'].includes(
    command.code ?? '',
  );
  const set = (patch: Partial<ZoneDraft>) => onChange({ ...draft, ...patch });
  const setCorners = (corners: ZoneDraft['corners']) => {
    setUndo((stack) => [...stack.slice(-19), draft.corners]);
    set({ corners });
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    const value = parsed.value;
    if (!value) return;
    if (!zone)
      return command.submit({ kind: 'create', cityId, zone: value }, onSaved);
    const patch = zonePatch(zone, value);
    if (!patch) return onBack();
    command.submit({ kind: 'update', zoneId: zone.id, patch }, onSaved);
  }

  const preview = parsed.value?.polygon.coordinates;
  const shapes: OutlineShape[] = [
    ...others
      .filter((item) => item.id !== zone?.id)
      .map((item) => ({ id: item.id, rings: item.polygon.coordinates })),
    ...(preview ? [{ id: 'draft', rings: preview, highlighted: true }] : []),
  ];
  const cornerError = (index: number, axis: 'lat' | 'lng') =>
    issues.has(`corner.${index}.${axis}`) ? t(`${axis}Invalid`) : undefined;

  return (
    <Card padded className="grid gap-stack-gap">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h2">{t(zone ? 'editTitle' : 'newTitle')}</h2>
        <Button variant="text" disabled={command.busy} onClick={onBack}>
          <span aria-hidden="true">←</span>
          {t('back')}
        </Button>
      </div>
      <form
        id="zone-editor"
        noValidate
        className="grid gap-stack-gap"
        onSubmit={submit}
      >
        <div className="grid gap-3 tablet:grid-cols-2">
          <Input
            label={t('name')}
            required
            maxLength={80}
            value={draft.name}
            error={issues.has('name') ? t('nameInvalid') : undefined}
            onChange={(event) => set({ name: event.target.value })}
          />
          <Select
            label={t('status')}
            value={draft.status}
            options={[
              { value: 'active', label: t('active') },
              { value: 'paused', label: t('paused') },
            ]}
            onChange={(event) =>
              set({
                status: event.target.value === 'paused' ? 'paused' : 'active',
              })
            }
          />
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-h4">{t('shape')}</legend>
          <GeoNote tone="info" message={t('noMap')} />
          <p className="text-small text-text-2 [overflow-wrap:anywhere]">
            {t('cornersHint', { min: MIN_CORNERS })}
          </p>
          {shapes.length > 0 && (
            <>
              <ZoneOutline shapes={shapes} />
              <p className="text-small text-muted">{t('outlineAlt')}</p>
            </>
          )}
          {draft.holes.length > 0 && (
            <p className="text-small text-text-2">
              {t('holesKept', { count: draft.holes.length })}
            </p>
          )}
          {issues.has('corners') && (
            <p role="alert" className="flex gap-2 text-small text-error">
              <span aria-hidden="true">⚠️</span>
              {t(
                draft.corners.length < MIN_CORNERS
                  ? 'tooFewCorners'
                  : 'shapeInvalid',
              )}
            </p>
          )}
          {draft.corners.length === 0 ? (
            <p className="text-small text-text-2">{t('noCorners')}</p>
          ) : (
            <ol className="m-0 grid list-none gap-2 p-0">
              {draft.corners.map((corner, index) => (
                <li
                  key={index}
                  className="grid gap-2 rounded-md border border-border p-2 tablet:grid-cols-[1fr_1fr_auto] tablet:items-end"
                >
                  <Input
                    label={t('cornerLat', { n: index + 1 })}
                    inputMode="decimal"
                    value={corner.lat}
                    error={cornerError(index, 'lat')}
                    onChange={(event) =>
                      set({
                        corners: draft.corners.map((item, at) =>
                          at === index
                            ? { ...item, lat: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <Input
                    label={t('cornerLng', { n: index + 1 })}
                    inputMode="decimal"
                    value={corner.lng}
                    error={cornerError(index, 'lng')}
                    onChange={(event) =>
                      set({
                        corners: draft.corners.map((item, at) =>
                          at === index
                            ? { ...item, lng: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    aria-label={t('removeCorner', { n: index + 1 })}
                    onClick={() =>
                      setCorners(draft.corners.filter((_, at) => at !== index))
                    }
                  >
                    {t('remove')}
                  </Button>
                </li>
              ))}
            </ol>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={draft.corners.length >= MAX_CORNERS}
              onClick={() =>
                setCorners([...draft.corners, { lat: '', lng: '' }])
              }
            >
              <span aria-hidden="true">＋</span>
              {t('addCorner')}
            </Button>
            <Button
              variant="ghost"
              disabled={undo.length === 0}
              onClick={() => {
                const previous = undo.at(-1);
                if (!previous) return;
                setUndo((stack) => stack.slice(0, -1));
                set({ corners: previous });
              }}
            >
              {t('undo')}
            </Button>
          </div>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="text-h4">{t('slabs')}</legend>
          <p className="text-small text-text-2 [overflow-wrap:anywhere]">
            {t('slabsHint', { max: MAX_SLABS })}
          </p>
          {issues.has('slabs') && (
            <p role="alert" className="flex gap-2 text-small text-error">
              <span aria-hidden="true">⚠️</span>
              {t('slabsInvalid')}
            </p>
          )}
          <ol className="m-0 grid list-none gap-2 p-0">
            {draft.slabs.map((slab, index) => {
              const fee = parsed.value?.feeSlabs[index]?.feePaise;
              return (
                <li
                  key={index}
                  className="grid gap-2 rounded-md border border-border p-2 tablet:grid-cols-[1fr_1fr_auto] tablet:items-end"
                >
                  <Input
                    label={t('upTo', { n: index + 1 })}
                    inputMode="decimal"
                    value={slab.km}
                    error={
                      issues.has(`slab.${index}.km`)
                        ? t('kmInvalid')
                        : undefined
                    }
                    onChange={(event) =>
                      set({
                        slabs: draft.slabs.map((item, at) =>
                          at === index
                            ? { ...item, km: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <Input
                    label={t('fee', { n: index + 1 })}
                    prefix="₹"
                    inputMode="decimal"
                    value={slab.fee}
                    hint={
                      fee !== undefined
                        ? t('feePreview', { fee: formatInr(fee, locale) })
                        : undefined
                    }
                    error={
                      issues.has(`slab.${index}.fee`)
                        ? t('feeInvalid')
                        : undefined
                    }
                    onChange={(event) =>
                      set({
                        slabs: draft.slabs.map((item, at) =>
                          at === index
                            ? { ...item, fee: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    disabled={draft.slabs.length <= 1}
                    aria-label={t('removeSlab', { n: index + 1 })}
                    onClick={() =>
                      set({
                        slabs: draft.slabs.filter((_, at) => at !== index),
                      })
                    }
                  >
                    {t('remove')}
                  </Button>
                </li>
              );
            })}
          </ol>
          <div>
            <Button
              variant="outline"
              disabled={draft.slabs.length >= MAX_SLABS}
              onClick={() =>
                set({ slabs: [...draft.slabs, { km: '', fee: '' }] })
              }
            >
              <span aria-hidden="true">＋</span>
              {t('addSlab')}
            </Button>
          </div>
        </fieldset>

        {command.code && !fieldCode && <AdminFailure code={command.code} />}
        {dirty && (
          <p className="flex gap-2 text-small text-text-2">
            <span aria-hidden="true">●</span>
            {t('unsaved')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={command.busy} disabled={!dirty}>
            {t('save')}
          </Button>
          <Button variant="ghost" disabled={command.busy} onClick={onBack}>
            {t('cancel')}
          </Button>
          {zone && (
            <Button
              variant="danger"
              disabled={command.busy}
              className="ms-auto"
              onClick={() => onDelete(zone)}
            >
              {t('delete')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
