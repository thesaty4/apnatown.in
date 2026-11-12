import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  DataRequestFailureCodeSchema,
  DataRequestStatusSchema,
  DataRequestTypeSchema,
} from '@apnatown/shared/users';
import type { DataRequest } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  DataRequestPatch,
  DataRequestRepository,
  StoredDataRequest,
} from '../domain/data-request';

const stepsSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/),
  z.strictObject({
    receipt: z.string().regex(/^[A-Za-z0-9._:-]{1,200}$/),
    status: z.enum(['completed', 'blocked']),
    reasonCode: z
      .string()
      .regex(/^[A-Z][A-Z0-9_]{0,63}$/)
      .optional(),
  }),
);

@Injectable()
export class PrismaDataRequestRepository implements DataRequestRepository {
  constructor(private readonly database: PrismaDatabase) {}
  async lock(tx: TxContext, id: string): Promise<StoredDataRequest | null> {
    const db = this.database.client(tx);
    await db.$queryRaw`SELECT id FROM data_requests WHERE id = ${id}::uuid FOR UPDATE`;
    const row = await db.dataRequest.findUnique({ where: { id } });
    return row ? fromRow(row) : null;
  }
  async findByKey(
    tx: TxContext,
    userId: string,
    idempotencyKey: string,
  ): Promise<StoredDataRequest | null> {
    const row = await this.database.client(tx).dataRequest.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      select: { id: true },
    });
    return row ? this.lock(tx, row.id) : null;
  }
  async openDeletion(
    tx: TxContext,
    userId: string,
  ): Promise<StoredDataRequest | null> {
    const row = await this.database.client(tx).dataRequest.findFirst({
      where: { userId, requestType: 'delete', status: { not: 'completed' } },
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });
    return row ? this.lock(tx, row.id) : null;
  }
  async activeExport(
    tx: TxContext,
    userId: string,
  ): Promise<StoredDataRequest | null> {
    const row = await this.database.client(tx).dataRequest.findFirst({
      where: {
        userId,
        requestType: 'export',
        status: { in: ['queued', 'processing'] },
      },
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
    });
    return row ? fromRow(row) : null;
  }
  async insert(tx: TxContext, row: StoredDataRequest): Promise<void> {
    await this.database.client(tx).dataRequest.create({
      data: {
        id: row.id,
        userId: row.userId,
        requestType: row.type,
        status: row.status,
        idempotencyKey: row.idempotencyKey,
        policyVersion: row.policyVersion,
        completedSteps: row.completedSteps as Record<string, never>,
        artifactStorageKey: row.artifactStorageKey,
        artifactExpiresAt: row.artifactExpiresAt,
        completionTokenHash: bytes(row.completionTokenHash),
        completionTokenExpiresAt: row.completionTokenExpiresAt,
        failureCode: row.failureCode,
        requestedAt: row.requestedAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
      },
    });
  }
  async update(
    tx: TxContext,
    id: string,
    patch: DataRequestPatch,
  ): Promise<StoredDataRequest> {
    const { completedSteps, completionTokenHash, ...rest } = patch;
    const row = await this.database.client(tx).dataRequest.update({
      where: { id },
      data: {
        ...rest,
        ...(completedSteps !== undefined
          ? {
              completedSteps: stepsSchema.parse(completedSteps) as Record<
                string,
                never
              >,
            }
          : {}),
        ...(completionTokenHash !== undefined
          ? { completionTokenHash: bytes(completionTokenHash) }
          : {}),
      },
    });
    return fromRow(row);
  }
}
function bytes(value: Uint8Array | null): Uint8Array<ArrayBuffer> | null {
  return value === null ? null : Uint8Array.from(value);
}
function fromRow(row: DataRequest): StoredDataRequest {
  return {
    id: row.id,
    userId: row.userId,
    type: DataRequestTypeSchema.parse(row.requestType),
    status: DataRequestStatusSchema.parse(row.status),
    idempotencyKey: row.idempotencyKey,
    policyVersion: row.policyVersion,
    completedSteps: stepsSchema.parse(row.completedSteps),
    artifactStorageKey: row.artifactStorageKey,
    artifactExpiresAt: row.artifactExpiresAt,
    completionTokenHash: row.completionTokenHash,
    completionTokenExpiresAt: row.completionTokenExpiresAt,
    failureCode:
      row.failureCode === null
        ? null
        : DataRequestFailureCodeSchema.parse(row.failureCode),
    requestedAt: row.requestedAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  };
}
