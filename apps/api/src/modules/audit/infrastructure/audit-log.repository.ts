import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { AuditLogRepository, AuditLogRow } from '../domain/audit-log';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly database: PrismaDatabase) {}
  async insert(tx: TxContext, row: AuditLogRow): Promise<void> {
    const json = (value: unknown) =>
      value === null ? null : JSON.stringify(value);
    await this.database.client(tx).$executeRaw(Prisma.sql`
      INSERT INTO audit_logs (id, occurred_at, actor_user_id, actor_role,
        actor_label, action, entity_type, entity_id, city_id, area_id,
        related_scopes, summary, before, after, correlation_id)
      VALUES (${row.id}::uuid, ${row.occurredAt}, ${row.actorUserId}::uuid,
        ${row.actorRole}, ${row.actorLabel}, ${row.action}, ${row.entityType},
        ${row.entityId}::uuid, ${row.cityId}::uuid, ${row.areaId}::uuid,
        ${JSON.stringify(row.relatedScopes)}::jsonb, ${row.summary},
        ${json(row.before)}::jsonb, ${json(row.after)}::jsonb,
        ${row.correlationId})`);
  }
}
