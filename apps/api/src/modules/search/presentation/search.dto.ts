import {
  ExploreQuerySchema,
  ExploreResponseSchema,
  SearchHomeQuerySchema,
  SearchHomeSchema,
} from '@apnatown/shared/search';
import { createZodDto } from 'nestjs-zod';

export class SearchHomeQueryDto extends createZodDto(SearchHomeQuerySchema) {}
export class SearchHomeDto extends createZodDto(SearchHomeSchema) {}
export class ExploreQueryDto extends createZodDto(ExploreQuerySchema) {}
export class ExploreResponseDto extends createZodDto(ExploreResponseSchema) {}
