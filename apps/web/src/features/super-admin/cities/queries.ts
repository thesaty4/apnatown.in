'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import type { AdminContext } from '../../admin';
import { getAdminCity, listAdminCities } from './api';

type Ctx = Pick<AdminContext, 'api' | 'scope' | 'lifecycle'>;

export function citiesOptions({ api, scope, lifecycle }: Ctx) {
  return privateInfiniteQueryOptions(
    queryKeys.adminGeoCities(scope),
    scope.epoch,
    lifecycle,
    (cursor, signal) => listAdminCities(api, cursor, signal),
  );
}

export function cityOptions({ api, scope, lifecycle }: Ctx, cityId: string) {
  return privateQueryOptions(
    queryKeys.adminGeoCity(scope, cityId),
    scope.epoch,
    lifecycle,
    (signal) => getAdminCity(api, cityId, signal),
  );
}

/** City status/creation changes what customers can pick: refresh the public
 * city list (areas are unaffected by status). Admin keys are invalidated by
 * the shared super-admin command. */
export function useRefreshPublicCities() {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: queryKeys.geoCities });
}
