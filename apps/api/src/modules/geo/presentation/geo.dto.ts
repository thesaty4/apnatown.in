import type { PipeTransform } from '@nestjs/common';
import {
  AdminCityDetailSchema,
  AdminCityPageSchema,
  AdminCitySchema,
  AreaListQuerySchema,
  AreaPageSchema,
  CityPageSchema,
  CreateCitySchema,
  CreateZoneSchema,
  DeleteZoneSchema,
  LocationResolutionSchema,
  LocationResolveSchema,
  SetCityStatusSchema,
  UpdateCityStateCodeSchema,
  UpdateZoneSchema,
  WaitlistAcceptedSchema,
  WaitlistRequestSchema,
  ZoneDeletedSchema,
  ZoneSchema,
  type AreaListQuery,
  type CreateZone,
  type LocationResolve,
  type UpdateZone,
} from '@apnatown/shared/geo';
import { PageQuerySchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';
import { DomainError, type ErrorCode } from '../../../shared/errors/errors';

export class GeoCityQueryDto extends createZodDto(PageQuerySchema) {}
export class GeoAreaQueryDto extends createZodDto(AreaListQuerySchema) {}
export class GeoCityPageDto extends createZodDto(CityPageSchema) {}
export class GeoAreaPageDto extends createZodDto(AreaPageSchema) {}
export class LocationResolveDto extends createZodDto(LocationResolveSchema) {}
export class LocationResolutionDto extends createZodDto(
  LocationResolutionSchema,
) {}
export class WaitlistRequestDto extends createZodDto(WaitlistRequestSchema) {}
export class WaitlistAcceptedDto extends createZodDto(WaitlistAcceptedSchema) {}
export class AdminCityDto extends createZodDto(AdminCitySchema) {}
export class AdminCityPageDto extends createZodDto(AdminCityPageSchema) {}
export class AdminCityDetailDto extends createZodDto(AdminCityDetailSchema) {}
export class CreateCityDto extends createZodDto(CreateCitySchema) {}
export class UpdateCityStateCodeDto extends createZodDto(
  UpdateCityStateCodeSchema,
) {}
export class SetCityStatusDto extends createZodDto(SetCityStatusSchema) {}
export class ZoneDto extends createZodDto(ZoneSchema) {}
export class CreateZoneDto extends createZodDto(CreateZoneSchema) {}
export class UpdateZoneDto extends createZodDto(UpdateZoneSchema) {}
export class DeleteZoneDto extends createZodDto(DeleteZoneSchema) {}
export class ZoneDeletedDto extends createZodDto(ZoneDeletedSchema) {}

export class GeoAreaQueryPipe implements PipeTransform<unknown, AreaListQuery> {
  transform(value: unknown): AreaListQuery {
    const result = AreaListQuerySchema.safeParse(value);
    if (result.success) return result.data;
    if (result.error.issues.every((issue) => issue.path[0] === 'pinCode'))
      throw new DomainError('PIN_CODE_INVALID', { field: 'pinCode' });
    throw new DomainError('COMMON_VALIDATION_FAILED');
  }
}

/**
 * Validates a body and maps top-level fields to their domain error codes
 * (e.g. `polygon` -> ZONE_INVALID); anything else is VALIDATION_ERROR.
 */
class CodedInputPipe<T> implements PipeTransform<unknown, T> {
  constructor(
    private readonly schema: z.ZodType<T>,
    private readonly codes: Readonly<Record<string, ErrorCode>>,
  ) {}
  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    const fields = [
      ...new Set(
        result.error.issues.map((issue) =>
          typeof issue.path[0] === 'string' ? issue.path[0] : '',
        ),
      ),
    ];
    const codes = new Set(fields.map((field) => this.codes[field]));
    const [code] = codes;
    const named = fields.filter((field) => /^[A-Za-z]\w*$/.test(field));
    if (codes.size === 1 && code)
      throw new DomainError(code, named[0] ? { field: named[0] } : {});
    throw new DomainError(
      'VALIDATION_ERROR',
      named.length ? { fields: named.slice(0, 50) } : {},
    );
  }
}

/** Coordinate/selector problems -> LOCATION_INVALID; PIN -> PIN_CODE_INVALID. */
export class LocationResolvePipe extends CodedInputPipe<LocationResolve> {
  constructor() {
    super(LocationResolveSchema, {
      lat: 'LOCATION_INVALID',
      lng: 'LOCATION_INVALID',
      pinCode: 'PIN_CODE_INVALID',
    });
  }
}
const zoneCodes = {
  polygon: 'ZONE_INVALID',
  feeSlabs: 'FEE_SLAB_INVALID',
} as const;
export class CreateZonePipe extends CodedInputPipe<CreateZone> {
  constructor() {
    super(CreateZoneSchema, zoneCodes);
  }
}
export class UpdateZonePipe extends CodedInputPipe<UpdateZone> {
  constructor() {
    super(UpdateZoneSchema, zoneCodes);
  }
}
