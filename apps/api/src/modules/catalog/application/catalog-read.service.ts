import { Inject, Injectable } from '@nestjs/common';
import {
  KeywordResolutionSchema,
  TaxonomyReadSchema,
  normalizeCatalogText,
  type CategoryKind,
  type KeywordResolution,
  type TaxonomyRead,
} from '@apnatown/shared/catalog';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  KEYWORD_MAPPING_REPOSITORY,
  SUGGESTION_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type KeywordMappingRepository,
  type SuggestionRepository,
  type TaxonomyRepository,
} from '../domain/catalog.repository';
import { categoryDto, imagesFor, subcategoryDto } from './catalog-mappers';
import {
  CATALOG_BUSINESS_CONTEXT,
  CATALOG_MEDIA_ASSETS,
  type CatalogBusinessContextPort,
  type CatalogMediaAssetPort,
  type CatalogReadPort,
  type SuggestionNotice,
} from './catalog-ports';

/** Bounded keyword resolution fan-out per query. */
const KEYWORD_MATCH_LIMIT = 5;

/**
 * Internal CatalogReadPort: taxonomy validation for Products/Services/
 * Businesses, keyword resolution and related categories for Search, and the
 * committed suggestion-decision context for Notifications.
 */
@Injectable()
export class CatalogReadService implements CatalogReadPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(TAXONOMY_REPOSITORY)
    private readonly taxonomyRepository: TaxonomyRepository,
    @Inject(KEYWORD_MAPPING_REPOSITORY)
    private readonly mappings: KeywordMappingRepository,
    @Inject(SUGGESTION_REPOSITORY)
    private readonly suggestions: SuggestionRepository,
    @Inject(CATALOG_MEDIA_ASSETS)
    private readonly media: CatalogMediaAssetPort,
    @Inject(CATALOG_BUSINESS_CONTEXT)
    private readonly business: CatalogBusinessContextPort,
  ) {}

  taxonomy(
    input: {
      categoryIds?: readonly string[];
      subcategoryIds?: readonly string[];
      kind?: CategoryKind;
      activeOnly: boolean;
    },
    transaction?: TxContext,
  ): Promise<TaxonomyRead> {
    const work = async (tx: TxContext) => {
      const subcategories = await this.taxonomyRepository.listSubcategories(
        tx,
        {
          activeOnly: input.activeOnly,
          ...(input.kind ? { kind: input.kind } : {}),
          ...(input.categoryIds ? { categoryIds: input.categoryIds } : {}),
          ...(input.subcategoryIds ? { ids: input.subcategoryIds } : {}),
        },
      );
      // Requested categories plus the parents of returned subcategories.
      const categoryIds =
        input.categoryIds || input.subcategoryIds
          ? [
              ...new Set([
                ...(input.categoryIds ?? []),
                ...subcategories.map((row) => row.categoryId),
              ]),
            ]
          : undefined;
      const categories = await this.taxonomyRepository.listCategories(tx, {
        activeOnly: input.activeOnly,
        ...(input.kind ? { kind: input.kind } : {}),
        ...(categoryIds ? { ids: categoryIds } : {}),
      });
      // Subcategories under an excluded (inactive/other-kind) parent are dropped.
      const parents = new Set(categories.map((row) => row.id));
      const children = subcategories.filter((row) =>
        parents.has(row.categoryId),
      );
      const [images, revision] = await Promise.all([
        imagesFor(this.media, tx, [...categories, ...children]),
        this.taxonomyRepository.revision(tx),
      ]);
      return TaxonomyReadSchema.parse({
        categories: categories.map((row) => categoryDto(row, images)),
        subcategories: children.map((row) => subcategoryDto(row, images)),
        revision,
      });
    };
    return transaction ? work(transaction) : this.uow.run(work);
  }

  resolveKeywords(input: {
    normalizedQuery: string;
  }, transaction?: TxContext): Promise<KeywordResolution> {
    const query = normalizeCatalogText(input.normalizedQuery).slice(0, 200);
    const work = async (tx: TxContext) => {
      const revision = await this.mappings.revision(tx);
      if (!query)
        return KeywordResolutionSchema.parse({ matches: [], revision });
      const matches = await this.mappings.match(tx, query, KEYWORD_MATCH_LIMIT);
      const mappings = new Map(
        (
          await this.mappings.findMany(
            tx,
            matches.map((match) => match.mappingId),
          )
        ).map((row) => [row.id, row]),
      );
      return KeywordResolutionSchema.parse({
        matches: matches.flatMap((match) => {
          const mapping = mappings.get(match.mappingId);
          return mapping?.enabled
            ? [
                {
                  mappingId: match.mappingId,
                  matchedTerm: match.matchedTerm,
                  canonicalTerm: mapping.canonicalTerm,
                  matchKind: match.exact ? 'exact' : 'fuzzy',
                  targets: mapping.targets,
                },
              ]
            : [];
        }),
        revision,
      });
    };
    return transaction ? work(transaction) : this.uow.run(work);
  }

  relatedCategories(input: {
    categoryId: string;
  }): Promise<{ id: string; slug: string }[]> {
    return this.uow.run(async (tx) => {
      const links = await this.taxonomyRepository.relations(tx, [
        input.categoryId,
      ]);
      if (!links.length) return [];
      const active = new Map(
        (
          await this.taxonomyRepository.listCategories(tx, {
            activeOnly: true,
            ids: links.map((link) => link.relatedCategoryId),
          })
        ).map((row) => [row.id, row.slug]),
      );
      return links.flatMap((link) => {
        const slug = active.get(link.relatedCategoryId);
        return slug ? [{ id: link.relatedCategoryId, slug }] : [];
      });
    });
  }

  suggestionNotice(input: {
    suggestionId: string;
    version: number;
  }): Promise<SuggestionNotice> {
    return this.uow.run(async (tx) => {
      const row = await this.suggestions.find(tx, input.suggestionId);
      if (!row) throw new DomainError('SUGGESTION_NOT_FOUND');
      // Notifications render only the committed decision they were told about.
      if (row.version !== input.version)
        throw new DomainError('CATALOG_VERSION_CONFLICT');
      // Audience/return path come from trusted business data (Businesses).
      const audienceRole = await this.business.audienceRole(tx, row.businessId);
      const category = await this.taxonomyRepository.findCategory(
        tx,
        row.categoryId,
      );
      const manager = category?.kind === 'service' ? 'services' : 'products';
      return {
        suggestionId: row.id,
        businessId: row.businessId,
        submitterUserId: row.submitterUserId,
        audienceRole,
        scope: { cityId: row.cityId, areaId: row.areaId },
        status: row.status,
        nameEn: row.nameEn,
        ...(row.nameHi ? { nameHi: row.nameHi } : {}),
        ...(row.rejectionReason ? { reason: row.rejectionReason } : {}),
        ...((row.subcategoryId ?? row.mergedIntoSubcategoryId)
          ? {
              subcategoryId: (row.subcategoryId ??
                row.mergedIntoSubcategoryId)!,
            }
          : {}),
        // Owning product/service manager for the business's role.
        returnPath: `/${audienceRole}/${manager}`,
      };
    });
  }
}
