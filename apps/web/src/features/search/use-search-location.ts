'use client';

import type { SearchFilters } from '@apnatown/shared/search';
import { preciseBrowseLocation, useBrowseLocation } from '../geo';

export function useSearchLocation(filters: SearchFilters) {
  const location = useBrowseLocation();
  const selection = location.selection;
  const sameCity = !filters.cityId || filters.cityId === selection?.city.id;
  const sameArea = !filters.areaId || filters.areaId === selection?.area?.id;
  const position = selection?.source === 'gps' && sameCity && sameArea
    ? preciseBrowseLocation() : null;
  const effective: SearchFilters = {
    ...filters,
    ...(selection && !filters.cityId && { cityId: selection.city.id }),
    ...(selection?.area && !filters.areaId && sameCity && { areaId: selection.area.id }),
  };
  return { effective, position, revision: location.revision };
}
