import type { PipeTransform } from '@nestjs/common';
import {
  AreaListQuerySchema,
  AreaPageSchema,
  CityPageSchema,
  type AreaListQuery,
} from '@apnatown/shared/geo';
import { PageQuerySchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { DomainError } from '../../../shared/errors/errors';

export class GeoCityQueryDto extends createZodDto(PageQuerySchema) {}
export class GeoAreaQueryDto extends createZodDto(AreaListQuerySchema) {}
export class GeoCityPageDto extends createZodDto(CityPageSchema) {}
export class GeoAreaPageDto extends createZodDto(AreaPageSchema) {}

export class GeoAreaQueryPipe implements PipeTransform<unknown, AreaListQuery> {
  transform(value: unknown): AreaListQuery {
    const result = AreaListQuerySchema.safeParse(value);
    if (result.success) return result.data;
    if (result.error.issues.every((issue) => issue.path[0] === 'pinCode'))
      throw new DomainError('PIN_CODE_INVALID', { field: 'pinCode' });
    throw new DomainError('COMMON_VALIDATION_FAILED');
  }
}
