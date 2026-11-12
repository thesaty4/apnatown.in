import { Inject, Injectable } from '@nestjs/common';
import type { TxContext } from '../../../shared/persistence/ports';
import { SERVICE_READ, type ServiceReadPort } from './service-read.service';

export const SERVICE_SAVED_CARDS = Symbol('SERVICE_SAVED_CARDS');
export interface SavedServiceCard { id: string; labelEn: string; labelHi: string | null; canonicalPath: string }
export interface ServiceSavedCards {
  cards(tx: TxContext, ids: readonly string[]): Promise<SavedServiceCard[]>;
}
/** Purpose-limited current public eligibility/card port; no private fields. */
@Injectable()
export class ServiceSavedCardsService implements ServiceSavedCards {
  constructor(@Inject(SERVICE_READ) private readonly services: ServiceReadPort) {}
  cards(tx: TxContext, ids: readonly string[]) {
    return this.services.publicCards(tx,ids);
  }
}
