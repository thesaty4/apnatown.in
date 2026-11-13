import { Module, type DynamicModule } from '@nestjs/common';
import { IDENTITY_CRYPTO, type IdentityCrypto } from '../../shared/auth/crypto';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../shared/config/config';
import { DELIVERY_CODE_CIPHER, DeliveryCodeCipher } from './application/delivery-code-cipher';
import { DELIVERY_CODES } from './application/delivery-codes-port';
import { DeliveryCodesService } from './application/delivery-codes.service';
import { DELIVERY_CODE_REPOSITORY } from './domain/delivery-code';
import { PrismaDeliveryCodeRepository } from './infrastructure/prisma-delivery-code.repository';

/**
 * Delivery handover codes (delivery BE `delivery_codes`, BR-05). Exported
 * separately so Orders can issue/invalidate codes and read nonsecret
 * metadata in its UoW without depending on the Delivery API module. The
 * HMAC key is the OTP hash key under a distinct domain-separation label;
 * ciphertext uses the PII encryption key (Auth's global IDENTITY_CRYPTO).
 */
@Module({})
export class DeliveryCodesModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: DeliveryCodesModule,
      imports: [runtime],
      providers: [
        { provide: DELIVERY_CODE_REPOSITORY, useClass: PrismaDeliveryCodeRepository },
        {
          provide: DELIVERY_CODE_CIPHER,
          inject: [RUNTIME_CONFIG, IDENTITY_CRYPTO],
          useFactory: (config: RuntimeConfig, crypto: IdentityCrypto) =>
            new DeliveryCodeCipher(config.OTP_HASH_KEY, crypto),
        },
        DeliveryCodesService,
        { provide: DELIVERY_CODES, useExisting: DeliveryCodesService },
      ],
      exports: [DELIVERY_CODES, DeliveryCodesService],
    };
  }
}
