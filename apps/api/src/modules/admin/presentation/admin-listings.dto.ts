import {
  AdminListingCreateSchema,
  AdminListingDetailSchema,
  AdminListingEditSchema,
  AdminListingMutationResultSchema,
  AdminListingPageSchema,
  AdminListingProductPageSchema,
  AdminListingQuerySchema,
  AdminListingRemoveSchema,
  AdminListingReportPageSchema,
  AdminListingReportQuerySchema,
  AdminListingReportResolutionSchema,
  AdminListingReportSchema,
  AdminProductPublicationResultSchema,
  AdminProductPublicationSchema,
  ListingReportAcceptedSchema,
  ListingReportCreateSchema,
} from '@apnatown/shared/admin';
import { PageQuerySchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { IdempotencyKey } from '../../businesses/presentation/business.dto';

// Listings
export class AdminListingQueryDto extends createZodDto(
  AdminListingQuerySchema,
) {}
export class AdminListingPageDto extends createZodDto(AdminListingPageSchema) {}
export class AdminListingDetailDto extends createZodDto(
  AdminListingDetailSchema,
) {}
export class AdminListingCreateDto extends createZodDto(
  AdminListingCreateSchema,
) {}
export class AdminListingEditDto extends createZodDto(AdminListingEditSchema) {}
export class AdminListingRemoveDto extends createZodDto(
  AdminListingRemoveSchema,
) {}
export class AdminListingMutationResultDto extends createZodDto(
  AdminListingMutationResultSchema,
) {}

// Products under a listing
export class AdminListingProductQueryDto extends createZodDto(
  PageQuerySchema,
) {}
export class AdminListingProductPageDto extends createZodDto(
  AdminListingProductPageSchema,
) {}
export class AdminProductPublicationDto extends createZodDto(
  AdminProductPublicationSchema,
) {}
export class AdminProductPublicationResultDto extends createZodDto(
  AdminProductPublicationResultSchema,
) {}

// Listing reports
export class ListingReportCreateDto extends createZodDto(
  ListingReportCreateSchema,
) {}
export class ListingReportAcceptedDto extends createZodDto(
  ListingReportAcceptedSchema,
) {}
export class AdminListingReportDto extends createZodDto(
  AdminListingReportSchema,
) {}
export class AdminListingReportPageDto extends createZodDto(
  AdminListingReportPageSchema,
) {}
export class AdminListingReportQueryDto extends createZodDto(
  AdminListingReportQuerySchema,
) {}
export class AdminListingReportResolutionDto extends createZodDto(
  AdminListingReportResolutionSchema,
) {}

/** Idempotency-Key header for scoped admin listing commands. */
export const listingCommandKey = () =>
  IdempotencyKey(
    'Case-sensitive command key. Retry the identical command within 24 hours to replay the stored result; replay rechecks current admin access and scope.',
  );

export const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable.';
export const CATALOG_READ_FORBIDDEN =
  'COMMON_FORBIDDEN without catalog:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin.';
export const CATALOG_EDIT_FORBIDDEN =
  'COMMON_FORBIDDEN without catalog:edit; ADMIN_INACTIVE for a deactivated admin; ADMIN_SCOPE_FORBIDDEN (route guard or transaction recheck) or BUSINESS_SCOPE_DENIED (Businesses recheck) outside the assigned city/area scope (an unresolved area needs super_admin).';
export const READ_LIMIT = {
  key: 'admin.listings.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
export const WRITE_LIMIT = {
  key: 'admin.listings.write',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
