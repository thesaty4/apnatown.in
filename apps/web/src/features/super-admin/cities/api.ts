import {
  AdminCityDetailSchema,
  AdminCityPageSchema,
  AdminCitySchema,
  ZoneDeletedSchema,
  ZoneSchema,
  type CityStatusAction,
  type CreateCity,
  type CreateZone,
  type GstStateCode,
} from '@apnatown/shared/geo';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';
import { commandHeaders, type Command } from '../api';

type Reader = Pick<BrowserApi, 'GET'>;
export type UpdateZoneBody = components['schemas']['UpdateZoneDto'];
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

export async function listAdminCities(
  api: Reader,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/geo/admin/cities', {
      params: { query: cursor ? { cursor, limit: 50 } : { limit: 50 } },
      ...withSignal(signal),
    }),
    AdminCityPageSchema,
  );
}

export async function getAdminCity(
  api: Reader,
  cityId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/geo/admin/cities/{cityId}', {
      params: { path: { cityId } },
      ...withSignal(signal),
    }),
    AdminCityDetailSchema,
  );
}

export async function createCity(
  api: BrowserApi,
  body: CreateCity,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/geo/admin/cities', { params: { header }, body }),
    AdminCitySchema,
  );
}

export async function setCityStatus(
  api: BrowserApi,
  input: { cityId: string; action: CityStatusAction; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  const { cityId, ...body } = input;
  return unwrap(
    await api.POST('/geo/admin/cities/{cityId}/status', {
      params: { header, path: { cityId } },
      body,
    }),
    AdminCitySchema,
  );
}

export async function setCityStateCode(
  api: BrowserApi,
  input: { cityId: string; stateCode: GstStateCode; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  const { cityId, ...body } = input;
  return unwrap(
    await api.PATCH('/geo/admin/cities/{cityId}', {
      params: { header, path: { cityId } },
      body,
    }),
    AdminCitySchema,
  );
}

export async function createZone(
  api: BrowserApi,
  input: { cityId: string; zone: CreateZone },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/geo/admin/cities/{cityId}/zones', {
      params: { header, path: { cityId: input.cityId } },
      body: input.zone,
    }),
    ZoneSchema,
  );
}

export async function updateZone(
  api: BrowserApi,
  input: { zoneId: string; patch: UpdateZoneBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PATCH('/geo/admin/zones/{zoneId}', {
      params: { header, path: { zoneId: input.zoneId } },
      body: input.patch,
    }),
    ZoneSchema,
  );
}

export async function deleteZone(
  api: BrowserApi,
  input: { zoneId: string; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.DELETE('/geo/admin/zones/{zoneId}', {
      params: { header, path: { zoneId: input.zoneId } },
      body: { expectedVersion: input.expectedVersion },
    }),
    ZoneDeletedSchema,
  );
}
