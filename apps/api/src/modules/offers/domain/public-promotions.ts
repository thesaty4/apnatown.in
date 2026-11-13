import type { TxContext } from '../../../shared/persistence/ports';

/**
 * Public read side of Offers (S-CUST-20, F-HM-002/006/007). Rows come from
 * runtime views that own approval/window/scope eligibility; the service only
 * projects them into public DTOs.
 */
export interface PublicOfferRow {
  id: string;
  businessId: string;
  businessKind: 'shop' | 'provider';
  businessSlug: string;
  businessNameEn: string;
  businessNameHi: string | null;
  titleEn: string;
  titleHi: string | null;
  termsEn: string | null;
  termsHi: string | null;
  discountType: 'percent' | 'flat' | 'free_delivery';
  discountPercent: number | null;
  discountPaise: number | null;
  validFrom: string;
  validTo: string;
  state: 'active' | 'out_of_stock';
  featured: boolean;
}

export interface PublicPlacementRow {
  id: string;
  kind: 'homepage_banner' | 'featured_business';
  surface: 'hero_banner' | 'featured_business' | 'local_promotion';
  titleEn: string | null;
  titleHi: string | null;
  subtitleEn: string | null;
  subtitleHi: string | null;
  banner: {
    width: number;
    height: number;
    bytes: number;
    mimeType: 'image/webp';
    path: string;
  } | null;
  destinationKind:
    | 'offers'
    | 'explore'
    | 'business'
    | 'product'
    | 'service'
    | 'category'
    | null;
  destinationTargetId: string | null;
  destinationHref: string | null;
  position: number;
}

export const PUBLIC_PROMOTIONS_REPOSITORY = Symbol('PUBLIC_PROMOTIONS_REPOSITORY');

export interface PublicPromotionsRepository {
  offers(
    tx: TxContext,
    input: {
      businessId: string | null;
      featured: boolean | null;
      take: number;
      after: { validTo: string; id: string } | null;
    },
  ): Promise<PublicOfferRow[]>;
  placements(
    tx: TxContext,
    input: {
      kind: 'homepage_banner' | 'featured_business' | null;
      cityId: string | null;
      areaId: string | null;
      take: number;
    },
  ): Promise<PublicPlacementRow[]>;
}
