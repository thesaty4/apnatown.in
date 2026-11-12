import { Module, type DynamicModule } from '@nestjs/common';
import { CatalogEvents } from './application/catalog-events';
import { CatalogHomeSectionsService } from './application/catalog-home-sections.service';
import { CatalogKeywordsService } from './application/catalog-keywords.service';
import {
  CATALOG_BUSINESS_CONTEXT,
  CATALOG_HOME_READ,
  CATALOG_MEDIA_ASSETS,
  CATALOG_READ,
  UnavailableBusinessContext,
  UnavailableMediaAssets,
} from './application/catalog-ports';
import { CatalogReadService } from './application/catalog-read.service';
import { CatalogSuggestionsService } from './application/catalog-suggestions.service';
import { CatalogTaxonomyService } from './application/catalog-taxonomy.service';
import { TaxonomyWriter } from './application/taxonomy-writer';
import {
  HOME_SECTION_REPOSITORY,
  KEYWORD_MAPPING_REPOSITORY,
  SUGGESTION_REPOSITORY,
  TAXONOMY_REPOSITORY,
} from './domain/catalog.repository';
import { PrismaHomeSectionRepository } from './infrastructure/prisma-home-section.repository';
import { PrismaKeywordMappingRepository } from './infrastructure/prisma-keyword-mapping.repository';
import { PrismaSuggestionRepository } from './infrastructure/prisma-suggestion.repository';
import { PrismaTaxonomyRepository } from './infrastructure/prisma-taxonomy.repository';
import { AdminCatalogController } from './presentation/admin-catalog.controller';
import { OwnerCatalogSuggestionsController } from './presentation/owner-catalog-suggestions.controller';
import { PublicCatalogController } from './presentation/public-catalog.controller';
import { SuperAdminCatalogController } from './presentation/super-admin-catalog.controller';

/**
 * Categories, subcategories, Home sections, subcategory suggestions and search
 * keyword mappings. Other modules read only through CATALOG_READ and
 * CATALOG_HOME_READ; Catalog never reads listing repositories.
 */
@Module({})
export class CatalogModule {
  static forRoot(
    runtime: DynamicModule,
    users: DynamicModule,
    audit: DynamicModule,
    admin: DynamicModule,
  ): DynamicModule {
    return {
      module: CatalogModule,
      imports: [runtime, users, audit, admin],
      controllers: [
        PublicCatalogController,
        AdminCatalogController,
        SuperAdminCatalogController,
        OwnerCatalogSuggestionsController,
      ],
      providers: [
        { provide: TAXONOMY_REPOSITORY, useClass: PrismaTaxonomyRepository },
        {
          provide: HOME_SECTION_REPOSITORY,
          useClass: PrismaHomeSectionRepository,
        },
        {
          provide: SUGGESTION_REPOSITORY,
          useClass: PrismaSuggestionRepository,
        },
        {
          provide: KEYWORD_MAPPING_REPOSITORY,
          useClass: PrismaKeywordMappingRepository,
        },
        // Binding points: Businesses and Media replace these unavailable
        // adapters with their real implementations when those modules land.
        {
          provide: CATALOG_BUSINESS_CONTEXT,
          useClass: UnavailableBusinessContext,
        },
        { provide: CATALOG_MEDIA_ASSETS, useClass: UnavailableMediaAssets },
        CatalogEvents,
        TaxonomyWriter,
        CatalogTaxonomyService,
        CatalogHomeSectionsService,
        CatalogSuggestionsService,
        CatalogKeywordsService,
        CatalogReadService,
        { provide: CATALOG_READ, useExisting: CatalogReadService },
        { provide: CATALOG_HOME_READ, useExisting: CatalogHomeSectionsService },
      ],
      exports: [CATALOG_READ, CATALOG_HOME_READ],
    };
  }
}
