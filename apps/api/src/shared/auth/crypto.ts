import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

export const IDENTITY_CRYPTO = Symbol('IDENTITY_CRYPTO');
export interface IdentityCrypto {
  phoneHash(normalizedPhone: string): Uint8Array;
  encrypt(plaintext: string, context: string): string;
  decrypt(ciphertext: string, context: string): string;
}
export class NodeIdentityCrypto implements IdentityCrypto {
  private readonly encryptionKey: Buffer;
  private readonly lookupKey: Buffer;
  constructor(encryptionKey: string, lookupKey: string) {
    this.encryptionKey = secret(encryptionKey);
    this.lookupKey = secret(lookupKey);
    if (encryptionKey === lookupKey) throw new Error('AUTH_KEYS_MUST_DIFFER');
  }
  phoneHash(normalizedPhone: string): Uint8Array {
    return createHmac('sha256', this.lookupKey)
      .update(`apnatown:phone-lookup:v1\0${normalizedPhone}`)
      .digest();
  }
  encrypt(plaintext: string, context: string): string {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, nonce);
    cipher.setAAD(Buffer.from(`apnatown:pii:v1\0${context}`));
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      nonce.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }
  decrypt(ciphertext: string, context: string): string {
    try {
      const [version, nonce, tag, body, extra] = ciphertext.split('.');
      if (version !== 'v1' || !nonce || !tag || !body || extra !== undefined)
        throw new Error();
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        Buffer.from(nonce, 'base64url'),
      );
      decipher.setAAD(Buffer.from(`apnatown:pii:v1\0${context}`));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(body, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new Error('PII_DECRYPTION_FAILED');
    }
  }
}

export const OTP_CODES = Symbol('OTP_CODES');
export interface OtpCodes {
  generate(): string;
  hash(challengeId: string, code: string): string;
  verify(challengeId: string, code: string, hash: string): boolean;
}
export class NodeOtpCodes implements OtpCodes {
  private readonly key: Buffer;
  constructor(key: string) {
    this.key = secret(key);
  }
  generate(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
  hash(challengeId: string, code: string): string {
    const salt = randomBytes(16).toString('hex');
    return `v1.${salt}.${this.digest(challengeId, salt, code).toString('hex')}`;
  }
  verify(challengeId: string, code: string, hash: string): boolean {
    const parsed = /^v1\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(hash);
    if (!parsed) throw new Error('INVALID_OTP_HASH');
    return timingSafeEqual(
      this.digest(challengeId, parsed[1]!, code),
      Buffer.from(parsed[2]!, 'hex'),
    );
  }
  private digest(challengeId: string, salt: string, code: string): Buffer {
    return createHmac('sha256', this.key)
      .update(`apnatown:login-otp:v1\0${challengeId}\0${salt}\0${code}`)
      .digest();
  }
}
function secret(key: string): Buffer {
  if (!/^[a-f0-9]{64}$/.test(key) || /^(.)\1+$/.test(key))
    throw new Error('INVALID_AUTH_KEY');
  return Buffer.from(key, 'hex');
}
