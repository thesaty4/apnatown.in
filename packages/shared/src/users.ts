import { z } from 'zod';
import {
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

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

// Plain text only; bounded before encryption, SQL binding or receipt encoding.
const addressTextField = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value));
const addressFields = {
  label: addressTextField(60),
  addressText: addressTextField(1000),
  landmark: addressTextField(200).nullable(),
  pinCode: z.string().regex(/^[0-9]{6}$/),
  cityId: IdSchema,
  areaId: IdSchema.nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  isDefault: z.boolean(),
};
const pairedCoordinates = (value: {
  lat?: number | null | undefined;
  lng?: number | null | undefined;
}) =>
  (value.lat === undefined && value.lng === undefined) ||
  (value.lat === null && value.lng === null) ||
  (typeof value.lat === 'number' && typeof value.lng === 'number');

export const AddressSchema = z
  .strictObject({
    id: IdSchema,
    ...addressFields,
    version: VersionSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .refine(pairedCoordinates);
export const CreateAddressSchema = z
  .strictObject({
    ...addressFields,
    landmark: addressFields.landmark.default(null),
    areaId: addressFields.areaId.default(null),
    lat: addressFields.lat.default(null),
    lng: addressFields.lng.default(null),
    isDefault: addressFields.isDefault.default(false),
  })
  .refine(pairedCoordinates);
export const UpdateAddressSchema = z
  .strictObject({
    ...z.strictObject(addressFields).partial().shape,
    expectedVersion: VersionSchema,
  })
  .refine(pairedCoordinates)
  .refine((value) => Object.keys(value).length > 1);
export const DeleteAddressSchema = z.strictObject({
  expectedVersion: VersionSchema,
});
export const AddressDeletedSchema = z.strictObject({
  id: IdSchema,
  version: VersionSchema,
  deleted: z.literal(true),
});
export const AddressParamsSchema = z.strictObject({ addressId: IdSchema });
export const AddressListQuerySchema = PageQuerySchema;
export const AddressPageSchema = z.strictObject({
  items: z.array(AddressSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type Address = z.infer<typeof AddressSchema>;
export type CreateAddress = z.infer<typeof CreateAddressSchema>;
export type UpdateAddress = z.infer<typeof UpdateAddressSchema>;
export type DeleteAddress = z.infer<typeof DeleteAddressSchema>;
export type AddressDeleted = z.infer<typeof AddressDeletedSchema>;
export type AddressPage = z.infer<typeof AddressPageSchema>;
