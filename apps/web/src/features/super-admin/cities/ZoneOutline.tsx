'use client';

import type { GeoJsonPolygon } from '@apnatown/shared/geo';

export type OutlineShape = {
  id: string;
  rings: GeoJsonPolygon['coordinates'];
  highlighted?: boolean;
};

const SIZE = 240;
const PAD = 12;

/**
 * Dependency-free schematic of zone outlines (no tiles, no provider). It is a
 * visual aid only (aria-hidden); the caller supplies the text alternative and
 * the coordinate list remains the accessible source of truth.
 * TODO(verify): replace with the approved map provider's zone editor.
 */
export function ZoneOutline({ shapes }: { shapes: readonly OutlineShape[] }) {
  const points = shapes.flatMap((shape) => shape.rings.flat());
  if (points.length < 3) return null;
  const lngs = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);
  const minLng = Math.min(...lngs);
  const maxLat = Math.max(...lats);
  // Equirectangular with longitude scaled by cos(latitude) so shapes keep
  // their rough proportions at Indian latitudes.
  const scaleX = Math.cos(((Math.min(...lats) + maxLat) / 2) * (Math.PI / 180));
  const width = (Math.max(...lngs) - minLng) * scaleX || 1e-6;
  const height = maxLat - Math.min(...lats) || 1e-6;
  const unit = (SIZE - PAD * 2) / Math.max(width, height);
  const project = ([lng, lat]: readonly number[]) =>
    `${(PAD + (lng! - minLng) * scaleX * unit).toFixed(1)},${(PAD + (maxLat - lat!) * unit).toFixed(1)}`;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-sm rounded-md border border-border bg-surface-2"
    >
      {shapes.map((shape) =>
        shape.rings.map((ring, index) => (
          <polygon
            key={`${shape.id}-${index}`}
            points={ring.map(project).join(' ')}
            className={
              shape.highlighted
                ? 'fill-primary-soft stroke-primary'
                : 'fill-transparent stroke-text-2'
            }
            strokeWidth={shape.highlighted ? 2.5 : 1.5}
            strokeDasharray={index > 0 ? '4 3' : undefined}
          />
        )),
      )}
    </svg>
  );
}
