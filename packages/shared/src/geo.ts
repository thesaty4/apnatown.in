import { z } from 'zod';
import { CursorSchema, IdSchema, PageQuerySchema } from './wire.js';

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
