import {
  SearchHomeQuerySchema,
  SearchHomeSchema,
} from '@apnatown/shared/search';
import { createZodDto } from 'nestjs-zod';

export class SearchHomeQueryDto extends createZodDto(SearchHomeQuerySchema) {}
export class SearchHomeDto extends createZodDto(SearchHomeSchema) {}
