import { createZodDto } from 'nestjs-zod';
import {
  CreateSupportMessageSchema,
  FeatureFlagSchema,
  LegalPageAdminSchema,
  LegalPageSchema,
  LegalQuerySchema,
  PlatformHealthSchema,
  PublicSettingsSchema,
  SavedSettingSchema,
  SavedSettingsGroupSchema,
  SuperAdminSettingsSchema,
  SupportMessageAcceptedSchema,
  SupportMessageDetailSchema,
  UpdateFeatureFlagSchema,
  UpdateLegalPageSchema,
  UpdateSettingDocSchema,
  UpdateSettingsGroupDocSchema,
} from '@apnatown/shared/settings';

export class PublicSettingsDto extends createZodDto(PublicSettingsSchema) {}
export class LegalQueryDto extends createZodDto(LegalQuerySchema) {}
export class LegalPageDto extends createZodDto(LegalPageSchema) {}
export class PlatformHealthDto extends createZodDto(PlatformHealthSchema) {}
export class SuperAdminSettingsDto extends createZodDto(
  SuperAdminSettingsSchema,
) {}
/** Documented per-key value union; the server validates the value per key. */
export class UpdateSettingDto extends createZodDto(UpdateSettingDocSchema) {}
export class SavedSettingDto extends createZodDto(SavedSettingSchema) {}
export class UpdateSettingsGroupDto extends createZodDto(
  UpdateSettingsGroupDocSchema,
) {}
export class SavedSettingsGroupDto extends createZodDto(
  SavedSettingsGroupSchema,
) {}
export class UpdateFeatureFlagDto extends createZodDto(
  UpdateFeatureFlagSchema,
) {}
export class FeatureFlagDto extends createZodDto(FeatureFlagSchema) {}
export class UpdateLegalPageDto extends createZodDto(UpdateLegalPageSchema) {}
export class LegalPageAdminDto extends createZodDto(LegalPageAdminSchema) {}
export class CreateSupportMessageDto extends createZodDto(
  CreateSupportMessageSchema,
) {}
export class SupportMessageAcceptedDto extends createZodDto(
  SupportMessageAcceptedSchema,
) {}
export class SupportMessageDetailDto extends createZodDto(
  SupportMessageDetailSchema,
) {}
