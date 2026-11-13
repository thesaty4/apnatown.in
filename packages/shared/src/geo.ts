import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  PaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

export const CityStatusSchema = z.enum(['enabled', 'disabled', 'coming_soon']);
export type CityStatus = z.infer<typeof CityStatusSchema>;
export const PinCodeSchema = z.string().regex(/^\d{6}$/);

export const CitySchema = z.strictObject({
  id: IdSchema,
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameHi: z.string().min(1),
  status: CityStatusSchema,
});
export const AreaSchema = z.strictObject({
  id: IdSchema,
  cityId: IdSchema,
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameHi: z.string().min(1),
  pinCode: PinCodeSchema.nullable(),
});
export const AreaListQuerySchema = PageQuerySchema.extend({
  query: z.string().trim().max(100).optional(),
  pinCode: PinCodeSchema.optional(),
});
export const CityPageSchema = z.strictObject({
  items: z.array(CitySchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export const AreaPageSchema = z.strictObject({
  items: z.array(AreaSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});

export type City = z.infer<typeof CitySchema>;
export type Area = z.infer<typeof AreaSchema>;
export type AreaListQuery = z.infer<typeof AreaListQuerySchema>;
export type CityPage = z.infer<typeof CityPageSchema>;
export type AreaPage = z.infer<typeof AreaPageSchema>;

// ---------------------------------------------------------------------------
// Verified GST state/UT codes (CBIC GST state code list). Legacy codes 25
// (Daman & Diu, merged into 26) and 28 (pre-2014 Andhra Pradesh), and the
// non-location codes 97/99 are excluded. A city's fiscal state is never
// inferred from locale, phone or IP.
// ---------------------------------------------------------------------------
export const GST_STATES = Object.freeze([
  { code: '01', nameEn: 'Jammu and Kashmir' },
  { code: '02', nameEn: 'Himachal Pradesh' },
  { code: '03', nameEn: 'Punjab' },
  { code: '04', nameEn: 'Chandigarh' },
  { code: '05', nameEn: 'Uttarakhand' },
  { code: '06', nameEn: 'Haryana' },
  { code: '07', nameEn: 'Delhi' },
  { code: '08', nameEn: 'Rajasthan' },
  { code: '09', nameEn: 'Uttar Pradesh' },
  { code: '10', nameEn: 'Bihar' },
  { code: '11', nameEn: 'Sikkim' },
  { code: '12', nameEn: 'Arunachal Pradesh' },
  { code: '13', nameEn: 'Nagaland' },
  { code: '14', nameEn: 'Manipur' },
  { code: '15', nameEn: 'Mizoram' },
  { code: '16', nameEn: 'Tripura' },
  { code: '17', nameEn: 'Meghalaya' },
  { code: '18', nameEn: 'Assam' },
  { code: '19', nameEn: 'West Bengal' },
  { code: '20', nameEn: 'Jharkhand' },
  { code: '21', nameEn: 'Odisha' },
  { code: '22', nameEn: 'Chhattisgarh' },
  { code: '23', nameEn: 'Madhya Pradesh' },
  { code: '24', nameEn: 'Gujarat' },
  { code: '26', nameEn: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', nameEn: 'Maharashtra' },
  { code: '29', nameEn: 'Karnataka' },
  { code: '30', nameEn: 'Goa' },
  { code: '31', nameEn: 'Lakshadweep' },
  { code: '32', nameEn: 'Kerala' },
  { code: '33', nameEn: 'Tamil Nadu' },
  { code: '34', nameEn: 'Puducherry' },
  { code: '35', nameEn: 'Andaman and Nicobar Islands' },
  { code: '36', nameEn: 'Telangana' },
  { code: '37', nameEn: 'Andhra Pradesh' },
  { code: '38', nameEn: 'Ladakh' },
] as const);
export const GST_STATE_CODES = Object.freeze(
  GST_STATES.map((state) => state.code),
);
export const GstStateCodeSchema = z.enum(
  GST_STATE_CODES as unknown as [
    (typeof GST_STATES)[number]['code'],
    ...(typeof GST_STATES)[number]['code'][],
  ],
);
export type GstStateCode = z.infer<typeof GstStateCodeSchema>;

// ---------------------------------------------------------------------------
// Public location resolve (POST /geo/location/resolve)
// ---------------------------------------------------------------------------
export const LatitudeSchema = z.number().min(-90).max(90);
export const LongitudeSchema = z.number().min(-180).max(180);
/**
 * Exactly one selector: `{lat,lng}`, `{pinCode}` or `{areaId}`. `cityId`
 * optionally constrains the result to the city the customer chose.
 * Coordinates are used for this request only and never stored or logged.
 */
export const LocationResolveSchema = z
  .strictObject({
    cityId: IdSchema.optional(),
    lat: LatitudeSchema.optional(),
    lng: LongitudeSchema.optional(),
    pinCode: PinCodeSchema.optional(),
    areaId: IdSchema.optional(),
  })
  .refine(
    (input) =>
      (input.lat === undefined) === (input.lng === undefined) &&
      [input.lat, input.pinCode, input.areaId].filter(
        (value) => value !== undefined,
      ).length === 1,
    { path: ['lat'] },
  );
export type LocationResolve = z.infer<typeof LocationResolveSchema>;
export const LocationSourceSchema = z.enum(['gps', 'pin', 'area']);
export const ZoneMatchSchema = z.strictObject({
  id: IdSchema,
  name: z.string().min(1),
});
export const LocationResolutionSchema = z.strictObject({
  source: LocationSourceSchema,
  city: CitySchema,
  /** null when the input identifies the city but not one authoritative area. */
  area: AreaSchema.nullable(),
  /** Matching active delivery zone (GPS only); never a delivery promise. */
  zone: ZoneMatchSchema.nullable(),
  /** City-level serviceability: true only for an enabled city. */
  serviceable: z.boolean(),
});
export type LocationResolution = z.infer<typeof LocationResolutionSchema>;

// ---------------------------------------------------------------------------
// Service-area waitlist (POST /geo/waitlist)
// ---------------------------------------------------------------------------
export const WaitlistRequestSchema = z.strictObject({
  cityId: IdSchema.optional(),
  /** 10-digit Indian mobile, optional +91; stored encrypted + lookup hash. */
  phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/),
});
export type WaitlistRequest = z.infer<typeof WaitlistRequestSchema>;
export const WaitlistAcceptedSchema = z.strictObject({ requestId: IdSchema });
export type WaitlistAccepted = z.infer<typeof WaitlistAcceptedSchema>;

// ---------------------------------------------------------------------------
// Super-admin cities, zones and delivery-fee slabs
// ---------------------------------------------------------------------------
const label = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value));
export const ZoneStatusSchema = z.enum(['active', 'paused']);
export type ZoneStatus = z.infer<typeof ZoneStatusSchema>;
export const CityStatusActionSchema = z.enum(['enable', 'disable']);
export type CityStatusAction = z.infer<typeof CityStatusActionSchema>;
const expectedVersion = VersionSchema;

/** GeoJSON position `[longitude, latitude]` (RFC 7946 order). */
export const GeoJsonPositionSchema = z.tuple([LongitudeSchema, LatitudeSchema]);
const samePosition = (a: readonly number[], b: readonly number[]) =>
  a[0] === b[0] && a[1] === b[1];
/** Closed linear ring: >= 4 positions, first equals last. */
export const GeoJsonRingSchema = z
  .array(GeoJsonPositionSchema)
  .min(4)
  .max(500)
  .refine((ring) => samePosition(ring[0]!, ring.at(-1)!));
/**
 * GeoJSON Polygon (outer ring plus optional holes). Shape only; PostGIS
 * validity (non-empty, non-self-intersecting) is checked by the server.
 */
export const GeoJsonPolygonSchema = z
  .strictObject({
    type: z.literal('Polygon'),
    coordinates: z.array(GeoJsonRingSchema).min(1).max(10),
  })
  .refine(
    (polygon) =>
      polygon.coordinates.reduce((sum, ring) => sum + ring.length, 0) <= 1000,
  );
export type GeoJsonPolygon = z.infer<typeof GeoJsonPolygonSchema>;

/** numeric(5,2): 0..999.99 with at most two decimals. */
export const UpperDistanceKmSchema = z
  .number()
  .min(0)
  .max(999.99)
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6);
export const FeeSlabSchema = z.strictObject({
  upperDistanceKm: UpperDistanceKmSchema,
  feePaise: PaiseSchema,
});
export type FeeSlab = z.infer<typeof FeeSlabSchema>;
/** 1..3 bands, strictly increasing upper bounds (prototype editor). */
export const FeeSlabsSchema = z
  .array(FeeSlabSchema)
  .min(1)
  .max(3)
  .refine((slabs) =>
    slabs.every(
      (slab, index) =>
        !index || slab.upperDistanceKm > slabs[index - 1]!.upperDistanceKm,
    ),
  );

export const AdminCitySchema = z.strictObject({
  id: IdSchema,
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameHi: z.string().min(1),
  stateCode: GstStateCodeSchema,
  status: CityStatusSchema,
  version: VersionSchema,
  counts: z.strictObject({
    areas: CountSchema,
    zones: CountSchema,
    waitlist: CountSchema,
  }),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type AdminCity = z.infer<typeof AdminCitySchema>;
export const AdminCityPageSchema = z.strictObject({
  items: z.array(AdminCitySchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type AdminCityPage = z.infer<typeof AdminCityPageSchema>;

export const ZoneSchema = z.strictObject({
  id: IdSchema,
  cityId: IdSchema,
  name: z.string().min(1),
  status: ZoneStatusSchema,
  polygon: GeoJsonPolygonSchema,
  feeSlabs: z.array(FeeSlabSchema).max(3),
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Zone = z.infer<typeof ZoneSchema>;

/** Detail lists are bounded; `city.counts` reports the totals. */
export const ADMIN_CITY_DETAIL_LIMIT = 200;
export const AdminCityDetailSchema = z.strictObject({
  city: AdminCitySchema,
  areas: z.array(AreaSchema).max(ADMIN_CITY_DETAIL_LIMIT),
  zones: z.array(ZoneSchema).max(ADMIN_CITY_DETAIL_LIMIT),
});
export type AdminCityDetail = z.infer<typeof AdminCityDetailSchema>;

export const CreateCitySchema = z.strictObject({
  nameEn: label(60),
  nameHi: label(60),
  stateCode: GstStateCodeSchema,
  status: CityStatusSchema,
});
export type CreateCity = z.infer<typeof CreateCitySchema>;
export const UpdateCityStateCodeSchema = z.strictObject({
  stateCode: GstStateCodeSchema,
  expectedVersion,
});
export type UpdateCityStateCode = z.infer<typeof UpdateCityStateCodeSchema>;
export const SetCityStatusSchema = z.strictObject({
  action: CityStatusActionSchema,
  expectedVersion,
});
export type SetCityStatus = z.infer<typeof SetCityStatusSchema>;

export const CreateZoneSchema = z.strictObject({
  name: label(80),
  polygon: GeoJsonPolygonSchema,
  feeSlabs: FeeSlabsSchema,
  status: ZoneStatusSchema,
});
export type CreateZone = z.infer<typeof CreateZoneSchema>;
export const UpdateZoneSchema = z
  .strictObject({
    name: label(80).optional(),
    polygon: GeoJsonPolygonSchema.optional(),
    feeSlabs: FeeSlabsSchema.optional(),
    status: ZoneStatusSchema.optional(),
    expectedVersion,
  })
  .refine(
    (input) =>
      input.name !== undefined ||
      input.polygon !== undefined ||
      input.feeSlabs !== undefined ||
      input.status !== undefined,
  );
export type UpdateZone = z.infer<typeof UpdateZoneSchema>;
export const DeleteZoneSchema = z.strictObject({ expectedVersion });
export type DeleteZone = z.infer<typeof DeleteZoneSchema>;
export const ZoneDeletedSchema = z.strictObject({
  id: IdSchema,
  cityId: IdSchema,
  deleted: z.literal(true),
});
export type ZoneDeleted = z.infer<typeof ZoneDeletedSchema>;

export const CityParamsSchema = z.strictObject({ cityId: IdSchema });
export type CityParams = z.infer<typeof CityParamsSchema>;
export const ZoneParamsSchema = z.strictObject({ zoneId: IdSchema });
export type ZoneParams = z.infer<typeof ZoneParamsSchema>;
