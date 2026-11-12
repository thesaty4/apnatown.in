import { Inject, Injectable } from '@nestjs/common';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../domain/business';

export const BUSINESS_SAVED_CARDS = Symbol('BUSINESS_SAVED_CARDS');
export interface BusinessSavedCards {
  cards(
    tx: TxContext,
    ids: readonly string[],
  ): Promise<Array<{ id: string; labelEn: string; labelHi: string | null }>>;
}

@Injectable()
export class BusinessSavedCardsService implements BusinessSavedCards {
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
  ) {}

  cards(tx: TxContext, ids: readonly string[]) {
    return this.businesses.savedCards(tx, ids);
  }
}
