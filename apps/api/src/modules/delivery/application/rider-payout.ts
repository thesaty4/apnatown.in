import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import type { StoredRider } from '../domain/rider';

const upiContext = (userId: string) => `rider:${userId}:payout:upi`;
const bankContext = (userId: string) => `rider:${userId}:payout:bank`;

/** `sunil@upi` -> `su***@upi`; never the full handle. */
export function maskUpi(upi: string): string {
  const at = upi.lastIndexOf('@');
  const handle = upi.slice(0, at);
  return `${handle.slice(0, Math.min(2, handle.length - 1))}***${upi.slice(at)}`;
}

/** Last four digits only. */
export function maskBank(account: string): string {
  return `****${account.slice(-4)}`;
}

/**
 * Payout instrument encryption at rest (database.instructions "PII
 * encryption"). Plaintext exists only inside this boundary; responses carry
 * masked strings and logs/events carry nothing.
 */
@Injectable()
export class RiderPayoutCipher {
  constructor(
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
  ) {}

  encryptUpi(userId: string, upi: string): string {
    return this.crypto.encrypt(upi, upiContext(userId));
  }

  encryptBank(userId: string, account: string): string {
    return this.crypto.encrypt(account, bankContext(userId));
  }

  masked(rider: StoredRider): { upi?: string; bank?: string } | undefined {
    if (!rider.payoutUpiCiphertext && !rider.payoutBankCiphertext)
      return undefined;
    return {
      ...(rider.payoutUpiCiphertext
        ? {
            upi: maskUpi(
              this.crypto.decrypt(rider.payoutUpiCiphertext, upiContext(rider.userId)),
            ),
          }
        : {}),
      ...(rider.payoutBankCiphertext
        ? {
            bank: maskBank(
              this.crypto.decrypt(rider.payoutBankCiphertext, bankContext(rider.userId)),
            ),
          }
        : {}),
    };
  }
}
