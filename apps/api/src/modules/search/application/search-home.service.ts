import { Inject, Injectable } from '@nestjs/common';
import type { DiscoveryLocation, SearchHome, SearchHomeQuery } from '@apnatown/shared/search';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  CATALOG_HOME_READ,
  type CatalogHomeReadPort,
} from '../../catalog/application/catalog-ports';
import { EXPLORE_REPOSITORY, type ExploreRepository } from './explore.repository';
import { homeListingSections, unavailableSection } from './search-home-sections';

/** S-CUST-01 Home composition; Search composes owner data, never owns it. */
@Injectable()
export class SearchHomeService {
  constructor(
    @Inject(CATALOG_HOME_READ)
    private readonly catalogHome: CatalogHomeReadPort,
    @Inject(EXPLORE_REPOSITORY) private readonly listings: ExploreRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async home(query: SearchHomeQuery, location: DiscoveryLocation | null = null): Promise<SearchHome> {
    const categorySections = await this.catalogHome.list({
      at: this.clock.now(),
      locale: query.locale,
    });
    const listings = await this.listings.snapshot((snapshot) =>
      homeListingSections(snapshot, query, location));
    return {
      categorySections,
      nearbyShops: listings.nearbyShops,
      featuredBusinesses: listings.featuredBusinesses,
      popularBusinesses: unavailableSection(),
      featuredProducts: listings.featuredProducts,
      popularProviders: unavailableSection(),
    };
  }
}
