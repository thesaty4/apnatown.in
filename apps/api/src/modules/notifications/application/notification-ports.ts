import type { NotificationChannelKind } from '@apnatown/shared/notifications';
import type {
  NotificationIntent,
  NotificationSuppressionReason,
  NotificationTopic,
} from '@apnatown/shared/notifications';
import type { TxContext } from '../../../shared/persistence/ports';
import type { PreferenceValues } from '../domain/notification';

// ---------------------------------------------------------------------------
// Ports Notifications consumes (consumer-defined; the owner binds them).
// ---------------------------------------------------------------------------

export const NOTIFICATION_BUSINESS_CONTEXT = Symbol(
  'NOTIFICATION_BUSINESS_CONTEXT',
);
/** Businesses-owned, least-privilege recipient context (no contact fields). */
export interface NotificationBusinessRecipient {
  businessId: string;
  ownerUserId: string;
  audienceRole: 'vendor' | 'provider';
  cityId: string | null;
  areaId: string | null;
  deleted: boolean;
}
export interface NotificationBusinessContextPort {
  recipient(
    tx: TxContext,
    businessId: string,
  ): Promise<NotificationBusinessRecipient | null>;
  /** Applicant capability: roles of live businesses the user owns. */
  applicantRoles(
    tx: TxContext,
    userId: string,
  ): Promise<readonly ('vendor' | 'provider')[]>;
}

// ---------------------------------------------------------------------------
// Channel strategy. Only in-app is implemented; external channels report
// unavailable until a provider/template is approved (NT-Q1, Q-04) and never
// fake a send.
// ---------------------------------------------------------------------------

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
export interface ChannelDeliveryInput {
  notificationId: string;
  userId: string;
  topic: NotificationTopic;
  intent: NotificationIntent;
  preferences: PreferenceValues;
  at: Date;
}
export type ChannelOutcome =
  | { status: 'delivered' }
  | { status: 'suppressed'; reason: NotificationSuppressionReason };
export interface NotificationChannel {
  readonly kind: NotificationChannelKind;
  /** False while no provider/adapter is configured. */
  readonly available: boolean;
  deliver(tx: TxContext, input: ChannelDeliveryInput): Promise<ChannelOutcome>;
}
