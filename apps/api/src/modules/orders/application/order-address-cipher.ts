import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { IDENTITY_CRYPTO, type IdentityCrypto } from '../../../shared/auth/crypto';
import type { AddressSnapshot } from '../domain/order';
import type { CheckoutAddress } from './order-ports';

const PlainSchema = z.strictObject({
  addressText: z.string().min(1).max(500),
  landmark: z.string().max(200).nullable(),
  location: z.strictObject({ lat: z.number(), lng: z.number() }).nullable(),
});
export type PlainAddress = z.infer<typeof PlainSchema>;

const context = (orderId: string) => `order:${orderId}:delivery-address`;

/**
 * Delivery address snapshot at rest (orders BE "encrypt/minimize address
 * snapshots"): address text, landmark and point are AES-GCM ciphertext
 * bound to the order; decrypted only for the order's customer and owning
 * approved business.
 */
@Injectable()
export class OrderAddressCipher {
  constructor(@Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto) {}

  seal(orderId: string, address: CheckoutAddress): AddressSnapshot {
    const plain: PlainAddress = {
      addressText: address.addressText,
      landmark: address.landmark,
      location: address.location,
    };
    return {
      addressId: address.id,
      addressVersion: address.version,
      cityId: address.cityId,
      areaId: address.areaId,
      pinCode: address.pinCode,
      ciphertext: this.crypto.encrypt(JSON.stringify(plain), context(orderId)),
    };
  }

  open(orderId: string, snapshot: AddressSnapshot): PlainAddress {
    return PlainSchema.parse(JSON.parse(this.crypto.decrypt(snapshot.ciphertext, context(orderId))));
  }
}
