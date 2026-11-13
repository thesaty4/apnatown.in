import {
  CreateZoneSchema,
  LatitudeSchema,
  LongitudeSchema,
  type CreateZone,
  type GeoJsonPolygon,
  type Zone,
  type ZoneStatus,
} from '@apnatown/shared/geo';
import type { UpdateZoneBody } from './api';
import { rupees, toPaise, type Issues } from '../settings/form';

export type CornerDraft = { lat: string; lng: string };
export type SlabDraft = { km: string; fee: string };
export type ZoneDraft = {
  name: string;
  status: ZoneStatus;
  /** Outer ring corners, open (the closing point is added on save). */
  corners: CornerDraft[];
  /** Inner rings (holes) are preserved untouched; this fallback edits only
   * the outer boundary. */
  holes: GeoJsonPolygon['coordinates'];
  slabs: SlabDraft[];
};

export const MAX_SLABS = 3;
export const MIN_CORNERS = 3;
export const MAX_CORNERS = 499;

export const emptyZoneDraft = (): ZoneDraft => ({
  name: '',
  status: 'active',
  corners: [],
  holes: [],
  slabs: [{ km: '', fee: '' }],
});

export function draftOfZone(zone: Zone): ZoneDraft {
  const [outer = [], ...holes] = zone.polygon.coordinates;
  return {
    name: zone.name,
    status: zone.status,
    corners: outer
      .slice(0, -1)
      .map(([lng, lat]) => ({ lat: String(lat), lng: String(lng) })),
    holes,
    slabs: zone.feeSlabs.length
      ? zone.feeSlabs.map((slab) => ({
          km: String(slab.upperDistanceKm),
          fee: rupees(slab.feePaise),
        }))
      : [{ km: '', fee: '' }],
  };
}

const coordinate = /^-?\d{1,3}(?:\.\d{1,7})?$/;
const km = /^\d{1,3}(?:\.\d{1,2})?$/;

/** Validates the draft with the same shared schema the API applies. Issue
 * paths: `name`, `corners`, `corner.<i>.lat|lng`, `slabs`, `slab.<i>.km|fee`. */
export function parseZoneDraft(draft: ZoneDraft): {
  value?: CreateZone;
  issues: Issues;
} {
  const issues: Issues = new Set();
  const ring = draft.corners.map((corner, index) => {
    const lat = Number(corner.lat.trim());
    const lng = Number(corner.lng.trim());
    if (
      !coordinate.test(corner.lat.trim()) ||
      !LatitudeSchema.safeParse(lat).success
    )
      issues.add(`corner.${index}.lat`);
    if (
      !coordinate.test(corner.lng.trim()) ||
      !LongitudeSchema.safeParse(lng).success
    )
      issues.add(`corner.${index}.lng`);
    return [lng, lat] as [number, number];
  });
  const distinct = new Set(ring.map((point) => point.join(','))).size;
  if (distinct < MIN_CORNERS || ring.length > MAX_CORNERS)
    issues.add('corners');
  const slabs = draft.slabs.map((slab, index) => {
    const value = slab.km.trim();
    if (!km.test(value)) issues.add(`slab.${index}.km`);
    return {
      upperDistanceKm: Number(value),
      feePaise: toPaise(slab.fee, `slab.${index}.fee`, issues),
    };
  });
  if (
    slabs.some(
      (slab, index) =>
        index > 0 && slab.upperDistanceKm <= slabs[index - 1]!.upperDistanceKm,
    )
  )
    issues.add('slabs');
  const first = ring[0];
  const candidate = {
    name: draft.name.trim(),
    status: draft.status,
    polygon: {
      type: 'Polygon' as const,
      coordinates: [first ? [...ring, first] : ring, ...draft.holes],
    },
    feeSlabs: slabs,
  };
  const parsed = CreateZoneSchema.safeParse(candidate);
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'name') issues.add('name');
      else if (field === 'polygon') issues.add('corners');
      else if (field === 'feeSlabs' && !hasSlabIssue(issues)) issues.add('slabs');
    }
  return issues.size || !parsed.success
    ? { issues }
    : { value: parsed.data, issues };
}

const hasSlabIssue = (issues: Issues) =>
  [...issues].some((issue) => issue.startsWith('slab'));

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Only the changed fields plus the latest version (PATCH semantics). */
export function zonePatch(zone: Zone, value: CreateZone): UpdateZoneBody | null {
  const patch: Omit<UpdateZoneBody, 'expectedVersion'> = {};
  if (value.name !== zone.name) patch.name = value.name;
  if (value.status !== zone.status) patch.status = value.status;
  if (!same(value.polygon, zone.polygon)) patch.polygon = value.polygon;
  if (!same(value.feeSlabs, zone.feeSlabs)) patch.feeSlabs = value.feeSlabs;
  return Object.keys(patch).length
    ? { ...patch, expectedVersion: zone.version }
    : null;
}

export const isZoneDraftDirty = (draft: ZoneDraft, zone: Zone | undefined) =>
  !same(draft, zone ? draftOfZone(zone) : emptyZoneDraft());

/** Server field names → draft issue paths for field-level errors. */
export function serverZoneIssues(code: string | undefined, fields: readonly string[]) {
  const issues: Issues = new Set();
  if (code === 'ZONE_INVALID') issues.add('corners');
  if (code === 'FEE_SLAB_INVALID') issues.add('slabs');
  for (const field of fields) {
    const name = field.split('.')[0];
    if (name === 'name') issues.add('name');
    else if (name === 'polygon') issues.add('corners');
    else if (name === 'feeSlabs') issues.add('slabs');
  }
  return issues;
}
