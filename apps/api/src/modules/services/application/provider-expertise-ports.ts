import type { TxContext } from '../../../shared/persistence/ports';

export const PROVIDER_EXPERTISE_REPOSITORY = Symbol(
  'PROVIDER_EXPERTISE_REPOSITORY',
);

/** Current expertise aggregate; absent version row means version 1. */
export interface StoredExpertise {
  subcategoryIds: string[];
  version: number;
}

/** Services-owned persistence for provider expertise (F-PV-002). */
export interface ProviderExpertiseRepository {
  /** Mapped subcategory IDs (stable order) and aggregate version. */
  read(tx: TxContext, businessId: string): Promise<StoredExpertise>;
  /**
   * Ensures and row-locks the version row until commit; returns its version.
   * Concurrent replacements serialize here.
   */
  lockVersion(tx: TxContext, businessId: string, at: Date): Promise<number>;
  /**
   * Replaces all mappings and advances the locked version row from
   * `expectedVersion`; returns the new version, or null on a stale version
   * (nothing is changed).
   */
  replace(
    tx: TxContext,
    input: {
      businessId: string;
      subcategoryIds: readonly string[];
      expectedVersion: number;
      at: Date;
    },
  ): Promise<number | null>;
  /**
   * Mapped subcategory IDs of a publicly visible approved PROVIDER business
   * by slug; null when no such public provider exists.
   */
  publicSubcategoryIds(slug: string): Promise<string[] | null>;
}
