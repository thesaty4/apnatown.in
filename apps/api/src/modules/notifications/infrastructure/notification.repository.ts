import { Injectable } from '@nestjs/common';
import type { NotificationTemplateKey } from '@apnatown/shared/notifications';
import type { UserRole } from '@apnatown/shared/users';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  DeliveryRecord,
  FeedFilter,
  FeedPosition,
  FeedRow,
  NotificationDraft,
  NotificationRepository,
  TemplateText,
} from '../domain/notification';

/**
 * Own, role-bound and published-only predicate. Admin alerts additionally
 * need, per module, a live view grant covering the alert's exact area or an
 * explicit whole-city grant (global alerts only for platform-wide grants).
 * No grant fails closed.
 */
function visible(filter: FeedFilter): Prisma.Sql {
  const own = Prisma.sql`n.user_id=${filter.userId}::uuid
    AND n.audience_role=${filter.audienceRole}
    AND n.in_app_published_at IS NOT NULL`;
  const alerts = filter.alerts;
  if (!alerts) return own;
  const grants = alerts.map(
    (grant) => Prisma.sql`(n.resource_scope->>'module' = ${grant.module}
      AND (${grant.platformWide}
        OR n.resource_scope->>'areaId' = ANY(${[...grant.areaIds]}::text[])
        OR n.resource_scope->>'cityId' = ANY(${[...grant.cityIds]}::text[])))`,
  );
  const scoped = grants.length
    ? Prisma.join(grants, ' OR ')
    : Prisma.sql`FALSE`;
  return Prisma.sql`${own} AND (${scoped})`;
}

/** Parameterized SQL only; Notifications owns these tables. */
@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async insert(tx: TxContext, draft: NotificationDraft): Promise<boolean> {
    const inserted = await this.db.client(tx).$executeRaw`
      INSERT INTO notifications (id,user_id,audience_role,category,topic,intent,
        template_key,template_version,content_version,params,link_path,
        resource_scope,source_event_id,source_type,source_version,created_at)
      VALUES (${draft.id}::uuid,${draft.userId}::uuid,${draft.audienceRole},
        ${draft.category},${draft.topic},${draft.intent},${draft.templateKey},
        ${draft.templateVersion},${draft.contentVersion},
        ${JSON.stringify(draft.params)}::jsonb,${draft.linkPath},
        ${draft.resourceScope ? JSON.stringify(draft.resourceScope) : null}::jsonb,
        ${draft.sourceEventId}::uuid,${draft.sourceType},${draft.sourceVersion},
        ${draft.at})
      ON CONFLICT (user_id,audience_role,source_event_id,template_key,content_version)
      DO NOTHING`;
    return inserted === 1;
  }

  async publishInApp(tx: TxContext, id: string, at: Date): Promise<void> {
    await this.db.client(tx).$executeRaw`
      UPDATE notifications SET in_app_published_at=${at}
      WHERE id=${id}::uuid AND in_app_published_at IS NULL`;
  }

  async recordDelivery(tx: TxContext, delivery: DeliveryRecord): Promise<void> {
    await this.db.client(tx).$executeRaw`
      INSERT INTO notification_deliveries (id,notification_id,channel,status,
        suppression_reason,delivered_at,created_at,updated_at)
      VALUES (${delivery.id}::uuid,${delivery.notificationId}::uuid,
        ${delivery.channel},${delivery.status},${delivery.suppressionReason},
        ${delivery.status === 'delivered' ? delivery.at : null},
        ${delivery.at},${delivery.at})
      ON CONFLICT (notification_id,channel) DO NOTHING`;
  }

  page(
    tx: TxContext,
    filter: FeedFilter,
    input: { after?: FeedPosition; limit: number },
  ): Promise<FeedRow[]> {
    const after = input.after
      ? Prisma.sql`AND (n.in_app_published_at,n.id) <
          (${input.after.publishedAt}::timestamptz,${input.after.id}::uuid)`
      : Prisma.empty;
    return this.db.client(tx).$queryRaw<FeedRow[]>`
      SELECT n.id::text AS id,n.category,n.template_key AS "templateKey",
        n.template_version AS "templateVersion",n.params,
        n.link_path AS "linkPath",n.read_at AS "readAt",
        n.in_app_published_at AS "publishedAt"
      FROM notifications n
      WHERE ${visible(filter)} ${after}
      ORDER BY n.in_app_published_at DESC,n.id DESC
      LIMIT ${input.limit + 1}`;
  }

  async unreadCount(tx: TxContext, filter: FeedFilter): Promise<number> {
    const rows = await this.db.client(tx).$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM notifications n
      WHERE ${visible(filter)} AND n.read_at IS NULL`;
    return rows[0]?.count ?? 0;
  }

  async ownRole(
    tx: TxContext,
    userId: string,
    id: string,
  ): Promise<UserRole | null> {
    const rows = await this.db.client(tx).$queryRaw<{ role: UserRole }[]>`
      SELECT audience_role AS role FROM notifications
      WHERE id=${id}::uuid AND user_id=${userId}::uuid
        AND in_app_published_at IS NOT NULL`;
    return rows[0]?.role ?? null;
  }

  async markRead(
    tx: TxContext,
    filter: FeedFilter,
    id: string,
    at: Date,
  ): Promise<boolean> {
    // Already-read visible items succeed without rewriting read_at.
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      SELECT n.id::text AS id FROM notifications n
      WHERE n.id=${id}::uuid AND ${visible(filter)} FOR UPDATE OF n`;
    if (!rows.length) return false;
    await this.db.client(tx).$executeRaw`
      UPDATE notifications SET read_at=${at}
      WHERE id=${id}::uuid AND read_at IS NULL`;
    return true;
  }

  async markAllRead(
    tx: TxContext,
    filter: FeedFilter,
    at: Date,
  ): Promise<void> {
    await this.db.client(tx).$executeRaw`
      UPDATE notifications n SET read_at=${at}
      WHERE ${visible(filter)} AND n.read_at IS NULL`;
  }

  templates(
    tx: TxContext,
    keys: readonly { key: string; version: number }[],
  ): Promise<TemplateText[]> {
    if (!keys.length) return Promise.resolve([]);
    return this.db.client(tx).$queryRaw<TemplateText[]>`
      SELECT t.key,t.version,t.locale,t.title,t.body
      FROM notification_templates t
      JOIN unnest(${keys.map((k) => k.key)}::text[],
        ${keys.map((k) => k.version)}::int[]) AS wanted(key,version)
        ON wanted.key=t.key AND wanted.version=t.version
      WHERE t.channel='in_app'`;
  }

  async activeTemplateVersion(
    tx: TxContext,
    key: NotificationTemplateKey,
  ): Promise<number | null> {
    // Publishing needs at least the EN fallback of the active version.
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>`
      SELECT version FROM notification_templates
      WHERE key=${key} AND channel='in_app' AND locale='en' AND active`;
    return rows[0]?.version ?? null;
  }
}
