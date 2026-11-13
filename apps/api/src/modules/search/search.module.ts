import { Module, type DynamicModule } from '@nestjs/common';
import { ExploreService } from './application/explore.service';
import { SearchHomeService } from './application/search-home.service';
import { SearchService } from './application/search.service';
import { ExploreController } from './presentation/explore.controller';
import { SearchHomeController } from './presentation/search-home.controller';
import { SearchController } from './presentation/search.controller';
import { EXPLORE_REPOSITORY } from './application/explore.repository';
import { SEARCH_REPOSITORY } from './application/search.repository';
import { PrismaExploreRepository } from './infrastructure/explore.repository';
import { PrismaSearchRepository } from './infrastructure/search.repository';

/** Public discovery composition. Reads owner modules only through their ports. */
@Module({})
export class SearchModule {
  static forRoot(
    runtime: DynamicModule,
    catalog: DynamicModule,
    businesses: DynamicModule,
  ): DynamicModule {
    return {
      module: SearchModule,
      imports: [runtime, catalog, businesses],
      // SearchHomeController (`/search/home`) precedes the `/search` collection routes.
      controllers: [SearchHomeController, SearchController, ExploreController],
      providers: [
        SearchHomeService, ExploreService, SearchService,
        { provide: EXPLORE_REPOSITORY, useClass: PrismaExploreRepository },
        { provide: SEARCH_REPOSITORY, useClass: PrismaSearchRepository },
      ],
    };
  }
}
