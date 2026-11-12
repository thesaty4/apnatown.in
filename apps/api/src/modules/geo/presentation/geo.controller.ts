import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import {
  LocationResolutionSchema,
  WaitlistAcceptedSchema,
  WaitlistRequestSchema,
  type AreaListQuery,
  type LocationResolve,
  type WaitlistRequest,
} from '@apnatown/shared/geo';
import {
  ZodSerializerDto,
  ZodSerializerInterceptor,
  ZodValidationPipe,
} from 'nestjs-zod';
import {
  PublicRoute,
  SessionRoute,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import {
  GEO_RESOLVE_LIMIT,
  GEO_WAITLIST_LIMIT,
  GeoLocationService,
} from '../application/geo-location.service';
import { GeoReadService } from '../application/geo-read.service';
import {
  GeoAreaPageDto,
  GeoAreaQueryDto,
  GeoAreaQueryPipe,
  GeoCityPageDto,
  GeoCityQueryDto,
  LocationResolutionDto,
  LocationResolvePipe,
  LocationResolveDto,
  WaitlistAcceptedDto,
  WaitlistRequestDto,
} from './geo.dto';

const readLimit = {
  key: 'geo.public-read',
  subject: 'ip',
  maximumHits: 60,
  windowSeconds: 60,
} as const;

@Controller('geo')
@ApiTags('geo')
@UseInterceptors(ZodSerializerInterceptor)
@ApiResponse({
  status: 400,
  type: ErrorDto,
  description: 'Invalid query or cursor',
})
@ApiResponse({ status: 403, type: ErrorDto, description: 'Untrusted Origin' })
@ApiResponse({
  status: 429,
  type: ErrorDto,
  description: 'Read limit exceeded',
})
@ApiResponse({ status: 500, type: ErrorDto, description: 'Unexpected failure' })
@ApiResponse({
  status: 503,
  type: ErrorDto,
  description: 'Read service unavailable',
})
export class GeoController {
  constructor(
    private readonly geo: GeoReadService,
    private readonly locations: GeoLocationService,
  ) {}

  @Get('cities')
  @PublicRoute()
  @RateLimit(readLimit)
  @ApiOperation({ operationId: 'geoCities', summary: 'List selectable cities' })
  @ApiResponse({ status: 200, type: GeoCityPageDto })
  @ZodSerializerDto(GeoCityPageDto)
  cities(@Query() query: GeoCityQueryDto): Promise<GeoCityPageDto> {
    return this.geo.cities(query);
  }

  @Get('cities/:cityId/areas')
  @PublicRoute()
  @RateLimit(readLimit)
  @ApiOperation({
    operationId: 'geoCityAreas',
    summary: 'Find areas within a city',
  })
  @ApiParam({ name: 'cityId', format: 'uuid' })
  @ApiQuery({ type: GeoAreaQueryDto })
  @ApiResponse({ status: 200, type: GeoAreaPageDto })
  @ApiResponse({ status: 404, type: ErrorDto, description: 'City not found' })
  @ApiResponse({ status: 422, type: ErrorDto, description: 'Invalid PIN code' })
  @ZodSerializerDto(GeoAreaPageDto)
  areas(
    @Param('cityId', new ZodValidationPipe(IdSchema)) cityId: string,
    @Query(new GeoAreaQueryPipe()) query: AreaListQuery,
  ): Promise<GeoAreaPageDto> {
    return this.geo.areas(cityId, query);
  }

  @Post('location/resolve')
  @HttpCode(200)
  @SessionRoute()
  @BrowserMutation()
  @ApiSecurity('sessionCookie')
  @ApiBody({ type: LocationResolveDto })
  @ApiOperation({
    operationId: 'geoLocationResolve',
    summary: 'Resolve a GPS point, PIN code or area to a city',
    description:
      'Guest (anonymous browser session) or signed-in user; location is optional and manual area/PIN selection always remains available. Exactly one selector: {lat,lng} (WGS84, finite, in bounds), {pinCode} (six digits) or {areaId}; optional cityId constrains the match to the chosen city. GPS resolves only against configured PostGIS delivery-zone polygons (no maps/geocoding provider): it returns the city and the covering active zone, never an area. A PIN shared by several cities or a point outside every configured zone is LOCATION_UNRESOLVED. serviceable reflects city status only (enabled); it is not a delivery promise: business delivery mode/radius is checked separately. Coordinates are used for this lookup only and are never stored or logged. Read-only and safe to retry. Limited per session and per network address. Blocked with MAINTENANCE while maintenance mode is on.',
  })
  @ApiOkResponse({ type: LocationResolutionDto })
  @AdminErrors({
    403: 'CSRF_INVALID for a missing session, Origin or CSRF token.',
    404: 'CITY_NOT_FOUND for an unknown cityId; AREA_NOT_FOUND for an unknown area or one outside cityId.',
    422: 'LOCATION_INVALID for missing/multiple selectors or out-of-range coordinates; PIN_CODE_INVALID for a non six-digit PIN; LOCATION_UNRESOLVED when no single city matches.',
  })
  @RateLimit(
    { ...GEO_RESOLVE_LIMIT, subject: 'session' },
    { ...GEO_RESOLVE_LIMIT, key: 'geo.location.resolve.ip', subject: 'ip' },
  )
  async resolve(
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new LocationResolvePipe()) input: LocationResolve,
  ) {
    return LocationResolutionSchema.parse(await this.locations.resolve(input));
  }

  @Post('waitlist')
  @HttpCode(202)
  @SessionRoute()
  @BrowserMutation()
  @ApiSecurity('sessionCookie')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive key; retry the identical request within 24 hours to replay the accepted result.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: WaitlistRequestDto })
  @ApiOperation({
    operationId: 'geoWaitlistJoin',
    summary: 'Ask to be notified when service reaches a city',
    description:
      'Explicit phone submission from a guest or signed-in user. Accepts a 10-digit Indian mobile (optional +91) and the selected city, if any. Stores only the encrypted phone, a keyed lookup hash and the city; the phone is never logged or echoed. This is not marketing consent and no message or job is created (notification target/channel/retention pending Q-35). Limited to 5 per hour per session and per network address. Blocked with MAINTENANCE while maintenance mode is on.',
  })
  @ApiAcceptedResponse({ type: WaitlistAcceptedDto })
  @AdminErrors({
    403: 'CSRF_INVALID for a missing session, Origin or CSRF token.',
    404: 'CITY_NOT_FOUND for an unknown cityId.',
    409: 'Idempotency-Key reused with a different request, or the original request is still in progress.',
  })
  @RateLimit(
    { ...GEO_WAITLIST_LIMIT, subject: 'session' },
    { ...GEO_WAITLIST_LIMIT, key: 'geo.waitlist.ip', subject: 'ip' },
  )
  async waitlist(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(WaitlistRequestSchema)) input: WaitlistRequest,
  ) {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    return WaitlistAcceptedSchema.parse(
      await this.locations.joinWaitlist(
        {
          session: sessionBinding(request),
          principalId: request.principal?.userId ?? null,
          correlationId,
          key: request.headers['idempotency-key'],
        },
        input,
      ),
    );
  }
}
