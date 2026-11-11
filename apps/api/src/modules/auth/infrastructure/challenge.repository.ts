import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { OtpChallenge, ChallengeRepository } from '../domain/challenge';

@Injectable()
export class PrismaChallengeRepository implements ChallengeRepository {
  constructor(private readonly database: PrismaDatabase) {}
  async lockPhone(tx: TxContext, hash: Uint8Array): Promise<void> {
    const key = `auth:phone:${Buffer.from(hash).toString('hex')}`;
    await this.database.client(tx)
      .$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  }
  latest(tx: TxContext, hash: Uint8Array): Promise<OtpChallenge | null> {
    return this.database.client(tx).otpChallenge.findFirst({
      where: { phoneLookupHash: Uint8Array.from(hash) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
  countSince(tx: TxContext, hash: Uint8Array, since: Date): Promise<number> {
    return this.database.client(tx).otpChallenge.count({
      where: {
        phoneLookupHash: Uint8Array.from(hash),
        createdAt: { gte: since },
      },
    });
  }
  find(tx: TxContext, id: string): Promise<OtpChallenge | null> {
    return this.database.client(tx).otpChallenge.findUnique({ where: { id } });
  }
  async lock(tx: TxContext, id: string): Promise<OtpChallenge | null> {
    await this.database.client(tx)
      .$queryRaw`SELECT id FROM otp_challenges WHERE id = ${id}::uuid FOR UPDATE`;
    return this.find(tx, id);
  }
  async supersedePhone(
    tx: TxContext,
    hash: Uint8Array,
    now: Date,
  ): Promise<void> {
    await this.database.client(tx).otpChallenge.updateMany({
      where: {
        phoneLookupHash: Uint8Array.from(hash),
        verifiedAt: null,
        supersededAt: null,
      },
      data: { supersededAt: now },
    });
  }
  async supersede(tx: TxContext, id: string, now: Date): Promise<void> {
    await this.database.client(tx).otpChallenge.updateMany({
      where: { id, verifiedAt: null, supersededAt: null },
      data: { supersededAt: now },
    });
  }
  async insert(tx: TxContext, challenge: OtpChallenge): Promise<void> {
    await this.database.client(tx).otpChallenge.create({
      data: {
        ...challenge,
        phoneLookupHash: Uint8Array.from(challenge.phoneLookupHash),
      },
    });
  }
  async failAttempt(tx: TxContext, id: string): Promise<void> {
    await this.database
      .client(tx)
      .otpChallenge.update({
        where: { id },
        data: { attemptCount: { increment: 1 } },
      });
  }
  async consume(tx: TxContext, id: string, now: Date): Promise<void> {
    await this.database
      .client(tx)
      .otpChallenge.update({ where: { id }, data: { verifiedAt: now } });
  }
}
