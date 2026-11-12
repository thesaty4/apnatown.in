import { z } from 'zod';
import {
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
} from './wire.js';

export const SavedQuerySchema = PageQuerySchema.extend({
  tab: z.enum(['shops', 'services', 'media']).default('shops'),
  mediaFilter: z.enum(['all', 'videos', 'reels']).default('all'),
});
export type SavedQuery = z.infer<typeof SavedQuerySchema>;

const relationship = {
  targetType: z.enum(['business', 'video', 'service']),
  targetId: IdSchema,
  savedAt: TimestampSchema,
  bellOn: z.boolean(),
  mediaKind: z.enum(['video', 'reel']).nullable(),
};

export const SavedItemSchema = z.discriminatedUnion('available', [
  z.strictObject({
    ...relationship,
    available: z.literal(false),
    reasonKey: z.literal('engagement.saved.unavailable'),
  }),
  z.strictObject({
    ...relationship,
    available: z.literal(true),
    labelEn: z.string().max(500),
    labelHi: z.string().max(500).nullable(),
    canonicalPath: z
      .string()
      .regex(/^(?:\/videos\/[0-9a-f-]{36}|\/service\/[a-z0-9]+(?:-[a-z0-9]+)*)$/)
      .nullable(),
  }),
]);
export type SavedItem = z.infer<typeof SavedItemSchema>;

export const SavedPageSchema = z.strictObject({
  items: z.array(SavedItemSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type SavedPage = z.infer<typeof SavedPageSchema>;
