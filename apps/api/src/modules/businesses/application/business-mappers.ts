import {
  AdminBillingProfileSchema,
  BillingProfileSchema,
  BusinessApplicationCardSchema,
  BusinessOwnerSchema,
  BusinessPublicSchema,
  BusinessSummarySchema,
  type AdminBillingProfile,
  type BillingProfile,
  type BusinessApplicationCard,
  type BusinessCategoryRef,
  type BusinessHoursEntry,
  type BusinessOwner,
  type BusinessPublic,
  type BusinessSummary,
} from '@apnatown/shared/businesses';
import type { AuditSnapshot } from '../../audit/application/audit-writer.port';
import {
  allowedActions,
  capabilities,
  deliveryConfigured,
  type BusinessAggregate,
  type StoredBilling,
  type StoredBusiness,
} from '../domain/business';

const IST_OFFSET_MS = 330 * 60 * 1000;

/** IST calendar date (YYYY-MM-DD) of an instant. */
export function istDate(at: Date): string {
  return new Date(at.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** IST weekday (0 = Sunday) of an instant. */
export function istWeekday(at: Date): number {
  return new Date(at.getTime() + IST_OFFSET_MS).getUTCDay();
}

function location(business: StoredBusiness) {
  return business.lat !== null && business.lng !== null
    ? { lat: business.lat, lng: business.lng }
    : null;
}

function primaryOf(aggregate: BusinessAggregate): string | null {
  return aggregate.categories.find((link) => link.isPrimary)?.categoryId ?? null;
}

export function ownerDto(
  aggregate: BusinessAggregate,
  sellerRole: boolean,
): BusinessOwner {
  const { business } = aggregate;
  return BusinessOwnerSchema.parse({
    id: business.id,
    kind: business.kind,
    status: business.status,
    slug: business.slug,
    nameEn: business.nameEn,
    nameHi: business.nameHi,
    categoryIds: aggregate.categories.map((link) => link.categoryId),
    primaryCategoryId: primaryOf(aggregate),
    description: business.description,
    cityId: business.cityId,
    areaId: business.areaId,
    addressText: business.addressText,
    location: location(business),
    businessPhoneE164: business.phoneE164,
    whatsappE164: business.whatsappE164,
    email: business.email,
    instagramUrl: business.instagramUrl,
    youtubeUrl: business.youtubeUrl,
    facebookUrl: business.facebookUrl,
    logoAssetId: business.logoAssetId,
    coverAssetId: business.coverAssetId,
    hours: aggregate.hours,
    settings: aggregate.settings,
    verified: business.verifiedAt !== null,
    reviewReason: business.reviewReason,
    reviewedAt: business.reviewedAt,
    submittedAt: business.submittedAt,
    capabilities: capabilities(business, sellerRole),
    version: business.version,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  });
}

export function summaryDto(business: StoredBusiness): BusinessSummary {
  return BusinessSummarySchema.parse({
    id: business.id,
    kind: business.kind,
    status: business.status,
    slug: business.slug,
    nameEn: business.nameEn,
    nameHi: business.nameHi,
    version: business.version,
  });
}

export interface PublicImage {
  assetId: string;
  publicUrl: string;
  width: number;
  height: number;
}

/** Allow-listed public projection; no owner, KYC or raw storage fields. */
export function publicDto(
  aggregate: BusinessAggregate,
  input: {
    categories: Map<string, BusinessCategoryRef>;
    area: { id: string; nameEn: string; nameHi: string } | null;
    images: Map<string, PublicImage>;
    now: Date;
  },
): BusinessPublic {
  const { business, settings } = aggregate;
  // Product categories only, in stored order (primary first).
  const categories = aggregate.categories
    .map((link) => input.categories.get(link.categoryId))
    .filter((ref): ref is BusinessCategoryRef => ref !== undefined);
  const primaryId = primaryOf(aggregate);
  const weekday = istWeekday(input.now);
  const today: BusinessHoursEntry | null =
    aggregate.hours.find((day) => day.dayOfWeek === weekday) ?? null;
  const image = (id: string | null) =>
    id ? (input.images.get(id) ?? null) : null;
  return BusinessPublicSchema.parse({
    id: business.id,
    kind: business.kind,
    slug: business.slug,
    nameEn: business.nameEn,
    nameHi: business.nameHi,
    categories,
    primaryCategory: primaryId
      ? (input.categories.get(primaryId) ?? null)
      : null,
    description: business.description,
    logo: image(business.logoAssetId),
    cover: image(business.coverAssetId),
    contacts: {
      phoneE164: business.phoneE164,
      whatsappE164: business.whatsappE164,
      email: business.email,
    },
    socialLinks: {
      instagramUrl: business.instagramUrl,
      youtubeUrl: business.youtubeUrl,
      facebookUrl: business.facebookUrl,
    },
    address: business.addressText,
    cityId: business.cityId,
    areaId: business.areaId,
    area: input.area,
    location: location(business),
    weeklyHours: aggregate.hours,
    today,
    temporarilyClosed: settings.temporarilyClosed,
    delivery: {
      available: deliveryConfigured(settings),
      method: settings.deliveryMethod,
      radiusKm: settings.deliveryRadiusKm,
      feePaise: settings.deliveryFeePaise,
      minimumOrderPaise: settings.minimumOrderPaise,
    },
    pickup: {
      enabled: settings.pickupEnabled,
      instructions: settings.pickupInstructions,
    },
    serviceArea: settings.serviceArea,
    serviceRadiusKm: settings.serviceRadiusKm,
    verified: business.verifiedAt !== null,
  });
}

export function cardDto(
  business: StoredBusiness,
  primaryCategoryId: string | null,
): BusinessApplicationCard {
  return BusinessApplicationCardSchema.parse({
    id: business.id,
    kind: business.kind,
    status: business.status,
    nameEn: business.nameEn,
    nameHi: business.nameHi,
    categoryId: primaryCategoryId,
    cityId: business.cityId,
    areaId: business.areaId,
    submittedAt: business.submittedAt,
    createdAt: business.createdAt,
    version: business.version,
    allowedActions: allowedActions(business.status),
  });
}

/** Audit snapshot of review-relevant fields (no contacts/KYC). */
export function businessSnapshot(business: StoredBusiness): AuditSnapshot {
  return {
    status: business.status,
    kind: business.kind,
    nameEn: business.nameEn,
    cityId: business.cityId,
    areaId: business.areaId,
    reviewReason: business.reviewReason,
    deleted: business.deletedAt !== null,
    version: business.version,
  };
}
export const BUSINESS_AUDIT_FIELDS = [
  'status',
  'kind',
  'nameEn',
  'cityId',
  'areaId',
  'reviewReason',
  'deleted',
  'version',
] as const;

function billingBase(businessId: string, row: StoredBilling | null) {
  return {
    businessId,
    reviewStatus: row?.reviewStatus ?? 'missing',
    draft: row?.draft ?? null,
    version: row?.version ?? null,
    approvedVersion: row?.approvedVersion ?? null,
    reviewReason: row?.reviewReason ?? null,
    reviewedAt: row?.reviewedAt ?? null,
  };
}

export function billingDto(
  businessId: string,
  row: StoredBilling | null,
): BillingProfile {
  return BillingProfileSchema.parse(billingBase(businessId, row));
}

export function adminBillingDto(
  business: StoredBusiness,
  row: StoredBilling | null,
): AdminBillingProfile {
  const snapshot = row?.approvedSnapshot as { requiresIrn?: unknown } | null;
  return AdminBillingProfileSchema.parse({
    ...billingBase(business.id, row),
    ownerUserId: business.ownerUserId,
    verificationEvidenceRef: row?.verificationEvidenceRef ?? null,
    requiresIrn:
      snapshot && typeof snapshot.requiresIrn === 'boolean'
        ? snapshot.requiresIrn
        : null,
  });
}
