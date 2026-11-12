import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  SupportMessageAcceptedSchema,
  SupportMessageDetailSchema,
  SupportMessageTextSchema,
  type SupportMessageAccepted,
  type SupportMessageDetail,
} from '@apnatown/shared/settings';
import { IdSchema, LimitSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { SessionBinding } from '../../../shared/auth';
import {
  SESSION_ACCESS,
  type AdminReadContext,
  type SessionAccess,
} from '../../../shared/auth/ports';
import { ScopeRegistry } from '../../../shared/auth/scope-registry';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  RATE_LIMIT_REPOSITORY,
  type RateLimitRepository,
} from '../../../shared/rate-limit/repository';
import { rateLimitSubjectHash } from '../../../shared/rate-limit/rate-limit';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  SUPPORT_MESSAGE_REPOSITORY,
  type StoredSupportMessage,
  type SupportMessageRepository,
  type SupportSource,
} from '../domain/settings';
import { SettingsEvents } from './settings-events';
import type {
  Page,
  SettingsSupportReadPort,
  SupportAlert,
  SupportIntakePort,
} from './settings-ports';

/** Shared intake abuse limit (spec: 5/hour per user or anonymous subject). */
export const SUPPORT_INTAKE_LIMIT = {
  key: 'support.intake',
  maximumHits: 5,
  windowSeconds: 3600,
} as const;
// Local retry horizon for intake receipts, not a retention policy.
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const SOURCE_KEY = /^[A-Za-z0-9._:-]{1,128}$/;
const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const linkPath = (id: string) => `/admin/overview?supportMessageId=${id}`;

export interface SupportSubmission {
  session: SessionBinding;
  /** Authenticated user from the guard; null for an anonymous guest session. */
  principalId: string | null;
  correlationId: string;
  key: unknown;
}

/**
 * Message-only support intake plus the scoped Admin read side. Scope is
 * server-derived (null for guests: super admins only); message text is
 * plain text and never logged.
 */
@Injectable()
export class SupportService
  implements SupportIntakePort, SettingsSupportReadPort, OnModuleInit
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(SUPPORT_MESSAGE_REPOSITORY)
    private readonly messages: SupportMessageRepository,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(RATE_LIMIT_REPOSITORY) private readonly limits: RateLimitRepository,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly registry: ScopeRegistry,
    private readonly events: SettingsEvents,
  ) {}

  onModuleInit(): void {
    this.registry.register('support_message', async (id, tx) => {
      const row = await this.read(id, tx);
      // Unscoped/global guest messages resolve to [] => super_admin only.
      return row.cityId ? [{ cityId: row.cityId, areaId: row.areaId }] : [];
    });
  }

  /** POST /support/messages: guest or authenticated, idempotent, 202. */
  submit(
    request: SupportSubmission,
    message: string,
  ): Promise<SupportMessageAccepted> {
    const command = this.contexts.create(
      {
        name: 'support.messages.create',
        method: 'POST',
        scope: 'principal',
        successStatus: 202,
      },
      {
        // Anonymous guests are keyed by their live session.
        actorId: request.principalId ?? request.session.id,
        correlationId: request.correlationId,
        resource: '/support/messages',
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload: { message } },
    );
    return this.commands.run(
      command,
      async (tx) => {
        let userId: string | null = null;
        if (request.principalId) {
          // Revalidate the session/identity through commit.
          const principal = await this.sessions.requirePrincipal(
            tx,
            request.session,
          );
          if (principal.userId !== request.principalId)
            throw new DomainError('SESSION_EXPIRED');
          userId = principal.userId;
        }
        return (await this.intake(tx, {
          userId,
          message,
          source: 'web',
          sourceKey: null,
          correlationId: request.correlationId,
        })) as SupportMessageAccepted & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            SupportMessageAcceptedSchema.parse(
              stored,
            ) as SupportMessageAccepted & JsonValue,
          ),
      },
    );
  }

  /** Delegated rider intake; the caller (Delivery) has verified the actor. */
  async create(input: {
    userId: string;
    message: string;
    source: 'rider';
    sourceKey: string;
  }): Promise<SupportMessageAccepted> {
    const userId = IdSchema.safeParse(input.userId);
    const message = SupportMessageTextSchema.safeParse(input.message);
    if (!userId.success || !SOURCE_KEY.test(input.sourceKey))
      throw new Error('INVALID_SUPPORT_INTAKE');
    if (!message.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'message' });
    const limit = await this.limits.consume({
      policyKey: SUPPORT_INTAKE_LIMIT.key,
      subjectHash: rateLimitSubjectHash(
        this.config.CURSOR_SIGNING_KEY,
        `principal:${userId.data}`,
      ),
      windowSeconds: SUPPORT_INTAKE_LIMIT.windowSeconds,
      maximumHits: SUPPORT_INTAKE_LIMIT.maximumHits,
    });
    if (!limit.allowed)
      throw new DomainError(
        'COMMON_RATE_LIMITED',
        {},
        Math.min(60, Math.max(1, limit.retryAfterSeconds)),
      );
    const correlationId = currentCorrelationId() ?? this.ids.uuidv7();
    return this.uow.run((tx) =>
      this.intake(tx, {
        userId: userId.data,
        message: message.data,
        source: input.source,
        sourceKey: input.sourceKey,
        correlationId,
      }),
    );
  }

  async alerts(
    ctx: AdminReadContext,
    input: { cursor?: string; limit?: number },
  ): Promise<Page<SupportAlert>> {
    this.assertReader(ctx);
    const limit = LimitSchema.parse(input.limit);
    const binding: CursorBinding = {
      operation: 'admin.support.alerts',
      sort: 'createdAt-id-desc',
      filters: null,
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    let after: { createdAt: string; id: string } | undefined;
    if (input.cursor) {
      const parsed = positionSchema.safeParse(
        this.cursors.decode(input.cursor, binding),
      );
      if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
      after = { createdAt: parsed.data[0], id: parsed.data[1] };
    }
    return this.uow.run(async (tx) => {
      const rows = await this.messages.page(
        tx,
        this.visibility(ctx),
        limit + 1,
        after,
      );
      const items = rows.slice(0, limit);
      const last = items.at(-1);
      return {
        items: items.map((row) => ({
          id: row.id,
          createdAt: row.createdAt,
          linkPath: linkPath(row.id),
        })),
        nextCursor:
          rows.length > limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      };
    });
  }

  detail(
    ctx: AdminReadContext,
    input: { messageId: string },
  ): Promise<SupportMessageDetail> {
    this.assertReader(ctx);
    return this.uow.run(async (tx) => {
      const row = await this.read(input.messageId, tx);
      // Scope is rechecked here even after the route guard.
      if (!this.visible(ctx, row))
        throw new DomainError('ADMIN_SCOPE_FORBIDDEN');
      const [author] = row.userId
        ? await this.identity.describe(tx, [row.userId])
        : [];
      const label = author?.displayName?.trim().slice(0, 80);
      return SupportMessageDetailSchema.parse({
        id: row.id,
        message: row.message,
        createdAt: row.createdAt,
        ...(label ? { authorLabel: label } : {}),
        scope: { cityId: row.cityId, areaId: row.areaId },
      });
    });
  }

  async notificationContext(input: { messageId: string }): Promise<{
    scope: { cityId: string | null; areaId: string | null };
    linkPath: string;
  }> {
    const row = await this.uow.run((tx) => this.read(input.messageId, tx));
    return {
      scope: { cityId: row.cityId, areaId: row.areaId },
      linkPath: linkPath(row.id),
    };
  }

  private async intake(
    tx: TxContext,
    input: {
      userId: string | null;
      message: string;
      source: SupportSource;
      sourceKey: string | null;
      correlationId: string;
    },
  ): Promise<SupportMessageAccepted> {
    // No trusted area is resolved for intake yet: every message is
    // unscoped/global and routed to super admins only.
    const scope = { cityId: null, areaId: null };
    const saved = await this.messages.insert(tx, {
      id: this.ids.uuidv7(),
      userId: input.userId,
      message: input.message,
      source: input.source,
      sourceKey: input.sourceKey,
      ...scope,
      at: this.clock.now(),
    });
    // Message + admin-notification outbox commit together (once per message).
    if (saved.created)
      await this.events.supportSubmitted(
        tx,
        { messageId: saved.id, scope },
        input.correlationId,
      );
    return SupportMessageAcceptedSchema.parse({
      id: saved.id,
      status: 'accepted',
    });
  }

  private async read(
    id: string,
    tx?: TxContext,
  ): Promise<StoredSupportMessage> {
    if (!IdSchema.safeParse(id).success)
      throw new DomainError('SUPPORT_MESSAGE_NOT_FOUND');
    const row = await (tx
      ? this.messages.read(tx, id)
      : this.uow.run((t) => this.messages.read(t, id)));
    if (!row) throw new DomainError('SUPPORT_MESSAGE_NOT_FOUND');
    return row;
  }

  private assertReader(ctx: AdminReadContext): void {
    if (!ctx.isSuper && ctx.permission?.module !== 'users')
      throw new DomainError('COMMON_FORBIDDEN');
  }

  private visibility(ctx: AdminReadContext) {
    return {
      platformWide: ctx.isSuper || ctx.scope.platformWide,
      cityIds: ctx.scope.cityWideIds,
      areaIds: ctx.scope.areaIds,
    };
  }

  private visible(ctx: AdminReadContext, row: StoredSupportMessage): boolean {
    const scope = this.visibility(ctx);
    if (scope.platformWide) return true;
    if (!row.cityId) return false;
    return (
      scope.cityIds.includes(row.cityId) ||
      (row.areaId !== null && scope.areaIds.includes(row.areaId))
    );
  }
}
