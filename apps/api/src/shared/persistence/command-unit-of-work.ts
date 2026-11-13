import { Inject, Injectable } from '@nestjs/common';
import { canonicalJson, type JsonValue } from '@apnatown/shared';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { DomainError } from '../errors/errors';
import { ID_PROVIDER, type IdProvider } from '../runtime/providers';
import { Prisma } from './generated/client';
import type {
  CommandContext,
  CommandUnitOfWork,
  IdempotencyResultPolicy,
  TxContext,
} from './ports';
import { PrismaDatabase } from './prisma-database';

type IdempotencyRow = {
  id: string;
  requestHash: Uint8Array;
  state: string;
  expired: boolean;
  leaseActive: boolean;
  httpStatus: number | null;
  bodyMissing: boolean;
  responseBody: Prisma.JsonValue | null;
};

type Claim =
  | { kind: 'claimed'; id: string; leaseOwner: string }
  | { kind: 'completed'; responseBody: JsonValue; httpStatus: number }
  | { kind: 'busy' };

function toJsonValue(value: Prisma.JsonValue): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return value;
  if (Array.isArray(value)) return value.map(toJsonValue);
  const result: { [key: string]: JsonValue } = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) throw new Error('IDEMPOTENCY_STORED_JSON_INVALID');
    result[key] = toJsonValue(child);
  }
  return result;
}

@Injectable()
export class PrismaCommandUnitOfWork implements CommandUnitOfWork {
  constructor(
    private readonly database: PrismaDatabase,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  async run<T extends JsonValue>(
    command: CommandContext,
    work: (tx: TxContext) => Promise<T>,
    resultPolicy: IdempotencyResultPolicy<T>,
  ): Promise<T> {
    this.validateCommand(command);
    await this.database.connect();
    return this.database.transaction(async (tx) => {
      const leaseOwner = this.ids.uuidv7();
      const claim = await this.claim(
        this.database.client(tx),
        command,
        leaseOwner,
      );
      if (claim.kind === 'busy')
        throw new DomainError('COMMON_CONFLICT', {}, 1);
      if (claim.kind === 'completed')
        return this.replay(tx, claim, command, resultPolicy);

      const result = await work(tx);
      const stored = resultPolicy.store(result);
      const encoded = canonicalJson(stored);
      const status = this.resultStatus(result, command, resultPolicy);
      if (status === 204 && (result !== null || stored !== null))
        throw new Error('IDEMPOTENCY_NO_CONTENT_RESULT_INVALID');
      await this.complete(this.database.client(tx), claim, status, encoded);
      return result;
    });
  }

  private async replay<T extends JsonValue>(
    tx: TxContext,
    claim: Extract<Claim, { kind: 'completed' }>,
    command: CommandContext,
    policy: IdempotencyResultPolicy<T>,
  ): Promise<T> {
    const result = await policy.replay(tx, claim.responseBody, command);
    if (this.resultStatus(result, command, policy) !== claim.httpStatus)
      throw new Error('IDEMPOTENCY_REPLAY_STATUS_MISMATCH');
    if (claim.httpStatus === 204 && result !== null)
      throw new Error('IDEMPOTENCY_NO_CONTENT_RESULT_INVALID');
    return result;
  }

  private resultStatus<T extends JsonValue>(
    result: T,
    command: CommandContext,
    policy: IdempotencyResultPolicy<T>,
  ): number {
    const status = policy.httpStatus?.(result) ?? command.successStatus;
    if (
      !Number.isInteger(status) ||
      !((status >= 200 && status <= 299) || (status >= 400 && status <= 499))
    )
      throw new Error('INVALID_IDEMPOTENCY_STATUS');
    return status;
  }

  private async claim(
    client: Prisma.TransactionClient,
    command: CommandContext,
    leaseOwner: string,
  ): Promise<Claim> {
    const principalKey = `${command.actor.kind}:${command.actor.id}`;
    const keyHash = Buffer.from(command.keyHash);
    const requestHash = Buffer.from(command.requestHash);
    const lock = await client.$queryRaw<{ acquired: boolean }[]>(
      Prisma.sql`
        SELECT pg_try_advisory_xact_lock(
          hashtextextended(
            ${principalKey} || chr(31) || ${command.operation} || chr(31)
              || encode(${keyHash}::bytea, 'hex'),
            0
          )
        ) AS acquired
      `,
    );
    if (!lock[0]?.acquired) return { kind: 'busy' };

    const expiry = await client.$queryRaw<{ valid: boolean }[]>(
      Prisma.sql`
        SELECT ${command.expiresAt}::timestamptz > clock_timestamp() AS valid
      `,
    );
    if (!expiry[0]?.valid) throw new Error('IDEMPOTENCY_EXPIRY_INVALID');

    const rows = await client.$queryRaw<IdempotencyRow[]>(
      Prisma.sql`
        SELECT id,
               request_hash AS "requestHash",
               state,
               expires_at <= clock_timestamp() AS expired,
               lease_expires_at > clock_timestamp() AS "leaseActive",
               http_status AS "httpStatus",
               response_body IS NULL AS "bodyMissing",
               response_body AS "responseBody"
        FROM idempotency_keys
        WHERE principal_key = ${principalKey}
          AND operation = ${command.operation}
          AND key_hash = ${keyHash}
        FOR UPDATE
      `,
    );
    const existing = rows[0];
    if (existing) {
      if (!Buffer.from(existing.requestHash).equals(requestHash))
        throw new DomainError('COMMON_CONFLICT');
      if (existing.state === 'completed' && !existing.expired) {
        if (existing.httpStatus === null)
          throw new Error('IDEMPOTENCY_COMPLETED_STATUS_MISSING');
        if (existing.httpStatus !== 204 && existing.bodyMissing)
          throw new Error('IDEMPOTENCY_COMPLETED_RESULT_MISSING');
        return {
          kind: 'completed',
          httpStatus: existing.httpStatus,
          responseBody:
            existing.responseBody === null
              ? null
              : toJsonValue(existing.responseBody),
        };
      }
      if (existing.state === 'in_progress' && existing.leaseActive)
        return { kind: 'busy' };
      if (!['in_progress', 'completed'].includes(existing.state))
        throw new Error('IDEMPOTENCY_STATE_INVALID');
      await this.reclaim(client, existing.id, command, leaseOwner);
      return { kind: 'claimed', id: existing.id, leaseOwner };
    }

    const id = this.ids.uuidv7();
    await client.$executeRaw(
      Prisma.sql`
        INSERT INTO idempotency_keys (
          id, principal_key, operation, key_hash, request_hash, state,
          lease_owner, lease_expires_at, response_headers,
          created_at, updated_at, expires_at
        )
        VALUES (
          ${id}::uuid, ${principalKey}, ${command.operation},
          ${keyHash}, ${requestHash}, 'in_progress',
          ${leaseOwner}, clock_timestamp()
            + (${this.config.IDEMPOTENCY_LEASE_MS} * INTERVAL '1 millisecond'),
          '{}'::jsonb, clock_timestamp(), clock_timestamp(),
          ${command.expiresAt}
        )
      `,
    );
    return { kind: 'claimed', id, leaseOwner };
  }

  private async reclaim(
    client: Prisma.TransactionClient,
    id: string,
    command: CommandContext,
    leaseOwner: string,
  ): Promise<void> {
    await client.$executeRaw(
      Prisma.sql`
        UPDATE idempotency_keys
        SET request_hash = ${Buffer.from(command.requestHash)},
            state = 'in_progress',
            lease_owner = ${leaseOwner},
            lease_expires_at = clock_timestamp()
              + (${this.config.IDEMPOTENCY_LEASE_MS} * INTERVAL '1 millisecond'),
            http_status = NULL,
            response_body = NULL,
            response_headers = '{}'::jsonb,
            resource_ref = NULL,
            created_at = clock_timestamp(),
            updated_at = clock_timestamp(),
            expires_at = ${command.expiresAt}
        WHERE id = ${id}::uuid
      `,
    );
  }

  private async complete(
    client: Prisma.TransactionClient,
    claim: Extract<Claim, { kind: 'claimed' }>,
    status: number,
    encoded: string,
  ): Promise<void> {
    const body =
      status === 204 ? Prisma.sql`NULL::jsonb` : Prisma.sql`${encoded}::jsonb`;
    const rows = await client.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        UPDATE idempotency_keys
        SET state = 'completed',
            lease_owner = NULL,
            lease_expires_at = NULL,
            http_status = ${status},
            response_body = ${body},
            response_headers = '{}'::jsonb,
            updated_at = clock_timestamp()
        WHERE id = ${claim.id}::uuid
          AND state = 'in_progress'
          AND lease_owner = ${claim.leaseOwner}
        RETURNING id
      `,
    );
    if (rows.length !== 1) throw new Error('IDEMPOTENCY_COMPLETION_FAILED');
  }

  private validateCommand(command: CommandContext): void {
    if (
      !command ||
      !command.actor ||
      !['user', 'consumer'].includes(command.actor.kind) ||
      !/^[A-Za-z0-9:_-]{1,200}$/.test(command.actor.id) ||
      !/^[A-Za-z0-9._:-]{1,200}$/.test(command.operation) ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(command.correlationId) ||
      !(command.keyHash instanceof Uint8Array) ||
      command.keyHash.byteLength !== 32 ||
      !(command.requestHash instanceof Uint8Array) ||
      command.requestHash.byteLength !== 32 ||
      !(command.expiresAt instanceof Date) ||
      !Number.isFinite(command.expiresAt.getTime()) ||
      !Number.isInteger(command.successStatus)
    )
      throw new Error('INVALID_COMMAND_CONTEXT');
    this.validateSuccessStatus(command.successStatus);
  }

  private validateSuccessStatus(status: number): void {
    if (!Number.isInteger(status) || status < 200 || status > 299)
      throw new Error('INVALID_IDEMPOTENCY_STATUS');
  }
}
