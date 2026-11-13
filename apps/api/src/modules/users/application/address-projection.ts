import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  AddressSchema,
  AddressDeletedSchema,
  type Address,
  type AddressDeleted,
} from '@apnatown/shared/users';
import { IdSchema } from '@apnatown/shared/wire';
import { canonicalJson, type JsonValue } from '@apnatown/shared';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import type { StoredAddress } from '../domain/address';

const receiptSchema = z.strictObject({
  id: IdSchema,
  ciphertext: z.string().min(1).max(20000),
});
export type AddressResult = Address | AddressDeleted;

@Injectable()
export class AddressProjection {
  constructor(
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
  ) {}
  encrypt(
    userId: string,
    id: string,
    field: 'addressText' | 'landmark',
    text: string,
  ): string {
    return this.crypto.encrypt(text, `user:${userId}:address:${id}:${field}`);
  }
  present(row: StoredAddress): Address {
    const context = `user:${row.userId}:address:${row.id}`;
    return AddressSchema.parse({
      id: row.id,
      label: row.label,
      addressText: this.crypto.decrypt(
        row.addressText,
        `${context}:addressText`,
      ),
      landmark:
        row.landmark === null
          ? null
          : this.crypto.decrypt(row.landmark, `${context}:landmark`),
      pinCode: row.pinCode,
      cityId: row.cityId,
      areaId: row.areaId,
      lat: row.lat,
      lng: row.lng,
      isDefault: row.isDefault,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
  store(result: AddressResult, userId: string, operation: string): JsonValue {
    // Never put private text, coordinates or a plaintext response snapshot in the receipt.
    const dto =
      'deleted' in result
        ? AddressDeletedSchema.parse(result)
        : AddressSchema.parse(result);
    return {
      id: dto.id,
      ciphertext: this.crypto.encrypt(
        canonicalJson(dto),
        `user:${userId}:address:${dto.id}:receipt:${operation}`,
      ),
    };
  }
  receipt(stored: JsonValue) {
    return receiptSchema.parse(stored);
  }
  replay(
    stored: JsonValue,
    userId: string,
    operation: string,
    deleted: boolean,
  ): AddressResult {
    const receipt = this.receipt(stored);
    const decoded: unknown = JSON.parse(
      this.crypto.decrypt(
        receipt.ciphertext,
        `user:${userId}:address:${receipt.id}:receipt:${operation}`,
      ),
    );
    const dto = deleted
      ? AddressDeletedSchema.parse(decoded)
      : AddressSchema.parse(decoded);
    if (dto.id !== receipt.id) throw new Error('INVALID_ADDRESS_RECEIPT');
    return dto;
  }
}
