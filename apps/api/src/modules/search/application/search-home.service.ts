import { Inject, Injectable } from '@nestjs/common';
import type { SearchHome } from '@apnatown/shared/search';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  CATALOG_HOME_READ,
  type CatalogHomeReadPort,
} from '../../catalog/application/catalog-ports';

/** S-CUST-01 Home composition; Search composes owner data, never owns it. */
@Injectable()
export class SearchHomeService {
  constructor(
    @Inject(CATALOG_HOME_READ) private readonly catalogHome: CatalogHomeReadPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async home(locale: 'en' | 'hi'): Promise<SearchHome> {
    return {
      categorySections: await this.catalogHome.list({
        at: this.clock.now(),
        locale,
      }),
    };
  }
}
