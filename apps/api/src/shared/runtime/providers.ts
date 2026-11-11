import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Module } from '@nestjs/common';

export const CLOCK = Symbol('CLOCK');
export const ID_PROVIDER = Symbol('ID_PROVIDER');

export interface Clock {
  now(): Date;
}

export interface IdProvider {
  uuidv7(): string;
}

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

@Injectable()
export class SystemIdProvider implements IdProvider {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  uuidv7(): string {
    const bytes = randomBytes(16);
    // RFC 9562: 48-bit Unix milliseconds, version 7, RFC variant, 74 random bits.
    bytes.writeUIntBE(this.clock.now().getTime(), 0, 6);
    bytes[6] = 0x70 | (bytes[6]! & 0x0f);
    bytes[8] = 0x80 | (bytes[8]! & 0x3f);
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}

@Module({
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_PROVIDER, useClass: SystemIdProvider },
  ],
  exports: [CLOCK, ID_PROVIDER],
})
export class RuntimePrimitivesModule {}
