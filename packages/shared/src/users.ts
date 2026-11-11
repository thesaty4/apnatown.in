import { z } from 'zod';
import { IdSchema, VersionSchema } from './wire.js';

export const UserRoleSchema = z.enum([
  'customer',
  'vendor',
  'provider',
  'rider',
  'admin',
  'super_admin',
]);
export const AccountStatusSchema = z.enum(['active', 'suspended', 'deleting']);
export const LocaleSchema = z.enum(['en', 'hi']);
export const ThemeSchema = z.enum(['light', 'dark', 'auto']);
export const PhoneInputSchema = z.string().regex(/^(?:\+91)?[6-9]\d{9}$/);
export function normalizePhone(phone: string): string {
  const parsed = PhoneInputSchema.parse(phone);
  return parsed.startsWith('+91') ? parsed : `+91${parsed}`;
}

const displayName = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine(
    (value) =>
      !/[<>]/u.test(value) &&
      [...value].every(
        (character) =>
          character.codePointAt(0)! >= 32 && character !== '\u007f',
      ),
  );
const email = z.email().max(254);
export const UpdateProfileSchema = z
  .strictObject({
    displayName: displayName.optional(),
    email: email.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export const PreferencesSchema = z.strictObject({
  locale: LocaleSchema,
  theme: ThemeSchema,
});
export const UpdatePreferencesSchema = PreferencesSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
);
export const ProfileSchema = z.strictObject({
  userId: IdSchema,
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  displayName: displayName.nullable(),
  email: email.nullable(),
  version: VersionSchema,
});
export type UserRole = z.infer<typeof UserRoleSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
