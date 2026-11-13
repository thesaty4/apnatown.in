import type { JsonValue } from '@apnatown/shared';
import type {
  NotificationCategory,
  NotificationChannelKind,
  NotificationDeliveryStatus,
  NotificationIntent,
  NotificationPreferenceKey,
  NotificationSuppressionReason,
  NotificationTemplateKey,
  NotificationTopic,
} from '@apnatown/shared/notifications';
import type { UserRole } from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';

/** Admin alert resource scope persisted for the per-read permission recheck. */
export interface AlertScope {
  module: 'approvals' | 'catalog' | 'reviews' | 'users';
  cityId: string | null;
  areaId: string | null;
}

/** One role-bound logical message (trusted matrix output, never caller text). */
export interface NotificationDraft {
  id: string;
  userId: string;
  audienceRole: UserRole;
  category: NotificationCategory;
  topic: NotificationTopic;
  intent: NotificationIntent;
  templateKey: NotificationTemplateKey;
  templateVersion: number;
  contentVersion: string;
  /** Allow-listed render params: ids, status codes, catalog names only. */
  params: Record<string, string>;
  linkPath: string | null;
  resourceScope: AlertScope | null;
  sourceEventId: string;
  sourceType: string;
  sourceVersion: number;
  at: Date;
}

export interface FeedRow {
  id: string;
  category: NotificationCategory;
  templateKey: string;
  templateVersion: number;
  params: JsonValue;
  linkPath: string | null;
  readAt: Date | null;
  publishedAt: Date;
}

export interface FeedPosition {
  publishedAt: string;
  id: string;
}

/** Live view grant for one admin alert module (never merged across modules). */
export interface AlertModuleGrant {
  module: AlertScope['module'];
  platformWide: boolean;
  cityIds: readonly string[];
  areaIds: readonly string[];
}

export interface FeedFilter {
  userId: string;
  audienceRole: UserRole;
  /** Admin feeds: per-module grants (empty = no alerts); `null` = not an admin feed. */
  alerts: readonly AlertModuleGrant[] | null;
}

export interface DeliveryRecord {
  id: string;
  notificationId: string;
  channel: NotificationChannelKind;
  status: NotificationDeliveryStatus;
  suppressionReason: NotificationSuppressionReason | null;
  at: Date;
}

export interface TemplateText {
  key: string;
  version: number;
  locale: 'en' | 'hi';
  title: string | null;
  body: string;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
export interface NotificationRepository {
  /** Inserts once per logical key; false when the message already exists (replay). */
  insert(tx: TxContext, draft: NotificationDraft): Promise<boolean>;
  publishInApp(tx: TxContext, id: string, at: Date): Promise<void>;
  recordDelivery(tx: TxContext, delivery: DeliveryRecord): Promise<void>;
  page(
    tx: TxContext,
    filter: FeedFilter,
    input: { after?: FeedPosition; limit: number },
  ): Promise<FeedRow[]>;
  unreadCount(tx: TxContext, filter: FeedFilter): Promise<number>;
  /** Audience role of the caller's own published item, or null. */
  ownRole(tx: TxContext, userId: string, id: string): Promise<UserRole | null>;
  /** Marks one own published item read; false when not visible to the caller. */
  markRead(
    tx: TxContext,
    filter: FeedFilter,
    id: string,
    at: Date,
  ): Promise<boolean>;
  markAllRead(tx: TxContext, filter: FeedFilter, at: Date): Promise<void>;
  templates(
    tx: TxContext,
    keys: readonly { key: string; version: number }[],
  ): Promise<TemplateText[]>;
  /** Active in-app template version for a key, or null when unavailable. */
  activeTemplateVersion(
    tx: TxContext,
    key: NotificationTemplateKey,
  ): Promise<number | null>;
}

export type PreferenceValues = Record<NotificationPreferenceKey, boolean>;
export interface StoredPreferences extends PreferenceValues {
  version: number;
}

export const PREFERENCE_REPOSITORY = Symbol('PREFERENCE_REPOSITORY');
export interface PreferenceRepository {
  find(tx: TxContext, userId: string): Promise<StoredPreferences | null>;
  /** Inserts display defaults if absent, then row-locks through commit. */
  lockOrCreate(
    tx: TxContext,
    userId: string,
    defaults: PreferenceValues,
    at: Date,
  ): Promise<StoredPreferences>;
  update(
    tx: TxContext,
    userId: string,
    values: PreferenceValues,
    version: number,
    at: Date,
  ): Promise<void>;
}
