import type { z } from 'zod';
import type { PublicImageVariantSchema } from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';

type PublicImageVariant = z.infer<typeof PublicImageVariantSchema>;

export const PRODUCT_CART_READ = Symbol('PRODUCT_CART_READ');

/**
 * Products-owned read model for Cart (cart-checkout BE spec, rule 2). Values
 * are read inside the caller's transaction on every cart read/command so
 * price, availability and shared product stock are always server-current.
 */
export interface CartProductView {
  readonly productId: string;
  readonly businessId: string;
  readonly nameEn: string;
  readonly nameHi: string | null;
  readonly unit: string;
  /** Null while the product is not publicly visible. */
  readonly slug: string | null;
  /** True when publicly visible (published, live, public shop/category). */
  readonly visible: boolean;
  /** Offer-effective public price; null while not visible. */
  readonly pricePaise: number | null;
  readonly mrpPaise: number | null;
  readonly image: PublicImageVariant | null;
  readonly stock: {
    readonly onHand: number;
    readonly availableForSale: boolean;
  };
  /** Active labels in display order; all share the product stock. */
  readonly variants: readonly { readonly id: string; readonly label: string }[];
}

export interface ProductCartReadPort {
  /** Unknown ids are omitted from the result. */
  forCart(
    tx: TxContext,
    productIds: readonly string[],
  ): Promise<ReadonlyMap<string, CartProductView>>;
}
