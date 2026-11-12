import {
  AdminCategorySchema,
  AdminCategoryTreeSchema,
  AdminHomeSectionListSchema,
  AdminHomeSectionSchema,
  AdminSubcategorySchema,
  AdminSuggestionPageSchema,
  AdminSuggestionQuerySchema,
  CategoryDetailSchema,
  CategoryListQuerySchema,
  CategoryListSchema,
  CreateCategorySchema,
  CreateHomeSectionSchema,
  CreateKeywordMappingSchema,
  CreateSubcategorySchema,
  DecideSuggestionSchema,
  ExpectedVersionBodySchema,
  HomeSectionRemovedSchema,
  HomeSectionStatusSchema,
  KeywordMappingDeletedSchema,
  KeywordMappingPageSchema,
  KeywordMappingSchema,
  SubcategoryDetailSchema,
  SuggestSubcategorySchema,
  SuggestionDuplicateCheckSchema,
  SuggestionDuplicateResultSchema,
  SuggestionPageSchema,
  SuggestionSchema,
  UpdateCategorySchema,
  UpdateHomeSectionSchema,
  UpdateKeywordMappingSchema,
  UpdateSubcategorySchema,
} from '@apnatown/shared/catalog';
import { PageQuerySchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';

/**
 * Top-level union bodies: TypeScript cannot extend a union instance type, but
 * the runtime DTO still carries the full zod schema (oneOf) for OpenAPI.
 */
const unionDto = (schema: z.ZodType) =>
  createZodDto(schema) as unknown as new () => object;

// Public taxonomy
export class CategoryListQueryDto extends createZodDto(
  CategoryListQuerySchema,
) {}
export class CategoryListDto extends createZodDto(CategoryListSchema) {}
export class CategoryDetailDto extends createZodDto(CategoryDetailSchema) {}
export class SubcategoryDetailDto extends createZodDto(
  SubcategoryDetailSchema,
) {}

// Admin taxonomy
export class AdminCategoryTreeDto extends createZodDto(
  AdminCategoryTreeSchema,
) {}
export class AdminCategoryDto extends createZodDto(AdminCategorySchema) {}
export class AdminSubcategoryDto extends createZodDto(AdminSubcategorySchema) {}
export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
export class CreateSubcategoryDto extends createZodDto(
  CreateSubcategorySchema,
) {}
export class UpdateSubcategoryDto extends createZodDto(
  UpdateSubcategorySchema,
) {}

// Home sections
export class AdminHomeSectionDto extends createZodDto(AdminHomeSectionSchema) {}
export class AdminHomeSectionListDto extends createZodDto(
  AdminHomeSectionListSchema,
) {}
export class CreateHomeSectionDto extends unionDto(CreateHomeSectionSchema) {}
export class UpdateHomeSectionDto extends createZodDto(
  UpdateHomeSectionSchema,
) {}
export class HomeSectionStatusDto extends createZodDto(
  HomeSectionStatusSchema,
) {}
export class ExpectedVersionBodyDto extends createZodDto(
  ExpectedVersionBodySchema,
) {}
export class HomeSectionRemovedDto extends createZodDto(
  HomeSectionRemovedSchema,
) {}

// Suggestions
export class SuggestionDuplicateCheckDto extends createZodDto(
  SuggestionDuplicateCheckSchema,
) {}
export class SuggestionDuplicateResultDto extends createZodDto(
  SuggestionDuplicateResultSchema,
) {}
export class SuggestSubcategoryDto extends createZodDto(
  SuggestSubcategorySchema,
) {}
export class SuggestionDto extends createZodDto(SuggestionSchema) {}
export class SuggestionPageDto extends createZodDto(SuggestionPageSchema) {}
export class CatalogPageQueryDto extends createZodDto(PageQuerySchema) {}
export class AdminSuggestionQueryDto extends createZodDto(
  AdminSuggestionQuerySchema,
) {}
export class AdminSuggestionPageDto extends createZodDto(
  AdminSuggestionPageSchema,
) {}
export class DecideSuggestionDto extends unionDto(DecideSuggestionSchema) {}

// Keyword mappings
export class KeywordMappingDto extends createZodDto(KeywordMappingSchema) {}
export class KeywordMappingPageDto extends createZodDto(
  KeywordMappingPageSchema,
) {}
export class CreateKeywordMappingDto extends createZodDto(
  CreateKeywordMappingSchema,
) {}
export class UpdateKeywordMappingDto extends createZodDto(
  UpdateKeywordMappingSchema,
) {}
export class KeywordMappingDeletedDto extends createZodDto(
  KeywordMappingDeletedSchema,
) {}
