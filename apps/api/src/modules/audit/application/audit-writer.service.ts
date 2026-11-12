import { Inject, Injectable } from '@nestjs/common';
import { canonicalJson, type JsonValue } from '@apnatown/shared';
import { ScopeRefSchema } from '@apnatown/shared/admin';
import { CorrelationIdSchema, IdSchema } from '@apnatown/shared/wire';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from '../domain/audit-log';
import { redactSnapshot, redactText } from '../domain/redaction';
import type {
  AuditEntry,
  AuditSnapshot,
  AuditWriter,
} from './audit-writer.port';

const ACTION = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const ENTITY_TYPE = /^[a-z][a-z0-9_]*$/;
const FIELD = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

function bounded(text: string, max: number, fallback: string): string {
  const redacted = redactText(text);
  const clipped = [...redacted].slice(0, max).join('').trim();
  return clipped || fallback;
}

/**
 * Keeps only allow-listed top-level fields; when both snapshots exist, only
 * fields whose canonical value changed.
 */
function diff(entry: AuditEntry): {
  before: Record<string, JsonValue> | null;
  after: Record<string, JsonValue> | null;
} {
  const pick = (snapshot: AuditSnapshot | null | undefined, keys: string[]) => {
    if (!snapshot) return null;
    const picked: Record<string, JsonValue> = {};
    for (const key of keys)
      if (Object.hasOwn(snapshot, key)) picked[key] = snapshot[key]!;
    return Object.keys(picked).length ? redactSnapshot(picked) : null;
  };
  const fields = [...new Set(entry.fields)];
  if (fields.some((field) => !FIELD.test(field)))
    throw new Error('INVALID_AUDIT_FIELDS');
  const changed =
    entry.before && entry.after
      ? fields.filter(
          (field) =>
            canonicalJson(entry.before![field] ?? null) !==
            canonicalJson(entry.after![field] ?? null),
        )
      : fields;
  return {
    before: pick(entry.before, changed),
    after: pick(entry.after, changed),
  };
}

@Injectable()
export class AuditWriterService implements AuditWriter {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly repository: AuditLogRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  async record(tx: TxContext, entry: AuditEntry): Promise<void> {
    const { actor } = entry;
    // Programming errors fail closed, rolling back the caller's action.
    if (
      (actor.role === 'system') !== (actor.userId === null) ||
      (actor.userId !== null && !IdSchema.safeParse(actor.userId).success) ||
      !ACTION.test(entry.action) ||
      entry.action.length > 100 ||
      !ENTITY_TYPE.test(entry.entityType) ||
      entry.entityType.length > 64 ||
      (entry.entityId != null && !IdSchema.safeParse(entry.entityId).success) ||
      (entry.cityId != null && !IdSchema.safeParse(entry.cityId).success) ||
      (entry.areaId != null && !IdSchema.safeParse(entry.areaId).success) ||
      (entry.areaId != null && entry.cityId == null) ||
      !CorrelationIdSchema.safeParse(entry.correlationId).success
    )
      throw new Error('INVALID_AUDIT_ENTRY');
    const relatedScopes = (entry.relatedScopes ?? []).map((scope) =>
      ScopeRefSchema.parse(scope),
    );
    const { before, after } = diff(entry);
    await this.repository.insert(tx, {
      id: this.ids.uuidv7(),
      occurredAt: this.clock.now(),
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorLabel: bounded(actor.label, 80, actor.role),
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      cityId: entry.cityId ?? null,
      areaId: entry.areaId ?? null,
      relatedScopes,
      summary: bounded(entry.summary, 300, entry.action),
      before,
      after,
      correlationId: entry.correlationId,
    });
  }
}
