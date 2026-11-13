import type {
  OfferCreate,
  OfferStatus,
  OwnerOffer,
} from '@apnatown/shared/offers';
import type { TxContext } from '../../../shared/persistence/ports';

export interface StoredOffer {
  id: string;
  businessId: string;
  titleEn: string;
  titleHi: string | null;
  discountType: OwnerOffer['discountType'];
  discountPercent: number | null;
  discountPaise: number | null;
  validFrom: string;
  validTo: string;
  status: OfferStatus;
  reviewDecision: 'approved' | 'rejected' | null;
  rejectionReason: string | null;
  viewsCount: number;
  usesCount: number;
  version: number;
  createdAt: string;
}

export type OfferAction = OwnerOffer['allowedActions'][number];

/**
 * Owner side of ST-offer: any edit re-queues approval; active ⇄ paused
 * (resume only when approved and still in window); active/paused → ended
 * (terminal). Pending/rejected offers can only be edited.
 */
export function allowedActions(offer: StoredOffer, now: Date): OfferAction[] {
  const expired = Date.parse(offer.validTo) <= now.getTime();
  const actions: OfferAction[] = [];
  if (offer.status !== 'ended') actions.push('edit');
  if (offer.status === 'active' && !expired) actions.push('pause');
  if (offer.status === 'paused' && offer.reviewDecision === 'approved' && !expired)
    actions.push('resume');
  if (offer.status === 'active' || offer.status === 'paused') actions.push('end');
  return actions;
}

export const STATUS_ACTION: Readonly<Record<'active' | 'paused' | 'ended', OfferAction>> = {
  active: 'resume',
  paused: 'pause',
  ended: 'end',
};

export const OWNER_OFFER_REPOSITORY = Symbol('OWNER_OFFER_REPOSITORY');

export interface OwnerOfferRepository {
  page(
    tx: TxContext,
    input: {
      businessId: string;
      status: OfferStatus | null;
      take: number;
      after: { createdAt: string; id: string } | null;
    },
  ): Promise<StoredOffer[]>;
  find(tx: TxContext, input: { id: string; businessId: string; lock: boolean }): Promise<StoredOffer | null>;
  insert(tx: TxContext, input: OfferCreate & { id: string; businessId: string; at: Date }): Promise<void>;
  /** Replaces editable fields and re-queues approval; false on version mismatch. */
  update(
    tx: TxContext,
    input: OfferCreate & { id: string; businessId: string; expectedVersion: number; at: Date },
  ): Promise<boolean>;
  setStatus(
    tx: TxContext,
    input: { id: string; businessId: string; status: OfferStatus; expectedVersion: number; at: Date },
  ): Promise<boolean>;
}
