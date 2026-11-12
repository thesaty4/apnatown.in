import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminCityDetailSchema,
  AdminCityPageSchema,
  AdminCitySchema,
  CityParamsSchema,
  CreateCitySchema,
  DeleteZoneSchema,
  SetCityStatusSchema,
  UpdateCityStateCodeSchema,
  ZoneDeletedSchema,
  ZoneParamsSchema,
  ZoneSchema,
  type CityParams,
  type CreateCity,
  type CreateZone,
  type DeleteZone,
  type SetCityStatus,
  type UpdateCityStateCode,
  type UpdateZone,
  type ZoneParams,
} from '@apnatown/shared/geo';
import {
  EmptyRequestSchema,
  PageQuerySchema,
  type PageQuery,
} from '@apnatown/shared/wire';
import { adminContext, Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { MaintenanceAdmission } from '../../../shared/maintenance/admission';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import {
  AdminErrors,
  IdempotentAdmin,
  adminCommand,
} from '../../admin/presentation/admin.dto';
import { GeoAdminService } from '../application/geo-admin.service';
import {
  AdminCityDetailDto,
  AdminCityDto,
  AdminCityPageDto,
  CreateCityDto,
  CreateZoneDto,
  CreateZonePipe,
  DeleteZoneDto,
  GeoCityQueryDto,
  SetCityStatusDto,
  UpdateCityStateCodeDto,
  UpdateZoneDto,
  UpdateZonePipe,
  ZoneDeletedDto,
  ZoneDto,
} from './geo.dto';

const READ_LIMIT = {
  key: 'super-admin.geo.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'super-admin.geo.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const AUDITED =
  'super_admin only (regular admins are denied even when assigned to the city); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.';
const MAINTENANCE_NOTE =
  'MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable.';
const SLABS =
  'feeSlabs: 1..3 bands {upperDistanceKm (0..999.99, two decimals), feePaise (integer paise)} with strictly increasing upperDistanceKm; the first band whose bound includes the distance applies and beyond the last band the last fee applies.';
const POLYGON =
  'polygon: GeoJSON Polygon, [longitude,latitude] positions, closed rings (4..500 positions, <= 10 rings). PostGIS must find it valid, non-empty and non-self-intersecting; an active zone may not intersect (including touching) another active zone in the same city (pending Q-37). No city boundary is stored, so "within city" cannot be checked server-side.';

@ApiTags('super-admin')
@PrivateApi()
@Roles('super_admin')
@MaintenanceAdmission('super')
@Controller('geo/admin')
export class SuperAdminGeoController {
  constructor(private readonly geo: GeoAdminService) {}

  @Get('cities')
  @ApiOperation({
    operationId: 'superAdminGeoCities',
    summary: 'List cities with area, zone and waitlist counts',
    description:
      'Platform-wide; no city/area grant or module permission applies. Ordered by status, English name and id; cursor is bound to the caller. Counts are real records (waitlist = notify-me requests for the city). Assigned-admin counts come from the admin module. private, no-store.',
  })
  @ApiQuery({ type: GeoCityQueryDto })
  @ApiOkResponse({ type: AdminCityPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid limit or cursor.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(READ_LIMIT)
  async cities(
    @Req() request: AuthRequest,
    @Query(new InputPipe(PageQuerySchema)) query: PageQuery,
  ) {
    return AdminCityPageSchema.parse(
      await this.geo.listCities(adminContext(request), query),
    );
  }

  @Post('cities')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiBody({ type: CreateCityDto })
  @ApiOperation({
    operationId: 'superAdminGeoCityCreate',
    summary: 'Create a city',
    description: `Status may be enabled, disabled or coming_soon. stateCode must be a verified GST state/UT code (never inferred). The slug is derived from nameEn (lowercase ASCII words joined by hyphens). No areas, zones or fee defaults are created. No event is emitted. ${AUDITED}`,
  })
  @ApiCreatedResponse({ type: AdminCityDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid names, stateCode or status, or a nameEn that yields an empty slug.',
    409: 'CITY_SLUG_CONFLICT when the derived slug already exists; idempotency conflicts.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async createCity(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateCitySchema)) input: CreateCity,
  ) {
    return AdminCitySchema.parse(
      await this.geo.createCity(adminCommand(request), input),
    );
  }

  @Get('cities/:cityId')
  @ApiParam({ name: 'cityId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'superAdminGeoCity',
    summary: 'Read a city with its areas, zones and fee slabs',
    description:
      'Platform-wide. Returns the city DTO (with totals in counts), up to 200 areas and up to 200 zones (polygon and fee slabs in paise). Admin assignments are read from the admin module. private, no-store.',
  })
  @ApiOkResponse({ type: AdminCityDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid cityId.',
    404: 'CITY_NOT_FOUND.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(READ_LIMIT)
  async city(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CityParamsSchema)) params: CityParams,
  ) {
    return AdminCityDetailSchema.parse(
      await this.geo.city(adminContext(request), params.cityId),
    );
  }

  @Patch('cities/:cityId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'cityId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: UpdateCityStateCodeDto })
  @ApiOperation({
    operationId: 'superAdminGeoCityStateUpdate',
    summary: "Correct a city's GST state code",
    description: `Versioned correction of stateCode only, validated against the verified GST state/UT allow-list. Historical order tax snapshots are not rewritten. No event is emitted. ${AUDITED}`,
  })
  @ApiOkResponse({ type: AdminCityDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown stateCode or unexpected fields.',
    404: 'CITY_NOT_FOUND.',
    409: 'GEO_VERSION_CONFLICT when expectedVersion is stale; idempotency conflicts.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateCity(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CityParamsSchema)) params: CityParams,
    @Body(new InputPipe(UpdateCityStateCodeSchema)) input: UpdateCityStateCode,
  ) {
    return AdminCitySchema.parse(
      await this.geo.updateStateCode(
        adminCommand(request),
        params.cityId,
        input,
      ),
    );
  }

  @Post('cities/:cityId/status')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'cityId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: SetCityStatusDto })
  @ApiOperation({
    operationId: 'superAdminGeoCityStatus',
    summary: 'Enable or disable a city',
    description: `Prototype edges only: enable changes disabled or coming_soon to enabled; disable changes enabled to coming_soon. A disabled city serves no new discovery or checkout; in-flight orders are not cancelled. Emits geo.city.status_changed. ${AUDITED}`,
  })
  @ApiOkResponse({ type: AdminCityDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown action or unexpected fields.',
    404: 'CITY_NOT_FOUND.',
    409: 'GEO_VERSION_CONFLICT when expectedVersion is stale; CITY_TRANSITION_INVALID for any other transition; idempotency conflicts.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async setCityStatus(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CityParamsSchema)) params: CityParams,
    @Body(new InputPipe(SetCityStatusSchema)) input: SetCityStatus,
  ) {
    return AdminCitySchema.parse(
      await this.geo.setCityStatus(adminCommand(request), params.cityId, input),
    );
  }

  @Post('cities/:cityId/zones')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'cityId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: CreateZoneDto })
  @ApiOperation({
    operationId: 'superAdminGeoZoneCreate',
    summary: 'Create a delivery zone with fee slabs',
    description: `name 1..80 characters; status active or paused. ${POLYGON} ${SLABS} Zones price platform-rider delivery only and never grant admin authority. Emits geo.zone.changed. ${AUDITED}`,
  })
  @ApiCreatedResponse({ type: ZoneDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid name/status or unexpected fields.',
    404: 'CITY_NOT_FOUND.',
    409: 'Idempotency conflicts.',
    422: 'ZONE_INVALID for an invalid or overlapping polygon; FEE_SLAB_INVALID for missing, excess, negative, fractional-paise or non-increasing slabs.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async createZone(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CityParamsSchema)) params: CityParams,
    @Body(new CreateZonePipe()) input: CreateZone,
  ) {
    return ZoneSchema.parse(
      await this.geo.createZone(adminCommand(request), params.cityId, input),
    );
  }

  @Patch('zones/:zoneId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'zoneId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: UpdateZoneDto })
  @ApiOperation({
    operationId: 'superAdminGeoZoneUpdate',
    summary: 'Update a delivery zone',
    description: `Allow-listed name, polygon, feeSlabs (replaces all bands) and status, at least one, with expectedVersion. ${POLYGON} ${SLABS} Activating a paused zone re-checks overlap. Emits geo.zone.changed. ${AUDITED}`,
  })
  @ApiOkResponse({ type: ZoneDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for no changes, an invalid name/status or unexpected fields.',
    404: 'ZONE_NOT_FOUND.',
    409: 'GEO_VERSION_CONFLICT when expectedVersion is stale; idempotency conflicts.',
    422: 'ZONE_INVALID for an invalid or overlapping polygon; FEE_SLAB_INVALID for invalid slabs.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateZone(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(ZoneParamsSchema)) params: ZoneParams,
    @Body(new UpdateZonePipe()) input: UpdateZone,
  ) {
    return ZoneSchema.parse(
      await this.geo.updateZone(adminCommand(request), params.zoneId, input),
    );
  }

  @Delete('zones/:zoneId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'zoneId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: DeleteZoneDto })
  @ApiOperation({
    operationId: 'superAdminGeoZoneDelete',
    summary: 'Delete a delivery zone',
    description: `Requires expectedVersion. Deletes the zone and its fee slabs; points formerly in it use the configured default delivery-fee schedule from settings for an enabled city. Emits geo.zone.changed (change deleted). ${AUDITED}`,
  })
  @ApiOkResponse({ type: ZoneDeletedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a missing expectedVersion or unexpected fields.',
    404: 'ZONE_NOT_FOUND.',
    409: 'GEO_VERSION_CONFLICT when expectedVersion is stale; idempotency conflicts.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async deleteZone(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(ZoneParamsSchema)) params: ZoneParams,
    @Body(new InputPipe(DeleteZoneSchema)) input: DeleteZone,
  ) {
    return ZoneDeletedSchema.parse(
      await this.geo.deleteZone(adminCommand(request), params.zoneId, input),
    );
  }
}
