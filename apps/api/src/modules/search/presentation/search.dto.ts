import {
  ExploreQuerySchema,
  ExploreResponseSchema,
  SearchHomeQuerySchema,
  SearchHomeSchema,
  SearchPopularSchema,
  SearchQuerySchema,
  SearchResponseSchema,
  SearchSuggestionsQuerySchema,
  SearchSuggestionsSchema,
} from '@apnatown/shared/search';
import { createZodDto } from 'nestjs-zod';

export class SearchHomeQueryDto extends createZodDto(SearchHomeQuerySchema) {}
export class SearchHomeDto extends createZodDto(SearchHomeSchema) {}
export class ExploreQueryDto extends createZodDto(ExploreQuerySchema) {}
export class ExploreResponseDto extends createZodDto(ExploreResponseSchema) {}
export class SearchQueryDto extends createZodDto(SearchQuerySchema) {}
export class SearchResponseDto extends createZodDto(SearchResponseSchema) {}
export class SearchSuggestionsQueryDto extends createZodDto(SearchSuggestionsQuerySchema) {}
export class SearchSuggestionsDto extends createZodDto(SearchSuggestionsSchema) {}
export class SearchPopularDto extends createZodDto(SearchPopularSchema) {}
