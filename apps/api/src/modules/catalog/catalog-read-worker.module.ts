import { Module, type DynamicModule } from '@nestjs/common';
import { CATALOG_MEDIA_ASSETS, CATALOG_READ } from './application/catalog-ports';
import { CatalogImages } from './application/catalog-images';
import { CatalogReadService } from './application/catalog-read.service';
import {
  KEYWORD_MAPPING_REPOSITORY,
  SUGGESTION_REPOSITORY,
  TAXONOMY_REPOSITORY,
} from './domain/catalog.repository';
import { PrismaKeywordMappingRepository } from './infrastructure/prisma-keyword-mapping.repository';
import { PrismaSuggestionRepository } from './infrastructure/prisma-suggestion.repository';
import { PrismaTaxonomyRepository } from './infrastructure/prisma-taxonomy.repository';

/**
 * Worker-side composition of the Catalog public read port (CATALOG_READ),
 * used by event consumers (Notifications' suggestion-decision notices).
 * `businessContext` must export CATALOG_BUSINESS_CONTEXT and `mediaStorage`
 * MEDIA_IMAGES. No controllers and no writers.
 */
@Module({})
export class CatalogReadWorkerModule {
  static forRoot(
    runtime: DynamicModule,
    businessContext: DynamicModule,
    mediaStorage: DynamicModule,
  ): DynamicModule {
    return {
      module: CatalogReadWorkerModule,
      imports: [runtime, businessContext, mediaStorage],
      providers: [
        { provide: TAXONOMY_REPOSITORY, useClass: PrismaTaxonomyRepository },
        {
          provide: SUGGESTION_REPOSITORY,
          useClass: PrismaSuggestionRepository,
        },
        {
          provide: KEYWORD_MAPPING_REPOSITORY,
          useClass: PrismaKeywordMappingRepository,
        },
        CatalogImages,
        { provide: CATALOG_MEDIA_ASSETS, useExisting: CatalogImages },
        CatalogReadService,
        { provide: CATALOG_READ, useExisting: CatalogReadService },
      ],
      exports: [CATALOG_READ],
    };
  }
}
