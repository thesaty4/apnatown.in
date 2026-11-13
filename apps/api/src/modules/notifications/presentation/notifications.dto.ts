import { createZodDto } from 'nestjs-zod';
import {
  NotificationPageSchema,
  NotificationPreferencesSchema,
  NotificationPreferencesUpdateSchema,
  NotificationUnreadCountSchema,
  NotificationUnsubscribeMarketingResultSchema,
  NotificationUnsubscribeMarketingSchema,
} from '@apnatown/shared/notifications';

export class NotificationPageDto extends createZodDto(NotificationPageSchema) {}
export class NotificationUnreadCountDto extends createZodDto(
  NotificationUnreadCountSchema,
) {}
export class NotificationPreferencesDto extends createZodDto(
  NotificationPreferencesSchema,
) {}
export class NotificationPreferencesUpdateDto extends createZodDto(
  NotificationPreferencesUpdateSchema,
) {}
export class NotificationUnsubscribeMarketingDto extends createZodDto(
  NotificationUnsubscribeMarketingSchema,
) {}
export class NotificationUnsubscribeMarketingResultDto extends createZodDto(
  NotificationUnsubscribeMarketingResultSchema,
) {}
