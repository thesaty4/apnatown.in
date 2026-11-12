import { z } from 'zod';
import type { MapConfiguration } from '@apnatown/ui/geo/MapView';

const secureUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' && !url.username && !url.password && !url.hash
    );
  });

export const mapEnvironmentSchema = z.object({
  MAP_TILE_URL_TEMPLATE: secureUrl
    .default('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
    .refine(
      (value) =>
        ['{z}', '{x}', '{y}'].every((key) => value.includes(key)) &&
        !/[{}]/.test(value.replace(/\{[zxy]\}/g, '0')) &&
        !new URL(value).search &&
        !new URL(value).hostname.includes('{'),
    ),
  MAP_TILE_ATTRIBUTION_TEXT: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .default('OpenStreetMap contributors'),
  MAP_TILE_ATTRIBUTION_URL: secureUrl.default(
    'https://www.openstreetmap.org/copyright',
  ),
  MAP_TILE_MAX_ZOOM: z.preprocess(
    (value) =>
      typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
    z.number().int().min(1).max(22).default(19),
  ),
});

export function mapConfiguration(
  environment: z.output<typeof mapEnvironmentSchema>,
): MapConfiguration {
  return {
    urlTemplate: environment.MAP_TILE_URL_TEMPLATE,
    attributionText: environment.MAP_TILE_ATTRIBUTION_TEXT,
    attributionUrl: environment.MAP_TILE_ATTRIBUTION_URL,
    maxZoom: environment.MAP_TILE_MAX_ZOOM,
  };
}
